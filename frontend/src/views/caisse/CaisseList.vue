<template>
    <div class="page">
        <div class="page-header">
            <div class="header-left">
                <router-link to="/seances" class="back-link" aria-label="Retour">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </router-link>
                <div>
                    <h1>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                        Caisse du VOAMAMI
                    </h1>
                    <p class="subtitle">Les mouvements sont isolés par VOAMAMI</p>
                </div>
            </div>
        </div>

        <!-- Toolbar: filters -->
        <div class="toolbar">
            <div class="filter-group">
                <div class="select-wrapper">
                    <select v-model="filters.voamami_id" class="filter-select filter-select-main" aria-label="VOAMAMI" @change="onVoamamiChange">
                        <option value="">— Sélectionner un VOAMAMI —</option>
                        <option v-for="v in voamamis" :key="v.id" :value="String(v.id)">
                            {{ v.code }} — {{ v.nom }}
                        </option>
                    </select>
                    <svg class="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>

                <div class="select-wrapper">
                    <select v-model="filters.cycle_id" class="filter-select" aria-label="Cycle" @change="loadAll">
                        <option value="">Tous les cycles</option>
                        <option v-for="c in filteredCycles" :key="c.id" :value="String(c.id)">
                            Cycle {{ c.numero_cycle }}
                        </option>
                    </select>
                    <svg class="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>

                <div class="select-wrapper">
                    <select v-model="filters.seance_id" class="filter-select" aria-label="Séance" @change="loadAll">
                        <option value="">Toutes les séances</option>
                        <option v-for="s in filteredSeances" :key="s.id" :value="String(s.id)">
                            S{{ s.numero_seance }} — {{ formatDate(s.date_seance) }}
                        </option>
                    </select>
                    <svg class="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
            </div>

            <div class="filter-group">
                <div class="select-wrapper">
                    <select v-model="filters.sens" class="filter-select" aria-label="Sens" @change="loadAll">
                        <option value="">Tous les sens</option>
                        <option value="ENTREE">Entrées</option>
                        <option value="SORTIE">Sorties</option>
                    </select>
                    <svg class="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>

                <div class="select-wrapper">
                    <select v-model="filters.type_mouvement" class="filter-select" aria-label="Type" @change="loadAll">
                        <option value="">Tous les types</option>
                        <option value="EPARGNE">Épargne</option>
                        <option value="CREDIT">Crédit</option>
                        <option value="REMBOURSEMENT_CAPITAL">Remb. capital</option>
                        <option value="REMBOURSEMENT_INTERET">Remb. intérêt</option>
                        <option value="PENALITE">Pénalité</option>
                    </select>
                    <svg class="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="state-block">
            <div class="spinner"></div>
            <p>Chargement de la caisse…</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="state-block state-error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p>{{ error }}</p>
            <button class="btn-secondary" @click="loadAll">Réessayer</button>
        </div>

        <!-- No VOAMAMI selected -->
        <div v-else-if="!filters.voamami_id" class="state-block">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><circle cx="12" cy="14" r="2"/></svg>
            <p>Sélectionnez un VOAMAMI pour consulter sa caisse.</p>
        </div>

        <!-- Content -->
        <template v-else>
            <!-- Summary cards -->
            <div class="summary-cards">
                <div class="summary-card summary-entree">
                    <div class="summary-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                    </div>
                    <div class="summary-content">
                        <span class="summary-label">Total entrées</span>
                        <span class="summary-value">{{ money(summary.total_entrees) }}</span>
                    </div>
                </div>

                <div class="summary-card summary-sortie">
                    <div class="summary-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
                    </div>
                    <div class="summary-content">
                        <span class="summary-label">Total sorties</span>
                        <span class="summary-value">{{ money(summary.total_sorties) }}</span>
                    </div>
                </div>

                <div class="summary-card summary-solde">
                    <div class="summary-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/></svg>
                    </div>
                    <div class="summary-content">
                        <span class="summary-label">Solde actuel</span>
                        <span :class="['summary-value', 'summary-solde-value', summary.solde >= 0 ? 'solde-positive' : 'solde-negative']">
                            {{ money(summary.solde) }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Table -->
            <div v-if="mouvements.length" class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Cycle</th>
                            <th>Séance</th>
                            <th>Type</th>
                            <th>Membre</th>
                            <th>Sens</th>
                            <th class="text-right">Montant</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(m, i) in mouvements" :key="m.id" :class="{ 'row-even': i % 2 === 0 }">
                            <td>{{ formatDate(m.date_mouvement) }}</td>
                            <td class="td-bold">C{{ m.numero_cycle || m.cycle_id }}</td>
                            <td>S{{ m.numero_seance || m.seance_id }}</td>
                            <td>
                                <span :class="['type-badge', 'type-' + (m.type_mouvement || '').toLowerCase().replace(/_/g, '-')]">
                                    {{ labelType(m.type_mouvement) }}
                                </span>
                            </td>
                            <td>
                                <span v-if="m.membre_nom" class="td-bold">{{ m.membre_nom }} {{ m.membre_prenom }}</span>
                                <span v-else class="muted">Caisse générale</span>
                            </td>
                            <td>
                                <span :class="['badge', m.sens === 'ENTREE' ? 'badge-entree' : 'badge-sortie']">
                                    <svg v-if="m.sens === 'ENTREE'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                                    <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                                    {{ m.sens === 'ENTREE' ? 'Entrée' : 'Sortie' }}
                                </span>
                            </td>
                            <td :class="['text-right', 'td-bold', m.sens === 'ENTREE' ? 'text-entree' : 'text-sortie']">
                                {{ m.sens === 'ENTREE' ? '+' : '−' }} {{ money(m.montant) }}
                            </td>
                            <td class="td-desc">{{ m.description || "—" }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Empty filtered -->
            <div v-else class="state-block">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                <p>Aucun mouvement pour ces filtres.</p>
                <button class="btn-secondary" @click="resetFilters">Réinitialiser les filtres</button>
            </div>
        </template>
    </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import mouvementCaisseService from "../../service/mouvement-caisse.service.js";
import voamamiService from "../../service/voamami.service.js";
import cycleService from "../../service/cycle.service.js";
import seanceService from "../../service/seance.service.js";

const route = useRoute();
const voamamis = ref([]);
const cycles = ref([]);
const seances = ref([]);
const mouvements = ref([]);
const loading = ref(false);
const error = ref("");
const summary = ref({ total_entrees: 0, total_sorties: 0, solde: 0 });

const filters = reactive({
    voamami_id: String(route.query.voamami_id || ""),
    cycle_id: String(route.query.cycle_id || ""),
    seance_id: String(route.query.seance_id || ""),
    sens: route.query.sens || "",
    type_mouvement: route.query.type_mouvement || ""
});

// Filtered cycles/seances based on selected VOAMAMI
const filteredCycles = computed(() => {
    if (!filters.voamami_id) return [];
    return cycles.value.filter((c) => Number(c.voamami_id) === Number(filters.voamami_id));
});

const filteredSeances = computed(() => {
    if (!filters.voamami_id) return [];
    let list = seances.value.filter((s) => Number(s.voamami_id) === Number(filters.voamami_id));
    if (filters.cycle_id) {
        list = list.filter((s) => Number(s.cycle_id) === Number(filters.cycle_id));
    }
    return list;
});

function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value).slice(0, 10);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function money(value) {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "MGA",
        minimumFractionDigits: 0
    }).format(Number(value || 0));
}

function labelType(value) {
    return {
        EPARGNE: "Épargne",
        CREDIT: "Crédit",
        REMBOURSEMENT_CAPITAL: "Remb. capital",
        REMBOURSEMENT_INTERET: "Remb. intérêt",
        PENALITE: "Pénalité"
    }[value] || value;
}

function params() {
    const result = { voamami_id: filters.voamami_id };
    for (const key of ["cycle_id", "seance_id", "sens", "type_mouvement"]) {
        if (filters[key] !== "" && filters[key] !== null) result[key] = filters[key];
    }
    return result;
}

function resetFilters() {
    filters.cycle_id = "";
    filters.seance_id = "";
    filters.sens = "";
    filters.type_mouvement = "";
    loadAll();
}

async function onVoamamiChange() {
    filters.cycle_id = "";
    filters.seance_id = "";
    await loadCyclesAndSeances();
    await loadAll();
}

async function loadCyclesAndSeances() {
    if (!filters.voamami_id) { cycles.value = []; seances.value = []; return; }
    try {
        const [cRes, sRes] = await Promise.all([
            cycleService.getAll(),
            seanceService.getAll()
        ]);
        cycles.value = cRes.data.data ?? cRes.data.cycles ?? [];
        seances.value = sRes.data.data ?? sRes.data.seances ?? [];
    } catch (e) { /* non bloquant */ }
}

async function loadAll() {
    error.value = "";
    if (!filters.voamami_id) {
        mouvements.value = [];
        summary.value = { total_entrees: 0, total_sorties: 0, solde: 0 };
        return;
    }

    loading.value = true;
    try {
        const query = params();
        const [listResponse, summaryResponse] = await Promise.all([
            mouvementCaisseService.getAll(query),
            mouvementCaisseService.getSummary(query)
        ]);
        mouvements.value = listResponse.data.data ?? [];
        summary.value = summaryResponse.data.data ?? summary.value;
    } catch (e) {
        error.value = e.response?.data?.message || "Impossible de charger la caisse.";
    } finally {
        loading.value = false;
    }
}

onMounted(async () => {
    try {
        const res = await voamamiService.getAll();
        voamamis.value = res.data.data ?? res.data.voamamis ?? res.data ?? [];
        if (filters.voamami_id) {
            await loadCyclesAndSeances();
            await loadAll();
        }
    } catch (e) {
        error.value = e.response?.data?.message || "Impossible de charger les VOAMAMI.";
    }
});
</script>

<style scoped>
/* ===== Page ===== */
.page {
    max-width: 1300px;
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
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
}
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
    min-width: 150px;
}
.filter-select:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
}
.filter-select-main {
    min-width: 220px;
    font-weight: 600;
    color: #1e293b;
}

/* ===== Summary cards ===== */
.summary-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
}
@media (max-width: 700px) {
    .summary-cards { grid-template-columns: 1fr; }
}

.summary-card {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 1rem 1.25rem;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.summary-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 10px;
    flex-shrink: 0;
}
.summary-entree .summary-icon { background: #dcfce7; color: #166534; }
.summary-sortie .summary-icon { background: #fee2e2; color: #991b1b; }
.summary-solde .summary-icon { background: #eff6ff; color: #1d4ed8; }

.summary-content {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}
.summary-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: #64748b;
}
.summary-value {
    font-size: 1.15rem;
    font-weight: 700;
    color: #0f172a;
}
.solde-positive { color: #166534; }
.solde-negative { color: #991b1b; }

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
    font-size: 0.85rem;
    min-width: 900px;
}
.data-table thead {
    background: #f8fafc;
    border-bottom: 2px solid #e2e8f0;
}
.data-table th {
    padding: 0.75rem 0.85rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #64748b;
    white-space: nowrap;
}
.data-table td {
    padding: 0.7rem 0.85rem;
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
.td-bold { font-weight: 600; }
.muted { color: #94a3b8; font-style: italic; }
.td-desc {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #64748b;
}
.text-entree { color: #166534; }
.text-sortie { color: #991b1b; }

/* ===== Type badge ===== */
.type-badge {
    display: inline-block;
    padding: 0.2rem 0.55rem;
    border-radius: 6px;
    font-size: 0.72rem;
    font-weight: 600;
    white-space: nowrap;
}
.type-epargne { background: #dcfce7; color: #166534; }
.type-credit { background: #fef3c7; color: #92400e; }
.type-remboursement-capital { background: #e0f2fe; color: #075985; }
.type-remboursement-interet { background: #ede9fe; color: #5b21b6; }
.type-penalite { background: #fee2e2; color: #991b1b; }

/* ===== Sens badges ===== */
.badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    white-space: nowrap;
}
.badge-entree { background: #dcfce7; color: #166534; }
.badge-sortie { background: #fee2e2; color: #991b1b; }
</style>