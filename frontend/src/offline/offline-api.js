import { offlineDb, getOfflineOwnerId, notifyOfflineDataChanged, stableStringify } from "./offline-db.js";

const cacheExcludedPath = /^\/(?:auth|users|utilisateurs)(?:\/|$)/;
const cacheExcludedFile = /\.(?:pdf|xlsx?|csv)$/i;
const queuedWrites = [
    { method: "post", path: /^\/presences$/ },
    { method: "put", path: /^\/presences\/\d+$/ },
    { method: "post", path: /^\/epargnes$/ },
    { method: "put", path: /^\/epargnes\/\d+$/ },
    { method: "post", path: /^\/credits$/ },
    { method: "post", path: /^\/remboursements$/ },
    { method: "post", path: /^\/penalites$/ },
    { method: "put", path: /^\/penalites\/\d+$/ },
    { method: "post", path: /^\/caisse-sociale\/\d+\/(?:cotisations|aides)$/ },
    { method: "post", path: /^\/caisse-sociale\/seances\/\d+\/cotisations-sociales$/ },
    { method: "patch", path: /^\/caisse-sociale\/aides\/\d+\/(?:decision|paiement)$/ }
];

let syncPromise = null;

function requestPath(config) {
    const url = config.url || "";
    const base = config.baseURL || window.location.origin;
    const combined = /^https?:\/\//i.test(url)
        ? url
        : `${String(base).replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
    return new URL(combined, window.location.origin)
        .pathname
        .replace(/^\/api(?=\/|$)/, "")
        .replace(/\/+$/, "") || "/";
}

function requestSearch(config) {
    const url = config.url || "";
    const base = config.baseURL || window.location.origin;
    const combined = /^https?:\/\//i.test(url)
        ? url
        : `${String(base).replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
    return new URL(combined, window.location.origin).search;
}

function cacheKey(config, ownerId) {
    const path = requestPath(config);
    const params = stableStringify(config.params || {});
    return `${ownerId}:GET:${path}${requestSearch(config)}:${params}`;
}

function canCache(config) {
    const path = requestPath(config);
    return !cacheExcludedPath.test(path) && !cacheExcludedFile.test(path);
}

function canQueue(config) {
    const method = String(config.method || "get").toLowerCase();
    const path = requestPath(config);
    return queuedWrites.some((entry) => entry.method === method && entry.path.test(path));
}

function isNetworkFailure(error) {
    return !error.response &&
        (error.code === "ERR_NETWORK" || !navigator.onLine);
}

function responseFor(config, data, status, headers = {}) {
    return {
        config,
        data,
        headers,
        status,
        statusText: status === 202 ? "Accepted" : "OK",
        request: null
    };
}

function serializedBody(data) {
    if (typeof data !== "string") return data ?? null;

    try {
        return JSON.parse(data);
    } catch {
        return data;
    }
}

async function cacheResponse(config, response) {
    const ownerId = getOfflineOwnerId();
    const contentType =
        response.headers?.get?.("content-type") ||
        response.headers?.["content-type"] ||
        "";
    if (
        !ownerId ||
        String(config.method || "get").toLowerCase() !== "get" ||
        !canCache(config) ||
        !contentType.includes("application/json")
    ) {
        return;
    }

    try {
        await offlineDb.apiCache.put({
            cacheKey: cacheKey(config, ownerId),
            ownerId,
            data: response.data,
            updatedAt: Date.now()
        });
        await offlineDb.apiCache
            .where("updatedAt")
            .below(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .delete();
    } catch (error) {
        console.warn("Impossible de conserver cette réponse pour le mode hors ligne.", error);
    }
}

async function clearCachedResponses(ownerId) {
    if (!ownerId) return;
    try {
        await offlineDb.apiCache.where("ownerId").equals(ownerId).delete();
    } catch (error) {
        console.warn("Impossible de mettre à jour le cache hors ligne.", error);
    }
}

async function getCachedResponse(config) {
    const ownerId = getOfflineOwnerId();
    if (!ownerId || !canCache(config)) return null;

    const cached = await offlineDb.apiCache.get(cacheKey(config, ownerId));
    if (!cached) return null;
    if (cached.updatedAt < Date.now() - 30 * 24 * 60 * 60 * 1000) {
        await offlineDb.apiCache.delete(cached.cacheKey);
        return null;
    }
    return responseFor(config, cached.data, 200, { "x-voamami-offline-cache": "true" });
}

async function enqueueWrite(config) {
    const ownerId = getOfflineOwnerId();
    if (!ownerId) {
        throw new Error("Connectez-vous une première fois sur cette tablette avant d’enregistrer hors ligne.");
    }

    const idempotencyKey =
        config.headers?.get?.("Idempotency-Key") ||
        config.headers?.["Idempotency-Key"] ||
        crypto.randomUUID();

    const id = await offlineDb.pendingOperations.add({
        ownerId,
        method: String(config.method || "post").toUpperCase(),
        url: config.url,
        params: config.params || null,
        data: serializedBody(config.data),
        idempotencyKey,
        status: "pending",
        createdAt: Date.now(),
        attempts: 0,
        lastError: ""
    });

    notifyOfflineDataChanged();
    return responseFor(config, {
        success: true,
        queued: true,
        offlineOperationId: id,
        message: "Opération enregistrée sur cette tablette. Elle sera synchronisée dès le retour du réseau."
    }, 202, { "x-voamami-operation-pending": "true" });
}

export async function syncPendingOperations(api, ownerId = getOfflineOwnerId()) {
    if (!ownerId || !navigator.onLine) return;
    if (syncPromise) return syncPromise;

    syncPromise = (async () => {
        await offlineDb.pendingOperations
            .where("[ownerId+status]")
            .equals([ownerId, "syncing"])
            .modify({ status: "pending" });

        const operations = await offlineDb.pendingOperations
            .where("ownerId")
            .equals(ownerId)
            .sortBy("createdAt");

        for (const operation of operations) {
            if (operation.status === "blocked") break;
            if (operation.status !== "pending") continue;
            if (!navigator.onLine) break;

            await offlineDb.pendingOperations.update(operation.id, {
                status: "syncing",
                attempts: operation.attempts + 1,
                lastError: ""
            });
            notifyOfflineDataChanged();

            try {
                await api.request({
                    url: operation.url,
                    method: operation.method,
                    params: operation.params || undefined,
                    data: operation.data ?? undefined,
                    headers: { "Idempotency-Key": operation.idempotencyKey },
                    _offlineReplay: true
                });
                await offlineDb.pendingOperations.delete(operation.id);
                await clearCachedResponses(ownerId);
                notifyOfflineDataChanged();
            } catch (error) {
                const blocked = Boolean(error.response) &&
                    error.response.status >= 400 &&
                    error.response.status < 500 &&
                    error.response.status !== 401;
                await offlineDb.pendingOperations.update(operation.id, {
                    status: blocked ? "blocked" : "pending",
                    lastError: error.response?.data?.message ||
                        (blocked
                            ? "Le serveur a refusé cette opération. Vérifiez le conflit avant de continuer."
                            : "La synchronisation a échoué. L’opération reste conservée.")
                });
                notifyOfflineDataChanged();
                break;
            }
        }
    })().finally(() => {
        syncPromise = null;
    });

    return syncPromise;
}

export function installOfflineApi(api) {
    api.interceptors.request.use(async (config) => {
        if (canQueue(config) && !config._offlineReplay) {
            const existingKey =
                config.headers?.get?.("Idempotency-Key") ||
                config.headers?.["Idempotency-Key"];
            if (!existingKey) {
                config.headers.set("Idempotency-Key", crypto.randomUUID());
            }
        }

        const path = requestPath(config);
        const localOnlySession =
            !sessionStorage.getItem("token") &&
            getOfflineOwnerId() &&
            !path.startsWith("/auth/");
        const readOnlyRequest = String(config.method || "get").toLowerCase() === "get";

        if (
            !config._offlineReplay &&
            (!navigator.onLine || (localOnlySession && (readOnlyRequest || canQueue(config))))
        ) {
            const error = new Error("Le réseau est indisponible.");
            error.code = "ERR_NETWORK";
            error.config = config;
            throw error;
        }

        return config;
    });

    api.interceptors.response.use(
        async (response) => {
            const method = String(response.config?.method || "get").toLowerCase();
            const ownerId = getOfflineOwnerId();
            if (method === "get") {
                await cacheResponse(response.config, response);
            } else if (response.status < 400) {
                await clearCachedResponses(ownerId);
                const path = requestPath(response.config);
                if (
                    !response.data?.queued &&
                    (/^\/credits(?:\/|$)/.test(path) ||
                        /^\/remboursements(?:\/|$)/.test(path))
                ) {
                    window.dispatchEvent(new Event("voamami-credits-updated"));
                }
            }
            return response;
        },
        async (error) => {
            const config = error.config;
            if (!config) return Promise.reject(error);

            if (
                String(config.method || "get").toLowerCase() === "get" &&
                isNetworkFailure(error)
            ) {
                try {
                    const cached = await getCachedResponse(config);
                    if (cached) return cached;
                } catch (cacheError) {
                    console.error("Erreur de lecture du cache hors ligne.", cacheError);
                }
            }

            if (
                !config._offlineReplay &&
                canQueue(config) &&
                isNetworkFailure(error)
            ) {
                try {
                    return await enqueueWrite(config);
                } catch (queueError) {
                    return Promise.reject(queueError);
                }
            }

            return Promise.reject(error);
        }
    );
}
