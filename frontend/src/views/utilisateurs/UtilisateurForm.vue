<template>
    <div class="page">
        <div class="page-header">
            <div class="header-left">
                <router-link to="/utilisateurs" class="back-link" aria-label="Retour à la liste">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </router-link>
                <h1>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    {{ isEdit ? "Modifier un compte utilisateur" : "Nouveau compte Agent FID" }}
                </h1>
            </div>
        </div>

        <!-- Form -->
        <form @submit.prevent="onSubmit" class="form" novalidate>

            <!-- Section: Identité -->
            <fieldset class="form-section">
                <legend>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Identité
                </legend>
                <div class="form-grid">
                    <div class="form-field">
                        <label for="nom">Nom <span class="req">*</span></label>
                        <input
                            id="nom"
                            v-model.trim="form.nom"
                            type="text"
                            required
                            placeholder="Rakoto"
                            autocomplete="off"
                        />
                    </div>
                    <div class="form-field">
                        <label for="prenom">Prénom <span class="req">*</span></label>
                        <input
                            id="prenom"
                            v-model.trim="form.prenom"
                            type="text"
                            required
                            placeholder="Jean"
                            autocomplete="off"
                        />
                    </div>
                </div>
            </fieldset>

            <!-- Section: Connexion -->
            <fieldset class="form-section">
                <legend>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Connexion
                </legend>
                <div class="form-grid">
                    <div class="form-field form-field-full">
                        <label for="email">Email <span class="req">*</span></label>
                        <input
                            id="email"
                            v-model.trim="form.email"
                            type="email"
                            required
                            placeholder="agent.fid@example.com"
                            autocomplete="off"
                        />
                    </div>
                    <div class="form-field form-field-full">
                        <label for="mot_de_passe">
                            {{ isEdit ? "Nouveau mot de passe (facultatif)" : "Mot de passe initial" }}
                            <span v-if="!isEdit" class="req">*</span>
                        </label>
                        <div class="password-wrapper">
                            <input
                                id="mot_de_passe"
                                v-model="form.mot_de_passe"
                                :type="showPassword ? 'text' : 'password'"
                                :minlength="form.mot_de_passe ? 6 : undefined"
                                :required="!isEdit"
                                :placeholder="isEdit ? 'Laisser vide pour conserver le mot de passe' : 'Minimum 6 caractères'"
                                autocomplete="new-password"
                            />
                            <button
                                type="button"
                                class="toggle-password"
                                @click="showPassword = !showPassword"
                                :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                            >
                                <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            </button>
                        </div>
                        <div class="password-strength" v-if="form.mot_de_passe">
                            <div class="strength-bar">
                                <div :class="['strength-fill', 'strength-' + strengthLevel]"></div>
                            </div>
                            <span class="strength-label">{{ strengthLabel }}</span>
                        </div>
                    </div>
                </div>
            </fieldset>

            <!-- Submit error -->
            <div v-if="error" class="alert alert-error">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{{ error }}</span>
                <button v-if="isEdit && !userLoaded" type="button" @click="loadUser">Réessayer</button>
            </div>

            <!-- Actions -->
            <div class="form-actions">
                <button type="submit" class="btn btn-primary" :disabled="saving || loading || (isEdit && !userLoaded)">
                    <svg v-if="saving" class="spinner-sm" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="31.4" stroke-dashoffset="10" stroke-linecap="round"/></svg>
                    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {{ saving ? "Enregistrement…" : isEdit ? "Enregistrer les modifications" : "Créer le compte" }}
                </button>
                <router-link to="/utilisateurs" class="btn btn-ghost">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Annuler
                </router-link>
            </div>
        </form>
    </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import utilisateurService from "../../service/utilisateur.service.js";
import { useToast } from "../../composables/useToast.js";

const router = useRouter();
const route = useRoute();
const toast = useToast();
const isEdit = computed(() => Boolean(route.params.id));
const loading = ref(false);
const userLoaded = ref(false);

const form = reactive({
    nom: "",
    prenom: "",
    email: "",
    mot_de_passe: ""
});

const saving = ref(false);
const error = ref("");
const showPassword = ref(false);

// Password strength
const strengthLevel = computed(() => {
    const p = form.mot_de_passe;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 2) return "weak";
    if (score <= 3) return "medium";
    return "strong";
});

const strengthLabel = computed(() => {
    const map = { weak: "Faible", medium: "Moyen", strong: "Fort" };
    return map[strengthLevel.value] || "";
});

async function loadUser() {
    if (!isEdit.value) return;
    loading.value = true;
    error.value = "";
    try {
        const { data } = await utilisateurService.getById(route.params.id);
        const utilisateur = data.utilisateur;
        form.nom = utilisateur.nom || "";
        form.prenom = utilisateur.prenom || "";
        form.email = utilisateur.email || "";
        userLoaded.value = true;
    } catch (e) {
        error.value = e.response?.data?.message || "Impossible de charger cet utilisateur.";
    } finally {
        loading.value = false;
    }
}

async function onSubmit() {
    if (loading.value || saving.value || (isEdit.value && !userLoaded.value)) return;
    saving.value = true;
    error.value = "";
    try {
        const payload = {
            nom: form.nom,
            prenom: form.prenom,
            email: form.email
        };
        if (form.mot_de_passe) payload.mot_de_passe = form.mot_de_passe;

        if (isEdit.value) {
            await utilisateurService.update(route.params.id, payload);
            toast.success("Utilisateur modifié avec succès.");
        } else {
            await utilisateurService.create({ ...payload, mot_de_passe: form.mot_de_passe });
            toast.success("Utilisateur créé avec succès.");
        }
        await router.push("/utilisateurs");
    } catch (e) {
        const data = e.response?.data;
        if (data?.errors && Array.isArray(data.errors)) {
            error.value = data.errors.map((item) => item.msg).join(", ");
        } else {
            error.value = data?.message || "Erreur lors de la création";
        }
    } finally {
        saving.value = false;
    }
}

onMounted(loadUser);
</script>

<style scoped>
/* ===== Base ===== */
.page {
    max-width: 560px;
    margin: 0 auto;
    padding: 1.5rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b;
}

/* ===== Header ===== */
.page-header { margin-bottom: 1.75rem; }
.header-left { display: flex; align-items: center; gap: 0.75rem; }
.back-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    color: #64748b;
    background: #f1f5f9;
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
}
.back-link:hover { background: #e2e8f0; color: #1e293b; }
.page-header h1 {
    font-size: 1.35rem;
    font-weight: 700;
    margin: 0;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

/* ===== Form sections ===== */
.form { display: flex; flex-direction: column; gap: 1.5rem; }

.form-section {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 1.25rem 1.25rem 1rem;
    margin: 0;
    background: #fff;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}

.form-section legend {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #64748b;
    padding: 0 0.5rem;
}

/* ===== Grid ===== */
.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}
@media (max-width: 540px) {
    .form-grid { grid-template-columns: 1fr; }
}
.form-field-full { grid-column: 1 / -1; }

/* ===== Fields ===== */
.form-field { display: flex; flex-direction: column; gap: 0.35rem; }

.form-field label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #475569;
}
.req { color: #dc2626; }

.form-field input {
    width: 100%;
    padding: 0.6rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.9rem;
    color: #1e293b;
    background: #fff;
    transition: border-color 0.15s, box-shadow 0.15s;
}
.form-field input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
}
.form-field input::placeholder { color: #94a3b8; }

/* ===== Password ===== */
.password-wrapper { position: relative; }
.password-wrapper input { padding-right: 2.8rem; }
.toggle-password {
    position: absolute;
    right: 0.6rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    transition: color 0.15s;
}
.toggle-password:hover { color: #475569; }

/* Password strength */
.password-strength {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.25rem;
}
.strength-bar {
    flex: 1;
    height: 4px;
    background: #e2e8f0;
    border-radius: 2px;
    overflow: hidden;
}
.strength-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s, background 0.3s;
}
.strength-weak { width: 33%; background: #ef4444; }
.strength-medium { width: 66%; background: #f59e0b; }
.strength-strong { width: 100%; background: #22c55e; }
.strength-label {
    font-size: 0.72rem;
    font-weight: 600;
    color: #64748b;
    min-width: 3.5rem;
    text-align: right;
}

/* ===== Alerts ===== */
.alert {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
}
.alert-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
}
.alert-error svg { flex-shrink: 0; margin-top: 0.1rem; }

/* ===== Actions ===== */
.form-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding-top: 0.5rem;
}

.btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1.25rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-primary {
    background: #2563eb;
    color: #fff;
}
.btn-primary:hover:not(:disabled) { background: #1d4ed8; }

.btn-ghost {
    background: transparent;
    color: #64748b;
    border: 1px solid #e2e8f0;
}
.btn-ghost:hover { background: #f8fafc; color: #334155; }

.spinner-sm { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>   