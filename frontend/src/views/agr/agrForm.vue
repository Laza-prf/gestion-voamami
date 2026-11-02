<template>
    <div class="page">
        <h1>
            {{
                isEdit
                    ? "Modifier l'AGR"
                    : "Nouvel AGR"
            }}
        </h1>

        <form
            class="form"
            @submit.prevent="onSubmit"
        >
            <label>
                Libellé

                <input
                    v-model.trim="form.libelle"
                    type="text"
                    required
                    maxlength="150"
                    placeholder="Exemple : Élevage de poulets"
                />
            </label>

            <label>
                Description

                <textarea
                    v-model.trim="form.description"
                    rows="4"
                    placeholder="Description de l'activité"
                ></textarea>
            </label>



            <label class="checkbox-label">
                <input
                    v-model="form.actif"
                    type="checkbox"
                />

                AGR actif
            </label>

            <p
                v-if="error"
                class="error"
            >
                {{ error }}
            </p>

            <div class="form-actions">
                <button
                    type="submit"
                    :disabled="saving"
                >
                    {{
                        saving
                            ? "Enregistrement..."
                            : "Enregistrer"
                    }}
                </button>

                <router-link to="/agr">
                    Annuler
                </router-link>
            </div>
        </form>
    </div>
</template>

<script setup>
import {
    reactive,
    ref,
    computed,
    onMounted
} from "vue";

import {
    useRoute,
    useRouter
} from "vue-router";

import agrService from "../../service/agr.service.js";
import { useToast } from "../../composables/useToast.js";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const isEdit = computed(() => {
    return Boolean(route.params.id);
});

const saving = ref(false);
const error = ref("");

const form = reactive({
    libelle: "",
    description: "",
    actif: true
});



async function loadAgr() {
    if (!isEdit.value) {
        return;
    }

    try {
        const { data } =
            await agrService.getById(
                route.params.id
            );

        const agr =
            data.data ??
            data.agr ??
            data;

        form.libelle = agr.libelle || "";
        form.description =
            agr.description || "";

        form.actif =
            agr.actif === 1 ||
            agr.actif === true;
    } catch (e) {
        console.error(
            "Erreur chargement AGR :",
            e.response?.data || e
        );

        error.value =
            e.response?.data?.message ||
            "AGR introuvable";
    }
}

async function onSubmit() {
    saving.value = true;
    error.value = "";

    try {
        const payload = {
            libelle: form.libelle,
            description:
                form.description || null,
            actif: form.actif ? 1 : 0
        };

        console.log(
            "Payload AGR :",
            payload
        );

        if (isEdit.value) {
            await agrService.update(
                route.params.id,
                payload
            );
            toast.success("AGR modifié avec succès.");
        } else {
            await agrService.create(payload);
            toast.success("AGR créé avec succès.");
        }

        await router.push("/agr");
    } catch (e) {
        console.error(
            "Erreur enregistrement AGR :",
            e.response?.data || e
        );

        error.value =
            e.response?.data?.message ||
            "Erreur d'enregistrement de l'AGR";
    } finally {
        saving.value = false;
    }
}

onMounted(loadAgr);
</script>

<style scoped>
.page {
    padding: 1.5rem;
}

.form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 560px;
}

label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-weight: 600;
}

input,
textarea {
    padding: 0.6rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font: inherit;
}

.checkbox-label {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
}

.checkbox-label input {
    width: auto;
}

.form-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 0.5rem;
}

.form-actions button {
    padding: 0.6rem 1rem;
    border: none;
    border-radius: 6px;
    background: #1e293b;
    color: white;
    cursor: pointer;
}

.form-actions button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.form-actions a {
    color: #2563eb;
    text-decoration: none;
}

.error {
    color: #b91c1c;
}
</style>
