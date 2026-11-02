<template>
    <div class="page">
        <div class="page-header">
            <div class="header-left">
                <router-link to="/seances" class="back-link" aria-label="Retour aux séances">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </router-link>
                <h1>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
                    Nouveau remboursement
                </h1>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="state-block">
            <div class="spinner"></div>
            <p>Chargement du contexte…</p>
        </div>

        <!-- Error global -->
        <div v-else-if="loadError" class="alert alert-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{{ loadError }}</span>
            <button class="btn-link" @click="loadForm()">Réessayer</button>
        </div>

        <!-- Form -->
        <template v-else>
            <!-- Context card -->
            <div v-if="seance" class="context-card">
                <div class="context-item">
                    <span class="context-label">VOAMAMI</span>
                    <span class="context-value">{{ seance.voamami_code }} — {{ seance.voamami_nom }}</span>
                </div>
                <div class="context-item">
                    <span class="context-label">Cycle</span>
                    <span class="context-value">{{ seance.numero_cycle }}</span>
                </div>
                <div class="context-item">
                    <span class="context-label">Séance</span>
                    <span class="context-value">S{{ seance.numero_seance }}</span>
                </div>
                <div class="context-item">
                    <span class="context-label">Date</span>
                    <span class="context-value">{{ formatDate(seance.date_seance) }}</span>
                </div>
                <div class="context-item">
                    <span class="context-label">Statut</span>
                    <span :class="['badge', seance.statut === 'OUVERTE' ? 'badge-ouverte' : 'badge-cloturee']">
                        <span class="badge-dot"></span>
                        {{ seance.statut === 'OUVERTE' ? 'Ouverte' : 'Clôturée' }}
                    </span>
                </div>
            </div>

            <form @submit.prevent="submit" class="form" novalidate>
                <template v-if="isAssistant">
                    <fieldset class="form-section">
                        <legend>Remboursements des membres présents</legend>
                        <p class="form-hint">
                            Saisissez les montants à encaisser pour chaque crédit. Laissez à 0 les montants non payés ; les lignes sans montant seront ignorées.
                        </p>
                        <div v-if="repaymentRows.length" class="repayments-table-wrap">
                            <table class="repayments-table">
                                <thead>
                                    <tr>
                                        <th>Membre</th>
                                        <th>Crédit</th>
                                        <th>Capital restant</th>
                                        <th>Intérêt restant</th>
                                        <th>Capital encaissé</th>
                                        <th>Intérêt encaissé</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="row in repaymentRows" :key="row.credit.id">
                                        <td>
                                            N° {{ row.credit.numero_membre }} —
                                            {{ row.credit.membre_nom }} {{ row.credit.membre_prenom || "" }}
                                        </td>
                                        <td>#{{ row.credit.id }}</td>
                                        <td>{{ money(row.principalRemaining) }}</td>
                                        <td>{{ money(row.interestRemaining) }}</td>
                                        <td>
                                            <input
                                                v-model.number="row.montant_principal"
                                                type="number"
                                                min="0"
                                                :max="row.principalRemaining"
                                                step="1"
                                                :disabled="saving || row.alreadyRecorded"
                                                :aria-label="`Capital remboursé crédit ${row.credit.id}`"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                v-model.number="row.montant_interet"
                                                type="number"
                                                min="0"
                                                :max="row.interestRemaining"
                                                step="1"
                                                :disabled="saving || row.alreadyRecorded"
                                                :aria-label="`Intérêt remboursé crédit ${row.credit.id}`"
                                            />
                                            <small v-if="row.alreadyRecorded" class="field-hint">
                                                Déjà enregistré pour cette séance
                                            </small>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p v-else class="field-hint warning-hint">
                            Aucun crédit en cours pour un membre présent dans cette séance.
                        </p>
                        <p class="field-hint">{{ selectedRepaymentCount }} remboursement(s) à enregistrer.</p>
                    </fieldset>
                </template>
                <template v-else>
                <!-- Section: Crédit -->
                <fieldset class="form-section">
                    <legend>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        Crédit à rembourser
                    </legend>
                    <div class="form-grid">
                        <div class="form-field form-field-full">
                            <label for="credit_id">Crédit <span class="req">*</span></label>
                            <div class="select-wrapper">
                                <select
                                    id="credit_id"
                                    v-model.number="form.credit_id"
                                    required
                                    @change="onCreditChange"
                                >
                                    <option :value="null" disabled>— Sélectionner un crédit —</option>
                                    <option
                                        v-for="credit in credits"
                                        :key="credit.id"
                                        :value="credit.id"
                                    >
                                        #{{ credit.id }} — {{ credit.membre_nom }} {{ credit.membre_prenom }} — Reste : {{ money(credit.reste_a_payer) }}
                                    </option>
                                </select>
                                <svg class="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                            </div>
                            <span v-if="credits.length === 0" class="field-hint warning-hint">
                                Aucun crédit en cours pour ce cycle.
                            </span>
                        </div>

                        <!-- Credit summary -->
                        <div v-if="creditSelectionne" class="form-field form-field-full">
                            <div class="credit-summary">
                                <div class="summary-item">
                                    <span class="summary-label">Capital</span>
                                    <span class="summary-value">{{ money(creditSelectionne.montant_capital) }}</span>
                                </div>
                                <div class="summary-item">
                                    <span class="summary-label">Total</span>
                                    <span class="summary-value">{{ money(creditSelectionne.montant_total) }}</span>
                                </div>
                                <div class="summary-item">
                                    <span class="summary-label">Déjà remboursé</span>
                                    <span class="summary-value">{{ money(creditSelectionne.total_rembourse) }}</span>
                                </div>
                                <div class="summary-item">
                                    <span class="summary-label">Reste à payer</span>
                                    <span class="summary-value summary-value-danger">{{ money(creditSelectionne.reste_a_payer) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </fieldset>

                <!-- Section: Montants -->
                <fieldset class="form-section">
                    <legend>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
                        Montants
                    </legend>
                    <div class="form-grid">
                        <div class="form-field">
                            <label for="montant_principal">Capital remboursé (MGA) <span class="req">*</span></label>
                            <input
                                id="montant_principal"
                                v-model.number="form.montant_principal"
                                type="number"
                                min="0"
                                step="1000"
                                required
                                placeholder="0"
                            />
                        </div>
                        <div class="form-field">
                            <label for="montant_interet">Intérêt remboursé (MGA) <span class="req">*</span></label>
                            <input
                                id="montant_interet"
                                v-model.number="form.montant_interet"
                                type="number"
                                min="0"
                                step="1000"
                                required
                                placeholder="0"
                            />
                        </div>
                        <div class="form-field form-field-full">
                            <label class="total-label">
                                Total du remboursement
                                <span class="total-value">{{ money((form.montant_principal || 0) + (form.montant_interet || 0)) }}</span>
                            </label>
                        </div>
                    </div>
                </fieldset>
                </template>

                <!-- Section: Observation -->
                <fieldset v-if="!isAssistant" class="form-section">
                    <legend>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        Observation
                    </legend>
                    <div class="form-grid">
                        <div class="form-field form-field-full">
                            <label for="observation">Observation</label>
                            <textarea
                                id="observation"
                                v-model.trim="form.observation"
                                rows="3"
                                maxlength="1000"
                                placeholder="Observation éventuelle…"
                            ></textarea>
                            <span class="field-hint field-hint-right">{{ form.observation.length }}/1000</span>
                        </div>
                    </div>
                </fieldset>

                <!-- Hint -->
                <p class="form-hint">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    Le cycle, le membre et la date sont définis automatiquement.
                </p>

                <!-- Submit error -->
                <div v-if="error" class="alert alert-error">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>{{ error }}</span>
                </div>

                <!-- Actions -->
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary" :disabled="saving || !seance">
                        <svg v-if="saving" class="spinner-sm" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="31.4" stroke-dashoffset="10" stroke-linecap="round"/></svg>
                        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        {{ saving ? "Enregistrement…" : isAssistant ? "Enregistrer tous les remboursements" : "Enregistrer le remboursement" }}
                    </button>
                    <router-link :to="cancelLink" class="btn btn-ghost">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Annuler
                    </router-link>
                </div>
            </form>
        </template>
    </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import seanceService from "../../service/seance.service.js";
import creditService from "../../service/credit.service.js";
import remboursementService from "../../service/remboursement.service.js";
import presenceService from "../../service/presence.service.js";
import { useToast } from "../../composables/useToast.js";
import { excludedMemberIdsFromPresence } from "../../utils/presence.js";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const seance = ref(null);
const credits = ref([]);
const repaymentRows = ref([]);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const loadError = ref("");
const isAssistant = computed(() => route.query.assistant === "1");
const cancelLink = computed(() =>
    isAssistant.value
        ? `/seances/${form.seance_id}/operations?etape=3`
        : "/seances"
);
const selectedRepaymentCount = computed(() =>
    repaymentRows.value.filter((row) =>
        Number(row.montant_principal) > 0 || Number(row.montant_interet) > 0
    ).length
);

const form = reactive({
    seance_id: Number(route.query.seance_id) || null,
    credit_id: null,
    cycle_id: null,
    membre_id: null,
    montant_principal: 0,
    montant_interet: 0,
    observation: ""
});

const creditSelectionne = computed(() =>
    credits.value.find((c) => Number(c.id) === Number(form.credit_id)) || null
);

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

function onCreditChange() {
    const credit = creditSelectionne.value;
    if (!credit) {
        form.cycle_id = null;
        form.membre_id = null;
        return;
    }
    form.cycle_id = Number(credit.cycle_id);
    form.membre_id = Number(credit.membre_id);
}

async function loadContext() {
    if (!form.seance_id) {
        throw new Error("Aucune séance sélectionnée.");
    }

    const [seanceResponse, creditsResponse, presenceResponse, repaymentsResponse] = await Promise.all([
        seanceService.getById(form.seance_id),
        creditService.getAll(),
        isAssistant.value ? presenceService.getAll({ seance_id: form.seance_id }) : null,
        isAssistant.value ? remboursementService.getAll({ seance_id: form.seance_id }) : null
    ]);

    const seanceData = seanceResponse.data;
    seance.value = seanceData.data ?? seanceData.seance ?? seanceData;

    if (!seance.value.id || !seance.value.cycle_id) {
        throw new Error("La séance ne possède pas de cycle valide.");
    }

    const allCredits = creditsResponse.data.data ?? [];
    if (!Array.isArray(allCredits)) {
        throw new Error("Le format des crédits reçus est invalide.");
    }
    credits.value = allCredits.filter((c) =>
        Number(c.cycle_id) === Number(seance.value.cycle_id) &&
        (c.statut === "EN_COURS" || c.statut === "EN_RETARD")
    );

    if (isAssistant.value) {
        const excludedMemberIds = excludedMemberIdsFromPresence(presenceResponse);
        const savedRepayments = repaymentsResponse.data?.data ?? [];
        if (!Array.isArray(savedRepayments)) {
            throw new Error("Le format des remboursements reçus est invalide.");
        }
        const recordedCreditIds = new Set(
            savedRepayments.map((item) => Number(item.credit_id))
        );
        repaymentRows.value = credits.value
            .filter((credit) =>
                !excludedMemberIds.has(Number(credit.membre_id)) &&
                (
                    Number(credit.montant_capital) > Number(credit.principal_rembourse || 0) ||
                    Number(credit.montant_interet) > Number(credit.interet_rembourse || 0)
                )
            )
            .map((credit) => ({
                credit,
                principalRemaining: Math.max(
                    0,
                    Number(credit.montant_capital) - Number(credit.principal_rembourse || 0)
                ),
                interestRemaining: Math.max(
                    0,
                    Number(credit.montant_interet) - Number(credit.interet_rembourse || 0)
                ),
                montant_principal: 0,
                montant_interet: 0,
                alreadyRecorded: recordedCreditIds.has(Number(credit.id))
            }));
    }
}

async function loadForm() {
    loading.value = true;
    loadError.value = "";
    try {
        await loadContext();
    } catch (e) {
        loadError.value = e.response?.data?.message || e.message || "Impossible de charger les données.";
    } finally {
        loading.value = false;
    }
}

async function submit() {
    error.value = "";

    if (!seance.value) { error.value = "Séance introuvable."; return; }
    if (seance.value.statut !== "OUVERTE") { error.value = "La séance est déjà clôturée."; return; }
    if (isAssistant.value) {
        const invalidRow = repaymentRows.value.find((row) => {
            const principal = Number(row.montant_principal);
            const interest = Number(row.montant_interet);
            return !Number.isFinite(principal) ||
                !Number.isFinite(interest) ||
                principal < 0 ||
                interest < 0 ||
                principal > row.principalRemaining ||
                interest > row.interestRemaining;
        });
        if (invalidRow) {
            error.value = `Les montants du crédit n° ${invalidRow.credit.id} sont invalides ou dépassent le solde restant.`;
            return;
        }
        const entries = repaymentRows.value
            .filter((row) =>
                !row.alreadyRecorded &&
                (Number(row.montant_principal) > 0 || Number(row.montant_interet) > 0)
            )
            .map((row) => ({
                credit_id: Number(row.credit.id),
                montant_principal: Number(row.montant_principal),
                montant_interet: Number(row.montant_interet)
            }));
        if (!entries.length) {
            error.value = "Saisissez au moins un montant de remboursement.";
            return;
        }

        saving.value = true;
        try {
            const response = await remboursementService.createMany({
                seance_id: Number(form.seance_id),
                entries
            });
            toast.success(response.data?.message || `${entries.length} remboursement(s) enregistré(s).`);
            await router.push(`/seances/${form.seance_id}/operations?etape=3`);
        } catch (e) {
            error.value = e.response?.data?.message || "Erreur lors de l'enregistrement groupé des remboursements.";
        } finally {
            saving.value = false;
        }
        return;
    }

    if (!form.credit_id) { error.value = "Veuillez sélectionner un crédit."; return; }
    if (Number(form.montant_principal) < 0 || Number(form.montant_interet) < 0) {
        error.value = "Les montants ne peuvent pas être négatifs."; return;
    }
    if (Number(form.montant_principal) === 0 && Number(form.montant_interet) === 0) {
        error.value = "Le remboursement doit être supérieur à zéro."; return;
    }

    saving.value = true;
    try {
        const response = await remboursementService.create({
            credit_id: Number(form.credit_id),
            seance_id: Number(form.seance_id),
            montant_principal: Number(form.montant_principal),
            montant_interet: Number(form.montant_interet),
            observation: form.observation || null
        });
        toast.success(response.data?.message || "Remboursement enregistré avec succès.");
        if (route.query.assistant === "1") {
            router.push(`/seances/${form.seance_id}/operations?etape=3`);
        } else {
            router.push({ path: "/remboursements", query: { seance_id: form.seance_id } });
        }
    } catch (e) {
        error.value = e.response?.data?.message || "Erreur lors de l'enregistrement du remboursement.";
    } finally {
        saving.value = false;
    }
}

onMounted(loadForm);
</script>

<style scoped>
/* ===== Base ===== */
.page {
    max-width: 720px;
    margin: 0 auto;
    padding: 1.5rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b;
}

/* ===== Header ===== */
.page-header { margin-bottom: 1.75rem; }
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

/* ===== States ===== */
.state-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4rem 1rem;
    gap: 0.75rem;
    color: #64748b;
}
.spinner {
    width: 32px; height: 32px;
    border: 3px solid #e2e8f0;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== Alerts ===== */
.alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    margin-bottom: 1rem;
}
.alert-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
}
.btn-link {
    margin-left: auto;
    background: none;
    border: none;
    color: #2563eb;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
}

/* ===== Context card ===== */
.context-card {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    padding: 1rem 1.25rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    margin-bottom: 1.5rem;
}
.context-item {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}
.context-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #94a3b8;
}
.context-value {
    font-size: 0.85rem;
    font-weight: 500;
    color: #334155;
}

/* ===== Badges ===== */
.badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    white-space: nowrap;
}
.badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
}
.badge-ouverte { background: #dcfce7; color: #166534; }
.badge-cloturee { background: #e2e8f0; color: #475569; }

/* ===== Form ===== */
.form { display: flex; flex-direction: column; gap: 1.25rem; }

.form-section {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 1.25rem 1.25rem 1rem;
    margin: 0;
    background: #fff;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}

.form-section legend {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #64748b;
    padding: 0 0.5rem;
}

.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}
.repayments-table-wrap {
    overflow-x: auto;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
}
.repayments-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
}
.repayments-table th,
.repayments-table td {
    padding: 0.7rem 0.85rem;
    border-bottom: 1px solid #e2e8f0;
    white-space: nowrap;
}
.repayments-table th {
    background: #f8fafc;
    color: #64748b;
    font-size: 0.75rem;
    font-weight: 700;
}
.repayments-table tr:last-child td { border-bottom: 0; }
.repayments-table input {
    width: 8rem;
    padding: 0.45rem 0.6rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font: inherit;
}
.repayments-table input:disabled {
    background: #f1f5f9;
    color: #64748b;
}
@media (max-width: 540px) {
    .form-grid { grid-template-columns: 1fr; }
}
.form-field-full { grid-column: 1 / -1; }

.form-field { display: flex; flex-direction: column; gap: 0.35rem; }

.form-field label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #475569;
}
.req { color: #dc2626; }

.form-field input,
.form-field select,
.form-field textarea {
    width: 100%;
    padding: 0.6rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.9rem;
    color: #1e293b;
    background: #fff;
    transition: border-color 0.15s, box-shadow 0.15s;
    appearance: none;
    font-family: inherit;
}
.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
}
.form-field input::placeholder,
.form-field textarea::placeholder { color: #94a3b8; }
.form-field textarea { resize: vertical; min-height: 70px; }

.select-wrapper { position: relative; }
.select-wrapper select { padding-right: 2.2rem; cursor: pointer; }
.select-arrow {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: #64748b;
}

.field-hint {
    font-size: 0.78rem;
    color: #94a3b8;
    margin: 0;
}
.field-hint-right { text-align: right; }
.warning-hint { color: #92400e; }

/* ===== Credit summary ===== */
.credit-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    padding: 0.85rem 1rem;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
}
.summary-item {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}
.summary-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #166534;
}
.summary-value {
    font-size: 0.85rem;
    font-weight: 500;
    color: #166534;
}
.summary-value-danger {
    font-weight: 700;
    color: #dc2626;
}

/* ===== Total label ===== */
.total-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
    font-weight: 600;
    color: #334155;
    padding: 0.5rem 0;
}
.total-value {
    font-size: 1rem;
    font-weight: 700;
    color: #2563eb;
}

/* ===== Form hint ===== */
.form-hint {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    color: #94a3b8;
    margin: 0;
}

/* ===== Actions ===== */
.form-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding-top: 0.5rem;
}

.btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1.25rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-primary {
    background: #2563eb;
    color: #fff;
}
.btn-primary:hover:not(:disabled) { background: #1d4ed8; }

.btn-ghost {
    background: transparent;
    color: #64748b;
    border: 1px solid #e2e8f0;
}
.btn-ghost:hover { background: #f8fafc; color: #334155; }

.spinner-sm { animation: spin 0.8s linear infinite; }
</style>