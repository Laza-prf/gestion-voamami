<template>
    <main class="auth-page">
        <button
            type="button"
            class="theme-toggle"
            :aria-label="isDark ? 'Activer le mode clair' : 'Activer le mode sombre'"
            :title="isDark ? 'Mode clair' : 'Mode sombre'"
            @click="toggleTheme"
        >
            <svg v-if="isDark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
            </svg>
            <span>{{ isDark ? "Mode clair" : "Mode sombre" }}</span>
        </button>

        <section class="auth-card" aria-labelledby="login-title">
            <div class="auth-brand" aria-label="VOAMAMI">
                <img class="brand-background" :src="fidLogo" alt="" aria-hidden="true" />

                <div class="brand-message">
                    <p class="brand-kicker">Gestion solidaire</p>
                    <h2>Ensemble, faisons grandir nos communautés.</h2>
                    <p>
                        Un espace simple et sécurisé pour suivre l’épargne,
                        les crédits et les activités de votre groupe.
                    </p>
                    <div class="brand-points" aria-label="Fonctionnalités">
                        <span><i aria-hidden="true">✓</i> Suivi des opérations</span>
                        <span><i aria-hidden="true">✓</i> Gestion des groupes</span>
                    </div>
                </div>

                <p class="brand-footer">Votre gestion, en toute confiance.</p>
            </div>

            <div class="auth-content">
                <div class="auth-heading">
                    <p class="eyebrow">Connexion à votre espace</p>
                    <h1 id="login-title">Bon retour parmi nous</h1>
                    <p>
                        Entrez vos identifiants pour continuer.
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
                            placeholder="exemple@gmail.com"
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
                            placeholder="Entrez votre mot de passe"
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
                        <svg v-if="!loading" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path d="M5 12h14m-7-7 7 7-7 7" />
                        </svg>
                    </button>

                    <router-link to="/mot-de-passe-oublie" class="forgot-password">
                        Mot de passe oublié ?
                    </router-link>
                </form>
            </div>
        </section>
        <p class="page-footer">© {{ new Date().getFullYear() }} VOAMAMI · Accès réservé aux utilisateurs autorisés</p>
    </main>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth.store.js";
import fidLogo from "../../assets/images/FID-1.png";

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const showPassword = ref(false);
const isDark = ref(document.documentElement.classList.contains("dark"));

const router = useRouter();
const auth = useAuthStore();

function toggleTheme() {
    isDark.value = !isDark.value;
    document.documentElement.classList.toggle("dark", isDark.value);
    localStorage.setItem("theme", isDark.value ? "dark" : "light");
}

async function onLogin() {
    error.value = "";

    if (!email.value || !password.value) {
        error.value = "Veuillez renseigner votre email et votre mot de passe.";
        return;
    }

    loading.value = true;

    try {
        await auth.login(email.value, password.value);
        await router.push(
            auth.offlinePinSetupRequired ? "/offline-access" : "/"
        );
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
    position: relative;
    display: flex;
    min-height: 100vh;
    align-items: center;
    justify-content: center;
    padding: 5rem 1.5rem 3.5rem;
    background:
        radial-gradient(circle at 10% 12%, rgb(219 234 254 / 0.8), transparent 32%),
        radial-gradient(circle at 90% 90%, rgb(224 231 255 / 0.7), transparent 35%),
        #f1f5f9;
}

.theme-toggle {
    position: absolute;
    top: 1.25rem;
    right: 1.5rem;
    display: inline-flex;
    min-height: 2.6rem;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border: 1px solid #dbe3ee;
    border-radius: 0.7rem;
    background: rgb(255 255 255 / 82%);
    padding: 0.55rem 0.8rem;
    color: #334155;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 650;
    cursor: pointer;
    transition: background 150ms ease, border-color 150ms ease, transform 150ms ease;
}

.theme-toggle:hover {
    transform: translateY(-1px);
    border-color: #94a3b8;
    background: #fff;
}

.theme-toggle:focus-visible {
    outline: 3px solid rgb(37 99 235 / 30%);
    outline-offset: 2px;
}

.auth-card {
    width: min(100%, 1020px);
    min-height: 610px;
    display: grid;
    grid-template-columns: 0.92fr 1.08fr;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    border-radius: 1.4rem;
    background: #ffffff;
    box-shadow: 0 28px 80px rgb(15 23 42 / 0.14);
}

.auth-brand {
    position: relative;
    isolation: isolate;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: space-between;
    gap: 2rem;
    overflow: hidden;
    padding: 2.5rem;
    background: #f8fafc;
    color: #0f172a;
}

.brand-background {
    position: absolute;
    z-index: -2;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
}

.auth-brand::before {
    position: absolute;
    z-index: -1;
    inset: 0;
    background:
        linear-gradient(180deg, rgb(255 255 255 / 28%) 0%, rgb(255 255 255 / 42%) 42%, rgb(255 255 255 / 84%) 100%),
        linear-gradient(90deg, rgb(255 255 255 / 18%), transparent 75%);
    content: "";
}

.brand-message {
    max-width: 24rem;
    margin: auto 0;
    text-shadow: 0 1px 10px rgb(255 255 255 / 80%);
}

.brand-kicker {
    margin: 0 0 0.85rem;
    color: #1d4ed8;
    font-size: 0.75rem;
    font-weight: 750;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}

.brand-message h2 {
    max-width: 22rem;
    margin: 0;
    color: #0f172a;
    font-size: clamp(2rem, 3.2vw, 2.7rem);
    font-weight: 750;
    letter-spacing: -0.045em;
    line-height: 1.12;
}

.brand-message > p:not(.brand-kicker) {
    max-width: 23rem;
    margin: 1rem 0 0;
    color: #334155;
    font-size: 0.95rem;
    line-height: 1.7;
}

.brand-points {
    display: grid;
    gap: 0.75rem;
    margin-top: 1.75rem;
    color: #1e293b;
    font-size: 0.84rem;
}

.brand-points span {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.brand-points i {
    display: grid;
    width: 1.3rem;
    height: 1.3rem;
    place-items: center;
    border-radius: 50%;
    background: rgb(37 99 235 / 14%);
    color: #1d4ed8;
    font-size: 0.75rem;
    font-style: normal;
    font-weight: 800;
}

.brand-footer {
    margin: 0;
    color: #475569;
    font-size: 0.75rem;
    letter-spacing: 0.02em;
}

.auth-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 3rem clamp(2rem, 5vw, 4.5rem);
}

.auth-heading {
    margin-bottom: 2.25rem;
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
    font-size: clamp(1.7rem, 3vw, 2.15rem);
    font-weight: 750;
    letter-spacing: -0.04em;
    line-height: 1.2;
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
    gap: 1.2rem;
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
    min-height: 3.25rem;
    border: 1px solid #cbd5e1;
    border-radius: 0.7rem;
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

.forgot-password {
    display: block;
    margin-top: 0.85rem;
    color: #2563eb;
    font-size: 0.85rem;
    font-weight: 650;
    text-align: center;
    text-decoration: none;
}

.forgot-password:hover {
    color: #1d4ed8;
    text-decoration: underline;
}



.submit-button {
    display: inline-flex;
    width: 100%;
    min-height: 3.25rem;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    border: 0;
    border-radius: 0.7rem;
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

.page-footer {
    position: absolute;
    right: 1rem;
    bottom: 1rem;
    left: 1rem;
    margin: 0;
    color: #64748b;
    font-size: 0.75rem;
    text-align: center;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

:global(html.dark .auth-page) {
    background:
        radial-gradient(circle at 15% 10%, rgb(30 58 138 / 0.35), transparent 34%),
        radial-gradient(circle at 90% 85%, rgb(49 46 129 / 0.3), transparent 36%),
        #0b1220;
}

:global(html.dark .theme-toggle) {
    border-color: #334155;
    background: #151e2e;
    color: #e2e8f0;
}

:global(html.dark .theme-toggle:hover) {
    border-color: #64748b;
    background: #1e293b;
}

:global(html.dark .auth-card) {
    border-color: #2b374a;
    background: #151e2e;
}

:global(html.dark .auth-content) {
    background: #151e2e;
}

:global(html.dark .auth-brand) {
    background: #0f172a;
    color: #fff;
}

:global(html.dark .auth-brand::before) {
    background:
        linear-gradient(180deg, rgb(8 15 35 / 28%) 0%, rgb(8 15 35 / 42%) 40%, rgb(8 15 35 / 72%) 100%),
        linear-gradient(90deg, rgb(8 15 35 / 18%), transparent 70%);
}

:global(html.dark .brand-message) {
    text-shadow: 0 2px 12px rgb(2 6 23 / 65%);
}

:global(html.dark .brand-kicker) {
    color: #93c5fd;
}

:global(html.dark .brand-message h2) {
    color: #fff;
}

:global(html.dark .brand-message > p:not(.brand-kicker)) {
    color: #cbd5e1;
}

:global(html.dark .brand-points) {
    color: #e2e8f0;
}

:global(html.dark .brand-points i) {
    background: rgb(96 165 250 / 18%);
    color: #93c5fd;
}

:global(html.dark .brand-footer) {
    color: #94a3b8;
}

:global(html.dark .auth-heading h1),
:global(html.dark .field label),
:global(html.dark .field-label-row label) {
    color: #e5eaf2;
}

:global(html.dark .auth-heading p:last-child) {
    color: #9aa8bb;
}

:global(html.dark .field input) {
    border-color: #3b4960;
    background: #111a29;
    color: #e5eaf2;
}

:global(html.dark .field input:disabled) {
    background: #1b2637;
}

:global(html.dark .password-toggle),
:global(html.dark .forgot-password) {
    color: #93c5fd;
}

:global(html.dark .page-footer) {
    color: #94a3b8;
}

@media (max-width: 720px) {
    .auth-page {
        min-height: 100vh;
        min-height: 100svh;
        align-items: stretch;
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
        min-height: 17rem;
        gap: 1.5rem;
        padding: 1.25rem 1.5rem 1.5rem;
    }

    .brand-message {
        margin: auto 0 0;
    }

    .brand-message h2 {
        max-width: 30rem;
        font-size: clamp(1.45rem, 6vw, 2rem);
    }

    .brand-message > p:not(.brand-kicker),
    .brand-points,
    .brand-footer {
        display: none;
    }

    .auth-content {
        justify-content: center;
        padding: 2rem clamp(1.25rem, 7vw, 2.5rem) 4rem;
    }

    .auth-heading {
        margin-bottom: 1.75rem;
    }

    h1 {
        font-size: clamp(1.65rem, 6vw, 2rem);
    }

    /* Empêche le zoom automatique iOS sur les champs (nécessite font-size >= 16px) */
    .field input {
        font-size: 16px;
        min-height: 2.9rem;
    }

    .theme-toggle {
        z-index: 2;
        top: 1rem;
        right: 1rem;
        min-height: 2.4rem;
        border-color: rgb(203 213 225 / 85%);
        background: rgb(255 255 255 / 86%);
        color: #1e293b;
        backdrop-filter: blur(8px);
    }

    .theme-toggle:hover {
        background: #fff;
    }

    :global(html.dark .theme-toggle) {
        border-color: rgb(255 255 255 / 25%);
        background: rgb(15 23 42 / 55%);
        color: #fff;
    }

    :global(html.dark .theme-toggle:hover) {
        background: rgb(15 23 42 / 70%);
    }

    .page-footer {
        bottom: 0.75rem;
        font-size: 0.68rem;
    }
}

/* Très petits écrans (iPhone SE et similaires) */
@media (max-width: 380px) {
    .auth-content {
        padding: 1.5rem 1rem 3.5rem;
    }

    .eyebrow {
        font-size: 0.68rem;
    }

    h1 {
        font-size: 1.4rem;
    }

    .submit-button,
    .field input {
        min-height: 2.9rem;
    }

    .theme-toggle {
        width: 2.4rem;
        padding: 0;
    }

    .theme-toggle span {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
    }
}
</style>
