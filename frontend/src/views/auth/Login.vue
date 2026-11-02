<template>
    <main class="auth-page">
        <section class="auth-card" aria-labelledby="login-title">
            <div class="auth-brand" aria-label="VOAMAMI">
                <span class="brand-mark">V</span>
                <span class="brand-name">VOAMAMI</span>
            </div>

            <div class="auth-content">
                <div class="auth-heading">
                    <p class="eyebrow">Espace sécurisé</p>
                    <h1 id="login-title">Bienvenue</h1>
                    <p>
                        Connectez-vous pour gérer les opérations d'épargne et de crédit.
                    </p>
                </div>

                <form class="login-form" @submit.prevent="onLogin" novalidate>
                    <div class="field">
                        <label for="email">Email</label>
                        <input
                            id="email"
                            v-model.trim="email"
                            type="email"
                            autocomplete="email"
                            placeholder="exemple@voamami.mg"
                            :disabled="loading"
                            required
                        />
                    </div>

                    <div class="field">
                        <div class="field-label-row">
                            <label for="password">Mot de passe</label>
                            <button
                                type="button"
                                class="password-toggle"
                                :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                                @click="showPassword = !showPassword"
                            >
                                {{ showPassword ? "Masquer" : "Afficher" }}
                            </button>
                        </div>

                        <input
                            id="password"
                            v-model="password"
                            :type="showPassword ? 'text' : 'password'"
                            autocomplete="current-password"
                            placeholder="Votre mot de passe"
                            :disabled="loading"
                            required
                        />
                    </div>

                    <div v-if="error" class="error-message" role="alert">
                        <span class="error-icon">!</span>
                        <span>{{ error }}</span>
                    </div>

                    <button
                        type="submit"
                        class="submit-button"
                        :disabled="loading"
                    >
                        <span v-if="loading" class="button-spinner"></span>
                        {{ loading ? "Connexion..." : "Se connecter" }}
                    </button>
                </form>

                <p class="security-note">
                    Accès réservé aux utilisateurs autorisés.
                </p>
            </div>

            <footer class="auth-footer">
                FID Toliara · Gestion des AVEC
            </footer>
        </section>
    </main>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth.store.js";

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const showPassword = ref(false);

const router = useRouter();
const auth = useAuthStore();

async function onLogin() {
    error.value = "";

    if (!email.value || !password.value) {
        error.value = "Veuillez renseigner votre email et votre mot de passe.";
        return;
    }

    loading.value = true;

    try {
        await auth.login(email.value, password.value);
        await router.push("/");
    } catch (e) {
        error.value =
            e.response?.data?.message ||
            "Email ou mot de passe incorrect.";
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
        radial-gradient(circle at 15% 10%, rgb(219 234 254 / 0.8), transparent 34%),
        radial-gradient(circle at 90% 85%, rgb(224 231 255 / 0.75), transparent 36%),
        #f8fafc;
}

.auth-card {
    width: min(100%, 980px);
    min-height: 590px;
    display: grid;
    grid-template-columns: 0.9fr 1.1fr;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    border-radius: 1.25rem;
    background: #ffffff;
    box-shadow: 0 24px 70px rgb(15 23 42 / 0.12);
}

.auth-brand {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 2rem 2.25rem;
    background: #0f172a;
    color: #ffffff;
}

.brand-mark {
    display: inline-flex;
    width: 2.2rem;
    height: 2.2rem;
    align-items: center;
    justify-content: center;
    border-radius: 0.65rem;
    background: #2563eb;
    font-size: 1.1rem;
    font-weight: 800;
}

.brand-name {
    font-size: 0.95rem;
    font-weight: 750;
    letter-spacing: 0.12em;
}

.auth-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 2rem clamp(1.5rem, 6vw, 5rem);
}

.auth-heading {
    margin-bottom: 2rem;
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
    font-weight: 750;
    letter-spacing: -0.035em;
}

.auth-heading p:last-child {
    max-width: 30rem;
    margin: 0.7rem 0 0;
    color: #64748b;
    font-size: 0.95rem;
    line-height: 1.6;
}

.login-form {
    display: grid;
    gap: 1.15rem;
}

.field {
    display: grid;
    gap: 0.45rem;
}

.field label,
.field-label-row label {
    color: #334155;
    font-size: 0.85rem;
    font-weight: 650;
}

.field-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.field input {
    width: 100%;
    min-height: 3rem;
    border: 1px solid #cbd5e1;
    border-radius: 0.6rem;
    background: #ffffff;
    padding: 0.75rem 0.85rem;
    color: #0f172a;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 150ms ease, box-shadow 150ms ease;
}

.field input::placeholder {
    color: #94a3b8;
}

.field input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgb(37 99 235 / 0.12);
}

.field input:disabled {
    cursor: not-allowed;
    background: #f8fafc;
}

.password-toggle {
    border: 0;
    background: transparent;
    padding: 0;
    color: #2563eb;
    font-size: 0.78rem;
    font-weight: 650;
    cursor: pointer;
}

.password-toggle:hover {
    color: #1d4ed8;
    text-decoration: underline;
}

.error-message {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    border: 1px solid #fecaca;
    border-radius: 0.6rem;
    background: #fef2f2;
    padding: 0.75rem;
    color: #b91c1c;
    font-size: 0.82rem;
    line-height: 1.4;
}

.error-icon {
    display: inline-flex;
    width: 1.15rem;
    height: 1.15rem;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #dc2626;
    color: #ffffff;
    font-size: 0.75rem;
    font-weight: 800;
}

.submit-button {
    display: inline-flex;
    min-height: 3rem;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    border: 0;
    border-radius: 0.6rem;
    background: #2563eb;
    padding: 0.75rem 1rem;
    color: #ffffff;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 150ms ease, transform 150ms ease;
}

.submit-button:hover:not(:disabled) {
    background: #1d4ed8;
    transform: translateY(-1px);
}

.submit-button:disabled {
    cursor: not-allowed;
    opacity: 0.7;
}

.button-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid rgb(255 255 255 / 0.45);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.75s linear infinite;
}

.security-note {
    margin: 1.25rem 0 0;
    color: #94a3b8;
    font-size: 0.75rem;
    text-align: center;
}

.auth-footer {
    grid-column: 1;
    grid-row: 2;
    padding: 1rem 2.25rem 1.5rem;
    background: #0f172a;
    color: #94a3b8;
    font-size: 0.75rem;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

:global(html.dark) .auth-page {
    background:
        radial-gradient(circle at 15% 10%, rgb(30 58 138 / 0.35), transparent 34%),
        radial-gradient(circle at 90% 85%, rgb(49 46 129 / 0.3), transparent 36%),
        #0b1220;
}

:global(html.dark) .auth-card {
    border-color: #2b374a;
    background: #151e2e;
}

:global(html.dark) .auth-content {
    background: #151e2e;
}

:global(html.dark) .auth-heading h1,
:global(html.dark) .field label,
:global(html.dark) .field-label-row label {
    color: #e5eaf2;
}

:global(html.dark) .auth-heading p:last-child {
    color: #9aa8bb;
}

:global(html.dark) .field input {
    border-color: #3b4960;
    background: #111a29;
    color: #e5eaf2;
}

:global(html.dark) .field input:disabled {
    background: #1b2637;
}

@media (max-width: 720px) {
    .auth-page {
        padding: 0;
    }

    .auth-card {
        min-height: 100vh;
        min-height: 100svh;
        grid-template-columns: 1fr;
        border: 0;
        border-radius: 0;
    }

    .auth-brand {
        padding: 1.25rem 1.5rem;
    }

    .brand-mark {
        width: 1.9rem;
        height: 1.9rem;
        font-size: 1rem;
    }

    .auth-content {
        justify-content: flex-start;
        padding: 2rem 1.25rem 1.5rem;
    }

    .auth-heading {
        margin-bottom: 1.5rem;
    }

    h1 {
        font-size: 1.6rem;
    }

    /* Empêche le zoom automatique iOS sur les champs (nécessite font-size >= 16px) */
    .field input {
        font-size: 16px;
        min-height: 2.9rem;
    }

    .auth-footer {
        grid-row: auto;
        padding: 1.25rem;
        text-align: center;
    }
}

/* Très petits écrans (iPhone SE et similaires) */
@media (max-width: 380px) {
    .auth-content {
        padding: 1.5rem 1rem 1.25rem;
    }

    .eyebrow {
        font-size: 0.68rem;
    }

    h1 {
        font-size: 1.4rem;
    }

    .submit-button,
    .field input {
        min-height: 2.75rem;
    }
}
</style>
