<template>
    <main class="offline-access-page">
        <section class="offline-access-card" aria-labelledby="offline-unlock-title">
            <p class="offline-eyebrow">Mode hors ligne</p>
            <h1 id="offline-unlock-title">Déverrouiller VOAMAMI</h1>
            <p class="offline-description">
                {{ profile?.user?.nom }} {{ profile?.user?.prenom }}
                <span v-if="profile?.user?.email">({{ profile.user.email }})</span>
            </p>

            <form class="offline-pin-form" @submit.prevent="unlock">
                <label for="offline-pin">Code PIN de cette tablette</label>
                <input
                    id="offline-pin"
                    v-model="pin"
                    inputmode="numeric"
                    autocomplete="current-password"
                    pattern="[0-9]{6}"
                    maxlength="6"
                    type="password"
                    required
                    autofocus
                />
                <p v-if="error" class="offline-error" role="alert">{{ error }}</p>
                <button class="offline-primary" type="submit" :disabled="unlocking">
                    {{ unlocking ? "Vérification…" : "Ouvrir mon espace" }}
                </button>
                <router-link v-if="online" to="/login" class="online-login">
                    Se connecter en ligne
                </router-link>
            </form>
            <p class="offline-note">
                Les opérations enregistrées hors ligne seront synchronisées
                après une reconnexion à votre compte.
            </p>
        </section>
    </main>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth.store.js";
import { loadOfflineProfile } from "../../offline/offline-security.js";

const auth = useAuthStore();
const router = useRouter();
const profile = ref(null);
const pin = ref("");
const error = ref("");
const unlocking = ref(false);
const online = ref(navigator.onLine);
const updateConnection = () => { online.value = navigator.onLine; };

onMounted(async () => {
    profile.value = await loadOfflineProfile();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
});

onBeforeUnmount(() => {
    window.removeEventListener("online", updateConnection);
    window.removeEventListener("offline", updateConnection);
});

async function unlock() {
    error.value = "";
    unlocking.value = true;
    try {
        await auth.unlockOffline(pin.value);
        await router.replace("/");
    } catch (unlockError) {
        error.value = unlockError.message || "Impossible d’ouvrir l’espace hors ligne.";
    } finally {
        unlocking.value = false;
    }
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

.offline-primary {
    min-height: 2.8rem;
    margin-top: 0.4rem;
    border: 0;
    border-radius: 0.5rem;
    padding: 0.65rem 0.9rem;
    background: #2563eb;
    color: #fff;
    font: inherit;
    font-weight: 650;
}

.offline-error {
    color: #dc2626;
}

.online-login {
    color: var(--voa-primary);
    text-align: center;
    text-decoration: underline;
}

.offline-note {
    margin: 1rem 0 0;
    font-size: 0.78rem;
}
</style>
