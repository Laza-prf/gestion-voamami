<template>
    <main class="offline-access-page">
        <section class="offline-access-card" aria-labelledby="offline-setup-title">
            <p class="offline-eyebrow">Accès tablette</p>
            <h1 id="offline-setup-title">Préparer l’accès hors ligne</h1>
            <p class="offline-description">
                Créez un code PIN local pour rouvrir votre espace sur cette tablette
                sans réseau. Il ne remplace pas votre mot de passe VOAMAMI.
            </p>

            <form class="offline-pin-form" @submit.prevent="savePin">
                <label for="offline-pin">Code PIN (6 chiffres)</label>
                <input
                    id="offline-pin"
                    v-model="pin"
                    inputmode="numeric"
                    autocomplete="new-password"
                    pattern="[0-9]{6}"
                    maxlength="6"
                    type="password"
                    required
                />
                <label for="offline-pin-confirm">Confirmer le code PIN</label>
                <input
                    id="offline-pin-confirm"
                    v-model="confirmation"
                    inputmode="numeric"
                    autocomplete="new-password"
                    pattern="[0-9]{6}"
                    maxlength="6"
                    type="password"
                    required
                />

                <p v-if="error" class="offline-error" role="alert">{{ error }}</p>
                <button class="offline-primary" type="submit" :disabled="saving">
                    {{ saving ? "Enregistrement…" : "Activer l’accès hors ligne" }}
                </button>
                <button class="offline-secondary" type="button" @click="continueOnline">
                    Continuer sans accès hors ligne
                </button>
            </form>

            <p class="offline-note">
                Les données restent stockées dans le navigateur de cette tablette.
                Utilisez un code que les autres utilisateurs ne connaissent pas.
            </p>
        </section>
    </main>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth.store.js";

const auth = useAuthStore();
const router = useRouter();
const pin = ref("");
const confirmation = ref("");
const error = ref("");
const saving = ref(false);

async function savePin() {
    error.value = "";
    if (!/^\d{6}$/.test(pin.value)) {
        error.value = "Le code PIN doit contenir exactement 6 chiffres.";
        return;
    }
    if (pin.value !== confirmation.value) {
        error.value = "Les deux codes PIN ne correspondent pas.";
        return;
    }

    saving.value = true;
    try {
        await auth.configureOfflineAccess(pin.value);
        await router.replace("/");
    } catch (saveError) {
        error.value = saveError.message || "Impossible d’activer l’accès hors ligne.";
    } finally {
        saving.value = false;
    }
}

async function continueOnline() {
    auth.skipOfflineAccessSetup();
    await router.replace("/");
}
</script>

<style scoped>
.offline-access-page {
    display: grid;
    min-height: 100vh;
    place-items: center;
    padding: 1.25rem;
    background: var(--voa-bg);
    color: var(--voa-text);
}

.offline-access-card {
    width: min(100%, 30rem);
    padding: 2rem;
    border: 1px solid var(--voa-border);
    border-radius: 1rem;
    background: var(--voa-surface);
    box-shadow: 0 16px 40px rgb(15 23 42 / 10%);
}

.offline-eyebrow {
    margin: 0 0 0.5rem;
    color: var(--voa-primary);
    font-size: 0.75rem;
    font-weight: 750;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

h1 {
    margin: 0;
    font-size: 1.5rem;
}

.offline-description,
.offline-note {
    color: var(--voa-muted);
    line-height: 1.5;
}

.offline-pin-form {
    display: grid;
    gap: 0.7rem;
    margin-top: 1.25rem;
}

.offline-pin-form label {
    font-weight: 650;
}

.offline-pin-form input {
    min-height: 3rem;
    padding: 0.65rem 0.75rem;
    border: 1px solid var(--voa-border);
    border-radius: 0.5rem;
    background: var(--voa-bg);
    color: var(--voa-text);
    font: inherit;
    letter-spacing: 0.3em;
}

.offline-primary,
.offline-secondary {
    min-height: 2.8rem;
    border: 0;
    border-radius: 0.5rem;
    padding: 0.65rem 0.9rem;
    font: inherit;
    font-weight: 650;
}

.offline-primary {
    margin-top: 0.4rem;
    background: #2563eb;
    color: #fff;
}

.offline-secondary {
    background: transparent;
    color: var(--voa-muted);
}

.offline-error {
    color: #dc2626;
}

.offline-note {
    margin: 1rem 0 0;
    font-size: 0.78rem;
}
</style>
