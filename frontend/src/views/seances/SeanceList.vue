<template>
    <div class="page">
        <div class="page-header">
            <div>
                <h1>Séances hebdomadaires</h1>
                <p class="subtitle">{{ filteredSeances.length }} séance(s) affichée(s)</p>
            </div>
            <router-link to="/seances/nouveau" class="btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nouvelle séance
            </router-link>
        </div>

        <!-- Toolbar: recherche + filtres -->
        <div class="toolbar">
            <div class="search-wrapper">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input v-model="searchQuery" type="text" placeholder="Rechercher un code, une séance…" class="search-input" />
            </div>

            <div class="select-wrapper">
                <select v-model="filterVoamami" class="filter-select" aria-label="Filtrer par VOAMAMI">
                    <option :value="null">Tous les VOAMAMI</option>
                    <option v-for="v in voamamis" :key="v.id" :value="v.id">{{ v.code }} — {{ v.nom }}</option>
                </select>
                <svg class="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>

            <div class="select-wrapper">
                <select v-model="filters.statut" class="filter-select" aria-label="Filtrer par statut">
                    <option value="">Tous les statuts</option>
                    <option value="OUVERTE">Ouvertes</option>
                    <option value="CLOTUREE">Clôturées</option>
                </select>
                <svg class="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
        </div>

        <!-- Stats (calculées sur les séances filtrées) -->
        <div v-if="!loading && !error && filteredSeances.length > 0" class="stats-row">
            <div class="stat-card">
                <span class="stat-value">{{ stats.total }}</span>
                <span class="stat-label">Séances</span>
            </div>
            <div class="stat-card stat-ouverte">
                <span class="stat-value">{{ stats.ouvertes }}</span>
                <span class="stat-label">Ouvertes</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">{{ stats.tauxPresence }}%</span>
                <span class="stat-label">Présence moyenne</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">{{ formatMoney(stats.totalEpargne) }}</span>
                <span class="stat-label">Épargne collectée</span>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="state-block">
            <div class="spinner"></div>
            <p>Chargement des séances…</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="state-block state-error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p>{{ error }}</p>
            <button class="btn-secondary" @click="loadSeances">Réessayer</button>
        </div>

        <!-- Empty -->
        <div v-else-if="filteredSeances.length === 0" class="state-block">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="9" y1="16" x2="15" y2="16"/></svg>
            <p>{{ searchQuery ? "Aucune séance ne correspond à votre recherche." : "Aucune séance enregistrée." }}</p>
            <router-link v-if="!searchQuery" to="/seances/nouveau" class="btn-primary">Créer la première séance</router-link>
        </div>

        <!-- Liste -->
        <div v-else class="list-wrapper">
            <div class="list-head">
                <span>VOAMAMI</span>
                <span>Séance</span>
                <span>Date</span>
                <span class="text-center">Présences</span>
                <span class="text-right">Épargne</span>
                <span class="text-right">Remb.</span>
                <span>Statut</span>
                <span></span>
            </div>

            <div v-for="seance in filteredSeances" :key="seance.id" class="row-card">
                <div class="cell cell-voamami" data-label="VOAMAMI">
                    <code class="code-badge">{{ seance.voamami_code || "—" }}</code>
                    <span class="voamami-nom">{{ seance.voamami_nom || "—" }}</span>
                </div>

                <div class="cell" data-label="Séance">
                    <span class="td-bold">S{{ seance.numero_seance }}</span>
                    <span class="cycle-tag">Cycle {{ seance.numero_cycle || "—" }}</span>
                </div>

                <div class="cell" data-label="Date">{{ formatDate(seance.date_seance) }}</div>

                <div class="cell text-center" data-label="Présences">
                    <span class="presence-ratio" :class="{ 'presence-low': (seance.total_presents || 0) < (seance.total_membres_actifs || 1) * 0.5 }">
                        {{ seance.total_presents || 0 }}<span class="presence-sep">/</span>{{ seance.total_membres_actifs || 0 }}
                    </span>
                </div>

                <div class="cell text-right" data-label="Épargne">{{ formatMoney(seance.total_epargne) }}</div>
                <div class="cell text-right" data-label="Remboursements">{{ formatMoney(seance.total_remboursements) }}</div>

                <div class="cell" data-label="Statut">
                    <span :class="['badge', seance.statut === 'OUVERTE' ? 'badge-ouverte' : 'badge-cloturee']">
                        <span class="badge-dot"></span>
                        {{ seance.statut === 'OUVERTE' ? 'Ouverte' : 'Clôturée' }}
                    </span>
                </div>

                <div class="cell cell-menu">
                    <button class="menu-trigger" @click="toggleMenu(seance.id)" :aria-expanded="openMenuId === seance.id" aria-label="Actions">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                    </button>

                    <div v-if="openMenuId === seance.id" class="menu-panel">
                        <router-link :to="operationsLink(seance)" class="menu-item menu-item-highlight" @click="closeMenu">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                            Ouvrir les opérations
                        </router-link>

                        <div class="menu-divider"></div>

                        <template v-if="seance.statut === 'OUVERTE'">
                            <div class="menu-divider"></div>
                            <router-link :to="`/seances/${seance.id}/modifier`" class="menu-item" @click="closeMenu">Modifier</router-link>
                            <button class="menu-item" @click="closeSeance(seance)">Clôturer la séance</button>
                            <button class="menu-item menu-item-danger" @click="deleteSeance(seance)">Supprimer</button>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <Teleport to="body">
        <Transition name="modal">
            <div
                v-if="confirmationAction"
                class="modal-backdrop"
                @click.self="cancelConfirmation"
            >
                <section
                    class="confirm-dialog"
                    role="dialog"
                    aria-modal="true"
                    :aria-labelledby="confirmationAction === 'close' ? 'close-title' : 'delete-title'"
                >
                    <h2 :id="confirmationAction === 'close' ? 'close-title' : 'delete-title'">
                        {{ confirmationAction === "close" ? "Clôturer la séance ?" : "Supprimer la séance ?" }}
                    </h2>
                    <p v-if="selectedSeance">
                        {{ confirmationAction === "close" ? "Confirmez la clôture définitive de" : "Confirmez la suppression de" }}
                        <strong>S{{ selectedSeance.numero_seance }}</strong>
                        — {{ selectedSeance.voamami_code }} {{ selectedSeance.voamami_nom }}.
                        {{ confirmationAction === "close" ? "Un rapport de séance sera généré." : "Cette action est irréversible." }}
                    </p>
                    <label v-if="confirmationAction === 'close'" class="observation-field">
                        Observation de clôture (facultatif)
                        <textarea
                            v-model.trim="closeObservation"
                            rows="3"
                            maxlength="1000"
                            placeholder="Ajouter une observation..."
                        ></textarea>
                    </label>
                    <div class="confirm-actions">
                        <button
                            type="button"
                            class="btn-secondary"
                            :disabled="savingConfirmation"
                            @click="cancelConfirmation"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            :class="['btn-confirm', confirmationAction === 'delete' ? 'btn-danger' : 'btn-close']"
                            :disabled="savingConfirmation"
                            @click="confirmAction"
                        >
                            {{
                                savingConfirmation
                                    ? (confirmationAction === "close" ? "Clôture..." : "Suppression...")
                                    : (confirmationAction === "close" ? "Clôturer la séance" : "Supprimer la séance")
                            }}
                        </button>
                    </div>
                </section>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from "vue";
import seanceService from "../../service/seance.service.js";
import voamamiService from "../../service/voamami.service.js";
import { useToast } from "../../composables/useToast.js";

const toast = useToast();
const seances = ref([]);
const voamamis = ref([]);
const loading = ref(true);
const error = ref("");
const searchQuery = ref("");
const openMenuId = ref(null);
const confirmationAction = ref(null);
const selectedSeance = ref(null);
const closeObservation = ref("");
const savingConfirmation = ref(false);

const filters = reactive({
    voamamiId: null,
    statut: ""
});

// Fermer le menu au clic extérieur
function onDocClick(e) {
    if (openMenuId.value && !e.target.closest(".cell-menu")) {
        openMenuId.value = null;
    }
}
onMounted(() => document.addEventListener("click", onDocClick));
import { onBeforeUnmount } from "vue";
onBeforeUnmount(() => document.removeEventListener("click", onDocClick));

function toggleMenu(id) { openMenuId.value = openMenuId.value === id ? null : id; }
function closeMenu() { openMenuId.value = null; }

// Liste filtrée (recherche + VOAMAMI + statut)
const filteredSeances = computed(() => {
    let list = seances.value;

    if (filters.voamamiId) {
        list = list.filter((s) => Number(s.voamami_id) === Number(filters.voamamiId));
    }

    if (filters.statut) {
        list = list.filter((s) => s.statut === filters.statut);
    }

    if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase();
        list = list.filter((s) =>
            (s.voamami_code || "").toLowerCase().includes(q) ||
            (s.voamami_nom || "").toLowerCase().includes(q) ||
            `s${s.numero_seance}`.includes(q)
        );
    }

    return list;
});

// Stats calculées sur la liste filtrée
const stats = computed(() => {
    const list = filteredSeances.value;
    const total = list.length;
    const ouvertes = list.filter((s) => s.statut === "OUVERTE").length;
    const totalPresents = list.reduce((sum, s) => sum + (s.total_presents || 0), 0);
    const totalMembres = list.reduce((sum, s) => sum + (s.total_membres_actifs || 0), 0);
    const totalEpargne = list.reduce((sum, s) => sum + Number(s.total_epargne || 0), 0);
    return {
        total,
        ouvertes,
        tauxPresence: totalMembres ? Math.round((totalPresents / totalMembres) * 100) : 0,
        totalEpargne
    };
});

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatMoney(value) {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "MGA", minimumFractionDigits: 0 }).format(Number(value || 0));
}

function operationQuery(seance) {
    return { voamami_id: seance.voamami_id, cycle_id: seance.cycle_id, seance_id: seance.id };
}
function operationsLink(seance) { return { path: `/seances/${seance.id}/operations`, query: operationQuery(seance) }; }

async function loadSeances() {
    loading.value = true;
    error.value = "";
    try {
        const [seancesRes, voamamisRes] = await Promise.all([
            seanceService.getAll(),
            voamamiService.getAll()
        ]);
        seances.value = seancesRes.data.data ?? seancesRes.data.seances ?? [];
        voamamis.value = voamamisRes.data.data ?? [];
    } catch (e) {
        error.value = e.response?.data?.message || "Impossible de charger les séances.";
    } finally {
        loading.value = false;
    }
}

function closeSeance(seance) {
    closeMenu();
    selectedSeance.value = seance;
    closeObservation.value = "";
    confirmationAction.value = "close";
}

function deleteSeance(seance) {
    closeMenu();
    selectedSeance.value = seance;
    confirmationAction.value = "delete";
}

function cancelConfirmation() {
    if (savingConfirmation.value) return;
    confirmationAction.value = null;
    selectedSeance.value = null;
    closeObservation.value = "";
}

async function confirmAction() {
    if (!selectedSeance.value || savingConfirmation.value) return;
    const seance = selectedSeance.value;
    const action = confirmationAction.value;
    savingConfirmation.value = true;
    try {
        if (action === "close") {
            await seanceService.close(seance.id, closeObservation.value || null);
            toast.success("Séance clôturée et rapport généré.");
            confirmationAction.value = null;
            selectedSeance.value = null;
            await loadSeances();
        } else if (action === "delete") {
            await seanceService.remove(seance.id);
            seances.value = seances.value.filter((item) => Number(item.id) !== Number(seance.id));
            toast.success("Séance supprimée avec succès.");
            confirmationAction.value = null;
            selectedSeance.value = null;
        }
    } catch (e) {
        toast.error(
            e.response?.data?.message ||
            (action === "close"
                ? "Impossible de clôturer la séance."
                : "Impossible de supprimer la séance.")
        );
    } finally {
        savingConfirmation.value = false;
    }
}

onMounted(loadSeances);
</script>

<style scoped>
.page { max-width: 1200px; margin: 0 auto; padding: 1.5rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem; }
.page-header h1 { font-size: 1.5rem; font-weight: 700; margin: 0; color: #0f172a; }
.subtitle { margin: 0.25rem 0 0; font-size: 0.85rem; color: #64748b; }

.btn-primary { display: inline-flex; align-items: center; gap: 0.4rem; background: #2563eb; color: #fff; padding: 0.55rem 1.1rem; border-radius: 8px; text-decoration: none; font-size: 0.875rem; font-weight: 600; border: none; cursor: pointer; }
.btn-primary:hover { background: #1d4ed8; }
.btn-secondary { background: #f1f5f9; color: #334155; padding: 0.45rem 1rem; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 0.85rem; cursor: pointer; }

/* ===== Stats ===== */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 1.25rem; }
.stat-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.9rem 1rem; display: flex; flex-direction: column; gap: 0.15rem; }
.stat-value { font-size: 1.4rem; font-weight: 700; color: #0f172a; }
.stat-label { font-size: 0.78rem; color: #64748b; }
.stat-card.stat-ouverte .stat-value { color: #166534; }

/* ===== Toolbar ===== */
.toolbar { display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; }
.search-wrapper { position: relative; flex: 1; min-width: 200px; display: flex; align-items: center; }
.search-wrapper svg { position: absolute; left: 0.75rem; color: #94a3b8; }
.search-input { width: 100%; padding: 0.55rem 0.75rem 0.55rem 2.3rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.85rem; }
.search-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }

.select-wrapper { position: relative; display: inline-flex; }
.select-arrow { position: absolute; right: 0.6rem; top: 50%; transform: translateY(-50%); pointer-events: none; color: #64748b; }
.filter-select { padding: 0.55rem 2rem 0.55rem 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.82rem; color: #475569; background: #fff; cursor: pointer; appearance: none; transition: border-color 0.15s, box-shadow 0.15s; }
.filter-select:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }

/* ===== States ===== */
.state-block { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 1rem; text-align: center; color: #64748b; gap: 0.75rem; }
.state-block p { margin: 0; font-size: 0.95rem; }
.spinner { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== Liste ===== */
.list-wrapper { border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; overflow: visible; }

.list-head {
    display: grid;
    grid-template-columns: 1.4fr 1fr 1fr 0.8fr 1fr 1fr 1fr 44px;
    gap: 0.5rem;
    padding: 0.65rem 1rem;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #64748b;
}

.row-card {
    display: grid;
    grid-template-columns: 1.4fr 1fr 1fr 0.8fr 1fr 1fr 1fr 44px;
    gap: 0.5rem;
    align-items: center;
    padding: 0.8rem 1rem;
    border-bottom: 1px solid #f1f5f9;
}
.row-card:last-child { border-bottom: none; }
.row-card:hover { background: #f8fafc; }

.cell { font-size: 0.85rem; min-width: 0; }
.cell-voamami { display: flex; flex-direction: column; gap: 0.15rem; }
.code-badge { display: inline-block; width: fit-content; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 0.12rem 0.45rem; border-radius: 4px; font-size: 0.75rem; font-family: 'JetBrains Mono', 'Fira Code', monospace; color: #475569; }
.voamami-nom { font-size: 0.78rem; color: #64748b; }

.td-bold { font-weight: 600; display: block; }
.cycle-tag { font-size: 0.75rem; color: #94a3b8; }

.text-right { text-align: right; }
.text-center { text-align: center; }

.presence-ratio { font-weight: 600; font-size: 0.9rem; }
.presence-sep { color: #94a3b8; font-weight: 400; margin: 0 0.15rem; }
.presence-low { color: #dc2626; }

.badge { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.65rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; }
.badge-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.badge-ouverte { background: #dcfce7; color: #166534; }
.badge-cloturee { background: #e2e8f0; color: #475569; }

/* ===== Menu d'actions ===== */
.cell-menu { position: relative; display: flex; justify-content: flex-end; }
.menu-trigger {
    width: 32px; height: 32px;
    display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid transparent; border-radius: 6px;
    background: transparent; color: #64748b; cursor: pointer;
}
.menu-trigger:hover, .menu-trigger[aria-expanded="true"] { background: #f1f5f9; color: #1e293b; }

.menu-panel {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: 20;
    min-width: 200px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
    padding: 0.35rem;
}
.menu-item {
    display: block;
    width: 100%;
    text-align: left;
    padding: 0.5rem 0.65rem;
    border-radius: 6px;
    border: none;
    background: transparent;
    font-size: 0.85rem;
    color: #334155;
    text-decoration: none;
    cursor: pointer;
}
.menu-item:hover { background: #f1f5f9; }
.menu-item-highlight { font-weight: 600; color: #2563eb; display: flex; align-items: center; gap: 0.5rem; }
.menu-item-danger { color: #dc2626; }
.menu-item-danger:hover { background: #fef2f2; }
.menu-divider { height: 1px; background: #f1f5f9; margin: 0.3rem 0; }
.modal-backdrop { position: fixed; z-index: 10000; inset: 0; display: grid; place-items: center; background: rgb(15 23 42 / 55%); padding: 1rem; }
.confirm-dialog { width: min(100%, 440px); border: 1px solid #e2e8f0; border-radius: 1rem; background: #fff; padding: 1.5rem; box-shadow: 0 25px 60px rgb(15 23 42 / 25%); }
.confirm-dialog h2 { margin: 0 0 .6rem; color: #0f172a; font-size: 1.15rem; }
.confirm-dialog p { color: #64748b; line-height: 1.55; }
.confirm-dialog strong { color: #1e293b; }
.observation-field { display: flex; flex-direction: column; gap: .4rem; margin-top: 1rem; color: #334155; font-size: .85rem; font-weight: 600; }
.observation-field textarea { resize: vertical; border: 1px solid #cbd5e1; border-radius: .5rem; padding: .65rem; font: inherit; font-weight: 400; }
.confirm-actions { display: flex; justify-content: flex-end; gap: .65rem; margin-top: 1.25rem; }
.confirm-actions button { min-height: 2.5rem; border-radius: .5rem; padding: .55rem .8rem; font: inherit; font-size: .85rem; font-weight: 650; cursor: pointer; }
.confirm-actions button:disabled { cursor: wait; opacity: .6; }
.confirm-actions .btn-secondary { border: 1px solid #e2e8f0; background: #f1f5f9; color: #334155; }
.btn-confirm { border: 0; color: #fff; }
.btn-danger { background: #b91c1c; }
.btn-close { background: #1e293b; }
.modal-enter-active, .modal-leave-active { transition: opacity .2s ease; }
.modal-enter-active .confirm-dialog, .modal-leave-active .confirm-dialog { transition: transform .2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .confirm-dialog, .modal-leave-to .confirm-dialog { transform: translateY(.75rem) scale(.97); }

/* ===== Responsive ===== */
@media (max-width: 860px) {
    .stats-row { grid-template-columns: repeat(2, 1fr); }
    .list-head { display: none; }
    .row-card {
        grid-template-columns: 1fr;
        gap: 0.4rem;
        padding: 1rem;
        position: relative;
    }
    .cell::before {
        content: attr(data-label);
        display: block;
        font-size: 0.68rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #94a3b8;
        margin-bottom: 0.1rem;
    }
    .cell-menu { position: absolute; top: 0.75rem; right: 0.75rem; }
    .text-right, .text-center { text-align: left; }
}
</style>   