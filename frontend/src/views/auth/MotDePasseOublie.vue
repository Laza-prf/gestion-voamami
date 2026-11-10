<template>
    <main class="auth-page">
        <section class="auth-card" aria-labelledby="forgot-title">
            <div class="auth-brand">
                <span class="brand-mark">V</span>
                <span class="brand-name">VOAMAMI</span>
            </div>

            <div class="auth-content">
                <router-link to="/login" class="back-link">
                    ← Retour à la connexion
                </router-link>

                <div class="auth-heading">
                    <p class="eyebrow">Récupération du compte</p>
                    <h1 id="forgot-title">Mot de passe oublié ?</h1>
                    <p>
                        Saisissez l’adresse e-mail associée à votre compte.
                        Si elle correspond à un utilisateur actif, un lien
                        sécurisé vous sera envoyé.
                    </p>
                </div>

                <form
                    v-if="!submitted"
                    class="auth-form"
                    @submit.prevent="submit"
                    novalidate
                >
                    <div class="field">
                        <label for="email">Adresse e-mail</label>
                        <input
                            id="email"
                            v-model.trim="email"
                            type="email"
                            autocomplete="email"
                            placeholder="exemple@gmail.com"
                            :disabled="loading"
                            required
                        />
                    </div>

                    <div v-if="error" class="message error-message" role="alert">
                        <span class="message-icon">!</span>
                        <span>{{ error }}</span>
                    </div>

                    <button
                        type="submit"
                        class="submit-button"
                        :disabled="loading"
                    >
                        <span v-if="loading" class="button-spinner"></span>
                        {{ loading ? "Envoi en cours..." : "Envoyer le lien" }}
                    </button>
                </form>

                <div v-else class="message success-message" role="status">
                    <span class="success-icon">✓</span>
                    <div>
                        <strong>Demande prise en compte</strong>
                        <p>
                            Si cette adresse correspond à un compte actif,
                            un lien de réinitialisation a été envoyé. Vérifiez
                            également vos courriers indésirables.
                        </p>
                    </div>
                </div>

                <router-link
                    v-if="submitted"
                    to="/login"
                    class="secondary-button"
                >
                    Retour à la connexion
                </router-link>

                <p class="security-note">
                    Pour votre sécurité, le système ne confirme jamais si une
                    adresse e-mail existe dans l’application.
                </p>
            </div>
        </section>
    </main>
</template>

<script setup>
import { ref } from "vue";
import api from "../../service/api.js";

const email = ref("");
const loading = ref(false);
const submitted = ref(false);
const error = ref("");

async function submit() {
    error.value = "";

    if (!email.value) {
        error.value = "Veuillez saisir votre adresse e-mail.";
        return;
    }

    loading.value = true;

    try {
        await api.post("/auth/forgot-password", {
            email: email.value
        });

        submitted.value = true;
    } catch (err) {
        error.value =
            err.response?.data?.message ||
            "Impossible d’envoyer la demande. Veuillez réessayer.";
    } finally {
        loading.value = false;
    }
}
</script>

<style scoped>
.auth-page {
    display: flex;
    min-height: 100vh;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    background:
        radial-gradient(circle at 15% 10%, rgb(219 234 254 / 80%), transparent 34%),
        radial-gradient(circle at 90% 85%, rgb(224 231 255 / 75%), transparent 36%),
        #f8fafc;
}

.auth-card {
    width: min(100%, 980px);
    overflow: hidden;
    border: 1px solid #e2e8f0;
    border-radius: 1.25rem;
    background: #fff;
    box-shadow: 0 24px 70px rgb(15 23 42 / 12%);
}

.auth-brand {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 1.4rem 2.25rem;
    background: #0f172a;
    color: #fff;
}

.brand-mark {
    display: inline-flex;
    width: 2.2rem;
    height: 2.2rem;
    align-items: center;
    justify-content: center;
    border-radius: 0.65rem;
    background: #2563eb;
    font-weight: 800;
}

.brand-name {
    font-size: 0.95rem;
    font-weight: 750;
    letter-spacing: 0.12em;
}

.auth-content {
    max-width: 620px;
    margin: 0 auto;
    padding: 2rem clamp(1.25rem, 6vw, 5rem) 2.5rem;
}

.back-link {
    display: inline-block;
    margin-bottom: 2rem;
    color: #2563eb;
    font-size: 0.85rem;
    font-weight: 650;
    text-decoration: none;
}

.back-link:hover,
.forgot-link:hover {
    text-decoration: underline;
}

.auth-heading {
    margin-bottom: 1.7rem;
}

.eyebrow {
    margin: 0 0 0.55rem;
    color: #2563eb;
    font-size: 0.75rem;
    font-weight: 750;
    letter-spacing: 0.09em;
    text-transform: uppercase;
}

h1 {
    margin: 0;
    color: #0f172a;
    font-size: clamp(1.8rem, 4vw, 2.4rem);
    letter-spacing: -0.035em;
}

.auth-heading p:last-child {
    margin: 0.7rem 0 0;
    color: #64748b;
    font-size: 0.95rem;
    line-height: 1.6;
}

.auth-form {
    display: grid;
    gap: 1.15rem;
}

.field {
    display: grid;
    gap: 0.45rem;
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

.submit-button,
.secondary-button {
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

.secondary-button {
    width: 100%;
    margin-top: 1rem;
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

.success-message p {
    margin: 0.4rem 0 0;
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

.message-icon {
    background: #dc2626;
}

.success-icon {
    background: #16a34a;
}

.security-note {
    margin: 1.4rem 0 0;
    color: #94a3b8;
    font-size: 0.75rem;
    line-height: 1.5;
    text-align: center;
}

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
    .auth-page {
        padding: 0;
        align-items: stretch;
    }

    .auth-card {
        min-height: 100vh;
        min-height: 100svh;
        border: 0;
        border-radius: 0;
    }

    .auth-brand {
        padding: 1.25rem 1.5rem;
    }

    .auth-content {
        padding: 2rem 1.25rem;
    }

    .field input {
        font-size: 16px;
    }
}
</style>
