import Dexie from "dexie";

const database = new Dexie("gestion-voamami-offline");

database.version(1).stores({
    apiCache: "&cacheKey, ownerId, updatedAt",
    pendingOperations: "++id, ownerId, status, [ownerId+status], createdAt, idempotencyKey",
    offlineProfiles: "&userId"
});

export const offlineDb = database;
export const OFFLINE_OWNER_KEY = "voamami.offline.ownerId";

export function getOfflineOwnerId() {
    const ownerId = Number(localStorage.getItem(OFFLINE_OWNER_KEY));
    return Number.isInteger(ownerId) && ownerId > 0 ? ownerId : null;
}

export function notifyOfflineDataChanged() {
    window.dispatchEvent(new Event("voamami-offline-data-changed"));
}

export function stableStringify(value) {
    if (Array.isArray(value)) {
        return `[${value.map(stableStringify).join(",")}]`;
    }

    if (value && typeof value === "object") {
        return `{${Object.keys(value)
            .sort()
            .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
            .join(",")}}`;
    }

    return JSON.stringify(value);
}
