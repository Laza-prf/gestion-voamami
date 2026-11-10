<template>
    <aside id="mobile-navigation" :class="['sidebar', { 'mobile-open': mobileOpen }]">
        <!-- Logo -->
<!-- Logo -->
<div class="sidebar-logo">
    <img :src="logo" alt="VOAMAMI" class="logo-icon" />

</div>

        <!-- Navigation -->
        <nav class="sidebar-nav" @click="closeAfterNavigation">

            <!-- GÉNÉRAL -->
            <div class="nav-section">
                <span class="nav-section-label">Général</span>
                <router-link
                    v-for="item in sectionGeneral"
                    :key="item.to"
                    :to="item.to"
                    :class="['nav-item', { active: isActive(item.to) }]"
                >
                    <span class="nav-icon" v-html="item.icon"></span>
                    <span class="nav-label">{{ item.label }}</span>
                </router-link>
            </div>

            <!-- OPÉRATIONS -->
            <div class="nav-section">
                <button class="nav-section-toggle" @click="opsOpen = !opsOpen" :aria-expanded="opsOpen">
                    <span class="nav-section-label">Opérations</span>
                    <svg :class="['chevron', { rotated: opsOpen }]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <div :class="['nav-sub', { open: opsOpen }]">
                    <router-link
                        v-for="item in sectionOperations"
                        :key="item.to"
                        :to="item.to"
                        :class="['nav-item nav-item-sub', { active: isActive(item.to) }]"
                    >
                        <span class="nav-icon" v-html="item.icon"></span>
                        <span class="nav-label">{{ item.label }}</span>
                    </router-link>
                </div>
            </div>

            <!-- ADMINISTRATION -->
            <div v-if="isAdmin" class="nav-section">
                <span class="nav-section-label">Administration</span>
                <router-link
                    v-for="item in sectionAdmin"
                    :key="item.to"
                    :to="item.to"
                    :class="['nav-item', { active: isActive(item.to) }]"
                >
                    <span class="nav-icon" v-html="item.icon"></span>
                    <span class="nav-label">{{ item.label }}</span>
                </router-link>
            </div>
        </nav>

        <!-- Footer -->
        <div class="sidebar-footer">
            <div class="footer-user">
                <div class="footer-avatar">{{ initials }}</div>
                <div class="footer-text">
                    <span class="footer-name">{{ auth.user?.nom }}</span>
                    <span class="footer-role">{{ roleLabel }}</span>
                </div>
            </div>
        </div>
    </aside>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../../stores/auth.store.js";
import logo from '../../assets/images/logoH.png';


const route = useRoute();
const auth = useAuthStore();
defineProps({
    mobileOpen: { type: Boolean, default: false }
});
const emit = defineEmits(["close"]);
const opsOpen = ref(true);

watch(() => route.fullPath, () => emit("close"));

function closeAfterNavigation(event) {
    if (event.target.closest("a")) emit("close");
}

const isAdmin = computed(() => auth.user?.role === "ADMINISTRATEUR");

const initials = computed(() => {
    const n = auth.user?.nom || "";
    const p = auth.user?.prenom || "";
    return ((n[0] || "") + (p[0] || "")).toUpperCase();
});

const roleLabel = computed(() => {
    const map = { ADMINISTRATEUR: "Admin", AGENT_FID: "Agent FID", PRESIDENT: "Président" };
    return map[auth.user?.role] || auth.user?.role || "";
});

// Icônes
const icons = {
    dashboard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>',
    voamami: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    cycles: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
    assistant: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h16M4 12h16M4 19h16"/><circle cx="8" cy="5" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/><circle cx="10" cy="19" r="2" fill="currentColor"/></svg>',
    membres: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    seances: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    presences: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>',
    epargnes: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
    credits: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    remboursements: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>',
    penalites: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    caisse: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
    caisse_sociale: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22"/><path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>',
    agr: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    utilisateurs: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    rapports: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
};

const sectionGeneral = [
    { label: "Tableau de bord", to: "/", icon: icons.dashboard },
    { label: "VOAMAMI", to: "/voamami", icon: icons.voamami, roles: ["ADMINISTRATEUR"] },
    { label: "Cycles", to: "/cycles", icon: icons.cycles, roles: ["ADMINISTRATEUR"] },
    { label: "Membres", to: "/membres", icon: icons.membres , roles: ["ADMINISTRATEUR"] },
    { label: "Séances", to: "/seances", icon: icons.seances }
].filter((item) => !item.roles || item.roles.includes(auth.user?.role));

const sectionOperations = [
    { label: "Assistant de séance", to: "/operations", icon: icons.assistant },
    { label: "Présences", to: "/presences", icon: icons.presences },
    { label: "Épargnes", to: "/epargnes", icon: icons.epargnes },
    { label: "Crédits", to: "/credits", icon: icons.credits },
    { label: "Remboursements", to: "/remboursements", icon: icons.remboursements },
    { label: "Pénalités", to: "/penalites", icon: icons.penalites },
    { label: "Caisse", to: "/caisse", icon: icons.caisse },
    { label: "Caisse sociale", to: "/caisse-sociale", icon: icons.caisse_sociale }
];

const sectionAdmin = [
    { label: "AGR", to: "/agr", icon: icons.agr },
    { label: "Utilisateurs", to: "/utilisateurs", icon: icons.utilisateurs },
    { label: "Rapports", to: "/rapports", icon: icons.rapports }
];

function isActive(path) {
    if (path === "/") return route.path === "/";
    if (path === "/operations") return route.path === "/operations" || route.name === "assistant-seance";
    return route.path.startsWith(path);
}
</script>

<style scoped>
.sidebar {
    width: 240px;
    flex-shrink: 0;
    background: #fff;
    border-right: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

/* Logo */
.sidebar-logo {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px 0;
    margin-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-icon {
    width: 100%;
    height: auto;
    object-fit: cover;
}
.logo-text {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
}
.logo-title {
    font-size: 0.9375rem;
    font-weight: 700;
    color: #0f172a;
}
.logo-sub {
    font-size: 0.75rem;
    color: #94a3b8;
}

/* Nav */
.sidebar-nav {
    flex: 1;
    overflow-y: auto;
    padding: 0 0.6rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.nav-section { margin-bottom: 0.25rem; }

.nav-section-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #94a3b8;
    padding: 0.6rem 0.75rem 0.25rem;
}

.nav-section-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.6rem 0.75rem 0.25rem;
}
.nav-section-toggle .nav-section-label { padding: 0; }

.chevron {
    color: #94a3b8;
    transition: transform 0.2s;
}
.chevron.rotated { transform: rotate(180deg); }

.nav-sub {
    overflow: hidden;
    max-height: 0;
    transition: max-height 0.25s ease;
}
.nav-sub.open { max-height: 320px; }

/* Items */
.nav-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    color: #475569;
    transition: all 0.12s;
    position: relative;
}
.nav-item:hover {
    background: #f8fafc;
    color: #1e293b;
}
.nav-item.active {
    background: #eff6ff;
    color: #1d4ed8;
    font-weight: 600;
}
.nav-item.active::before {
    content: "";
    position: absolute;
    left: -0.6rem;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 60%;
    background: #2563eb;
    border-radius: 0 3px 3px 0;
}

.nav-item-sub {
    padding-left: 1.4rem;
    font-size: 0.875rem;
}
.nav-item-sub.active::before {
    left: -0.6rem;
}

.nav-icon {
    display: flex;
    align-items: center;
    color: #94a3b8;
    flex-shrink: 0;
}
.nav-item:hover .nav-icon { color: #475569; }
.nav-item.active .nav-icon { color: #2563eb; }

.nav-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Footer */
.sidebar-footer {
    padding: 0.75rem 1rem;
    border-top: 1px solid #f1f5f9;
}
.footer-user {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}
.footer-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #e2e8f0;
    color: #475569;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    flex-shrink: 0;
}
.footer-text {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
    min-width: 0;
}
.footer-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.footer-role {
    font-size: 0.75rem;
    color: #94a3b8;
    text-transform: uppercase;
}

@media (max-width: 860px) {
    .sidebar {
        position: fixed;
        z-index: 110;
        inset: 56px auto 0 0;
        width: min(300px, calc(100vw - 3rem));
        height: calc(100vh - 56px);
        height: calc(100dvh - 56px);
        flex-direction: column;
        border-right: 1px solid #e2e8f0;
        border-bottom: 0;
        overflow: hidden;
        box-shadow: 12px 0 30px rgb(15 23 42 / 0.14);
        transform: translateX(-105%);
        transition: transform 180ms ease;
        visibility: hidden;
    }
    .sidebar.mobile-open {
        transform: translateX(0);
        visibility: visible;
    }

    .sidebar-logo {
        display: flex;
        padding-top: 1rem;
    }

    .sidebar-nav {
        flex: 1;
        min-height: 0;
        flex-direction: column;
        overflow-y: auto;
        padding: 0 0.6rem 0.75rem;
    }

    .nav-section {
        display: block;
        margin-bottom: 0.25rem;
    }

    .nav-section-label {
        display: block;
    }

    .nav-section-toggle {
        display: flex;
    }
    .nav-sub {
        display: block;
    }

    .nav-item {
        min-height: 44px;
        flex-direction: row;
        gap: 0.65rem;
        padding: 0.65rem 0.75rem;
        font-size: 0.875rem;
        border-radius: 8px;
    }
    .nav-item-sub {
        padding-left: 1.4rem;
    }
    .nav-item.active::before,
    .nav-item-sub.active::before {
        display: none;
    }
    .nav-icon svg {
        width: 18px;
        height: 18px;
    }
    .nav-label {
        font-size: 0.875rem;
    }

    .sidebar-footer {
        display: block;
    }
}

</style>