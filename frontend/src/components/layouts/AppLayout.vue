<template>
    <div class="app-layout">
        <Navbar
            :mobile-nav-open="mobileNavOpen"
            @toggle-mobile-nav="mobileNavOpen = !mobileNavOpen"
        />
        <div class="app-body">
            <button
                v-if="mobileNavOpen"
                class="sidebar-backdrop"
                type="button"
                aria-label="Fermer le menu de navigation"
                @click="mobileNavOpen = false"
            />
            <Sidebar :mobile-open="mobileNavOpen" @close="mobileNavOpen = false" />
            <main class="app-content">
                <router-view />
            </main>
        </div>
    </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import Navbar from "../layouts/Navbar.vue";
import Sidebar from "../layouts/Sidebar.vue";

const mobileNavOpen = ref(false);

function closeMobileNavOnEscape(event) {
    if (event.key === "Escape") mobileNavOpen.value = false;
}

onMounted(() => window.addEventListener("keydown", closeMobileNavOnEscape));
onBeforeUnmount(() => window.removeEventListener("keydown", closeMobileNavOnEscape));
</script>

<style scoped>
.app-layout {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg, #f8fafc);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.app-body {
    display: flex;
    flex: 1;
    overflow: hidden;
    min-height: 0;
    position: relative;
}
.app-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    min-width: 0;
}
.sidebar-backdrop {
    display: none;
}

@media (max-width: 860px) {
    .app-layout {
        height: auto;
        min-height: 100vh;
    }
    .app-body {
        flex-direction: column;
        overflow: visible;
    }
    .app-content {
        padding: 0.875rem;
        overflow-y: visible;
    }
    .sidebar-backdrop {
        display: block;
        position: fixed;
        inset: 56px 0 0;
        z-index: 109;
        border: 0;
        background: rgb(15 23 42 / 0.48);
    }
}

</style>