<template>
    <header class="navbar">
        <button
            class="mobile-menu-toggle"
            type="button"
            :aria-label="mobileNavOpen ? 'Fermer le menu' : 'Ouvrir le menu'"
            aria-controls="mobile-navigation"
            :aria-expanded="mobileNavOpen"
            @click="$emit('toggle-mobile-nav')"
        >
            <svg v-if="mobileNavOpen" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            <svg v-else width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>

        <!-- Left: page title -->
        <div class="navbar-left">
            <span class="page-title">{{ pageTitle }}</span>
        </div>

        <!-- Center: Global Search -->
        <div class="navbar-center">
            <button class="search-bar" type="button" aria-label="Rechercher" @click="searchOpen = true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span class="search-placeholder">Rechercher…</span>
                <kbd class="search-kbd">Ctrl K</kbd>
            </button>
        </div>

        <!-- Right: actions -->
        <div class="navbar-right">

            <!-- Dark / Light toggle -->
            <button
                class="icon-btn"
                :title="isDark ? 'Mode clair' : 'Mode sombre'"
                :aria-label="isDark ? 'Activer le mode clair' : 'Activer le mode sombre'"
                @click="toggleTheme"
            >
                <svg v-if="isDark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </button>

            <!-- Notifications -->
            <div ref="notifWrapper" class="notif-wrapper">
                <button class="icon-btn" title="Notifications" aria-label="Notifications" :aria-expanded="notifOpen" @click="toggleNotifications">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount }}</span>
                </button>

                <!-- Notifications dropdown -->
                <div v-if="notifOpen" class="dropdown notif-dropdown">
                    <div class="dropdown-header">
                        <span>Crédits à rembourser</span>
                        <button v-if="unreadCount > 0" class="btn-mark-read" @click="markAllRead">Tout marquer lu</button>
                    </div>
                    <div class="dropdown-divider"></div>
                    <div v-if="notificationLoading" class="notif-empty"><p>Actualisation des crédits...</p></div>
                    <div v-else-if="notificationError" class="notif-empty notif-error" role="alert">
                        <p>{{ notificationError }}</p>
                        <button class="btn-mark-read" @click="loadNotifications">Réessayer</button>
                    </div>
                    <div v-else-if="notifications.length === 0" class="notif-empty">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                        <p>Aucun crédit restant à rembourser.</p>
                    </div>
                    <div v-else class="notif-list">
                        <div
                            v-for="n in notifications"
                            :key="n.id"
                            :class="['notif-item', { unread: !n.read }]"
                            role="button"
                            tabindex="0"
                            @click="openNotification(n)"
                            @keydown.enter="openNotification(n)"
                            @keydown.space.prevent="openNotification(n)"
                        >
                            <span :class="['notif-icon', { 'notif-icon-alert': n.overdue, 'notif-icon-info': !n.overdue }]" v-html="creditIcon"></span>
                            <div class="notif-content">
                                <span class="notif-text">{{ n.message }}</span>
                                <span class="notif-detail">{{ n.detail }}</span>
                                <span class="notif-time">{{ n.dueLabel }}</span>
                            </div>
                            <span :class="['notif-status', { overdue: n.overdue }]">{{ n.overdue ? "En retard" : "En cours" }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- User -->
            <button class="user-info" type="button" :aria-expanded="userOpen" aria-controls="user-menu" @click="userOpen = !userOpen">
                <div class="avatar">{{ initials }}</div>
                <div class="user-text">
                    <span class="user-name">{{ auth.user?.nom }}</span>
                    <span class="user-role">{{ roleLabel }}</span>
                </div>
                <svg :class="['chevron', { open: userOpen }]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            <!-- User dropdown -->
            <div v-if="userOpen" id="user-menu" class="dropdown user-dropdown" @click.away="userOpen = false">
                <div class="dropdown-header">
                    <span class="dropdown-name">{{ auth.user?.nom }} {{ auth.user?.prenom }}</span>
                    <span class="dropdown-email">{{ auth.user?.email }}</span>
                </div>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item" @click="logout">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Déconnexion
                </button>
            </div>
        </div>

        <!-- Global Search Overlay (Ctrl+K) -->
        <Teleport to="body">
            <div v-if="searchOpen" class="search-overlay" @click.self="searchOpen = false">
                <div class="search-modal">
                    <div class="search-modal-header">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input
                            ref="searchInput"
                            v-model="searchQuery"
                            type="text"
                            placeholder="Rechercher une page, un VOAMAMI, un membre…"
                            class="search-modal-input"
                            @keydown.escape="searchOpen = false"
                            @keydown.down.prevent="searchIdx = Math.min(searchIdx + 1, searchResults.length - 1)"
                            @keydown.up.prevent="searchIdx = Math.max(searchIdx - 1, 0)"
                            @keydown.enter.prevent="goToSearch(searchResults[searchIdx])"
                        />
                        <kbd class="search-esc">Esc</kbd>
                    </div>

                    <!-- Results -->
                    <div v-if="searchQuery.trim()" class="search-results">
                        <div v-if="searchResults.length === 0" class="search-empty">
                            Aucun résultat pour "{{ searchQuery }}"
                        </div>
                        <div
                            v-for="(item, i) in searchResults"
                            :key="item.to"
                            :class="['search-result-item', { selected: i === searchIdx }]"
                            @click="goToSearch(item)"
                            @mouseenter="searchIdx = i"
                        >
                            <span class="search-result-icon" v-html="item.icon"></span>
                            <div class="search-result-text">
                                <span class="search-result-label">{{ item.label }}</span>
                                <span class="search-result-section">{{ item.section }}</span>
                            </div>
                            <kbd class="search-result-kbd" v-if="i === searchIdx">↵</kbd>
                        </div>
                    </div>

                    <!-- Recent / shortcuts (when no query) -->
                    <div v-else class="search-shortcuts">
                        <p class="search-shortcuts-title">Accès rapides</p>
                        <div
                            v-for="(item, i) in quickLinks"
                            :key="item.to"
                            :class="['search-result-item', { selected: i === searchIdx }]"
                            @click="goToSearch(item)"
                            @mouseenter="searchIdx = i"
                        >
                            <span class="search-result-icon" v-html="item.icon"></span>
                            <span class="search-result-label">{{ item.label }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
    </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useAuthStore } from "../../stores/auth.store.js";
import { useRouter, useRoute } from "vue-router";
import creditService from "../../service/credit.service.js";

defineProps({
    mobileNavOpen: { type: Boolean, default: false }
});
defineEmits(["toggle-mobile-nav"]);

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

// ===== State =====
const searchOpen = ref(false);
const searchQuery = ref("");
const searchIdx = ref(0);
const searchInput = ref(null);
const notifOpen = ref(false);
const notifWrapper = ref(null);
const userOpen = ref(false);
const isDark = ref(document.documentElement.classList.contains("dark"));

const notificationLoading = ref(false);
const notificationError = ref("");
const notifications = ref([]);
let notificationRefreshTimer;
const creditIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>';

// ===== Theme =====
function toggleTheme() {
    isDark.value = !isDark.value;
    document.documentElement.classList.toggle("dark", isDark.value);
    localStorage.setItem("theme", isDark.value ? "dark" : "light");
}

// ===== Page title =====
const titles = {
    "": "Tableau de bord",
    voamami: "Groupes VOAMAMI",
    cycles: "Cycles d'épargne et de crédit",
    membres: "Membres",
    seances: "Séances hebdomadaires",
    epargnes: "Épargnes",
    credits: "Crédits",
    remboursements: "Remboursements",
    presences: "Présences",
    penalites: "Pénalités",
    caisse: "Caisse",
    agr: "AGR",
    utilisateurs: "Utilisateurs",
    rapports: "Rapports"
};
const pageTitle = computed(() => {
    const key = route.path.split("/").filter(Boolean)[0] || "";
    return titles[key] || "VOAMAMI";
});

// ===== User =====
const initials = computed(() => {
    const n = auth.user?.nom || "";
    const p = auth.user?.prenom || "";
    return ((n[0] || "") + (p[0] || "")).toUpperCase();
});
const roleLabel = computed(() => {
    const map = { ADMINISTRATEUR: "Admin", AGENT_FID: "Agent FID", PRESIDENT: "Président" };
    return map[auth.user?.role] || auth.user?.role || "";
});
async function logout() {
    await auth.logout();
    router.push("/login");
}

// Old mock notification examples are kept disabled; live items are loaded below.
/* const mockNotifications = ref([
    { id: 1, type: "alert", message: "Crédit de Rakoto J. en retard (échéance 15 oct.)", time: "il y a 2 h", read: false, link: "/credits", icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
    { id: 2, type: "success", message: "Séance S3 de VOA-001 clôturée avec succès", time: "il y a 5 h", read: false, link: "/seances", icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' },
    { id: 3, type: "info", message: "Nouvelle épargne enregistrée : Andry M. (2 parts)", time: "hier", read: true, link: "/epargnes", icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' }
]); */
const unreadCount = computed(
    () => notifications.value.filter((notification) => !notification.read).length
);

function readNotificationState() {
    const key = `voamami-read-credit-notifications-${auth.user?.id ?? "user"}`;
    try {
        const stored = JSON.parse(localStorage.getItem(key) || "[]");
        return new Set(Array.isArray(stored) ? stored.map(String) : []);
    } catch (error) {
        console.warn("Impossible de lire l'état des notifications :", error);
        return new Set();
    }
}

function saveReadNotificationState() {
    const key = `voamami-read-credit-notifications-${auth.user?.id ?? "user"}`;
    try {
        localStorage.setItem(
            key,
            JSON.stringify(
                notifications.value.filter((item) => item.read).map((item) => item.id)
            )
        );
    } catch (error) {
        console.warn("Impossible d'enregistrer l'état des notifications :", error);
    }
}

function formatMoney(value) {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "MGA",
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}

function formatDueDate(value) {
    if (!value) return "Échéance non définie";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? `Échéance : ${String(value).slice(0, 10)}`
        : `Échéance : ${date.toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric"
          })}`;
}

async function loadNotifications() {
    if (notificationLoading.value) return;
    notificationLoading.value = true;
    notificationError.value = "";
    try {
        const response = await creditService.getAll();
        const credits = response.data?.data;
        if (!Array.isArray(credits)) {
            throw new Error("La réponse des crédits est invalide.");
        }

        const readIds = readNotificationState();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        notifications.value = credits
            .filter((credit) => Number(credit.reste_a_payer) > 0)
            .map((credit) => {
                const dueDate = credit.date_echeance ? new Date(credit.date_echeance) : null;
                if (dueDate && !Number.isNaN(dueDate.getTime())) dueDate.setHours(0, 0, 0, 0);
                const id = `credit-${credit.id}`;
                const memberName = [credit.membre_nom, credit.membre_prenom]
                    .filter(Boolean)
                    .join(" ");
                return {
                    id,
                    message: `${memberName || `Membre n° ${credit.numero_membre || "—"}`} — ${credit.voamami_code || "VOAMAMI"}${credit.voamami_nom ? ` · ${credit.voamami_nom}` : ""}`,
                    detail: `Reste à rembourser : ${formatMoney(credit.reste_a_payer)}`,
                    dueLabel: formatDueDate(credit.date_echeance),
                    overdue: Boolean(dueDate && dueDate < today),
                    read: readIds.has(id),
                    link: "/credits"
                };
            })
            .sort((first, second) => {
                if (first.overdue !== second.overdue) return first.overdue ? -1 : 1;
                return first.message.localeCompare(second.message, "fr");
            });
    } catch (error) {
        notificationError.value =
            error.response?.data?.message ||
            error.message ||
            "Impossible de charger les crédits à rembourser.";
        console.error("Erreur de chargement des notifications de crédit :", error);
    } finally {
        notificationLoading.value = false;
    }
}

function toggleNotifications() {
    notifOpen.value = !notifOpen.value;
    if (notifOpen.value) loadNotifications();
}

function markAllRead() {
    notifications.value.forEach((notification) => {
        notification.read = true;
    });
    saveReadNotificationState();
}

function openNotification(notification) {
    notification.read = true;
    saveReadNotificationState();
    notifOpen.value = false;
    router.push(notification.link);
}

function onDocumentClick(event) {
    if (!notifWrapper.value?.contains(event.target)) notifOpen.value = false;
    if (!event.target.closest(".user-info, .user-dropdown")) userOpen.value = false;
}
// ===== Global Search =====
const searchItems = [
    { label: "Tableau de bord", to: "/", section: "Général", icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>' },
    { label: "Groupes VOAMAMI", to: "/voamami", section: "Général", icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' },
    { label: "Cycles", to: "/cycles", section: "Général", icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>' },
    { label: "Membres", to: "/membres", section: "Général", icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
    { label: "Séances", to: "/seances", section: "Général", icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
    { label: "Présences", to: "/presences", section: "Opérations", icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>' },
    { label: "Épargnes", to: "/epargnes", section: "Opérations", icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' },
    { label: "Crédits", to: "/credits", section: "Opérations", icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
    { label: "Remboursements", to: "/remboursements", section: "Opérations", icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>' },
    { label: "Pénalités", to: "/penalites", section: "Opérations", icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>' },
    { label: "Caisse", to: "/caisse", section: "Opérations", icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>' },
    { label: "AGR", to: "/agr", section: "Administration", icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' },
    { label: "Utilisateurs", to: "/utilisateurs", section: "Administration", icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
    { label: "Rapports", to: "/rapports", section: "Administration", icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' }
];

const quickLinks = computed(() => searchItems.slice(0, 5));

const searchResults = computed(() => {
    const q = searchQuery.value.toLowerCase().trim();
    if (!q) return [];
    return searchItems.filter((item) =>
        item.label.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q)
    );
});

function goToSearch(item) {
    if (!item) return;
    searchOpen.value = false;
    searchQuery.value = "";
    searchIdx.value = 0;
    router.push(item.to);
}

// Keyboard shortcut: Ctrl+K
function onKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchOpen.value = true;
        nextTick(() => searchInput.value?.focus());
    }
}

onMounted(() => {
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKeydown);
    loadNotifications();
    notificationRefreshTimer = window.setInterval(loadNotifications, 60_000);
});

onBeforeUnmount(() => {
    document.removeEventListener("click", onDocumentClick);
    document.removeEventListener("keydown", onKeydown);
    window.clearInterval(notificationRefreshTimer);
});
</script>

<style scoped>
/* ===== Navbar base ===== */
.navbar {
    height: 56px;
    display: flex;
    align-items: center;
    padding: 0 1.25rem;
    background: #fff;
    border-bottom: 1px solid #e2e8f0;
    flex-shrink: 0;
    position: relative;
    z-index: 100;
    gap: 1rem;
}
.mobile-menu-toggle {
    display: none;
}
.dark .navbar {
    background: #1e293b;
    border-bottom-color: #334155;
}

.navbar-left { flex: 1; min-width: 0; }
.page-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.dark .page-title { color: #f1f5f9; }

/* ===== Search bar (center) ===== */
.navbar-center {
    flex: 1;
    max-width: 400px;
    display: flex;
    justify-content: center;
}
.search-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.45rem 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #f8fafc;
    cursor: pointer;
    transition: all 0.15s;
    color: #94a3b8;
    font-size: 0.875rem;
    font: inherit;
}
.search-bar:hover {
    border-color: #cbd5e1;
    background: #fff;
}
.dark .search-bar {
    background: #334155;
    border-color: #475569;
    color: #94a3b8;
}
.dark .search-bar:hover {
    background: #475569;
}
.search-placeholder { flex: 1; text-align: left; }
.search-kbd {
    font-size: 0.75rem;
    font-family: monospace;
    background: #e2e8f0;
    color: #64748b;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    border: 1px solid #cbd5e1;
}
.dark .search-kbd {
    background: #475569;
    color: #94a3b8;
    border-color: #64748b;
}

/* ===== Right actions ===== */
.navbar-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.icon-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #fff;
    color: #64748b;
    cursor: pointer;
    transition: all 0.15s;
}
.icon-btn:hover {
    background: #f8fafc;
    color: #1e293b;
    border-color: #cbd5e1;
}
.dark .icon-btn {
    background: #334155;
    border-color: #475569;
    color: #94a3b8;
}
.dark .icon-btn:hover {
    background: #475569;
    color: #f1f5f9;
}

/* Notification badge */
.notif-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #dc2626;
    color: #fff;
    font-size: 0.6875rem;
    font-weight: 700;
    min-width: 16px;
    height: 16px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
}

/* ===== User ===== */
.user-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    padding: 0.3rem 0.5rem;
    border-radius: 8px;
    transition: background 0.15s;
    border: 0;
    background: transparent;
    font: inherit;
    text-align: left;
}
.user-info:hover { background: #f8fafc; }
.dark .user-info:hover { background: #334155; }

.avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #2563eb;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    flex-shrink: 0;
}
.user-text {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
}
.user-name { font-size: 0.875rem; font-weight: 600; color: #1e293b; }
.dark .user-name { color: #f1f5f9; }
.user-role { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; }

.chevron { color: #94a3b8; transition: transform 0.2s; }
.chevron.open { transform: rotate(180deg); }

/* ===== Dropdowns ===== */
.dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
    z-index: 200;
    overflow: hidden;
}
.dark .dropdown {
    background: #1e293b;
    border-color: #334155;
}

.notif-wrapper { position: relative; }
.user-dropdown { width: 220px; padding: 0.5rem; }

.dropdown-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #1e293b;
}
.dark .dropdown-header { color: #f1f5f9; }

.btn-mark-read {
    background: none;
    border: none;
    font-size: 0.75rem;
    color: #2563eb;
    cursor: pointer;
    font-weight: 500;
}
.btn-mark-read:hover { text-decoration: underline; }

.dropdown-divider { height: 1px; background: #f1f5f9; }
.dark .dropdown-divider { background: #334155; }

.dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.5rem 0.6rem;
    border: none;
    background: none;
    border-radius: 6px;
    font-size: 0.85rem;
    color: #dc2626;
    cursor: pointer;
    transition: background 0.15s;
}
.dropdown-item:hover { background: #fef2f2; }
.dark .dropdown-item { color: #f87171; }
.dark .dropdown-item:hover { background: #450a0a; }

/* ===== Notifications dropdown ===== */
.notif-dropdown {
    width: min(460px, calc(100vw - 2rem));
    padding: 0;
}
.notif-dropdown .dropdown-header {
    border-bottom: 1px solid #f1f5f9;
}
.dark .notif-dropdown .dropdown-header { border-bottom-color: #334155; }

.notif-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 1rem;
    gap: 0.5rem;
    color: #94a3b8;
}
.notif-empty p { margin: 0; font-size: 0.875rem; }

.notif-list {
    max-height: 300px;
    overflow-y: auto;
}
.notif-item {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    padding: 0.65rem 0.75rem;
    cursor: pointer;
    transition: background 0.1s;
    border-bottom: 1px solid #f8fafc;
}
.notif-item:last-child { border-bottom: none; }
.notif-item:hover { background: #f8fafc; }
.dark .notif-item:hover { background: #334155; }
.notif-item.unread { background: #eff6ff; }
.dark .notif-item.unread { background: #1e3a5f; }

.notif-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.notif-icon-alert { background: #fef2f2; color: #dc2626; }
.notif-icon-success { background: #dcfce7; color: #16a34a; }
.notif-icon-info { background: #eff6ff; color: #2563eb; }

.notif-content {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
}
.notif-detail {
    font-size: 0.75rem;
    font-weight: 600;
    color: #475569;
}
.notif-text {
    font-size: 0.875rem;
    color: #334155;
    line-height: 1.3;
}
.dark .notif-text { color: #e2e8f0; }
.notif-time {
    font-size: 0.75rem;
    color: #94a3b8;
}
.notif-status {
    flex-shrink: 0;
    align-self: center;
    padding: 0.2rem 0.45rem;
    border-radius: 999px;
    background: #dcfce7;
    color: #166534;
    font-size: 0.75rem;
    font-weight: 700;
}
.notif-status.overdue {
    background: #fee2e2;
    color: #991b1b;
}
.notif-error { color: #b91c1c; }

/* ===== Search Overlay ===== */
.search-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(4px);
    z-index: 9999;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 15vh;
}

.search-modal {
    width: 90%;
    max-width: 560px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    overflow: hidden;
}
.dark .search-modal {
    background: #1e293b;
    border: 1px solid #334155;
}

.search-modal-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.9rem 1rem;
    border-bottom: 1px solid #e2e8f0;
    color: #94a3b8;
}
.dark .search-modal-header { border-bottom-color: #334155; }

.search-modal-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 0.95rem;
    color: #1e293b;
    background: transparent;
}
.dark .search-modal-input { color: #f1f5f9; }
.search-modal-input::placeholder { color: #94a3b8; }

.search-esc {
    font-size: 0.75rem;
    font-family: monospace;
    background: #f1f5f9;
    color: #64748b;
    padding: 0.2rem 0.45rem;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
}
.dark .search-esc {
    background: #334155;
    color: #94a3b8;
    border-color: #475569;
}

.search-results,
.search-shortcuts {
    max-height: 340px;
    overflow-y: auto;
    padding: 0.4rem;
}

.search-empty,
.search-shortcuts-title {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    color: #94a3b8;
}

.search-result-item {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.6rem 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.1s;
}
.search-result-item:hover,
.search-result-item.selected {
    background: #eff6ff;
}
.dark .search-result-item:hover,
.dark .search-result-item.selected {
    background: #334155;
}

.search-result-icon {
    display: flex;
    align-items: center;
    color: #64748b;
    flex-shrink: 0;
}
.search-result-item.selected .search-result-icon { color: #2563eb; }

.search-result-text {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    flex: 1;
    min-width: 0;
}
.search-result-label {
    font-size: 0.88rem;
    font-weight: 500;
    color: #1e293b;
}
.dark .search-result-label { color: #f1f5f9; }
.search-result-section {
    font-size: 0.75rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.search-result-kbd {
    font-size: 0.75rem;
    font-family: monospace;
    color: #2563eb;
    font-weight: 700;
}

@media (max-width: 860px) {
    .navbar {
        height: auto;
        min-height: 56px;
        padding: 0.55rem 0.75rem;
        gap: 0.55rem;
    }

    .mobile-menu-toggle {
        display: inline-flex;
        flex: 0 0 40px;
        width: 40px;
        height: 40px;
        align-items: center;
        justify-content: center;
        border: 1px solid #e2e8f0;
        border-radius: 9px;
        background: #fff;
        color: #334155;
    }
    .dark .mobile-menu-toggle {
        border-color: #475569;
        background: #334155;
        color: #e2e8f0;
    }

    .navbar-left {
        flex: 1 1 auto;
    }
    .page-title {
        display: block;
        font-size: 0.9rem;
    }
    .navbar-center {
        flex: 0 0 auto;
    }
    .search-bar {
        width: 40px;
        height: 40px;
        justify-content: center;
        padding: 0;
    }
    .search-placeholder,
    .search-kbd,
    .user-text,
    .user-info > .chevron {
        display: none;
    }
    .navbar-right {
        gap: 0.35rem;
    }
    .navbar-right > .icon-btn,
    .navbar-right .user-info {
        width: 40px;
        height: 40px;
        justify-content: center;
        padding: 0;
    }
    .notif-dropdown {
        position: fixed;
        top: 60px;
        right: 0.5rem;
        width: min(460px, calc(100vw - 1rem));
    }
    .user-dropdown {
        top: 60px;
        right: 0.5rem;
    }
}

@media (max-width: 420px) {
    .navbar {
        gap: 0.35rem;
        padding-inline: 0.5rem;
    }
    .navbar-right {
        gap: 0.2rem;
    }
    .mobile-menu-toggle,
    .search-bar,
    .navbar-right > .icon-btn,
    .navbar-right .user-info {
        flex-basis: 36px;
        width: 36px;
        height: 36px;
    }
}
</style>