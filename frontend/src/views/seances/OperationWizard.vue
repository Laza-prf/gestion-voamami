<template>
    <div class="page">
        <header class="page-header">
            <div >
                <router-link to="/seances" class="back-link" aria-label="Retour">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </router-link>
                <div>
                <h1>Assistant des opérations</h1>

                <p class="subtitle">
                    {{ seance ? `${seance.voamami_code || "VOAMAMI"} — Séance S${seance.numero_seance || seance.id}` : "Enregistrez les opérations d'une séance dans l'ordre." }}
                </p>
                </div>
            </div>
            <span v-if="seance" :class="['status-badge', seance.statut === 'OUVERTE' ? 'status-open' : 'status-closed']">
                {{ seance.statut === "OUVERTE" ? "Séance ouverte" : "Séance clôturée" }}
            </span>
        </header>

        <div v-if="loading" class="state-card">Chargement...</div>
        <div v-else-if="error" class="state-card state-error">
            <p>{{ error }}</p>
            <button class="button button-secondary" @click="load">Réessayer</button>
        </div>

        <section v-else-if="!seanceId" class="session-picker">
            <h2>Choisir une séance ouverte</h2>
            <p class="muted">Sélectionnez la séance dont vous souhaitez enregistrer les opérations.</p>
            <p v-if="openSessions.length === 0" class="empty-state">Aucune séance ouverte n'est disponible.</p>
            <button
                v-for="session in openSessions"
                :key="session.id"
                class="session-option"
                @click="openSession(session.id)"
            >
                <span>
                    <strong>{{ session.voamami_code || "VOAMAMI" }} — S{{ session.numero_seance || session.id }}</strong>
                    <small>{{ session.voamami_nom || " " }} · {{ formatDate(session.date_seance) }}</small>
                </span>
                <span class="session-arrow">Ouvrir →</span>
            </button>
        </section>

        <template v-else-if="seance">
            <nav class="stepper" aria-label="Progression des opérations">
                <button
                    v-for="(stepItem, index) in steps"
                    :key="stepItem.title"
                    type="button"
                    :class="['step-marker', { current: index === step, completed: index < step }]"
                    :disabled="index > step"
                    :aria-current="index === step ? 'step' : undefined"
                    @click="goToStep(index)"
                >
                    <span class="step-number">{{ index < step ? "✓" : index + 1 }}</span>
                    <span class="step-label">{{ stepItem.title }}</span>
                </button>
            </nav>

            <section v-if="step < steps.length - 1" class="step-card">
                <div class="step-heading">
                    <span class="step-count">ÉTAPE {{ step + 1 }} SUR 5</span>
                    <h2>{{ steps[step].title }}</h2>
                    <p class="muted">{{ steps[step].description }}</p>
                </div>

                <div v-if="step !== 4" class="action-card">
                    <div>
                        <strong>{{ steps[step].actionTitle }}</strong>
                        <p>{{ steps[step].actionDescription }}</p>
                    </div>
                    <router-link
                        v-if="seance.statut === 'OUVERTE'"
                        class="button button-primary"
                        :to="steps[step].target(seance.id)"
                    >
                        {{ steps[step].actionLabel }}
                    </router-link>
                    <p v-else class="muted">Les opérations ne peuvent plus être modifiées pour une séance clôturée.</p>
                </div>

                <section v-else class="penalties-panel" aria-labelledby="penalties-heading">
                    <div class="penalties-heading">
                        <div>
                            <h3 id="penalties-heading">Pénalités de la séance</h3>
                            <p class="muted">
                                Les absences non excusées créent une pénalité automatiquement.
                                Vous pouvez la régler maintenant ou la laisser impayée.
                            </p>
                        </div>
                        <router-link
                            v-if="seance.statut === 'OUVERTE'"
                            class="button button-primary"
                            :to="steps[step].target(seance.id)"
                        >
                            {{ steps[step].actionLabel }}
                        </router-link>
                    </div>
                    <div v-if="penaltiesLoading" class="state-inline">Chargement des pénalités...</div>
                    <div v-else-if="penaltiesError" class="review-error" role="alert">
                        <span>{{ penaltiesError }}</span>
                        <button type="button" class="button button-secondary" @click="loadPenalties">Réessayer</button>
                    </div>
                    <p v-else-if="!penalties.length" class="empty-state">
                        Aucune pénalité enregistrée pour cette séance.
                    </p>
                    <div v-else class="penalties-table-wrap">
                        <table class="penalties-table">
                            <thead>
                                <tr>
                                    <th>N° pénalité</th>
                                    <th>Membre</th>
                                    <th>Type</th>
                                    <th>Montant</th>
                                    <th>Statut</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="penalty in penalties" :key="penalty.id">
                                    <td>#{{ penalty.id }}</td>
                                    <td>N° {{ penalty.numero_membre }} — {{ penalty.membre_nom }} {{ penalty.membre_prenom }}</td>
                                    <td>
                                        {{ penalty.type_penalite }}
                                        <small v-if="penalty.motif?.includes('[AUTO:PRESENCE]') || penalty.type_penalite === 'ABSENCE NON EXCUSÉE'">
                                            Automatique · présence
                                        </small>
                                    </td>
                                    <td>{{ money(penalty.montant) }}</td>
                                    <td>{{ penalty.statut === "PAYEE" ? "Payée" : "Impayée" }}</td>
                                    <td>
                                        <button
                                            v-if="penalty.statut === 'IMPAYEE'"
                                            type="button"
                                            class="button button-secondary"
                                            :disabled="seance.statut !== 'OUVERTE' || payingPenaltyId === penalty.id"
                                            @click="payPenalty(penalty)"
                                        >
                                            {{ payingPenaltyId === penalty.id ? "Enregistrement..." : "Marquer payée" }}
                                        </button>
                                        <span v-else>Encaissée</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <div class="step-navigation">
                    <button
                        v-if="step > 0"
                        type="button"
                        class="button button-secondary"
                        @click="goToStep(step - 1)"
                    >
                        ← Précédent
                    </button>
                    <span v-else></span>
                    <button type="button" class="button button-primary" @click="goToStep(step + 1)">
                        {{ step === steps.length - 2 ? "Vérification finale" : "Continuer" }} →
                    </button>
                </div>
            </section>

            <section v-else class="step-card review-card">
                <div class="step-heading">
                    <span class="step-count">DERNIÈRE ÉTAPE</span>
                    <h2>Vérification avant clôture</h2>
                    <p class="muted">Consultez le récapitulatif et confirmez chaque catégorie avant de clôturer la séance.</p>
                </div>

                <div v-if="reviewLoading" class="state-inline">Vérification des opérations enregistrées...</div>
                <div v-else-if="reviewError" class="review-error" role="alert">
                    <span>{{ reviewError }}</span>
                    <button type="button" class="button button-secondary" @click="loadReview">Réessayer</button>
                </div>
                <template v-else>
                    <div class="review-list">
                        <label v-for="(item, index) in steps.slice(0, 5)" :key="item.title" class="review-row">
                            <span class="review-copy">
                                <strong>{{ index + 1 }}. {{ item.title }}</strong>
                                <small>{{ reviewCounts[index] }} opération(s) enregistrée(s)</small>
                            </span>
                            <span class="review-actions">
                                <router-link :to="reviewListTarget(index, seance.id)" class="review-link">Consulter</router-link>
                                <input v-model="checkedItems[index]" type="checkbox" :aria-label="`Vérifier ${item.title}`" />
                                <span>Vérifié</span>
                            </span>
                        </label>
                    </div>

                    <label class="observation-label" for="close-observation">Observation de clôture (facultatif)</label>
                    <textarea id="close-observation" v-model.trim="observation" rows="2" maxlength="1000" placeholder="Ajouter une remarque sur la séance..."></textarea>

                    <p v-if="closeError" class="review-error" role="alert">{{ closeError }}</p>
                    <p v-if="seance.statut !== 'OUVERTE'" class="closed-notice">Cette séance est déjà clôturée.</p>
                    <div class="step-navigation">
                        <button type="button" class="button button-secondary" @click="goToStep(step - 1)">← Étape précédente</button>
                        <button
                            v-if="seance.statut === 'OUVERTE'"
                            type="button"
                            class="button button-danger"
                            :disabled="!canClose || closing"
                            @click="closeSession"
                        >
                            {{ closing ? "Clôture..." : "Clôturer la séance" }}
                        </button>
                        <router-link v-else to="/seances" class="button button-primary">Retour aux séances</router-link>
                    </div>
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
import creditService from "../../service/credit.service.js";
import remboursementService from "../../service/remboursement.service.js";
import penaliteService from "../../service/penalite.service.js";
import { useToast } from "../../composables/useToast.js";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const steps = [
    {
        title: "Présences",
        description: "Enregistrez la présence ou l'absence de chaque membre du cycle.",
        actionTitle: "Feuille de présence",
        actionDescription: "Renseignez la présence de tous les membres en une seule fois.",
        actionLabel: "Saisir les présences",
        target: (id) => `/seances/${id}/presences?assistant=1`,
        listTarget: (id, verified) => `/seances/${id}/presences?assistant=1&etape=5&verifie=${verified}`
    },
    {
        title: "Épargne",
        description: "Enregistrez les parts d'épargne collectées lors de cette séance.",
        actionTitle: "Nouvelle épargne",
        actionDescription: "Choisissez le membre et le nombre de parts à enregistrer.",
        actionLabel: "Ajouter une épargne",
        target: (id) => `/epargnes/nouveau?seance_id=${id}&assistant=1`,
        listTarget: (id, verified) => `/epargnes?seance_id=${id}&assistant=1&etape=5&verifie=${verified}`
    },
    {
        title: "Crédits",
        description: "Enregistrez les nouveaux crédits accordés aux membres.",
        actionTitle: "Nouveau crédit",
        actionDescription: "Saisissez le bénéficiaire et le montant du crédit.",
        actionLabel: "Ajouter un crédit",
        target: (id) => `/credits/nouveau?seance_id=${id}&assistant=1`,
        listTarget: (id, verified) => `/credits?seance_id=${id}&assistant=1&etape=5&verifie=${verified}`
    },
    {
        title: "Remboursements",
        description: "Enregistrez les remboursements reçus pour les crédits en cours.",
        actionTitle: "Nouveau remboursement",
        actionDescription: "Sélectionnez le crédit concerné et renseignez les montants.",
        actionLabel: "Ajouter un remboursement",
        target: (id) => `/remboursements/nouveau?seance_id=${id}&assistant=1`,
        listTarget: (id, verified) => `/remboursements?seance_id=${id}&assistant=1&etape=5&verifie=${verified}`
    },
    {
        title: "Pénalités",
        description: "Consultez les pénalités de la séance, réglez celles qui sont payées ou laissez-les impayées.",
        actionTitle: "Nouvelle pénalité manuelle",
        actionDescription: "Sélectionnez le membre concerné et le motif de la pénalité.",
        actionLabel: "Ajouter une pénalité",
        target: (id) => `/penalites/nouveau?seance_id=${id}&assistant=1`,
        listTarget: (id, verified) => `/penalites?seance_id=${id}&assistant=1&etape=5&verifie=${verified}`
    },
    { title: "Vérification" }
];

const loading = ref(true);
const error = ref("");
const seance = ref(null);
const openSessions = ref([]);
const reviewLoading = ref(false);
const reviewError = ref("");
const reviewCounts = ref([0, 0, 0, 0, 0]);
const penalties = ref([]);
const penaltiesLoading = ref(false);
const penaltiesError = ref("");
const payingPenaltyId = ref(null);
const initialVerified = route.query.verifie;
const checkedItems = ref(
    typeof initialVerified === "string" && /^[01]{5}$/.test(initialVerified)
        ? [...initialVerified].map((value) => value === "1")
        : [false, false, false, false, false]
);
const observation = ref("");
const closing = ref(false);
const closeError = ref("");
const seanceId = computed(() => Number(route.params.seanceId) || null);
const step = computed(() => {
    const value = Number(route.query.etape);
    return Number.isInteger(value) && value >= 0 && value < steps.length ? value : 0;
});
const canClose = computed(() =>
    checkedItems.value.length === 5 &&
    checkedItems.value.every(Boolean) &&
    !reviewLoading.value &&
    !reviewError.value
);

function unwrap(response) {
    const data = response?.data?.data ?? response?.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
        const rows = data.data ?? data.seances ?? data.presences ?? data.epargnes ??
            data.credits ?? data.remboursements ?? data.penalites;
        if (Array.isArray(rows)) return rows;
    }
    throw new Error("Le format des opérations reçues est invalide.");
}

function formatDate(value) {
    return value ? new Date(value).toLocaleDateString("fr-FR") : "Date non renseignée";
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
    seance.value = null;
    openSessions.value = [];
    try {
        if (!seanceId.value) {
            openSessions.value = unwrap(await seanceService.getAll())
                .filter((session) => session.statut === "OUVERTE");
            return;
        }
        const response = await seanceService.getById(seanceId.value);
        const payload = response.data?.data ?? response.data;
        seance.value = payload.data ?? payload.seance ?? payload;
        if (!seance.value || typeof seance.value !== "object" || !seance.value.id) {
            throw new Error("Séance introuvable.");
        }
    } catch (e) {
        error.value = e.response?.data?.message || e.message || "Impossible de charger la séance.";
    } finally {
        loading.value = false;
    }
}

function openSession(id) {
    router.push(`/seances/${id}/operations`);
}

function goToStep(nextStep) {
    if (nextStep < 0 || nextStep >= steps.length || nextStep > step.value + 1) return;
    router.push({
        path: route.path,
        query: { ...route.query, etape: String(nextStep) }
    });
}

function reviewListTarget(index, id) {
    const verified = checkedItems.value
        .map((checked) => checked ? "1" : "0")
        .join("");
    return steps[index].listTarget(id, verified);
}

async function loadReview() {
    if (!seanceId.value) return;
    reviewLoading.value = true;
    reviewError.value = "";
    try {
        const responses = await Promise.all([
            presenceService.getAll({ seance_id: seanceId.value }),
            epargneService.getAll({ seance_id: seanceId.value }),
            creditService.getAll({ seance_id: seanceId.value }),
            remboursementService.getAll({ seance_id: seanceId.value }),
            penaliteService.getAll({ seance_id: seanceId.value })
        ]);
        reviewCounts.value = responses.map((response) => unwrap(response).length);
    } catch (e) {
        reviewError.value = e.response?.data?.message || e.message || "Impossible de vérifier les opérations de la séance.";
    } finally {
        reviewLoading.value = false;
    }
}

async function loadPenalties() {
    if (!seanceId.value) return;
    penaltiesLoading.value = true;
    penaltiesError.value = "";
    try {
        penalties.value = unwrap(
            await penaliteService.getAll({ seance_id: seanceId.value })
        );
    } catch (e) {
        penaltiesError.value =
            e.response?.data?.message || e.message || "Impossible de charger les pénalités.";
    } finally {
        penaltiesLoading.value = false;
    }
}

async function payPenalty(penalty) {
    if (payingPenaltyId.value || penalty.statut !== "IMPAYEE") return;
    payingPenaltyId.value = penalty.id;
    penaltiesError.value = "";
    try {
        const response = await penaliteService.update(penalty.id, {
            statut: "PAYEE",
            motif: penalty.motif
        });
        penalty.statut = response.data?.data?.statut || "PAYEE";
        toast.success(response.data?.message || "Pénalité payée avec succès.");
    } catch (e) {
        penaltiesError.value =
            e.response?.data?.message || "Impossible d'enregistrer le paiement de la pénalité.";
        toast.error(penaltiesError.value);
    } finally {
        payingPenaltyId.value = null;
    }
}

async function closeSession() {
    closeError.value = "";
    closing.value = true;
    try {
        await seanceService.close(seanceId.value, observation.value || null);
        seance.value.statut = "CLOTUREE";
        toast.success("Séance clôturée avec succès.");
    } catch (e) {
        closeError.value = e.response?.data?.message || "Impossible de clôturer la séance.";
        toast.error(closeError.value);
    } finally {
        closing.value = false;
    }
}

watch(
    () => route.params.seanceId,
    load,
    { immediate: true }
);

watch(
    step,
    (value) => {
        if (value === 4 && seanceId.value) loadPenalties();
        if (value === steps.length - 1 && seanceId.value) loadReview();
    },
    { immediate: true }
);

watch(
    () => route.params.seanceId,
    () => {
        if (step.value === 4 && seanceId.value) loadPenalties();
    }
);
</script>

<style scoped>
.page { max-width: 1050px; margin: 0 auto; padding: 1.5rem; color: #1e293b; }
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
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
    gap: 1rem;
}
.subtitle, .muted { color: #64748b; }
.back-link { display: inline-flex; align-items: center; gap: .35rem; padding: .35rem .65rem; margin-left: -.65rem; border-radius: .5rem; color: #2563eb; text-decoration: none; font-size: .9rem; font-weight: 600; transition: background .15s ease, color .15s ease; }
.back-link:hover { background: #eff6ff; color: #1d4ed8; }
.back-link:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; }
.status-badge { border-radius: 999px; padding: .35rem .75rem; font-size: .8rem; font-weight: 700; }
.status-open { background: #dcfce7; color: #166534; }
.status-closed { background: #e2e8f0; color: #475569; }
.stepper { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); margin: 1.5rem 0; }
.step-marker { position: relative; display: flex; flex-direction: column; align-items: center; gap: .5rem; border: 0; background: transparent; color: #94a3b8; font: inherit; }
.step-marker:not(:last-child)::after { position: absolute; top: 1rem; left: calc(50% + 1.1rem); width: calc(100% - 2.2rem); height: 2px; background: #cbd5e1; content: ""; }
.step-marker.completed:not(:last-child)::after { background: #2563eb; }
.step-marker:disabled { cursor: default; }
.step-marker:not(:disabled) { cursor: pointer; }
.step-number { z-index: 1; display: grid; width: 2rem; height: 2rem; place-items: center; border: 2px solid #cbd5e1; border-radius: 50%; background: #fff; font-weight: 700; }
.step-marker.current { color: #1d4ed8; }
.step-marker.current .step-number { border-color: #2563eb; background: #2563eb; color: #fff; }
.step-marker.completed { color: #1d4ed8; }
.step-marker.completed .step-number { border-color: #2563eb; color: #2563eb; }
.step-label { font-size: .8rem; text-align: center; }
.step-card, .session-picker, .state-card { border: 1px solid #e2e8f0; border-radius: 1rem; background: #fff; padding: 1.5rem; box-shadow: 0 5px 18px rgb(15 23 42 / .04); }
.step-heading { margin-bottom: 1.5rem; }
.step-heading h2, .session-picker h2 { margin: .35rem 0; font-size: 1.35rem; }
.step-count { color: #2563eb; font-size: .75rem; font-weight: 800; letter-spacing: .08em; }
.action-card { display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; border: 1px solid #dbeafe; border-radius: .75rem; background: #f8fbff; padding: 1.25rem; }
.action-card p { margin-top: .35rem; color: #64748b; font-size: .9rem; }
.penalties-panel { border: 1px solid #e2e8f0; border-radius: .75rem; padding: 1rem; }
.penalties-heading { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.penalties-heading h3 { margin: 0 0 .35rem; font-size: 1rem; }
.penalties-heading p { margin: 0; }
.penalties-table-wrap { overflow-x: auto; }
.penalties-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
.penalties-table th, .penalties-table td { padding: .7rem; border-top: 1px solid #e2e8f0; text-align: left; white-space: nowrap; }
.penalties-table th { background: #f8fafc; color: #64748b; font-size: .75rem; text-transform: uppercase; }
.penalties-table small { display: block; margin-top: .2rem; color: #64748b; }
.step-navigation { display: flex; justify-content: space-between; align-items: center; gap: .75rem; margin-top: 1.5rem; }
.button { display: inline-flex; justify-content: center; align-items: center; gap: .4rem; min-height: 2.65rem; border: 0; border-radius: .55rem; padding: .65rem 1rem; font: inherit; font-weight: 650; text-decoration: none; cursor: pointer; }
.button:disabled { opacity: .5; cursor: not-allowed; }
.button-primary { background: #1e293b; color: #fff; }
.button-secondary { border: 1px solid #cbd5e1; background: #fff; color: #334155; }
.button-danger { background: #b91c1c; color: #fff; }
.review-list { margin-bottom: 1.25rem; border: 1px solid #e2e8f0; border-radius: .65rem; overflow: hidden; }
.review-row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: .9rem 1rem; border-bottom: 1px solid #e2e8f0; }
.review-row:last-child { border-bottom: 0; }
.review-copy { display: flex; flex-direction: column; gap: .2rem; }
.review-copy small { color: #64748b; }
.review-actions { display: flex; align-items: center; gap: .55rem; white-space: nowrap; font-size: .85rem; }
.review-actions input { width: 1.1rem; height: 1.1rem; accent-color: #2563eb; }
.review-link { color: #2563eb; font-weight: 600; }
.observation-label { display: block; margin: 1rem 0 .4rem; font-weight: 650; }
textarea { width: 100%; resize: vertical; border: 1px solid #cbd5e1; border-radius: .5rem; padding: .7rem; font: inherit; }
.review-error { display: flex; align-items: center; gap: .75rem; margin-top: 1rem; color: #b91c1c; }
.closed-notice { margin-top: 1rem; color: #475569; }
.state-inline, .empty-state { padding: 1rem 0; color: #64748b; }
.state-error { display: flex; align-items: center; gap: 1rem; color: #b91c1c; }
.session-picker .muted { margin-bottom: 1rem; }
.session-option { display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: .6rem; border: 1px solid #e2e8f0; border-radius: .65rem; background: #fff; padding: .9rem 1rem; text-align: left; cursor: pointer; }
.session-option:hover { border-color: #93c5fd; background: #f8fbff; }
.session-option span:first-child { display: flex; flex-direction: column; gap: .25rem; }
.session-option small { color: #64748b; }
.session-arrow { color: #2563eb; font-weight: 650; }
@media (max-width: 700px) {
    .page { padding: 0.25rem 0; }
    .stepper { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem .25rem; }
    .step-marker::after { display: none; }
    .step-label { font-size: .72rem; }
    .action-card, .review-row, .page-header { align-items: flex-start; flex-direction: column; }
    .penalties-heading { align-items: flex-start; flex-direction: column; }
    .review-actions { flex-wrap: wrap; white-space: normal; }
    .step-navigation { align-items: stretch; flex-direction: column-reverse; }
    .step-navigation .button { width: 100%; }
    .step-card, .session-picker, .state-card { padding: 1rem; border-radius: 0.75rem; }
    .step-heading { margin-bottom: 1rem; }
    .stepper { margin: 1rem 0; }
    .step-marker { min-width: 0; }
    .step-label { overflow-wrap: anywhere; }
    .session-option { align-items: flex-start; gap: 0.5rem; padding: 0.8rem; }
    .session-option > span:first-child { min-width: 0; overflow-wrap: anywhere; }
    .session-arrow { white-space: nowrap; }
    .penalties-table-wrap { max-width: 100%; -webkit-overflow-scrolling: touch; }
    .penalties-table { min-width: 680px; }
    .review-row { gap: 0.65rem; }
    .review-actions { width: 100%; }
    .review-error { align-items: flex-start; flex-direction: column; }
    .review-error .button { width: 100%; }
}
</style>
