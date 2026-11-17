<template>
    <section class="page">
        <header class="page-header">
            <div>
                <router-link :to="backUrl" class="back-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </router-link>

                <p class="eyebrow">Assistant des opérations</p>
                <h1>Cotisation sociale</h1>
                <p class="muted">
                    Enregistrez la contribution sociale d’un membre pendant
                    la séance active.
                </p>
            </div>
        </header>

        <div v-if="loading" class="state-card">
            Chargement du contexte de la séance…
        </div>

        <div v-else-if="error" class="state-card error-box" role="alert">
            <p>{{ error }}</p>
            <button
                type="button"
                class="button secondary"
                @click="loadContext"
            >
                Réessayer
            </button>
        </div>

        <template v-else-if="seance">
            <section class="context-card">
                <div>
                    <span class="context-label">VOAMAMI</span>
                    <strong>
                        {{ seance.voamami_code || "VOAMAMI" }}
                        <span v-if="seance.voamami_nom">
                            — {{ seance.voamami_nom }}
                        </span>
                    </strong>
                </div>

                <div>
                    <span class="context-label">Séance</span>
                    <strong>
                        S{{ seance.numero_seance || seance.id }}
                        — {{ formatDate(seance.date_seance) }}
                    </strong>
                </div>

                <div>
                    <span class="context-label">Statut</span>
                    <span
                        :class="[
                            'status-badge',
                            isSessionOpen
                                ? 'status-open'
                                : 'status-closed'
                        ]"
                    >
                        {{ seance.statut || "INCONNU" }}
                    </span>
                </div>
            </section>

            <form
                v-if="isSessionOpen"
                class="form-card"
                @submit.prevent="submit"
            >
                <label>
                    Membre
                    <select
                        v-model="form.membre_id"
                        required
                        :disabled="saving || membres.length === 0"
                    >
                        <option value="">
                            Sélectionner un membre
                        </option>
                        <option
                            v-for="membre in membres"
                            :key="membre.id"
                            :value="String(membre.id)"
                        >
                            N°{{ membre.numero_membre || "—" }} —
                            {{ membre.nom || "" }}
                            {{ membre.prenom || "" }}
                        </option>
                    </select>
                </label>

                <label>
                    Mois concerné
                    <input
                        v-model="form.mois_concerne"
                        type="month"
                        required
                        :disabled="saving"
                    />
                </label>

                <label>
                    Montant versé en Ariary
                    <input
                        v-model.number="form.montant"
                        type="number"
                        min="1"
                        step="1"
                        required
                        :disabled="saving"
                    />
                </label>

                <p class="hint">
                    Le minimum mensuel est de 1 000 Ar. Un membre peut verser
                    1 000 Ar, 10 000 Ar ou davantage. Plusieurs versements
                    sont autorisés au cours du même mois.
                </p>

                <label>
                    Observation facultative
                    <textarea
                        v-model.trim="form.observation"
                        rows="3"
                        maxlength="500"
                        :disabled="saving"
                        placeholder="Observation sur le versement…"
                    ></textarea>
                </label>

                <p v-if="formError" class="error-box" role="alert">
                    {{ formError }}
                </p>

                <p
                    v-if="!membres.length"
                    class="warning-box"
                >
                    Aucun membre actif n’est disponible pour cette séance.
                </p>

                <div class="form-actions">
                    <button
                        type="button"
                        class="button secondary"
                        :disabled="saving"
                        @click="goBack"
                    >
                        Annuler
                    </button>

                    <button
                        type="submit"
                        class="button primary"
                        :disabled="saving || membres.length === 0"
                    >
                        {{ saving ? "Enregistrement…" : "Enregistrer" }}
                    </button>
                </div>
            </form>

            <div v-else class="state-card warning-box">
                Cette séance est clôturée. Une nouvelle cotisation ne peut
                plus y être enregistrée.
            </div>
        </template>
    </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "../../composables/useToast.js";
import seanceService from "../../service/seance.service.js";
import membreService from "../../service/membre.service.js";
import caisseSocialeService from "../../service/caisse-sociale.service.js";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const seance = ref(null);
const membres = ref([]);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const formError = ref("");

const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1
).padStart(2, "0")}`;

const form = reactive({
    membre_id: "",
    mois_concerne: currentMonth,
    montant: 1000,
    observation: ""
});

/*
 * Le composant peut être ouvert depuis :
 * /seances/:seanceId/cotisations-sociales
 * ou depuis l’assistant avec ?seance_id=27.
 */
const seanceId = computed(() => {
    const routeValue =
        route.params.seanceId ??
        route.params.id ??
        route.query.seance_id;

    const id = Number(routeValue);
    return Number.isInteger(id) && id > 0 ? id : null;
});

const backUrl = computed(() =>
    seanceId.value
        ? `/seances/${seanceId.value}/operations?etape=2`
        : "/caisse-sociale"
);
const successUrl = computed(() =>
    route.query.assistant === "1" && seanceId.value
        ? `/seances/${seanceId.value}/operations?etape=3`
        : backUrl.value
);

const isSessionOpen = computed(() => {
    const statut = String(
        seance.value?.statut || ""
    ).toUpperCase();

    return statut === "OUVERTE" || statut === "OUVERT";
});

function extractRows(response, keys = []) {
    const payload = response?.data;

    if (Array.isArray(payload)) {
        return payload;
    }

    const data = payload?.data ?? payload;

    if (Array.isArray(data)) {
        return data;
    }

    if (data && typeof data === "object") {
        for (const key of keys) {
            if (Array.isArray(data[key])) {
                return data[key];
            }
        }
    }

    return [];
}

function extractObject(response, keys = []) {
    const payload = response?.data;
    const data = payload?.data ?? payload;

    if (Array.isArray(data)) {
        return data[0] ?? null;
    }

    if (!data || typeof data !== "object") {
        return null;
    }

    for (const key of keys) {
        if (data[key] && typeof data[key] === "object") {
            return data[key];
        }
    }

    return data;
}

function isActiveMember(membre) {
    return (
        membre?.actif === 1 ||
        membre?.actif === true ||
        membre?.actif === "1"
    );
}

function formatDate(value) {
    if (!value) {
        return "Date non renseignée";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value).slice(0, 10);
    }

    return date.toLocaleDateString("fr-FR");
}

function getServerMessage(errorObject, fallback) {
    const responseData = errorObject?.response?.data;
    const validationErrors = responseData?.errors;

    if (Array.isArray(validationErrors)) {
        const firstError = validationErrors.find(Boolean);

        if (typeof firstError === "string") {
            return firstError;
        }

        if (firstError?.msg) {
            return firstError.msg;
        }

        if (firstError?.message) {
            return firstError.message;
        }
    }

    return (
        responseData?.message ||
        responseData?.error ||
        errorObject?.message ||
        fallback
    );
}

async function loadContext() {
    loading.value = true;
    error.value = "";
    formError.value = "";
    seance.value = null;
    membres.value = [];

    try {
        if (!seanceId.value) {
            throw new Error(
                "La cotisation doit être ouverte depuis une séance valide."
            );
        }

        const seanceResponse =
            await seanceService.getById(seanceId.value);

        const loadedSeance = extractObject(
            seanceResponse,
            ["seance"]
        );

        if (!loadedSeance?.id) {
            throw new Error("Séance introuvable.");
        }

        if (!loadedSeance.voamami_id) {
            throw new Error(
                "La séance ne contient pas de VOAMAMI."
            );
        }

        seance.value = loadedSeance;

        let membreResponse;

        try {
            membreResponse = await membreService.getAll({
                voamami_id: loadedSeance.voamami_id,
                actif: 1
            });
        } catch (firstError) {
            // Compatibilité avec un service getAll() qui n’accepte pas de filtre.
            console.warn(
                "Le filtrage des membres par paramètres a échoué ; repli sur getAll().",
                firstError
            );
            membreResponse = await membreService.getAll();
        }

        const rows = extractRows(membreResponse, [
            "membres",
            "members",
            "rows"
        ]);

        membres.value = rows.filter((membre) => {
            const sameVoamami =
                Number(membre.voamami_id) ===
                Number(loadedSeance.voamami_id);

            return sameVoamami && isActiveMember(membre);
        });

        if (membres.value.length === 0) {
            error.value =
                "Aucun membre actif n’est disponible pour cette séance.";
        }
    } catch (err) {
        console.error(
            "Erreur chargement contexte cotisation sociale :",
            err
        );

        error.value = getServerMessage(
            err,
            "Impossible de charger le contexte de la séance."
        );
    } finally {
        loading.value = false;
    }
}

function goBack() {
    router.push(backUrl.value);
}

function validateForm() {
    if (!seanceId.value) {
        return "La séance est introuvable.";
    }

    if (!seance.value?.id) {
        return "Le contexte de la séance est introuvable.";
    }

    if (!isSessionOpen.value) {
        return "Cette séance est clôturée.";
    }

    if (!form.membre_id) {
        return "Veuillez sélectionner un membre.";
    }

    const memberExists = membres.value.some(
        (membre) =>
            Number(membre.id) === Number(form.membre_id)
    );

    if (!memberExists) {
        return "Le membre sélectionné n’est pas disponible dans ce VOAMAMI.";
    }

    if (!/^\d{4}-\d{2}$/.test(form.mois_concerne)) {
        return "Veuillez sélectionner un mois valide.";
    }

    const montant = Number(form.montant);

    if (!Number.isFinite(montant) || montant <= 0) {
        return "Le montant doit être un nombre supérieur à zéro.";
    }

    if (montant % 1 !== 0) {
        return "Le montant doit être un nombre entier en Ariary.";
    }

    return "";
}

async function submit() {
    formError.value = "";

    const validationMessage = validateForm();

    if (validationMessage) {
        formError.value = validationMessage;
        toast.error(validationMessage);
        return;
    }

    saving.value = true;

    const payload = {
        seance_id: seanceId.value,
        membre_id: Number(form.membre_id),
        mois_concerne: form.mois_concerne,
        montant: Number(form.montant),
        observation: form.observation?.trim() || null
    };

    console.log(
        "POST cotisation sociale :",
        `/seances/${seanceId.value}/cotisations-sociales`
    );

   console.log(
    "Payload cotisation sociale détaillé :",
    JSON.stringify(payload, null, 2)
);


    try {
        const response =
            await caisseSocialeService.createCotisationForSeance(
                seanceId.value,
                payload
            );

        console.log(
            "Cotisation sociale créée :",
            response?.data
        );

        toast.success(
            "Cotisation sociale enregistrée avec succès."
        );

        await router.push(successUrl.value);
    } catch (err) {
    const serverResponse = err?.response?.data || {};

    console.error(
        "Erreur enregistrement cotisation sociale :",
        err
    );

    console.error(
        "Réponse détaillée du serveur :",
        JSON.stringify(
            serverResponse,
            null,
            2
        )
    );

    console.error(
        "Statut HTTP :",
        err?.response?.status
    );

    const message =
        serverResponse.message ||
        serverResponse.error ||
        serverResponse.detail ||
        serverResponse.sqlMessage ||
        serverResponse.errors?.[0]?.msg ||
        serverResponse.errors?.[0]?.message ||
        err.message ||
        "Impossible d’enregistrer la cotisation sociale.";

    formError.value = message;
    toast.error(message);
} finally {
    saving.value = false;
}
}

onMounted(loadContext);
</script>

<style scoped>
.page {
    max-width: 760px;
    margin: 0 auto;
    padding: clamp(1rem, 4vw, 2rem);
}

.page-header {
    margin-bottom: 1.25rem;
}

.back-link {
    display: inline-block;
    margin-bottom: 1rem;
    color: #2563eb;
    font-weight: 600;
    text-decoration: none;
}

.eyebrow {
    margin: 0;
    color: #2563eb;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

h1 {
    margin: 0.35rem 0;
}

.muted {
    color: #64748b;
}

.context-card,
.form-card,
.state-card {
    border: 1px solid #e2e8f0;
    border-radius: 1rem;
    background: #fff;
    padding: 1.25rem;
    box-shadow: 0 5px 18px rgb(15 23 42 / 4%);
}

.context-card {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;
    background: #f8fbff;
}

.context-card > div {
    display: grid;
    gap: 0.3rem;
}

.context-label {
    color: #64748b;
    font-size: 0.75rem;
    text-transform: uppercase;
}

.status-badge {
    width: fit-content;
    border-radius: 999px;
    padding: 0.3rem 0.65rem;
    font-size: 0.8rem;
    font-weight: 700;
}

.status-open {
    background: #dcfce7;
    color: #166534;
}

.status-closed {
    background: #e2e8f0;
    color: #475569;
}

.form-card {
    display: grid;
    gap: 1rem;
}

.form-card label {
    display: grid;
    gap: 0.35rem;
    font-weight: 650;
}

input,
select,
textarea {
    width: 100%;
    border: 1px solid #cbd5e1;
    border-radius: 0.55rem;
    padding: 0.75rem;
    font: inherit;
}

input:disabled,
select:disabled,
textarea:disabled {
    cursor: not-allowed;
    background: #f1f5f9;
}

textarea {
    resize: vertical;
}

.hint {
    margin: 0;
    border-radius: 0.55rem;
    background: #eff6ff;
    padding: 0.75rem;
    color: #1e40af;
    font-size: 0.9rem;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.65rem;
}

.button {
    border: 0;
    border-radius: 0.55rem;
    padding: 0.7rem 1rem;
    font: inherit;
    font-weight: 650;
    cursor: pointer;
}

.button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
}

.primary {
    background: #1e293b;
    color: #fff;
}

.secondary {
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #334155;
}

.error-box {
    color: #991b1b;
}

.warning-box {
    background: #fffbeb;
    color: #92400e;
}

.state-card {
    min-height: 8rem;
}

@media (max-width: 650px) {
    .context-card {
        grid-template-columns: 1fr;
    }

    .form-actions {
        flex-direction: column-reverse;
    }

    .form-actions .button {
        width: 100%;
    }
}
</style>
