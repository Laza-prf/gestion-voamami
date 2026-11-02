<template>
    <div class="page">
        <div class="page-header">
            <div>
                <h1>Liste des membres</h1>
                <p class="subtitle">{{ filteredMembres.length }} membre(s) — page {{ currentPage }} / {{ totalPages }}</p>
            </div>
            <router-link to="/membres/nouveau" class="btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nouveau membre
            </router-link>
        </div>

        <!-- Toolbar: search + filters -->
        <div class="toolbar">
            <div class="search-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                    v-model.trim="searchQuery"
                    type="text"
                    placeholder="Rechercher (nom, code, téléphone…)"
                    aria-label="Rechercher"
                />
                <button
                    v-if="searchQuery"
                    class="search-clear"
                    @click="searchQuery = ''"
                    aria-label="Effacer la recherche"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>

            <div class="filter-group">
                <select v-model="filterVoamami" class="filter-select" aria-label="Filtrer par VOAMAMI">
                    <option :value="null">Tous les VOAMAMI</option>
                    <option
                        v-for="v in voamamis"
                        :key="v.id"
                        :value="v.id"
                    >
                        {{ v.code }}
                    </option>
                </select>

                <select v-model="filterStatut" class="filter-select" aria-label="Filtrer par statut">
                    <option :value="null">Tous statuts</option>
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                </select>

                <select v-model="filterRole" class="filter-select" aria-label="Filtrer par rôle">
                    <option :value="null">Tous les rôles</option>
                    <option value="PRESIDENT">Président</option>
                    <option value="SECRETAIRE">Secrétaire</option>
                    <option value="TRESORIER">Trésorier</option>
                    <option value="MEMBRE">Membre</option>
                </select>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="state-block">
            <div class="spinner"></div>
            <p>Chargement des membres…</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="state-block state-error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p>{{ error }}</p>
            <button class="btn-secondary" @click="loadMembres">Réessayer</button>
        </div>

        <!-- Empty (no data at all) -->
        <div v-else-if="membres.length === 0" class="state-block">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <p>Aucun membre enregistré.</p>
            <router-link to="/membres/nouveau" class="btn-primary">Créer le premier membre</router-link>
        </div>

        <!-- Empty (filtered) -->
        <div v-else-if="filteredMembres.length === 0" class="state-block">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            <p>Aucun résultat pour ces filtres.</p>
            <button class="btn-secondary" @click="resetFilters">Réinitialiser les filtres</button>
        </div>

        <!-- Table -->
        <div v-else class="table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>N°</th>
                        <th>Nom et prénom</th>
                        <th>VOAMAMI</th>
                        <th>Téléphone</th>
                        <th>Rôle</th>
                        <th>Cycle actif</th>
                        <th class="text-right">Épargne</th>
                        <th>Statut</th>
                        <th class="col-actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(membre, i) in paginatedMembres" :key="membre.id" :class="{ 'row-even': i % 2 === 0 }">
                        <td class="td-muted">{{ membre.numero_membre }}</td>

                        <td class="cell-person">
                            <span class="person-name">{{ membre.nom }} {{ membre.prenom }}</span>
                            <span class="person-meta">{{ membre.sexe || "—" }}</span>
                        </td>

                        <td class="cell-voamami">
                            <code class="code-badge">{{ membre.voamami_code }}</code>
                            <span class="voamami-nom">{{ membre.voamami_nom }}</span>
                        </td>

                        <td>{{ membre.telephone || "—" }}</td>

                        <td>
                            <span :class="['role-badge', 'role-' + (membre.role_bureau || 'membre').toLowerCase()]">
                                {{ formatRole(membre.role_bureau) }}
                            </span>
                        </td>

                        <td>
                            <template v-if="membre.cycle_actif_id">
                                <span class="cycle-info">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    Cycle {{ membre.numero_cycle }}
                                </span>
                                <span class="cycle-meta">{{ membre.cycle_statut }}</span>
                            </template>
                            <span v-else class="muted">Aucun</span>
                        </td>

                        <td class="text-right">{{ formatMoney(membre.solde_epargne) }}</td>

                        <td>
                            <span :class="['badge', 'badge-' + (membre.actif ? 'actif' : 'inactif')]">
                                <span class="badge-dot"></span>
                                {{ membre.actif ? "Actif" : "Inactif" }}
                            </span>
                        </td>

                        <td class="col-actions">
                            <div class="actions">
                                <router-link
                                    :to="`/membres/${membre.id}/modifier`"
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
                                    @click="onDelete(membre.id)"
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
                    <span>Affichage {{ rangeStart }}–{{ rangeEnd }} sur {{ filteredMembres.length }}</span>
                    <select v-model.number="pageSize" class="page-size-select" aria-label="Lignes par page">
                        <option :value="10">10 / page</option>
                        <option :value="25">25 / page</option>
                        <option :value="50">50 / page</option>
                        <option :value="100">100 / page</option>
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
                    >
                        {{ p }}
                    </button>

                    <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++" aria-label="Page suivante">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
    <ConfirmationDialog
        v-model="showDeleteDialog"
        title="Supprimer ce membre ?"
        message="Cette action est irréversible."
        confirm-label="Supprimer"
        loading-label="Suppression..."
        :loading="deleting"
        @confirm="confirmDelete"
    />
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import membreService from "../../service/membre.service.js";
import voamamiService from "../../service/voamami.service.js";
import { useToast } from "../../composables/useToast.js";
import ConfirmationDialog from "../../components/ConfirmationDialog.vue";

const toast = useToast();
const membres = ref([]);
const voamamis = ref([]);
const loading = ref(true);
const error = ref("");
const showDeleteDialog = ref(false);
const selectedMemberId = ref(null);
const deleting = ref(false);

// Filters
const searchQuery = ref("");
const filterVoamami = ref(null);
const filterStatut = ref(null);
const filterRole = ref(null);

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);

// Computed: filtered
const filteredMembres = computed(() => {
    let list = [...membres.value];

    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        list = list.filter((m) =>
            m.nom?.toLowerCase().includes(q) ||
            m.prenom?.toLowerCase().includes(q) ||
            m.voamami_code?.toLowerCase().includes(q) ||
            m.telephone?.includes(q) ||
            String(m.numero_membre).includes(q)
        );
    }

    if (filterVoamami.value) {
        list = list.filter((m) => Number(m.voamami_id) === Number(filterVoamami.value));
    }

    if (filterStatut.value) {
        list = list.filter((m) => (m.actif ? "actif" : "inactif") === filterStatut.value);
    }

    if (filterRole.value) {
        list = list.filter((m) => m.role_bureau === filterRole.value);
    }

    return list.sort((a, b) => Number(a.numero_membre ?? 0) - Number(b.numero_membre ?? 0));
});

// Computed: pagination
const totalPages = computed(() => Math.max(1, Math.ceil(filteredMembres.value.length / pageSize.value)));
const paginatedMembres = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return filteredMembres.value.slice(start, start + pageSize.value);
});
const rangeStart = computed(() => filteredMembres.value.length === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1);
const rangeEnd = computed(() => Math.min(currentPage.value * pageSize.value, filteredMembres.value.length));

const visiblePages = computed(() => {
    const total = totalPages.value;
    const cur = currentPage.value;
    const pages = [];
    const start = Math.max(1, cur - 2);
    const end = Math.min(total, cur + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
});

// Reset page when filters change
watch([searchQuery, filterVoamami, filterStatut, filterRole, pageSize], () => {
    currentPage.value = 1;
});

function resetFilters() {
    searchQuery.value = "";
    filterVoamami.value = null;
    filterStatut.value = null;
    filterRole.value = null;
}

// Formatters
function formatMoney(value) {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "MGA",
        minimumFractionDigits: 0
    }).format(Number(value || 0));
}

function formatRole(role) {
    const roles = {
        PRESIDENT: "Président",
        SECRETAIRE: "Secrétaire",
        TRESORIER: "Trésorier",
        MEMBRE: "Membre"
    };
    return roles[role] || role || "—";
}

// Load
async function loadMembres() {
    loading.value = true;
    error.value = "";
    try {
        const [membresRes, voamamisRes] = await Promise.all([
            membreService.getAll(),
            voamamiService.getAll()
        ]);
        membres.value = membresRes.data.data ?? [];
        voamamis.value = voamamisRes.data.data ?? [];
    } catch (e) {
        console.error("Erreur chargement membres :", e.response?.data || e);
        error.value = e.response?.data?.message || "Erreur de chargement des membres";
    } finally {
        loading.value = false;
    }
}

function onDelete(id) {
    selectedMemberId.value = id;
    showDeleteDialog.value = true;
}

async function confirmDelete() {
    if (selectedMemberId.value === null || deleting.value) return;
    const id = selectedMemberId.value;
    deleting.value = true;
    try {
        await membreService.remove(id);
        membres.value = membres.value.filter((m) => m.id !== id);
        toast.success("Membre supprimé avec succès.");
        showDeleteDialog.value = false;
        selectedMemberId.value = null;
    } catch (e) {
        toast.error(e.response?.data?.message || "Suppression impossible");
    } finally {
        deleting.value = false;
    }
}

onMounted(loadMembres);
</script>

<style scoped>
/* ===== Page ===== */
.page {
    max-width: 1300px;
    margin: 0 auto;
    padding: 1.5rem;
    font-family: "Poppins", sans-serif !important;
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
    min-width: 240px;
    max-width: 380px;
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
    padding: 0.55rem 2.2rem 0.55rem 2.4rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.875rem;
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
    padding: 0.25rem;
    display: flex;
    align-items: center;
}
.search-clear:hover { color: #475569; }

.filter-group {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
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
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.6rem center;
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

/* ===== Table wrapper ===== */
.table-wrapper {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    background: #fff;
    overflow: hidden;
}

/* ===== Table ===== */
.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    min-width: 1000px;
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
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
}
.data-table tbody tr { transition: background 0.1s; }
.data-table tbody tr:hover { background: #f8fafc; }
.data-table tbody tr.row-even { background: #fcfcfd; }
.data-table tbody tr.row-even:hover { background: #f1f5f9; }
.data-table tbody tr:last-child td { border-bottom: none; }

/* ===== Helpers ===== */
.text-right { text-align: right; }
.td-muted { color: #94a3b8; font-size: 0.8rem; }
.muted { color: #cbd5e1; }

/* ===== Person cell ===== */
.cell-person { white-space: nowrap; }
.person-name {
    display: block;
    font-weight: 600;
}
.person-meta {
    display: block;
    font-size: 0.78rem;
    color: #94a3b8;
    margin-top: 0.1rem;
}

/* ===== VOAMAMI cell ===== */
.cell-voamami { white-space: nowrap; }
.code-badge {
    display: inline-block;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-size: 0.78rem;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    color: #475569;
}
.voamami-nom {
    display: block;
    font-size: 0.78rem;
    color: #64748b;
    margin-top: 0.15rem;
}

/* ===== Role badge ===== */
.role-badge {
    display: inline-block;
    padding: 0.2rem 0.55rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
}
.role-president { background: #ede9fe; color: #5b21b6; }
.role-secretaire { background: #e0f2fe; color: #075985; }
.role-tresorier { background: #fef3c7; color: #92400e; }
.role-membre { background: #f1f5f9; color: #475569; }

/* ===== Cycle cell ===== */
.cycle-info {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-weight: 500;
    font-size: 0.85rem;
}
.cycle-meta {
    display: block;
    font-size: 0.75rem;
    color: #94a3b8;
    margin-top: 0.1rem;
}

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