<template>
    <aside
        v-if="!online || pendingCount > 0"
        class="offline-status"
        :class="{ 'has-conflict': blockedCount > 0 }"
        role="status"
        aria-live="polite"
    >
        <span class="connection-label">
            {{ online ? "En ligne" : "Hors ligne" }}
        </span>
        <span v-if="auth.offlineOnly && online && pendingCount">
            Connectez-vous en ligne pour synchroniser les opérations conservées.
        </span>
        <span v-else-if="pendingCount">
            {{ pendingCount }} opération{{ pendingCount > 1 ? "s" : "" }}
            {{ blockedCount ? "en attente de résolution" : "à synchroniser" }}
        </span>
        <span v-else>
            Les listes déjà consultées restent disponibles hors ligne.
        </span>
        <button
            v-if="online && pendingCount && auth.token && !auth.offlineOnly && !syncing"
            type="button"
            @click="sync"
        >
            Synchroniser
        </button>
        <router-link
            v-if="online && auth.offlineOnly && pendingCount"
            class="login-link"
            to="/login"
        >
            Se connecter
        </router-link>
        <span v-if="syncing" class="syncing-label">Synchronisation…</span>
        <p v-if="conflictMessage" class="sync-error">{{ conflictMessage }}</p>
        <p v-if="lastError" class="sync-error">{{ lastError }}</p>
    </aside>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useAuthStore } from "../../stores/auth.store.js";
import { getOfflineOwnerId, notifyOfflineDataChanged, offlineDb } from "../../offline/offline-db.js";
import { syncPendingOperations } from "../../offline/offline-api.js";
import api from "../../service/api.js";

const auth = useAuthStore();
const online = ref(navigator.onLine);
const pendingCount = ref(0);
const blockedCount = ref(0);
const syncing = ref(false);
const lastError = ref("");
const conflictMessage = ref("");

async function refresh() {
    try {
        const ownerId = getOfflineOwnerId();
        if (!ownerId) {
            pendingCount.value = 0;
            blockedCount.value = 0;
            conflictMessage.value = "";
            return;
        }

        const operations = await offlineDb.pendingOperations
            .where("ownerId")
            .equals(ownerId)
            .toArray();
        pendingCount.value = operations.length;
        blockedCount.value = operations.filter((operation) => operation.status === "blocked").length;
        conflictMessage.value =
            operations.find((operation) => operation.status === "blocked")?.lastError || "";
    } catch (error) {
        lastError.value = error.message || "Impossible de lire la file hors ligne.";
    }
}

async function sync() {
    if (!online.value || !auth.token || auth.offlineOnly || syncing.value) return;
    syncing.value = true;
    lastError.value = "";
    try {
        await syncPendingOperations(api);
    } catch (error) {
        lastError.value = error.message || "La synchronisation a échoué.";
    } finally {
        syncing.value = false;
        await refresh();
    }
}

function updateConnection() {
    online.value = navigator.onLine;
    if (online.value) sync();
}

function updateQueue() {
    refresh();
}

onMounted(() => {
    refresh();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    window.addEventListener("voamami-offline-data-changed", updateQueue);
});

watch(
    () => [auth.token, auth.offlineOnly],
    () => {
        refresh();
        if (auth.token && !auth.offlineOnly) sync();
    }
);

onBeforeUnmount(() => {
    window.removeEventListener("online", updateConnection);
    window.removeEventListener("offline", updateConnection);
    window.removeEventListener("voamami-offline-data-changed", updateQueue);
});
</script>

<style scoped>
.offline-status {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.45rem 0.75rem;
    padding: 0.45rem 1rem;
    border-bottom: 1px solid #bfdbfe;
    background: #eff6ff;
    color: #1e3a8a;
    font-size: 0.8rem;
}

.offline-status.has-conflict {
    border-bottom-color: #fcd34d;
    background: #fffbeb;
    color: #92400e;
}

.connection-label {
    font-weight: 750;
}

button {
    border: 0;
    border-radius: 0.4rem;
    padding: 0.3rem 0.6rem;
    background: #1d4ed8;
    color: #fff;
    font: inherit;
    font-weight: 650;
}

.login-link {
    color: #1d4ed8;
    font-weight: 700;
}

.syncing-label,
.sync-error {
    color: #92400e;
}

.sync-error {
    flex-basis: 100%;
    margin: 0;
}

:global(html.dark .offline-status) {
    border-color: #2b4668;
    background: #172b48;
    color: #bfdbfe;
}

:global(html.dark .offline-status.has-conflict) {
    border-color: #6b4d1f;
    background: #332714;
    color: #fcd34d;
}
</style>
