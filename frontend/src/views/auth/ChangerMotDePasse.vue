<template>
    <main class="page">
        <section class="card" aria-labelledby="change-title">
            <div class="page-header">
                <router-link to="/" class="back-link">
                    ← Retour au tableau de bord
                </router-link>
                <p class="eyebrow">Sécurité du compte</p>
                <h1 id="change-title">Modifier mon mot de passe</h1>
                <p class="description">
                    Utilisez cette page pour remplacer votre mot de passe
                    actuel par un nouveau mot de passe sécurisé.
                </p>
            </div>

            <form class="form" @submit.prevent="submit" novalidate>
                <div class="field">
                    <label for="current-password">
                        Mot de passe actuel
                    </label>
                    <div class="password-wrapper">
                        <input
                            id="current-password"
                            v-model="form.ancien_mot_de_passe"
                            :type="showCurrent ? 'text' : 'password'"
                            autocomplete="current-password"
                            required
                        />
                        <button
                            type="button"
                            class="password-toggle"
                            @click="showCurrent = !showCurrent"
                        >
                            {{ showCurrent ? "Masquer" : "Afficher" }}
                        </button>
                    </div>
                </div>

                <div class="field">
                    <label for="new-password">
                        Nouveau mot de passe
                    </label>
                    <div class="password-wrapper">
                        <input
                            id="new-password"
                            v-model="form.nouveau_mot_de_passe"
                            :type="showNew ? 'text' : 'password'"
                            autocomplete="new-password"
                            minlength="8"
                            placeholder="Au moins 8 caractères"
                            required
                        />
                        <button
                            type="button"
                            class="password-toggle"
                            @click="showNew = !showNew"
                        >
                            {{ showNew ? "Masquer" : "Afficher" }}
                        </button>
                    </div>
                </div>

                <div class="field">
                    <label for="confirm-password">
                        Confirmer le nouveau mot de passe
                    </label>
                    <input
                        id="confirm-password"
                        v-model="form.confirmation"
                        type="password"
                        autocomplete="new-password"
                        minlength="8"
                        required
                    />
                </div>

                <ul class="password-rules">
                    <li :class="{ valid: form.nouveau_mot_de_passe.length >= 8 }">
                        Au moins 8 caractères
                    </li>
                    <li :class="{ valid: passwordsMatch }">
                        Les deux nouveaux mots de passe correspondent
                    </li>
                </ul>

                <div v-if="error" class="message error-message" role="alert">
                    <span class="message-icon">!</span>
                    <span>{{ error }}</span>
                </div>

                <div v-if="success" class="message success-message" role="status">
                    <span class="success-icon">✓</span>
                    <span>{{ success }}</span>
                </div>

                <div class="form-actions">
                    <router-link to="/" class="cancel-button">
                        Annuler
                    </router-link>
                    <button
                        type="submit"
                        class="submit-button"
                        :disabled="loading"
                    >
                        <span v-if="loading" class="button-spinner"></span>
                        {{ loading ? "Modification..." : "Modifier le mot de passe" }}
                    </button>
                </div>
            </form>
        </section>
    </main>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import api from "../../service/api.js";

const form = reactive({
    ancien_mot_de_passe: "",
    nouveau_mot_de_passe: "",
    confirmation: ""
});

const loading = ref(false);
const error = ref("");
const success = ref("");
const showCurrent = ref(false);
const showNew = ref(false);

const passwordsMatch = computed(() =>
    form.nouveau_mot_de_passe.length > 0 &&
    form.nouveau_mot_de_passe === form.confirmation
);

async function submit() {
    error.value = "";
    success.value = "";

    if (!form.ancien_mot_de_passe) {
        error.value = "Veuillez saisir votre mot de passe actuel.";
        return;
    }

    if (form.nouveau_mot_de_passe.length < 8) {
        error.value =
            "Le nouveau mot de passe doit contenir au moins 8 caractères.";
        return;
    }

    if (!passwordsMatch.value) {
        error.value =
            "Les deux nouveaux mots de passe ne correspondent pas.";
        return;
    }

    if (form.ancien_mot_de_passe === form.nouveau_mot_de_passe) {
        error.value =
            "Le nouveau mot de passe doit être différent de l’ancien.";
        return;
    }

    loading.value = true;

    try {
        const response = await api.patch(
            "/auth/change-password",
            {
                ancien_mot_de_passe: form.ancien_mot_de_passe,
                nouveau_mot_de_passe: form.nouveau_mot_de_passe,
                confirmation: form.confirmation
            }
        );

        success.value =
            response.data?.message ||
            "Votre mot de passe a été modifié avec succès.";

        form.ancien_mot_de_passe = "";
        form.nouveau_mot_de_passe = "";
        form.confirmation = "";
    } catch (err) {
        error.value =
            err.response?.data?.message ||
            "Impossible de modifier le mot de passe.";
    } finally {
        loading.value = false;
    }
}
</script>

<style scoped>
.page {
    min-height: 100%;
    padding: clamp(1rem, 4vw, 2.5rem);
}

.card {
    width: min(100%, 680px);
    margin: 0 auto;
    border: 1px solid #e2e8f0;
    border-radius: 1rem;
    background: #fff;
    padding: clamp(1.25rem, 4vw, 2rem);
    box-shadow: 0 12px 30px rgb(15 23 42 / 7%);
}

.page-header {
    margin-bottom: 1.5rem;
}

.back-link {
    display: inline-block;
    margin-bottom: 1.5rem;
    color: #2563eb;
    font-size: 0.85rem;
    font-weight: 650;
    text-decoration: none;
}

.back-link:hover {
    text-decoration: underline;
}

.eyebrow {
    margin: 0 0 0.5rem;
    color: #2563eb;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

h1 {
    margin: 0;
    color: #0f172a;
    font-size: clamp(1.6rem, 4vw, 2.1rem);
}

.description {
    color: #64748b;
    line-height: 1.6;
}

.form {
    display: grid;
    gap: 1rem;
}

.field {
    display: grid;
    gap: 0.4rem;
}

.field label {
    color: #334155;
    font-size: 0.85rem;
    font-weight: 650;
}

.field input {
    width: 100%;
    min-height: 3rem;
    border: 1px solid #cbd5e1;
    border-radius: 0.6rem;
    padding: 0.75rem 0.85rem;
    color: #0f172a;
    font: inherit;
    outline: none;
}

.field input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgb(37 99 235 / 12%);
}

.password-wrapper {
    position: relative;
}

.password-wrapper input {
    padding-right: 5.5rem;
}

.password-toggle {
    position: absolute;
    top: 50%;
    right: 0.75rem;
    transform: translateY(-50%);
    border: 0;
    background: transparent;
    color: #2563eb;
    font-size: 0.78rem;
    font-weight: 650;
    cursor: pointer;
}

.password-rules {
    display: grid;
    gap: 0.35rem;
    margin: 0;
    padding-left: 1.2rem;
    color: #64748b;
    font-size: 0.8rem;
}

.password-rules li.valid {
    color: #15803d;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.7rem;
    margin-top: 0.5rem;
}

.submit-button,
.cancel-button {
    display: inline-flex;
    min-height: 3rem;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    border-radius: 0.6rem;
    padding: 0.75rem 1rem;
    font: inherit;
    font-weight: 700;
    text-decoration: none;
}

.submit-button {
    border: 0;
    background: #2563eb;
    color: #fff;
    cursor: pointer;
}

.submit-button:hover:not(:disabled) {
    background: #1d4ed8;
}

.submit-button:disabled {
    cursor: not-allowed;
    opacity: 0.7;
}

.cancel-button {
    border: 1px solid #cbd5e1;
    color: #334155;
}

.message {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    border-radius: 0.6rem;
    padding: 0.8rem;
    font-size: 0.85rem;
    line-height: 1.45;
}

.error-message {
    border: 1px solid #fecaca;
    background: #fef2f2;
    color: #b91c1c;
}

.success-message {
    border: 1px solid #bbf7d0;
    background: #f0fdf4;
    color: #166534;
}

.message-icon,
.success-icon {
    display: inline-flex;
    width: 1.2rem;
    height: 1.2rem;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: #fff;
    font-size: 0.75rem;
    font-weight: 800;
}

.message-icon { background: #dc2626; }
.success-icon { background: #16a34a; }

.button-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid rgb(255 255 255 / 45%);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.75s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

@media (max-width: 600px) {
    .page {
        padding: 1rem;
    }

    .form-actions {
        flex-direction: column-reverse;
    }

    .form-actions > * {
        width: 100%;
    }

    .field input {
        font-size: 16px;
    }
}
</style>
