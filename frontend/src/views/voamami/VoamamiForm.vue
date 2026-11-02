<template>
    <div class="page">
        <div class="page-header">
            <div class="header-left">
                <router-link to="/voamami" class="back-link" aria-label="Retour à la liste">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </router-link>
                <h1>
                    <svg v-if="!isEdit" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                    {{ isEdit ? "Modifier le groupe" : "Nouveau groupe" }} VOAMAMI
                </h1>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loadingForm" class="state-block">
            <div class="spinner"></div>
            <p>Chargement…</p>
        </div>

        <!-- Error global -->
        <div v-else-if="loadError" class="alert alert-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{{ loadError }}</span>
            <button class="btn-link" @click="loadForm()">Réessayer</button>
        </div>

        <!-- Form -->
        <form v-else @submit.prevent="onSubmit" class="form" novalidate>

            <!-- Section: Identification -->
            <fieldset class="form-section">
                <legend>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>
                    Identification
                </legend>
                <div class="form-grid">
                    <div class="form-field">
                        <label for="code">Code <span class="req">*</span></label>
                        <input
                            id="code"
                            v-model.trim="form.code"
                            type="text"
                            placeholder="VOA-001"
                            required
                            autocomplete="off"
                        />
                    </div>
                    <div class="form-field">
                        <label for="nom">Nom du groupe <span class="req">*</span></label>
                        <input
                            id="nom"
                            v-model.trim="form.nom"
                            type="text"
                            placeholder="Groupe VOAMAMI de…"
                            required
                            autocomplete="off"
                        />
                    </div>
                </div>
            </fieldset>

            <!-- Section: Localisation -->
            <fieldset class="form-section">
                <legend>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    Localisation
                </legend>
                <div class="form-grid">
                    <div class="form-field">
                        <label for="fokontany">Fokontany</label>
                        <input id="fokontany" v-model.trim="form.fokontany" type="text" autocomplete="off" />
                    </div>
                    <div class="form-field">
                        <label for="commune">Commune</label>
                        <input id="commune" v-model.trim="form.commune" type="text" autocomplete="off" />
                    </div>
                    <div class="form-field">
                        <label for="district">District</label>
                        <input id="district" v-model.trim="form.district" type="text" autocomplete="off" />
                    </div>
                    <div class="form-field">
                        <label for="region">Région</label>
                        <input id="region" v-model.trim="form.region" type="text" autocomplete="off" />
                    </div>
                </div>
            </fieldset>

            <!-- Section: Paramètres -->
            <fieldset class="form-section">
                <legend>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    Paramètres
                </legend>
                <div class="form-grid">
                    <div class="form-field">
                        <label for="date_creation">Date de création <span class="req">*</span></label>
                        <input
                            id="date_creation"
                            v-model="form.date_creation"
                            type="date"
                            required
                            :max="todayStr"
                        />
                    </div>
                    <div class="form-field">
                        <label for="statut">Statut</label>
                        <div class="select-wrapper">
                            <select id="statut" v-model="form.statut">
                                <option value="ACTIF">Actif</option>
                                <option value="INACTIF">Inactif</option>
                            </select>
                            <svg class="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                    </div>
                </div>
            </fieldset>

            <!-- Section: Agent (admin only) -->
            <fieldset v-if="isAdmin" class="form-section">
                <legend>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Agent responsable
                </legend>
                <div class="form-field">
                    <label for="agent">Agent FID</label>
                    <div class="select-wrapper">
                        <select id="agent" v-model="form.agent_responsable_id">
                            <option :value="null">— Aucun agent assigné —</option>
                            <option
                                v-for="agent in agents"
                                :key="agent.id"
                                :value="agent.id"
                            >
                                {{ agent.nom }} {{ agent.prenom }} — {{ agent.email }}
                            </option>
                        </select>
                        <svg class="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                    <p v-if="agents.length === 0" class="field-hint warning-hint">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        Aucun agent FID disponible.
                    </p>
                </div>
            </fieldset>

            <!-- Submit error -->
            <div v-if="error" class="alert alert-error">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{{ error }}</span>
            </div>

            <!-- Actions -->
            <div class="form-actions">
                <button type="submit" class="btn btn-primary" :disabled="saving">
                    <svg v-if="saving" class="spinner-sm" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="31.4" stroke-dashoffset="10" stroke-linecap="round"/></svg>
                    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {{ saving ? "Enregistrement…" : (isEdit ? "Mettre à jour" : "Créer le groupe") }}
                </button>
                <router-link to="/voamami" class="btn btn-ghost">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Annuler
                </router-link>
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth.store.js";
import voamamiService from "../../service/voamami.service.js";
import api from "../../service/api.js";
import { useToast } from "../../composables/useToast.js";



const route = useRoute();
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

const isEdit = computed(() => Boolean(route.params.id));
const isAdmin = computed(() => authStore.user?.role === "ADMINISTRATEUR");

const todayStr = computed(() => new Date().toISOString().slice(0, 10));

const form = reactive({
    code: "",
    nom: "",
    fokontany: "",
    commune: "",
    district: "",
    region: "",
    date_creation: "",
    statut: "ACTIF",
    agent_responsable_id: null
});

const agents = ref([]);
const saving = ref(false);
const error = ref("");
const loadingForm = ref(false);
const loadError = ref("");

async function loadForm() {
    loadingForm.value = true;
    loadError.value = "";
    try {
        if (isAdmin.value) {
            const { data } = await api.get("/users?role=AGENT_FID");
            agents.value = data.utilisateurs ?? [];
        }
        if (isEdit.value) {
            const { data } = await voamamiService.getById(route.params.id);
            const d = data.data ?? data.voamami ?? data;
            Object.assign(form, d);
            if (form.date_creation) {
                form.date_creation = form.date_creation.slice(0, 10);
            }
        }
    } catch (e) {
        loadError.value = e.response?.data?.message || "Erreur lors du chargement";
    } finally {
        loadingForm.value = false;
    }
}
async function onSubmit() {
    error.value = "";

    const payload = {
        code: String(form.code || "").trim(),
        nom: String(form.nom || "").trim(),
        localite: String(form.localite || "").trim() || null,
        fokontany: String(form.fokontany || "").trim() || null,
        commune: String(form.commune || "").trim() || null,
        district: String(form.district || "").trim() || null,
        region: String(form.region || "").trim() || null,
        date_creation: form.date_creation || null,
        statut: form.statut || "ACTIF",
        agent_responsable_id:
            form.agent_responsable_id || null
    };

    console.log("Payload VOAMAMI envoyé :", payload);

    if (!payload.code || !payload.nom || !payload.date_creation) {
        error.value =
            "Les champs code, nom et date de création sont obligatoires.";
        return;
    }

    saving.value = true;

    try {
        if (isEdit.value) {
            await voamamiService.update(
                route.params.id,
                payload
            );
             toast.success(
                "Groupe VOAMAMI modifié avec succès."
            );
        } else {
            await voamamiService.create(payload);
            toast.success(
                "Groupe VOAMAMI ajouté avec succès."
            );
        }

        router.push("/voamami");
    } catch (e) {
        const data = e.response?.data;

        if (Array.isArray(data?.errors)) {
            error.value = data.errors
                .map((item) => item.msg)
                .join(", ");
        } else {
            error.value =
                data?.message ||
                "Erreur lors de l'enregistrement du VOAMAMI.";
        }
    } finally {
        saving.value = false;
    }
}

onMounted(loadForm);
</script>

<style scoped>
/* ===== Base ===== */
.page {
    max-width: 720px;
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

/* ===== States ===== */
.state-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4rem 1rem;
    gap: 0.75rem;
    color: #64748b;
}
.spinner {
    width: 32px; height: 32px;
    border: 3px solid #e2e8f0;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== Alerts ===== */
.alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    margin-bottom: 1rem;
}
.alert-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
}
.btn-link {
    margin-left: auto;
    background: none;
    border: none;
    color: #2563eb;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
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

/* ===== Fields ===== */
.form-field { display: flex; flex-direction: column; gap: 0.35rem; }

.form-field label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #475569;
}
.req { color: #dc2626; }

.form-field input,
.form-field select {
    width: 100%;
    padding: 0.6rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.9rem;
    color: #1e293b;
    background: #fff;
    transition: border-color 0.15s, box-shadow 0.15s;
    appearance: none;
}
.form-field input:focus,
.form-field select:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
}
.form-field input::placeholder { color: #94a3b8; }

/* Select wrapper for custom arrow */
.select-wrapper { position: relative; }
.select-wrapper select { padding-right: 2.2rem; cursor: pointer; }
.select-arrow {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: #64748b;
}

/* Hint / warning under field */
.field-hint {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.8rem;
    margin: 0;
    color: #92400e;
}
.warning-hint { color: #92400e; }

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

/* Spinner inside button */
.spinner-sm { animation: spin 0.8s linear infinite; }
</style>   