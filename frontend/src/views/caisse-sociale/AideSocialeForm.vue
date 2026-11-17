<template>
    <section class="page">
        <header class="page-header">
            <p class="eyebrow">Caisse sociale</p>
            <h1>Demander une aide sociale</h1>
            <p class="muted">
                Sélectionnez d’abord un VOAMAMI, puis un membre actif de ce
                groupe.
            </p>
        </header>

        <form class="form" @submit.prevent="submit">
            <label>
                VOAMAMI
                <select
                    v-model="form.voamami_id"
                    required
                    :disabled="saving || loadingVoamamis"
                    @change="loadMembers"
                >
                    <option value="">
                        {{ loadingVoamamis
                            ? "Chargement…"
                            : "Sélectionner un VOAMAMI" }}
                    </option>

                    <option
                        v-for="voamami in voamamis"
                        :key="voamami.id"
                        :value="String(voamami.id)"
                    >
                        {{ voamami.code }} — {{ voamami.nom }}
                    </option>
                </select>
            </label>

            <label>
                Membre bénéficiaire
                <select
                    v-model="form.membre_id"
                    required
                    :disabled="saving || loadingMembers || !form.voamami_id"
                >
                    <option value="">
                        {{ loadingMembers
                            ? "Chargement des membres…"
                            : !form.voamami_id
                              ? "Sélectionnez d’abord un VOAMAMI"
                              : members.length === 0
                                ? "Aucun membre actif"
                                : "Sélectionner un membre" }}
                    </option>

                    <option
                        v-for="member in members"
                        :key="member.id"
                        :value="String(member.id)"
                    >
                        N°{{ member.numero_membre || "—" }} —
                        {{ member.nom || "" }}
                        {{ member.prenom || "" }}
                    </option>
                </select>

                <small
                    v-if="form.voamami_id && !loadingMembers && members.length === 0"
                    class="field-warning"
                >
                    Aucun membre actif n’est disponible dans ce VOAMAMI.
                </small>
            </label>

            <label>
                Type d’aide
                <select
                    v-model="form.type_aide"
                    required
                    :disabled="saving"
                >
                    <option value="ACCIDENT">Accident</option>
                    <option value="MALADIE_GRAVE">Maladie grave</option>
                    <option value="DECES">Décès</option>
                    <option value="NAISSANCE">Naissance</option>
                    <option value="AUTRE">Autre</option>
                </select>
            </label>

            <label>
                Montant demandé (Ar)
                <input
                    v-model.number="form.montant_demande"
                    type="number"
                    min="1"
                    step="1"
                    required
                    :disabled="saving"
                />
            </label>

            <label>
                Motif
                <textarea
                    v-model.trim="form.motif"
                    rows="4"
                    maxlength="1000"
                    required
                    :disabled="saving"
                    placeholder="Décrivez la situation du membre…"
                ></textarea>
            </label>

            <label>
                Séance concernée
                <span class="optional">Facultatif</span>
                <input
                    v-model="form.seance_id"
                    type="number"
                    min="1"
                    step="1"
                    :disabled="saving"
                    placeholder="Identifiant de la séance"
                />
            </label>

            <label>
                Observation
                <span class="optional">Facultatif</span>
                <textarea
                    v-model.trim="form.observation"
                    rows="3"
                    maxlength="500"
                    :disabled="saving"
                    placeholder="Informations complémentaires…"
                ></textarea>
            </label>

            <p
                v-if="error"
                class="error"
                role="alert"
            >
                {{ error }}
            </p>

            <div class="actions">
                <button
                    type="button"
                    class="secondary"
                    :disabled="saving"
                    @click="router.back()"
                >
                    Annuler
                </button>

                <button
                    type="submit"
                    class="primary"
                    :disabled="saving || loadingMembers || members.length === 0"
                >
                    {{ saving ? "Envoi…" : "Envoyer la demande" }}
                </button>
            </div>
        </form>
    </section>
</template>

<script setup>
import {
    onMounted,
    reactive,
    ref
} from "vue";

import {
    useRoute,
    useRouter
} from "vue-router";

import caisseSocialeService from "../../service/caisse-sociale.service.js";
import voamamiService from "../../service/voamami.service.js";
import membreService from "../../service/membre.service.js";

const route = useRoute();
const router = useRouter();

const voamamis = ref([]);
const members = ref([]);
const loadingVoamamis = ref(false);
const loadingMembers = ref(false);
const saving = ref(false);
const error = ref("");

const form = reactive({
    voamami_id: String(route.query.voamamiId ?? route.query.voamami_id ?? ""),
    membre_id: "",
    type_aide: "ACCIDENT",
    montant_demande: 0,
    motif: "",
    seance_id: "",
    observation: ""
});

function extractArray(response, keys = []) {
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

function isActive(member) {
    // PostgreSQL renvoie généralement true/false ; le wrapper peut aussi
    // renvoyer 1/0 selon la structure ou les données migrées.
    return (
        member?.actif === true ||
        member?.actif === 1 ||
        member?.actif === "1" ||
        member?.actif === undefined ||
        member?.actif === null
    );
}

function getMessage(errorObject, fallback) {
    const responseData = errorObject?.response?.data;

    return (
        responseData?.message ||
        responseData?.error ||
        responseData?.errors?.[0]?.msg ||
        responseData?.errors?.[0]?.message ||
        errorObject?.message ||
        fallback
    );
}

async function loadVoamamis() {
    loadingVoamamis.value = true;
    error.value = "";

    try {
        const response = await voamamiService.getAll();

        voamamis.value = extractArray(response, [
            "voamamis",
            "groups",
            "rows"
        ]).filter((voamami) => voamami?.id);
    } catch (err) {
        console.error("Erreur chargement VOAMAMI :", err);
        error.value = getMessage(
            err,
            "Impossible de charger les VOAMAMI."
        );
    } finally {
        loadingVoamamis.value = false;
    }
}

async function loadMembers() {
    const voamamiId = Number(form.voamami_id);

    members.value = [];
    form.membre_id = "";
    error.value = "";

    if (!Number.isInteger(voamamiId) || voamamiId <= 0) {
        return;
    }

    loadingMembers.value = true;

    try {
        let response;

        try {
            response = await membreService.getAll({
                voamami_id: voamamiId,
                actif: true
            });
        } catch (filteredRequestError) {
            // Compatibilité si le service/backend n’accepte pas encore les
            // paramètres de filtrage.
            console.warn(
                "Filtrage serveur indisponible, repli sur getAll() :",
                filteredRequestError
            );
            response = await membreService.getAll();
        }

        const allMembers = extractArray(response, [
            "membres",
            "members",
            "rows"
        ]);

        // Le filtrage côté frontend reste obligatoire : certains contrôleurs
        // ignorent les query params reçus par getAll().
        members.value = allMembers
            .filter((member) =>
                Number(member?.voamami_id) === voamamiId
            )
            .filter(isActive)
            .sort((a, b) =>
                Number(a.numero_membre || 0) -
                Number(b.numero_membre || 0)
            );
    } catch (err) {
        console.error("Erreur chargement membres :", err);
        error.value = getMessage(
            err,
            "Impossible de charger les membres de ce VOAMAMI."
        );
    } finally {
        loadingMembers.value = false;
    }
}

function validate() {
    const voamamiId = Number(form.voamami_id);
    const membreId = Number(form.membre_id);
    const amount = Number(form.montant_demande);

    if (!Number.isInteger(voamamiId) || voamamiId <= 0) {
        return "Veuillez sélectionner un VOAMAMI.";
    }

    if (!Number.isInteger(membreId) || membreId <= 0) {
        return "Veuillez sélectionner un membre.";
    }

    const memberBelongsToGroup = members.value.some(
        (member) => Number(member.id) === membreId
    );

    if (!memberBelongsToGroup) {
        return "Le membre sélectionné n’appartient pas à ce VOAMAMI.";
    }

    if (!Number.isInteger(amount) || amount <= 0) {
        return "Le montant demandé doit être supérieur à zéro.";
    }

    if (!String(form.motif || "").trim()) {
        return "Le motif est obligatoire.";
    }

    if (form.seance_id) {
        const seanceId = Number(form.seance_id);

        if (!Number.isInteger(seanceId) || seanceId <= 0) {
            return "L’identifiant de séance est invalide.";
        }
    }

    return "";
}

async function submit() {
    error.value = "";

    const validationError = validate();

    if (validationError) {
        error.value = validationError;
        return;
    }

    saving.value = true;

    const payload = {
        membre_id: Number(form.membre_id),
        type_aide: form.type_aide,
        montant_demande: Number(form.montant_demande),
        motif: String(form.motif).trim(),
        seance_id: form.seance_id
            ? Number(form.seance_id)
            : null,
        observation: form.observation?.trim() || null
    };

    try {
        await caisseSocialeService.createAide(
            Number(form.voamami_id),
            payload
        );

        await router.push({
            path: "/caisse-sociale/aides",
            query: {
                voamamiId: String(form.voamami_id),
                created: "1"
            }
        });
    } catch (err) {
        console.error("Erreur création aide sociale :", err);
        error.value = getMessage(
            err,
            "Impossible d’envoyer la demande d’aide."
        );
    } finally {
        saving.value = false;
    }
}

onMounted(async () => {
    await loadVoamamis();

    if (form.voamami_id) {
        await loadMembers();
    }
});

</script>

<style scoped>
.page {
    max-width: 700px;
    margin: 0 auto;
    padding: clamp(1rem, 4vw, 2rem);
}

.page-header {
    margin-bottom: 1.25rem;
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

.form {
    display: grid;
    gap: 1rem;
    padding: clamp(1rem, 4vw, 1.5rem);
    border: 1px solid #e2e8f0;
    border-radius: 1rem;
    background: #fff;
    box-shadow: 0 8px 24px rgb(15 23 42 / 5%);
}

label {
    display: grid;
    gap: 0.35rem;
    color: #334155;
    font-weight: 650;
}

.optional {
    display: inline;
    margin-left: 0.25rem;
    color: #64748b;
    font-size: 0.8rem;
    font-weight: 400;
}

input,
select,
textarea {
    width: 100%;
    border: 1px solid #cbd5e1;
    border-radius: 0.55rem;
    padding: 0.72rem;
    background: #fff;
    color: #0f172a;
    font: inherit;
}

input:disabled,
select:disabled,
textarea:disabled {
    cursor: not-allowed;
    background: #f1f5f9;
}

.field-warning {
    color: #92400e;
    font-weight: 400;
}

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
    margin-top: 0.4rem;
}

.actions button {
    border: 0;
    border-radius: 0.55rem;
    padding: 0.72rem 1rem;
    font: inherit;
    font-weight: 650;
    cursor: pointer;
}

.actions button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
}

.primary {
    background: #2563eb;
    color: #fff;
}

.secondary {
    border: 1px solid #cbd5e1 !important;
    background: #fff;
    color: #334155;
}

.error {
    margin: 0;
    border-radius: 0.55rem;
    background: #fee2e2;
    padding: 0.75rem;
    color: #991b1b;
}

@media (max-width: 600px) {
    .actions {
        flex-direction: column-reverse;
    }

    .actions button {
        width: 100%;
    }
}
</style>
