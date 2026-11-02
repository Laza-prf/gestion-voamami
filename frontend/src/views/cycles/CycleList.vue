<template>
    <div class="page">
        <div class="page-header">
            <div>
                <h1>Cycles d'épargne et de crédit</h1>
                <p class="subtitle">{{ cycles.length }} cycle(s) enregistré(s)</p>
            </div>
            <router-link to="/cycles/nouveau" class="btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nouveau cycle
            </router-link>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="state-block">
            <div class="spinner"></div>
            <p>Chargement des cycles…</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="state-block state-error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p>{{ error }}</p>
            <button class="btn-secondary" @click="load">Réessayer</button>
        </div>

        <!-- Empty -->
        <div v-else-if="cycles.length === 0" class="state-block">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
            <p>Aucun cycle enregistré.</p>
            <router-link to="/cycles/nouveau" class="btn-primary">Créer le premier cycle</router-link>
        </div>

        <!-- Table -->
        <div v-else class="table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>VOAMAMI</th>
                        <th>N° cycle</th>
                        <th>Début</th>
                        <th>Fin prévue</th>
                        <th class="text-right">Part épargne</th>
                        <th class="text-right">Taux</th>
                        <th class="text-right">Durée</th>
                        <th>Statut</th>
                        <th class="col-actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(cycle, i) in cycles" :key="cycle.id" :class="{ 'row-even': i % 2 === 0 }">
                        <!-- VOAMAMI -->
                        <td class="cell-voamami">
                            <code class="code-badge">{{ cycle.voamami_code || "—" }}</code>
                            <span class="voamami-nom">{{ cycle.voamami_nom || "VOAMAMI inconnu" }}</span>
                        </td>

                        <!-- Numéro -->
                        <td class="td-bold">Cycle {{ cycle.numero_cycle }}</td>

                        <!-- Dates -->
                        <td>{{ formatDate(cycle.date_debut) }}</td>
                        <td>{{ formatDate(cycle.date_fin_prevue) }}</td>

                        <!-- Montant -->
                        <td class="text-right">{{ formatMontant(cycle.montant_part_epargne) }}</td>

                        <!-- Taux -->
                        <td class="text-right">{{ cycle.taux_interet }} %</td>

                        <!-- Durée -->
                        <td class="text-right">{{ cycle.duree_credit_mois }} mois</td>

                        <!-- Statut -->
                        <td>
                            <span :class="['badge', 'badge-' + cycle.statut.toLowerCase().replace(/\s/g, '-')]">
                                <span class="badge-dot"></span>
                                {{ cycle.statut }}
                            </span>
                        </td>

                        <!-- Actions -->
                        <td class="col-actions">
                            <div class="actions">

                                <router-link
                                    :to="`/cycles/${cycle.id}/modifier`"
                                    class="icon-btn icon-btn-edit"
                                    title="Modifier"
                                    aria-label="Modifier"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                                </router-link>
                                <button
                                    v-if="cycle.statut === 'OUVERT'"
                                    class="icon-btn icon-btn-close"
                                    type="button"
                                    :disabled="closingCycleId === cycle.id"
                                    :title="closingCycleId === cycle.id ? 'Clôture en cours' : 'Clôturer le cycle'"
                                    :aria-label="`Clôturer le cycle ${cycle.numero_cycle}`"
                                    @click="closeCycle(cycle)"
                                >
                                    {{ closingCycleId === cycle.id ? "…" : "Clôturer" }}
                                </button>
                                <router-link
                                    v-if="cycle.statut === 'CLOTURE'"
                                    :to="{ name: 'rapport-cycle', params: { cycleId: cycle.id } }"
                                    class="icon-btn icon-btn-report"
                                >
                                    Rapport
                                </router-link>
                                <button
                                    v-if="cycle.statut === 'PREPARATION'"
                                    class="icon-btn icon-btn-delete"
                                    title="Supprimer"
                                    aria-label="Supprimer"
                                    @click="askDelete(cycle)"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    <Teleport to="body">
    <Transition name="modal">
        <div
            v-if="showDeleteDialog"
            class="modal-backdrop"
            @click.self="cancelDelete"
        >
            <section
                class="confirm-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-title"
            >
                <h2 id="delete-title">
                    Supprimer ce cycle ?
                </h2>

                <p>
                    Voulez-vous supprimer
                    <strong>
                        le cycle {{ selectedCycle?.numero_cycle }}
                    </strong>
                    ?
                </p>



                <div class="confirm-actions">
                    <button
                        type="button"
                        class="btn-secondary"
                        :disabled="deleting"
                        @click="cancelDelete"
                    >
                        Annuler
                    </button>

                    <button
                        type="button"
                        class="btn-danger"
                        :disabled="deleting"
                        @click="confirmDelete"
                    >
                        {{
                            deleting
                                ? "Suppression..."
                                : "Supprimer"
                        }}
                    </button>
                </div>
            </section>
        </div>
    </Transition>
</Teleport>

        <ConfirmationDialog
            v-model="showCloseDialog"
            title="Clôturer le cycle ?"
            :message="selectedCycle ? `Clôturer définitivement le cycle ${selectedCycle.numero_cycle} ? Toutes les séances doivent être clôturées et les crédits soldés.` : ''"
            confirm-label="Clôturer le cycle"
            loading-label="Clôture..."
            :loading="closingCycleId !== null"
            @confirm="confirmCloseCycle"
        />

    </template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import cycleService from "../../service/cycle.service.js";
import { useToast } from "../../composables/useToast.js";
import ConfirmationDialog from "../../components/ConfirmationDialog.vue";

const toast = useToast();
const router = useRouter();

const cycles = ref([]);
const loading = ref(true);
const error = ref("");

const showDeleteDialog = ref(false);
const showCloseDialog = ref(false);
const selectedCycle = ref(null);
const deleting = ref(false);
const closingCycleId = ref(null);

function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function formatMontant(val) {
    if (val == null) return "—";

    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "MGA",
        minimumFractionDigits: 0
    }).format(val);
}

async function load() {
    loading.value = true;
    error.value = "";

    try {
        const { data } = await cycleService.getAll();
        cycles.value = data.data ?? [];
    } catch (e) {
        console.error(
            "Erreur liste cycles :",
            e.response?.data || e
        );

        error.value =
            e.response?.data?.message ||
            "Erreur de chargement des cycles";
    } finally {
        loading.value = false;
    }
}

function askDelete(cycleItem) {
    selectedCycle.value = cycleItem;
    showDeleteDialog.value = true;
}

function cancelDelete() {
    showDeleteDialog.value = false;
    selectedCycle.value = null;
}

async function confirmDelete() {
    if (!selectedCycle.value || deleting.value) return;
    const id = selectedCycle.value.id;
    deleting.value = true;

    try {
        await cycleService.remove(id);

        cycles.value = cycles.value.filter(
            (item) => Number(item.id) !== Number(id)
        );

        toast.success("Cycle supprimé avec succès.");
        cancelDelete();
    } catch (e) {
        console.error(
            "Erreur suppression cycle :",
            e.response?.data || e
        );

        toast.error(
            e.response?.data?.message ||
            "Suppression impossible."
        );
    } finally {
        deleting.value = false;
    }
}

async function closeCycle(cycle) {
    if (closingCycleId.value !== null) return;
    selectedCycle.value = cycle;
    showCloseDialog.value = true;
}

async function confirmCloseCycle() {
    if (!selectedCycle.value || closingCycleId.value !== null) return;
    const cycle = selectedCycle.value;
    closingCycleId.value = cycle.id;
    try {
        await cycleService.close(cycle.id);
        toast.success("Cycle clôturé et rapport généré.");
        showCloseDialog.value = false;
        await router.push({
            name: "rapport-cycle",
            params: { cycleId: cycle.id }
        });
    } catch (e) {
        toast.error(e.response?.data?.message || "Impossible de clôturer le cycle.");
        showCloseDialog.value = false;
    } finally {
        closingCycleId.value = null;
        selectedCycle.value = null;
    }
}

onMounted(load);
</script>

<style scoped>
/* ===== Page ===== */
.page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
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
    overflow-x: auto;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    background: #fff;
}

/* ===== Table ===== */
.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    min-width: 960px;
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

/* ===== Alignment helpers ===== */
.text-right { text-align: right; }
.td-bold { font-weight: 600; }

/* ===== VOAMAMI cell ===== */
.cell-voamami { white-space: nowrap; }
.code-badge {
    display: inline-block;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    color: #475569;
    margin-bottom: 0.2rem;
}
.voamami-nom {
    display: block;
    font-size: 0.8rem;
    color: #64748b;
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
.badge-preparation { background: #fef3c7; color: #92400e; }
.badge-ouvert { background: #dcfce7; color: #166534; }
.badge-cloture { background: #e2e8f0; color: #475569; }

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

/*alerte de notification */
.modal-backdrop {
    position: fixed;
    z-index: 10000;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(15 23 42 / 0.48);
    padding: 1rem;
}

.confirm-dialog {
    width: min(100%, 420px);
    border: 1px solid #e2e8f0;
    border-radius: 1rem;
    background: #ffffff;
    padding: 1.5rem;
    box-shadow: 0 20px 50px rgb(15 23 42 / 0.24);
}

.confirm-icon {
    display: flex;
    width: 2.75rem;
    height: 2.75rem;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    border-radius: 50%;
    background: #fee2e2;
    color: #dc2626;
    font-size: 1.25rem;
    font-weight: 700;
}

.confirm-dialog h2 {
    margin-bottom: 0.5rem;
    color: #0f172a;
    font-size: 1.15rem;
    font-weight: 700;
}

.confirm-dialog p {
    color: #64748b;
    line-height: 1.5;
}

.confirm-dialog strong {
    color: #1e293b;
}

.confirm-warning {
    margin-top: 0.5rem;
    color: #dc2626 !important;
    font-size: 0.875rem;
}

.confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
}

.btn-secondary,
.btn-danger {
    border: 0;
    border-radius: 0.5rem;
    padding: 0.7rem 1rem;
    cursor: pointer;
    font: inherit;
    font-weight: 600;
}

.btn-secondary {
    background: #f1f5f9;
    color: #334155;
}

.btn-secondary:hover {
    background: #e2e8f0;
}

.btn-danger {
    background: #dc2626;
    color: #ffffff;
}

.btn-danger:hover {
    background: #b91c1c;
}

.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.2s ease;
}

.modal-enter-active .confirm-dialog,
.modal-leave-active .confirm-dialog {
    transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-from .confirm-dialog,
.modal-leave-to .confirm-dialog {
    transform: translateY(0.75rem) scale(0.97);
}

@media (max-width: 600px) {
    .confirm-dialog {
        padding: 1.25rem;
    }

    .confirm-actions {
        flex-direction: column-reverse;
    }

    .btn-secondary,
    .btn-danger {
        width: 100%;
    }
}


</style>