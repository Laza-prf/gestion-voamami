<template>
  <div class="page">
    <header class="page-header">
      <div class="header-left">
        <router-link to="/seances" class="back-link">← Retour</router-link>
        <div>
          <h1>Assistant des opérations</h1>
          <p class="subtitle">
            {{ seance ? `${seance.voamami_code || "VOAMAMI"} — Séance S${seance.numero_seance || seance.id}` : "Enregistrez les opérations de la séance dans l'ordre." }}
          </p>
        </div>
      </div>
      <span v-if="seance" :class="['status-badge', seance.statut === 'OUVERTE' ? 'status-open' : 'status-closed']">
        {{ seance.statut === "OUVERTE" ? "Séance ouverte" : "Séance clôturée" }}
      </span>
    </header>

    <div v-if="loading" class="state-card">Chargement…</div>
    <div v-else-if="error" class="state-card state-error">
      <p>{{ error }}</p><button class="button button-secondary" @click="load">Réessayer</button>
    </div>

    <section v-else-if="!seanceId" class="session-picker">
      <h2>Choisir une séance ouverte</h2>
      <p class="muted">Sélectionnez la séance dont vous souhaitez enregistrer les opérations.</p>
      <p v-if="!openSessions.length" class="empty-state">Aucune séance ouverte disponible.</p>
      <button v-for="session in openSessions" :key="session.id" class="session-option" @click="openSession(session.id)">
        <span><strong>{{ session.voamami_code || "VOAMAMI" }} — S{{ session.numero_seance || session.id }}</strong><small>{{ session.voamami_nom || "" }} · {{ formatDate(session.date_seance) }}</small></span><span class="session-arrow">Ouvrir →</span>
      </button>
    </section>

    <template v-else-if="seance">
      <nav class="stepper" aria-label="Progression des opérations">
        <button v-for="(item, index) in steps" :key="item.title" type="button" :class="['step-marker', { current: index === step, completed: index < step }]" :disabled="index > step" @click="goToStep(index)">
          <span class="step-number">{{ index < step ? "✓" : index + 1 }}</span><span class="step-label">{{ item.title }}</span>
        </button>
      </nav>

      <section v-if="step < steps.length - 1" class="step-card">
        <div class="step-heading"><span class="step-count">ÉTAPE {{ step + 1 }} SUR {{ steps.length }}</span><h2>{{ steps[step].title }}</h2><p class="muted">{{ steps[step].description }}</p></div>

        <section v-if="steps[step].title === 'Pénalités'" class="penalties-panel">
          <div class="panel-heading"><div><h3>Pénalités de la séance</h3><p class="muted">Les absences non excusées peuvent produire une pénalité.</p></div><router-link v-if="isOpen" class="button button-primary" :to="steps[step].target(seance.id)">{{ steps[step].actionLabel }}</router-link></div>
          <div v-if="penaltiesLoading" class="state-inline">Chargement des pénalités…</div>
          <div v-else-if="penaltiesError" class="review-error">{{ penaltiesError }} <button class="button button-secondary" @click="loadPenalties">Réessayer</button></div>
          <p v-else-if="!penalties.length" class="empty-state">Aucune pénalité enregistrée.</p>
          <div v-else class="table-wrap"><table><thead><tr><th>N°</th><th>Membre</th><th>Type</th><th>Montant</th><th>Statut</th><th>Action</th></tr></thead><tbody><tr v-for="penalty in penalties" :key="penalty.id"><td>#{{ penalty.id }}</td><td>N°{{ penalty.numero_membre }} — {{ penalty.membre_nom }} {{ penalty.membre_prenom }}</td><td>{{ penalty.type_penalite }}</td><td>{{ money(penalty.montant) }}</td><td>{{ penalty.statut === 'PAYEE' ? 'Payée' : 'Impayée' }}</td><td><button v-if="penalty.statut === 'IMPAYEE'" class="button button-secondary" :disabled="!isOpen || payingPenaltyId === penalty.id" @click="payPenalty(penalty)">{{ payingPenaltyId === penalty.id ? 'Enregistrement…' : 'Marquer payée' }}</button><span v-else>Encaissée</span></td></tr></tbody></table></div>
        </section>

        <div v-else class="action-card"><div><strong>{{ steps[step].actionTitle }}</strong><p>{{ steps[step].actionDescription }}</p></div><router-link v-if="isOpen" class="button button-primary" :to="steps[step].target(seance.id)">{{ steps[step].actionLabel }}</router-link><p v-else class="muted">Les opérations ne peuvent plus être modifiées.</p></div>

        <div class="step-navigation"><button v-if="step > 0" class="button button-secondary" @click="goToStep(step - 1)">← Précédent</button><span v-else></span><button class="button button-primary" @click="goToStep(step + 1)">{{ step === steps.length - 2 ? 'Vérification finale' : 'Continuer' }} →</button></div>
      </section>

      <section v-else class="step-card review-card">
        <div class="step-heading"><span class="step-count">DERNIÈRE ÉTAPE</span><h2>Vérification avant clôture</h2><p class="muted">Vérifiez les opérations avant de clôturer la séance.</p></div>
        <div v-if="reviewLoading" class="state-inline">Vérification des opérations…</div>
        <div v-else-if="reviewError" class="review-error">{{ reviewError }} <button class="button button-secondary" @click="loadReview">Réessayer</button></div>
        <template v-else>
          <div class="review-list"><label v-for="(item, index) in steps.slice(0, -1)" :key="item.title" class="review-row"><span class="review-copy"><strong>{{ index + 1 }}. {{ item.title }}</strong><small>{{ reviewCounts[index] }} opération(s) enregistrée(s)</small></span><span class="review-actions"><router-link class="review-link" :to="reviewListTarget(index, seance.id)">Consulter</router-link><input v-model="checkedItems[index]" type="checkbox"><span>Vérifié</span></span></label></div>
          <label class="observation-label">Observation de clôture (facultatif)</label><textarea v-model.trim="observation" rows="2" maxlength="1000" placeholder="Ajouter une remarque…"></textarea>
          <p v-if="closeError" class="review-error">{{ closeError }}</p><p v-if="!isOpen" class="closed-notice">Cette séance est déjà clôturée.</p>
          <div class="step-navigation"><button class="button button-secondary" @click="goToStep(step - 1)">← Étape précédente</button><button v-if="isOpen" class="button button-danger" :disabled="!canClose || closing" @click="closeSession">{{ closing ? 'Clôture…' : 'Clôturer la séance' }}</button><router-link v-else to="/seances" class="button button-primary">Retour aux séances</router-link></div>
        </template>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import seanceService from "../../service/seance.service.js";
import presenceService from "../../service/presence.service.js";
import epargneService from "../../service/epargne.service.js";
import caisseSocialeService from "../../service/caisse-sociale.service.js";
import creditService from "../../service/credit.service.js";
import remboursementService from "../../service/remboursement.service.js";
import penaliteService from "../../service/penalite.service.js";
import { useToast } from "../../composables/useToast.js";

const route = useRoute(); const router = useRouter(); const toast = useToast();
const loading = ref(true); const error = ref(""); const seance = ref(null); const openSessions = ref([]);
const reviewLoading = ref(false); const reviewError = ref(""); const penalties = ref([]); const penaltiesLoading = ref(false); const penaltiesError = ref(""); const payingPenaltyId = ref(null); const closing = ref(false); const closeError = ref(""); const observation = ref("");
const reviewCounts = ref([0, 0, 0, 0, 0, 0]);
const initialVerified = route.query.verifie;
const checkedItems = ref(typeof initialVerified === "string" && /^[01]{6}$/.test(initialVerified) ? [...initialVerified].map(v => v === "1") : [false, false, false, false, false, false]);
const seanceId = computed(() => Number(route.params.seanceId) || null);
const step = computed(() => { const value = Number(route.query.etape); return Number.isInteger(value) && value >= 0 && value < steps.length ? value : 0; });
const isOpen = computed(() => seance.value?.statut === "OUVERTE");
const canClose = computed(() => checkedItems.value.length === steps.length - 1 && checkedItems.value.every(Boolean) && !reviewLoading.value && !reviewError.value);

const steps = [
  { title: "Présences", description: "Enregistrez la présence ou l’absence de chaque membre.", actionTitle: "Feuille de présence", actionDescription: "Renseignez la présence de tous les membres.", actionLabel: "Saisir les présences", target: id => `/seances/${id}/presences?assistant=1`, listTarget: (id, v) => `/seances/${id}/presences?assistant=1&etape=6&verifie=${v}` },
  { title: "Épargne", description: "Enregistrez les parts d’épargne collectées.", actionTitle: "Nouvelle épargne", actionDescription: "Choisissez le membre et le nombre de parts.", actionLabel: "Ajouter une épargne", target: id => `/epargnes/nouveau?seance_id=${id}&assistant=1`, listTarget: (id, v) => `/epargnes?seance_id=${id}&assistant=1&etape=6&verifie=${v}` },
  { title: "Cotisations sociales", description: "Enregistrez les versements sociaux mensuels.", actionTitle: "Nouvelle cotisation sociale", actionDescription: "Le membre peut payer 1 000 Ar ou davantage, en un ou plusieurs versements.", actionLabel: "Ajouter une cotisation", target: id => `/caisse-sociale/cotisations/nouveau?seance_id=${id}&assistant=1`, listTarget: (id, v) => `/caisse-sociale/${id}/cotisations?assistant=1&etape=6&verifie=${v}` },
  { title: "Crédits", description: "Enregistrez les crédits accordés.", actionTitle: "Nouveau crédit", actionDescription: "Saisissez le bénéficiaire et le montant.", actionLabel: "Ajouter un crédit", target: id => `/credits/nouveau?seance_id=${id}&assistant=1`, listTarget: (id, v) => `/credits?seance_id=${id}&assistant=1&etape=6&verifie=${v}` },
  { title: "Remboursements", description: "Enregistrez les remboursements reçus.", actionTitle: "Nouveau remboursement", actionDescription: "Sélectionnez le crédit et les montants.", actionLabel: "Ajouter un remboursement", target: id => `/remboursements/nouveau?seance_id=${id}&assistant=1`, listTarget: (id, v) => `/remboursements?seance_id=${id}&assistant=1&etape=6&verifie=${v}` },
  { title: "Pénalités", description: "Consultez et encaissez les pénalités de la séance.", actionTitle: "Nouvelle pénalité", actionDescription: "Sélectionnez le membre et le motif.", actionLabel: "Ajouter une pénalité", target: id => `/penalites/nouveau?seance_id=${id}&assistant=1`, listTarget: (id, v) => `/penalites?seance_id=${id}&assistant=1&etape=6&verifie=${v}` },
  { title: "Vérification" }
];

function unwrap(response) { const payload = response?.data; if (!payload) return []; if (Array.isArray(payload)) return payload; if (Array.isArray(payload.data)) return payload.data; if (Array.isArray(payload.rows)) return payload.rows; for (const key of ["seances", "presences", "epargnes", "cotisations", "credits", "remboursements", "penalites"]) if (Array.isArray(payload[key])) return payload[key]; return []; }
function formatDate(value) { return value ? new Date(value).toLocaleDateString("fr-FR") : "Date non renseignée"; }
function money(value) { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "MGA", minimumFractionDigits: 0 }).format(Number(value || 0)); }
async function load() { loading.value = true; error.value = ""; seance.value = null; openSessions.value = []; try { if (!seanceId.value) { openSessions.value = unwrap(await seanceService.getAll()).filter(s => s.statut === "OUVERTE"); return; } const response = await seanceService.getById(seanceId.value); const payload = response.data?.data ?? response.data; seance.value = payload?.data ?? payload?.seance ?? payload; if (!seance.value?.id) throw new Error("Séance introuvable."); } catch (e) { error.value = e.response?.data?.message || e.message || "Impossible de charger la séance."; } finally { loading.value = false; } }
function openSession(id) { router.push(`/seances/${id}/operations`); }
function goToStep(next) { if (next < 0 || next >= steps.length || next > step.value + 1) return; router.push({ path: route.path, query: { ...route.query, etape: String(next) } }); }
function reviewListTarget(index, id) { const verified = checkedItems.value.map(v => v ? "1" : "0").join(""); return steps[index].listTarget(id, verified); }
async function loadReview() { if (!seanceId.value) return; reviewLoading.value = true; reviewError.value = ""; try { const responses = await Promise.all([presenceService.getAll({ seance_id: seanceId.value }), epargneService.getAll({ seance_id: seanceId.value }), caisseSocialeService.getCotisationsBySeance(seanceId.value), creditService.getAll({ seance_id: seanceId.value }), remboursementService.getAll({ seance_id: seanceId.value }), penaliteService.getAll({ seance_id: seanceId.value })]); reviewCounts.value = responses.map(unwrap).map(rows => rows.length); } catch (e) { reviewError.value = e.response?.data?.message || e.message || "Impossible de vérifier les opérations."; } finally { reviewLoading.value = false; } }
async function loadPenalties() { if (!seanceId.value) return; penaltiesLoading.value = true; penaltiesError.value = ""; try { penalties.value = unwrap(await penaliteService.getAll({ seance_id: seanceId.value })); } catch (e) { penaltiesError.value = e.response?.data?.message || "Impossible de charger les pénalités."; } finally { penaltiesLoading.value = false; } }
async function payPenalty(penalty) { if (payingPenaltyId.value || penalty.statut !== "IMPAYEE") return; payingPenaltyId.value = penalty.id; try { const response = await penaliteService.update(penalty.id, { statut: "PAYEE", motif: penalty.motif }); penalty.statut = response.data?.data?.statut || "PAYEE"; toast.success("Pénalité payée avec succès."); } catch (e) { penaltiesError.value = e.response?.data?.message || "Paiement impossible."; toast.error(penaltiesError.value); } finally { payingPenaltyId.value = null; } }
async function closeSession() { closeError.value = ""; closing.value = true; try { await seanceService.close(seanceId.value, observation.value || null); seance.value.statut = "CLOTUREE"; toast.success("Séance clôturée avec succès."); } catch (e) { closeError.value = e.response?.data?.message || "Impossible de clôturer la séance."; toast.error(closeError.value); } finally { closing.value = false; } }
watch(() => route.params.seanceId, load, { immediate: true });
watch(step, value => { if (steps[value]?.title === "Pénalités" && seanceId.value) loadPenalties(); if (value === steps.length - 1 && seanceId.value) loadReview(); }, { immediate: true });
</script>

<style scoped>
.page{max-width:1050px;margin:auto;padding:1.5rem;color:#1e293b}.page-header{display:flex;justify-content:space-between;gap:1rem;margin-bottom:1.25rem}.header-left{display:flex;gap:1rem;align-items:flex-start}.back-link{color:#2563eb;text-decoration:none}.subtitle,.muted{color:#64748b}.status-badge,.badge{border-radius:999px;padding:.35rem .75rem;font-size:.8rem;font-weight:700}.status-open{background:#dcfce7;color:#166534}.status-closed{background:#e2e8f0;color:#475569}.stepper{display:grid;grid-template-columns:repeat(7,1fr);gap:.25rem;margin:1.5rem 0}.step-marker{border:0;background:transparent;color:#94a3b8;font:inherit;cursor:pointer}.step-marker:disabled{cursor:default}.step-number{display:grid;width:2rem;height:2rem;margin:auto;place-items:center;border:2px solid #cbd5e1;border-radius:50%;background:#fff;font-weight:700}.step-marker.current{color:#1d4ed8}.step-marker.current .step-number{border-color:#2563eb;background:#2563eb;color:#fff}.step-marker.completed{color:#1d4ed8}.step-marker.completed .step-number{border-color:#2563eb;color:#2563eb}.step-label{display:block;margin-top:.4rem;font-size:.75rem}.step-card,.session-picker,.state-card{border:1px solid #e2e8f0;border-radius:1rem;background:#fff;padding:1.5rem;box-shadow:0 5px 18px #0f172a0a}.step-count,.eyebrow{color:#2563eb;font-size:.75rem;font-weight:800;letter-spacing:.08em}.action-card,.panel-heading{display:flex;justify-content:space-between;align-items:center;gap:1rem;border:1px solid #dbeafe;border-radius:.75rem;background:#f8fbff;padding:1.25rem}.button{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:.55rem;padding:.65rem 1rem;font:inherit;font-weight:650;text-decoration:none;cursor:pointer}.button:disabled{opacity:.5;cursor:not-allowed}.button-primary{background:#1e293b;color:#fff}.button-secondary{border:1px solid #cbd5e1;background:#fff;color:#334155}.button-danger{background:#b91c1c;color:#fff}.step-navigation{display:flex;justify-content:space-between;gap:.75rem;margin-top:1.5rem}.table-wrap{overflow:auto}.table-wrap table{width:100%;border-collapse:collapse;font-size:.875rem}.table-wrap th,.table-wrap td{padding:.7rem;border-top:1px solid #e2e8f0;text-align:left;white-space:nowrap}.review-list{margin-bottom:1.25rem;border:1px solid #e2e8f0;border-radius:.65rem;overflow:hidden}.review-row{display:flex;justify-content:space-between;gap:1rem;padding:.9rem 1rem;border-bottom:1px solid #e2e8f0}.review-row:last-child{border-bottom:0}.review-copy{display:flex;flex-direction:column;gap:.2rem}.review-copy small{color:#64748b}.review-actions{display:flex;align-items:center;gap:.55rem}.review-link{color:#2563eb;font-weight:600}.observation-label{display:block;margin:1rem 0 .4rem;font-weight:650}textarea{width:100%;padding:.7rem;border:1px solid #cbd5e1;border-radius:.5rem;resize:vertical;font:inherit}.review-error,.state-error{color:#b91c1c}.state-inline,.empty-state{padding:1rem 0;color:#64748b}.session-option{display:flex;justify-content:space-between;width:100%;margin-top:.6rem;padding:.9rem 1rem;border:1px solid #e2e8f0;border-radius:.65rem;background:#fff;text-align:left;cursor:pointer}.session-option span:first-child{display:flex;flex-direction:column;gap:.25rem}.session-option small{color:#64748b}.session-arrow{color:#2563eb;font-weight:650}@media(max-width:700px){.page{padding:1rem .25rem}.stepper{grid-template-columns:repeat(4,1fr);gap:1rem .25rem}.step-label{font-size:.68rem}.page-header,.action-card,.panel-heading,.review-row{align-items:flex-start;flex-direction:column}.step-navigation{align-items:stretch;flex-direction:column}.step-navigation .button{width:100%}.review-actions{flex-wrap:wrap}}
</style>
