<template>
    <div class="app-root">
        <main v-if="!authStore.initialized" class="app-loading" role="status" aria-live="polite">
            <span class="app-loading-spinner" aria-hidden="true"></span>
            <p>Chargement de votre espace...</p>
        </main>
        <router-view v-else />

        <!-- Le composant doit être monté une seule fois au niveau global. -->
        <Toast />
    </div>
</template>

<script setup>
import { useAuthStore } from "./stores/auth.store.js";
import Toast from "./components/layouts/AppToast.vue";

const authStore = useAuthStore();
</script>

<style scoped>
.app-root {
    min-height: 100vh;
}

.app-loading {
    display: grid;
    min-height: 100vh;
    place-content: center;
    justify-items: center;
    gap: 0.9rem;
    background: var(--voa-bg, #f8fafc);
    color: var(--voa-muted, #64748b);
    font-size: var(--type-body, 0.9375rem);
}

.app-loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid var(--voa-border, #e2e8f0);
    border-top-color: var(--voa-primary, #2563eb);
    border-radius: 50%;
    animation: app-loading-spin 0.8s linear infinite;
}

@keyframes app-loading-spin {
    to {
        transform: rotate(360deg);
    }
}
</style>


