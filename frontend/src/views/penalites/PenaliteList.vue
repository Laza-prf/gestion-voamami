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
                        Pénalités
                    </h1>
                    <p class="subtitle">{{ penalites.length }} pénalité(s) — {{ contextLabel }}</p>
                </div>
            </div>

        </div>

        <!-- Toolbar -->
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
                    <select v-model="filters.statut" class="filter-select" aria-label="Filtrer par statut" @change="load">
                        <option value="">Tous les statuts</option>
                        <option value="IMPAYEE">Impayées</option>
                        <option value="PAYEE">Payées</option>
                    </select>
                    <svg class="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="state-block">
            <div class="spinner"></div>
            <p>Chargement des pénalités…</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="state-block state-error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p>{{ error }}</p>
            <button class="btn-secondary" @click="load">Réessayer</button>
        </div>

        <!-- Empty -->
        <div v-else-if="penalites.length === 0" class="state-block">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <p>Aucune pénalité enregistrée.</p>
            <router-link :to="newLink" class="btn-primary">Créer une pénalité</router-link>
        </div>

        <!-- Empty filtered -->
        <div v-else-if="filteredPenalites.length === 0" class="state-block">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            <p>Aucun résultat pour ces filtres.</p>
            <button class="btn-secondary" @click="searchQuery = ''; filters.statut = ''; load()">Réinitialiser</button>
        </div>

        <!-- Table -->
        <div v-else class="table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Séance</th>
                        <th>Membre</th>
                        <th>Type</th>
                        <th class="text-right">Montant</th>
                        <th>Motif</th>
                        <th>Statut</th>
                        <th class="col-actions">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(p, i) in filteredPenalites" :key="p.id" :class="{ 'row-even': i % 2 === 0 }">
                        <td>{{ formatDate(p.date_penalite) }}</td>
                        <td class="td-bold">S{{ p.numero_seance || p.seance_id }}</td>
                        <td class="cell-member">
                            <span class="member-name">N° {{ p.numero_membre }} — {{ p.membre_nom }} {{ p.membre_prenom }}</span>
                        </td>
                        <td>
                            <span :class="['type-badge', 'type-' + (p.type_penalite || '').toLowerCase().replace(/\s/g, '-')]">
                                {{ p.type_penalite }}
                            </span>
                        </td>
                        <td class="text-right td-bold">{{ money(p.montant) }}</td>
                        <td class="td-motif">{{ p.motif || "—" }}</td>
                        <td>
                            <span :class="['badge', p.statut === 'PAYEE' ? 'badge-payee' : 'badge-impayee']">
                                <span class="badge-dot"></span>
                                {{ p.statut === 'PAYEE' ? 'Payée' : 'Impayée' }}
                            </span>
                        </td>
                        <td class="col-actions">
                            <button
                                v-if="p.statut === 'IMPAYEE'"
                                class="icon-btn icon-btn-pay"
                                title="Marquer payée"
                                aria-label="Marquer payée"
                                @click="pay(p)"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </button>
                            <span v-else class="paid-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                Encaissée
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    <ConfirmationDialog
        v-model="showPayDialog"
        title="Confirmer le paiement ?"
        :message="selectedPenalty ? `Marquer la pénalité de ${money(selectedPenalty.montant)} comme payée ?` : ''"
        confirm-label="Confirmer le paiement"
        loading-label="Enregistrement..."
        :loading="paying"
        @confirm="confirmPay"
    />
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import penaliteService from "../../service/penalite.service.js";
import ConfirmationDialog from "../../components/ConfirmationDialog.vue";
import { useToast } from "../../composables/useToast.js";

const route = useRoute();
const toast = useToast();
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
const penalites = ref([]);
const loading = ref(true);
const error = ref("");
const showPayDialog = ref(false);
const selectedPenalty = ref(null);
const paying = ref(false);
const searchQuery = ref("");
const filters = reactive({ statut: String(route.query.statut || "") });

const contextParams = computed(() => {
    const params = {};
    for (const key of ["voamami_id", "cycle_id", "seance_id", "membre_id"]) {
        if (route.query[key]) params[key] = route.query[key];
    }
    return params;
});

const contextLabel = computed(() => {
    if (route.query.seance_id) return `Séance ${route.query.seance_id}`;
    if (route.query.cycle_id) return `Cycle ${route.query.cycle_id}`;
    if (route.query.voamami_id) return `VOAMAMI #${route.query.voamami_id}`;
    return "Toutes les pénalités";
});

const newLink = computed(() => ({
    path: "/penalites/nouveau",
    query: { seance_id: route.query.seance_id || "" }
}));

// Client-side search filter
const filteredPenalites = computed(() => {
    if (!searchQuery.value) return penalites.value;
    const q = searchQuery.value.toLowerCase();
    return penalites.value.filter((p) =>
        p.membre_nom?.toLowerCase().includes(q) ||
        p.membre_prenom?.toLowerCase().includes(q) ||
        String(p.numero_membre).includes(q)
    );
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

async function load() {
    loading.value = true;
    error.value = "";
    try {
        const params = { ...contextParams.value };
        if (filters.statut) params.statut = filters.statut;
        const { data } = await penaliteService.getAll(params);
        penalites.value = data.data ?? [];
    } catch (e) {
        error.value = e.response?.data?.message || "Impossible de charger les pénalités.";
    } finally {
        loading.value = false;
    }
}

function pay(penalite) {
    selectedPenalty.value = penalite;
    showPayDialog.value = true;
}

async function confirmPay() {
    if (!selectedPenalty.value || paying.value) return;
    const penalite = selectedPenalty.value;
    paying.value = true;
    try {
        await penaliteService.update(penalite.id, {
            statut: "PAYEE",
            motif: penalite.motif
        });
        toast.success("Pénalité marquée comme payée.");
        showPayDialog.value = false;
        selectedPenalty.value = null;
        await load();
    } catch (e) {
        error.value = e.response?.data?.message || "Impossible d'enregistrer le paiement.";
        toast.error(error.value);
    } finally {
        paying.value = false;
    }
}

onMounted(load);
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
.td-bold { font-weight: 600; }
.td-motif {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* ===== Member cell ===== */
.cell-member { white-space: nowrap; }
.member-name { font-weight: 500; }

/* ===== Type badge ===== */
.type-badge {
    display: inline-block;
    padding: 0.2rem 0.55rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
}
.type-retard { background: #fef3c7; color: #92400e; }
.type-absence { background: #fee2e2; color: #991b1b; }
.type-autre { background: #f1f5f9; color: #475569; }

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
.badge-payee { background: #dcfce7; color: #166534; }
.badge-impayee { background: #fef3c7; color: #92400e; }

/* ===== Actions ===== */
.col-actions { width: 90px; text-align: right; }
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
.icon-btn-pay {
    color: #166534;
    background: #dcfce7;
    border-color: #bbf7d0;
}
.icon-btn-pay:hover { background: #bbf7d0; border-color: #86efac; }

.paid-label {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.78rem;
    font-weight: 600;
    color: #166534;
}
</style>