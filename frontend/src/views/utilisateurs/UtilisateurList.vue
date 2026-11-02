<template>
    <div class="page">
        <div class="page-header">
            <div>
                <h1>Utilisateurs</h1>
                <p class="subtitle">{{ filteredUsers.length }} compte(s)</p>
            </div>
            <router-link to="/utilisateurs/nouveau" class="btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nouveau compte
            </router-link>
        </div>

        <!-- Toolbar -->
        <div class="toolbar">
            <div class="search-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                    v-model.trim="searchQuery"
                    type="text"
                    placeholder="Rechercher (nom, email…)"
                    aria-label="Rechercher"
                />
                <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''" aria-label="Effacer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>

            <div class="filter-group">
                <div class="select-wrapper">
                    <select v-model="filterRole" class="filter-select" aria-label="Filtrer par rôle">
                        <option :value="null">Tous les rôles</option>
                        <option value="ADMINISTRATEUR">Administrateur</option>
                        <option value="AGENT_FID">Agent FID</option>
                    </select>
                    <svg class="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>

                <div class="select-wrapper">
                    <select v-model="filterStatut" class="filter-select" aria-label="Filtrer par statut">
                        <option :value="null">Tous statuts</option>
                        <option value="actif">Actif</option>
                        <option value="inactif">Inactif</option>
                    </select>
                    <svg class="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="state-block">
            <div class="spinner"></div>
            <p>Chargement des utilisateurs…</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="state-block state-error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p>{{ error }}</p>
            <button class="btn-secondary" @click="chargerUtilisateurs">Réessayer</button>
        </div>

        <!-- Empty -->
        <div v-else-if="utilisateurs.length === 0" class="state-block">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <p>Aucun utilisateur enregistré.</p>
            <router-link to="/utilisateurs/nouveau" class="btn-primary">Créer le premier compte</router-link>
        </div>

        <!-- Empty filtered -->
        <div v-else-if="filteredUsers.length === 0" class="state-block">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            <p>Aucun résultat pour ces filtres.</p>
            <button class="btn-secondary" @click="resetFilters">Réinitialiser les filtres</button>
        </div>

        <!-- Table -->
        <div v-else class="table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Prénom</th>
                        <th>Email</th>
                        <th>Rôle</th>
                        <th>Statut</th>
                        <th class="col-actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(u, i) in paginatedUsers" :key="u.id" :class="{ 'row-even': i % 2 === 0 }">
                        <td class="td-bold">{{ u.nom }}</td>
                        <td>{{ u.prenom }}</td>
                        <td class="td-email">{{ u.email }}</td>
                        <td>
                            <span :class="['role-badge', 'role-' + (u.role || '').toLowerCase().replace(/_/g, '-')]">
                                {{ formatRole(u.role) }}
                            </span>
                        </td>
                        <td>
                            <span :class="['badge', 'badge-' + (u.actif ? 'actif' : 'inactif')]">
                                <span class="badge-dot"></span>
                                {{ u.actif ? 'Actif' : 'Inactif' }}
                            </span>
                        </td>
                        <td class="col-actions">
                            <div class="actions">
                                <router-link
                                    :to="`/utilisateurs/${u.id}/modifier`"
                                    class="icon-btn icon-btn-edit"
                                    title="Modifier"
                                    aria-label="Modifier"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                                </router-link>
                                <button
                                    class="icon-btn icon-btn-delete"
                                    title="Supprimer"
                                    aria-label="Supprimer"
                                    @click="onDelete(u.id, u.nom)"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Pagination -->
            <div class="pagination">
                <div class="pagination-info">
                    <span>Affichage {{ rangeStart }}–{{ rangeEnd }} sur {{ filteredUsers.length }}</span>
                    <select v-model.number="pageSize" class="page-size-select" aria-label="Lignes par page">
                        <option :value="10">10 / page</option>
                        <option :value="25">25 / page</option>
                        <option :value="50">50 / page</option>
                    </select>
                </div>
                <div class="pagination-controls">
                    <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--" aria-label="Page précédente">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <button
                        v-for="p in visiblePages"
                        :key="p"
                        :class="['page-btn', { active: p === currentPage }]"
                        @click="currentPage = p"
                    >{{ p }}</button>
                    <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++" aria-label="Page suivante">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
    <ConfirmationDialog
        v-model="showDeleteDialog"
        title="Supprimer cet utilisateur ?"
        :message="`Supprimer le compte de ${selectedUser?.nom || ''} ? Cette action est irréversible.`"
        confirm-label="Supprimer"
        loading-label="Suppression..."
        :loading="deleting"
        @confirm="confirmDelete"
    />
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import utilisateurService from "../../service/utilisateur.service.js";
import { useToast } from "../../composables/useToast.js";
import ConfirmationDialog from "../../components/ConfirmationDialog.vue";

const toast = useToast();
const utilisateurs = ref([]);
const loading = ref(true);
const error = ref("");
const showDeleteDialog = ref(false);
const selectedUser = ref(null);
const deleting = ref(false);

// Filters
const searchQuery = ref("");
const filterRole = ref(null);
const filterStatut = ref(null);

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);

const filteredUsers = computed(() => {
    let list = utilisateurs.value;

    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        list = list.filter((u) =>
            u.nom?.toLowerCase().includes(q) ||
            u.prenom?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q)
        );
    }

    if (filterRole.value) {
        list = list.filter((u) => u.role === filterRole.value);
    }

    if (filterStatut.value) {
        list = list.filter((u) => (u.actif ? "actif" : "inactif") === filterStatut.value);
    }

    return list;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / pageSize.value)));
const paginatedUsers = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return filteredUsers.value.slice(start, start + pageSize.value);
});
const rangeStart = computed(() => filteredUsers.value.length === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1);
const rangeEnd = computed(() => Math.min(currentPage.value * pageSize.value, filteredUsers.value.length));

const visiblePages = computed(() => {
    const total = totalPages.value;
    const cur = currentPage.value;
    const pages = [];
    for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) pages.push(i);
    return pages;
});

watch([searchQuery, filterRole, filterStatut, pageSize], () => {
    currentPage.value = 1;
});

function resetFilters() {
    searchQuery.value = "";
    filterRole.value = null;
    filterStatut.value = null;
}

function formatRole(role) {
    const map = {
        ADMINISTRATEUR: "Administrateur",
        AGENT_FID: "Agent FID"
    };
    return map[role] || role || "—";
}

async function chargerUtilisateurs() {
    loading.value = true;
    error.value = "";
    try {
        const response = await utilisateurService.getAll();
        utilisateurs.value = response.data.utilisateurs || [];
    } catch (e) {
        console.error("Erreur liste :", e.response?.data || e);
        error.value = e.response?.data?.message || "Impossible de charger les utilisateurs";
    } finally {
        loading.value = false;
    }
}

function onDelete(id, nom) {
    selectedUser.value = { id, nom };
    showDeleteDialog.value = true;
}

async function confirmDelete() {
    if (!selectedUser.value || deleting.value) return;
    const id = selectedUser.value.id;
    deleting.value = true;
    try {
        await utilisateurService.remove(id);
        utilisateurs.value = utilisateurs.value.filter((u) => u.id !== id);
        toast.success("Utilisateur supprimé avec succès.");
        showDeleteDialog.value = false;
        selectedUser.value = null;
    } catch (e) {
        toast.error(e.response?.data?.message || "Suppression impossible.");
    } finally {
        deleting.value = false;
    }
}

onMounted(chargerUtilisateurs);
</script>

<style scoped>
/* ===== Page ===== */
.page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 1.5rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
    gap: 1rem;
}
.page-header h1 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    color: #0f172a;
}
.subtitle {
    margin: 0.25rem 0 0;
    font-size: 0.85rem;
    color: #64748b;
}

/* ===== Buttons ===== */
.btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: #2563eb;
    color: #fff;
    padding: 0.55rem 1.1rem;
    border-radius: 8px;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: background 0.15s;
}
.btn-primary:hover { background: #1d4ed8; }

.btn-secondary {
    background: #f1f5f9;
    color: #334155;
    padding: 0.45rem 1rem;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 0.15s;
}
.btn-secondary:hover { background: #e2e8f0; }

/* ===== Toolbar ===== */
.toolbar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
}

.search-box {
    position: relative;
    flex: 1;
    min-width: 220px;
    max-width: 320px;
    display: flex;
    align-items: center;
}
.search-box svg {
    position: absolute;
    left: 0.75rem;
    color: #94a3b8;
    pointer-events: none;
}
.search-box input {
    width: 100%;
    padding: 0.5rem 2rem 0.5rem 2.3rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.85rem;
    background: #fff;
    transition: border-color 0.15s, box-shadow 0.15s;
}
.search-box input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
}
.search-clear {
    position: absolute;
    right: 0.5rem;
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 0.2rem;
    display: flex;
    align-items: center;
}
.search-clear:hover { color: #475569; }

.filter-group { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.select-wrapper { position: relative; display: inline-flex; }
.select-arrow {
    position: absolute;
    right: 0.6rem;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: #64748b;
}

.filter-select {
    padding: 0.5rem 2rem 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.82rem;
    color: #475569;
    background: #fff;
    cursor: pointer;
    appearance: none;
    transition: border-color 0.15s, box-shadow 0.15s;
}
.filter-select:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
}

/* ===== States ===== */
.state-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 1rem;
    text-align: center;
    color: #64748b;
    gap: 0.75rem;
}
.state-block p { margin: 0; font-size: 0.95rem; }
.state-error svg { color: #dc2626; }

.spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e2e8f0;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== Table ===== */
.table-wrapper {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    background: #fff;
    overflow: hidden;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
}
.data-table thead {
    background: #f8fafc;
    border-bottom: 2px solid #e2e8f0;
}
.data-table th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #64748b;
    white-space: nowrap;
}
.data-table td {
    padding: 0.7rem 1rem;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
}
.data-table tbody tr { transition: background 0.1s; }
.data-table tbody tr:hover { background: #f8fafc; }
.data-table tbody tr.row-even { background: #fcfcfd; }
.data-table tbody tr.row-even:hover { background: #f1f5f9; }
.data-table tbody tr:last-child td { border-bottom: none; }

/* ===== Helpers ===== */
.td-bold { font-weight: 600; }
.td-email {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.8rem;
    color: #475569;
}

/* ===== Role badge ===== */
.role-badge {
    display: inline-block;
    padding: 0.2rem 0.55rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
}
.role-administrateur { background: #ede9fe; color: #5b21b6; }
.role-agent-fid { background: #e0f2fe; color: #075985; }

/* ===== Status badges ===== */
.badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.65rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
}
.badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
}
.badge-actif { background: #dcfce7; color: #166534; }
.badge-inactif { background: #fee2e2; color: #991b1b; }

/* ===== Actions ===== */
.col-actions { width: 90px; text-align: right; }
.actions {
    display: inline-flex;
    gap: 0.35rem;
    justify-content: flex-end;
}
.icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: 1px solid transparent;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.15s;
}
.icon-btn-edit {
    color: #2563eb;
    background: #eff6ff;
    border-color: #bfdbfe;
}
.icon-btn-edit:hover { background: #dbeafe; border-color: #93c5fd; }
.icon-btn-delete {
    color: #dc2626;
    background: #fef2f2;
    border-color: #fecaca;
}
.icon-btn-delete:hover { background: #fee2e2; border-color: #fca5a5; }

/* ===== Pagination ===== */
.pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-top: 1px solid #e2e8f0;
    background: #fafbfc;
    flex-wrap: wrap;
    gap: 0.75rem;
}
.pagination-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.82rem;
    color: #64748b;
}
.page-size-select {
    padding: 0.3rem 1.8rem 0.3rem 0.6rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.8rem;
    color: #475569;
    background: #fff;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.5rem center;
}
.pagination-controls {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}
.page-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: 32px;
    padding: 0 0.4rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #fff;
    font-size: 0.82rem;
    font-weight: 500;
    color: #475569;
    cursor: pointer;
    transition: all 0.15s;
}
.page-btn:hover:not(:disabled):not(.active) {
    background: #f1f5f9;
    border-color: #cbd5e1;
}
.page-btn.active {
    background: #2563eb;
    border-color: #2563eb;
    color: #fff;
}
.page-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}
</style>