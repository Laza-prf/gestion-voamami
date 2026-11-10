<template>
    <section class="page">
        <header class="page-header">
            <div>
                <router-link
                    :to="backUrl"
                    class="back-link"
                >
                    ← Retour à l’assistant
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

        <div v-else-if="error" class="state-card error-box">
            <p>{{ error }}</p>
            <button
                type="button"
                class="button secondary"
                @click="loadContext"
            >
                Réessayer
            </button>
        </div>

        <template v-else>
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
                            seance.statut === 'OUVERTE'
                                ? 'status-open'
                                : 'status-closed'
                        ]"
                    >
                        {{ seance.statut }}
                    </span>
                </div>
            </section>

            <form
                v-if="seance.statut === 'OUVERTE'"
                class="form-card"
                @submit.prevent="submit"
            >
                <label>
                    Membre
                    <select
                        v-model="form.membre_id"
                        required
                    >
                        <option value="">
                            Sélectionner un membre
                        </option>
                        <option
                            v-for="membre in membres"
                            :key="membre.id"
                            :value="membre.id"
                        >
                            N°{{ membre.numero_membre }} —
                            {{ membre.nom }}
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
                        placeholder="Observation sur le versement…"
                    ></textarea>
                </label>

                <p v-if="formError" class="error-box">
                    {{ formError }}
                </p>

                <div class="form-actions">
                    <button
                        type="button"
                        class="button secondary"
                        @click="goBack"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        class="button primary"
                        :disabled="saving || !membres.length"
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
import { onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import seanceService from "../../service/seance.service.js";
import membreService from "../../service/membre.service.js";
import caisseSocialeService from "../../service/caisse-sociale.service.js";

const route = useRoute();
const router = useRouter();

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

const seanceId = Number(route.query.seance_id) || null;
const isAssistant = route.query.assistant === "1";

const backUrl = seanceId
    ? `/seances/${seanceId}/operations`
    : "/caisse-sociale";

function extractRows(response) {
    const payload = response?.data;

    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.rows)) return payload.rows;
    if (Array.isArray(payload.membres)) return payload.membres;
    if (Array.isArray(payload.seances)) return payload.seances;

    return [];
}

function extractObject(response) {
    const payload = response?.data;
    const data = payload?.data ?? payload;

    if (Array.isArray(data)) {
        return data[0] || null;
    }

    if (data?.seance) {
        return data.seance;
    }

    return data && typeof data === "object" ? data : null;
}

function formatDate(value) {
    if (!value) return "Date non renseignée";

    return new Date(value).toLocaleDateString("fr-FR");
}

async function loadContext() {
    loading.value = true;
    error.value = "";

    try {
        if (!seanceId) {
            throw new Error(
                "La cotisation doit être ouverte depuis une séance."
            );
        }

        const seanceResponse =
            await seanceService.getById(seanceId);

        seance.value = extractObject(seanceResponse);

        if (!seance.value?.id) {
            throw new Error("Séance introuvable.");
        }

        if (!seance.value.voamami_id) {
            throw new Error(
                "La séance ne contient pas de VOAMAMI."
            );
        }

        const membreResponse = await membreService.getAll({
            voamami_id: seance.value.voamami_id,
            actif: 1
        });

        membres.value = extractRows(membreResponse).filter(
            (membre) => membre.actif === undefined || Boolean(membre.actif)
        );

        if (!membres.value.length) {
            error.value =
                "Aucun membre actif n'est disponible pour cette séance.";
        }
    } catch (err) {
        console.error(
            "Erreur chargement contexte cotisation sociale :",
            err
        );

        error.value =
            err.response?.data?.message ||
            err.message ||
            "Impossible de charger le contexte de la séance.";
    } finally {
        loading.value = false;
    }
}

function goBack() {
    router.push(backUrl);
}

async function submit() {
    formError.value = "";

    if (!seance.value?.id) {
        formError.value = "Séance introuvable.";
        return;
    }

    if (!form.membre_id) {
        formError.value = "Veuillez sélectionner un membre.";
        return;
    }

    if (!form.montant || Number(form.montant) <= 0) {
        formError.value = "Le montant doit être supérieur à zéro.";
        return;
    }

    saving.value = true;

    try {
        await caisseSocialeService.createCotisationForSeance(
            seance.value.id,
            {
                membre_id: Number(form.membre_id),
                mois_concerne: `${form.mois_concerne}-01`,
                montant: Number(form.montant),
                observation: form.observation || null
            }
        );

        router.push({
            path: `/seances/${seance.value.id}/operations`,
            query: {
                etape: "3"
            }
        });
    } catch (err) {
        console.error(
            "Erreur enregistrement cotisation sociale :",
            err
        );

        formError.value =
            err.response?.data?.message ||
            "Impossible d'enregistrer la cotisation sociale.";
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
