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
                        Crédits
                    </h1>
                    <p class="subtitle">{{ filteredCredits.length }} crédit(s)</p>
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

                <div class="select-wrapper">
                    <select v-model="filterStatut" class="filter-select" aria-label="Filtrer par statut">
                        <option :value="null">Tous les statuts</option>
                        <option value="EN_COURS">En cours</option>
                        <option value="ACQUITTE">Acquitté</option>
                        <option value="EN_RETARD">En retard</option>
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
        <div v-else-if="credits.length === 0" class="state-block">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <p>Aucun crédit enregistré.</p>
            <router-link :to="newLink" class="btn-primary">Créer le premier crédit</router-link>
        </div>

        <!-- Empty (filtered) -->
        <div v-else-if="filteredCredits.length === 0" class="state-block">
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
                        <th class="text-right">Capital</th>
                        <th class="text-right">Intérêt</th>
                        <th class="text-right">Total</th>
                        <th class="text-right">Reste à payer</th>
                        <th>Échéance</th>
                        <th>Statut</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(credit, i) in filteredCredits" :key="credit.id" :class="{ 'row-even': i % 2 === 0 }">
                        <td class="td-bold">{{ credit.membre_nom }} {{ credit.membre_prenom }}</td>
                        <td><code class="code-badge">{{ credit.voamami_code || "—" }}</code></td>
                        <td class="text-right">{{ money(credit.montant_capital) }}</td>
                        <td class="text-right">{{ money(credit.montant_interet) }}</td>
                        <td class="text-right td-bold">{{ money(credit.montant_total) }}</td>
                        <td class="text-right" :class="{ 'text-danger': (credit.reste_a_payer || 0) > 0 }">
                            {{ money(credit.reste_a_payer) }}
                        </td>
                        <td :class="{ 'text-danger': isOverdue(credit) }">{{ date(credit.date_echeance) }}</td>
                        <td>
                            <span :class="['badge', 'badge-' + (credit.statut || '').toLowerCase().replace(/\s/g, '-')]">
                                <span class="badge-dot"></span>
                                {{ formatStatut(credit.statut) }}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import creditService from "../../service/credit.service.js";
import voamamiService from "../../service/voamami.service.js";
import seanceService from "../../service/seance.service.js";

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
const credits = ref([]);
const loading = ref(true);
const error = ref("");

// Filters
const searchQuery = ref("");
const filterVoamami = ref(null);
const filterSeance = ref(route.query.seance_id || null);
const filterStatut = ref(null);

// Filter options
const voamamis = ref([]);
const seances = ref([]);

const seanceId = computed(() => route.query.seance_id || null);
const newLink = computed(() => ({
    path: "/credits/nouveau",
    query: seanceId.value ? { seance_id: seanceId.value } : {}
}));

// Filtered
const filteredCredits = computed(() => {
    let list = credits.value;

    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        list = list.filter((c) =>
            c.membre_nom?.toLowerCase().includes(q) ||
            c.membre_prenom?.toLowerCase().includes(q)
        );
    }

    if (filterVoamami.value) {
        list = list.filter((c) => Number(c.voamami_id) === Number(filterVoamami.value));
    }

    if (filterSeance.value) {
        list = list.filter((c) => Number(c.seance_id) === Number(filterSeance.value));
    }

    if (filterStatut.value) {
        list = list.filter((c) => c.statut === filterStatut.value);
    }

    return list;
});

function resetFilters() {
    searchQuery.value = "";
    filterVoamami.value = null;
    filterSeance.value = null;
    filterStatut.value = null;
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

function isOverdue(credit) {
    if (!credit.date_echeance || credit.statut === "ACQUITTE") return false;
    return new Date(credit.date_echeance) < new Date();
}

function formatStatut(statut) {
    const map = {
        EN_COURS: "En cours",
        ACQUITTE: "Acquitté",
        EN_RETARD: "En retard"
    };
    return map[statut] || statut || "—";
}

// Load
async function load() {
    loading.value = true;
    error.value = "";
    try {
        const [crRes, voaRes, seaRes] = await Promise.all([
            creditService.getAll(seanceId.value ? { seance_id: seanceId.value } : {}),
            voamamiService.getAll(),
            seanceService.getAll()
        ]);
        credits.value = crRes.data.data ?? [];
        voamamis.value = voaRes.data.data ?? [];
        seances.value = (seaRes.data.data ?? seaRes.data.seances ?? []).slice(0, 50);
    } catch (e) {
        error.value = e.response?.data?.message || "Erreur de chargement.";
    } finally {
        loading.value = false;
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
    min-width: 800px;
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
.text-danger { color: #dc2626; font-weight: 600; }

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

/* ===== Badges ===== */
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
.badge-en-cours { background: #dbeafe; color: #1e40af; }
.badge-acquitte { background: #dcfce7; color: #166534; }
.badge-en-retard { background: #fee2e2; color: #991b1b; }
</style>   