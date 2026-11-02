<template>
    <div class="page">
        <div class="page-header">
            <div class="header-left">
                <router-link
                    :to="returnLink"
                    class="back-link"
                    :aria-label="route.query.assistant === '1' ? 'Retour à la vérification' : 'Retour aux séances'"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </router-link>
                <div>
                    <h1>

                        Épargnes
                    </h1>
                    <p class="subtitle">{{ filteredItems.length }} opération(s)</p>
                </div>
            </div>

        </div>

        <!-- Toolbar: filters -->
        <div class="toolbar">
            <div class="search-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                    v-model.trim="searchQuery"
                    type="text"
                    placeholder="Rechercher un membre…"
                    aria-label="Rechercher"
                />
                <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''" aria-label="Effacer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>

            <div class="filter-group">
                <div class="select-wrapper">
                    <select v-model="filterVoamami" class="filter-select" aria-label="Filtrer par VOAMAMI">
                        <option :value="null">Tous les VOAMAMI</option>
                        <option v-for="v in voamamis" :key="v.id" :value="v.id">{{ v.code }}</option>
                    </select>
                    <svg class="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>

                <div class="select-wrapper">
                    <select v-model="filterSeance" class="filter-select" aria-label="Filtrer par séance">
                        <option :value="null">Toutes les séances</option>
                        <option v-for="s in seances" :key="s.id" :value="s.id">
                            S{{ s.numero_seance }} — {{ s.voamami_code }}
                        </option>
                    </select>
                    <svg class="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="state-block">
            <div class="spinner"></div>
            <p>Chargement…</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="state-block state-error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p>{{ error }}</p>
            <button class="btn-secondary" @click="load">Réessayer</button>
        </div>

        <!-- Empty (no data) -->
        <div v-else-if="items.length === 0" class="state-block">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>
            <p>Aucune épargne enregistrée.</p>
            <router-link :to="newLink" class="btn-primary">Enregistrer la première épargne</router-link>
        </div>

        <!-- Empty (filtered) -->
        <div v-else-if="filteredItems.length === 0" class="state-block">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            <p>Aucun résultat pour ces filtres.</p>
            <button class="btn-secondary" @click="resetFilters">Réinitialiser les filtres</button>
        </div>

        <!-- Table -->
        <div v-else class="table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Membre</th>
                        <th>VOAMAMI</th>
                        <th>Séance</th>
                        <th class="text-center">Parts</th>
                        <th class="text-right">Montant/part</th>
                        <th class="text-right">Total</th>
                        <th>Date</th>
                        <th class="col-actions">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item, i) in filteredItems" :key="item.id" :class="{ 'row-even': i % 2 === 0 }">
                        <td class="td-bold">{{ item.membre_nom }} {{ item.membre_prenom }}</td>
                        <td><code class="code-badge">{{ item.voamami_code || "—" }}</code></td>
                        <td>S{{ item.numero_seance }}</td>
                        <td class="text-center">{{ item.nombre_parts }}</td>
                        <td class="text-right">{{ money(item.montant_part) }}</td>
                        <td class="text-right td-bold">{{ money(item.montant_total) }}</td>
                        <td>{{ date(item.date_epargne) }}</td>
                        <td class="col-actions">
                            <button class="icon-btn icon-btn-delete" title="Supprimer" aria-label="Supprimer" @click="remove(item.id)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    <ConfirmationDialog
        v-model="showDeleteDialog"
        title="Supprimer cette épargne ?"
        message="Cette action est irréversible."
        confirm-label="Supprimer"
        loading-label="Suppression..."
        :loading="deleting"
        @confirm="confirmRemove"
    />
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import epargneService from "../../service/epargne.service.js";
import voamamiService from "../../service/voamami.service.js";
import seanceService from "../../service/seance.service.js";
import { useToast } from "../../composables/useToast.js";
import ConfirmationDialog from "../../components/ConfirmationDialog.vue";

const toast = useToast();
const route = useRoute();
const returnLink = computed(() => {
    const seanceId = route.query.seance_id;
    if (route.query.assistant !== "1" || typeof seanceId !== "string") {
        return "/seances";
    }
    return {
        path: `/seances/${seanceId}/operations`,
        query: {
            etape: "5",
            ...(typeof route.query.verifie === "string"
                ? { verifie: route.query.verifie }
                : {})
        }
    };
});
const items = ref([]);
const loading = ref(true);
const error = ref("");
const showDeleteDialog = ref(false);
const selectedItemId = ref(null);
const deleting = ref(false);

// Filters
const searchQuery = ref("");
const filterVoamami = ref(null);
const filterSeance = ref(route.query.seance_id || null);

// Filter options
const voamamis = ref([]);
const seances = ref([]);

const newLink = computed(() => ({
    path: "/epargnes/nouveau",
    query: route.query.seance_id ? { seance_id: route.query.seance_id } : {}
}));

// Filtered items
const filteredItems = computed(() => {
    let list = items.value;

    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        list = list.filter((m) =>
            m.membre_nom?.toLowerCase().includes(q) ||
            m.membre_prenom?.toLowerCase().includes(q)
        );
    }

    if (filterVoamami.value) {
        list = list.filter((m) => Number(m.voamami_id) === Number(filterVoamami.value));
    }

    if (filterSeance.value) {
        list = list.filter((m) => Number(m.seance_id) === Number(filterSeance.value));
    }

    return list;
});

// Reset page on filter change
watch([searchQuery, filterVoamami, filterSeance], () => {});

function resetFilters() {
    searchQuery.value = "";
    filterVoamami.value = null;
    filterSeance.value = null;
}

// Formatters
const money = (value) => new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "MGA",
    minimumFractionDigits: 0
}).format(Number(value || 0));

const date = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value).slice(0, 10);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

// Load
async function load() {
    loading.value = true;
    error.value = "";
    try {
        const [epRes, voaRes, seaRes] = await Promise.all([
            epargneService.getAll(route.query.seance_id ? { seance_id: route.query.seance_id } : {}),
            voamamiService.getAll(),
            seanceService.getAll()
        ]);
        items.value = epRes.data.data ?? [];
        voamamis.value = voaRes.data.data ?? [];
        seances.value = (seaRes.data.data ?? seaRes.data.seances ?? []).slice(0, 50);
    } catch (e) {
        error.value = e.response?.data?.message || "Erreur de chargement.";
    } finally {
        loading.value = false;
    }
}

function remove(id) {
    selectedItemId.value = id;
    showDeleteDialog.value = true;
}

async function confirmRemove() {
    if (selectedItemId.value === null || deleting.value) return;
    const id = selectedItemId.value;
    deleting.value = true;
    try {
        await epargneService.remove(id);
        items.value = items.value.filter((item) => item.id !== id);
        toast.success("Épargne supprimée avec succès.");
        showDeleteDialog.value = false;
        selectedItemId.value = null;
    } catch (e) {
        toast.error(e.response?.data?.message || "Suppression impossible.");
    } finally {
        deleting.value = false;
    }
}

onMounted(load);
</script>

<style scoped>
/* ===== Page ===== */
.page {
    max-width: 1000px;
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
.header-left { display: flex; align-items: center; gap: 0.75rem; }
.back-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    color: #64748b;
    background: #f1f5f9;
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
}
.back-link:hover { background: #e2e8f0; color: #1e293b; }
.page-header h1 {
    font-size: 1.35rem;
    font-weight: 700;
    margin: 0;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 0.5rem;
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
    min-width: 200px;
    max-width: 280px;
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

.filter-group {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

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
    overflow-x: auto;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    background: #fff;
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
.text-right { text-align: right; }
.text-center { text-align: center; }
.td-bold { font-weight: 600; }

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

/* ===== Actions ===== */
.col-actions { width: 50px; text-align: right; }
.icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.15s;
}
.icon-btn-delete {
    color: #dc2626;
    background: #fef2f2;
    border-color: #fecaca;
}
.icon-btn-delete:hover { background: #fee2e2; border-color: #fca5a5; }
</style>