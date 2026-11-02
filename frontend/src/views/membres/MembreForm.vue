<template>
    <div class="page">
        <div class="page-header">
            <div class="header-left">
                <router-link to="/membres" class="back-link" aria-label="Retour à la liste">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </router-link>
                <h1>
                    <svg v-if="!isEdit" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                    {{ isEdit ? "Modifier le membre" : "Nouveau membre" }}
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

            <!-- Section: Général -->
            <fieldset class="form-section">
                <legend>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>
                    Général
                </legend>
                <div class="form-grid">
                    <div class="form-field">
                        <label for="voamami_id">VOAMAMI <span class="req">*</span></label>
                        <div class="select-wrapper">
                            <select
                                id="voamami_id"
                                v-model.number="form.voamami_id"
                                required
                                @change="onVoamamiChange"
                            >
                                <option :value="null" disabled>— Sélectionner un VOAMAMI —</option>
                                <option
                                    v-for="v in voamami"
                                    :key="v.id"
                                    :value="v.id"
                                >
                                    {{ v.code }} — {{ v.nom }}
                                </option>
                            </select>
                            <svg class="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                    </div>
                    <div class="form-field">
                        <label for="numero_membre">Numéro du membre <span class="req">*</span></label>
                        <input
                            id="numero_membre"
                            v-model.number="form.numero_membre"
                            type="number"
                            min="1"
                            max="25"
                            required
                            :disabled="!form.voamami_id"
                        />
                        <span v-if="!form.voamami_id" class="field-hint">Sélectionnez d'abord un VOAMAMI</span>
                        <span v-else class="field-hint">Compris entre 1 et 25</span>
                    </div>
                </div>
            </fieldset>

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
                            maxlength="100"
                            required
                            placeholder="Rakoto"
                            autocomplete="off"
                        />
                    </div>
                    <div class="form-field">
                        <label for="prenom">Prénom</label>
                        <input
                            id="prenom"
                            v-model.trim="form.prenom"
                            type="text"
                            maxlength="100"
                            placeholder="Jean"
                            autocomplete="off"
                        />
                    </div>
                    <div class="form-field">
                        <label for="sexe">Sexe</label>
                        <div class="select-wrapper">
                            <select id="sexe" v-model="form.sexe">
                                <option :value="null">— Non précisé —</option>
                                <option value="M">Masculin</option>
                                <option value="F">Féminin</option>
                            </select>
                            <svg class="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                    </div>
                    <div class="form-field">
                        <label for="date_naissance">Date de naissance</label>
                        <input
                            id="date_naissance"
                            v-model="form.date_naissance"
                            type="date"
                            :max="todayStr"
                        />
                    </div>
                </div>
            </fieldset>

            <!-- Section: Contact -->
            <fieldset class="form-section">
                <legend>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    Contact
                </legend>
                <div class="form-grid">
                    <div class="form-field">
                        <label for="telephone">Téléphone</label>
                        <input
                            id="telephone"
                            v-model.trim="form.telephone"
                            type="tel"
                            maxlength="30"
                            placeholder="034 00 000 00"
                            autocomplete="off"
                        />
                    </div>
                    <div class="form-field">
                        <label for="profession">Profession</label>
                        <input
                            id="profession"
                            v-model.trim="form.profession"
                            type="text"
                            maxlength="100"
                            placeholder="Agriculteur, commerçant…"
                            autocomplete="off"
                        />
                    </div>
                    <div class="form-field form-field-full">
                        <label for="adresse">Adresse</label>
                        <input
                            id="adresse"
                            v-model.trim="form.adresse"
                            type="text"
                            maxlength="255"
                            placeholder="Fokontany, commune, district…"
                            autocomplete="off"
                        />
                    </div>
                </div>
            </fieldset>

            <!-- Section: Bureau & Cycle -->
            <fieldset class="form-section">
                <legend>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    Bureau &amp; Cycle
                </legend>
                <div class="form-grid">
                    <div class="form-field">
                        <label for="role_bureau">Rôle dans le bureau</label>
                        <div class="select-wrapper">
                            <select id="role_bureau" v-model="form.role_bureau">
                                <option value="MEMBRE">Membre</option>
                                <option value="PRESIDENT">Président</option>
                                <option value="SECRETAIRE">Secrétaire</option>
                                <option value="TRESORIER">Trésorier</option>
                            </select>
                            <svg class="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                    </div>
                    <div class="form-field">
                        <label for="cycle_actif">Cycle actif</label>
                        <div class="select-wrapper">
                            <select
                                id="cycle_actif"
                                v-model.number="form.cycle_actif_id"
                                :disabled="cycles.length === 0"
                            >
                                <option :value="null">— Aucun cycle —</option>
                                <option
                                    v-for="cycle in cycles"
                                    :key="cycle.id"
                                    :value="cycle.id"
                                >
                                    Cycle {{ cycle.numero_cycle }} — {{ cycle.statut }}
                                </option>
                            </select>
                            <svg class="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                        <span v-if="cycles.length === 0 && form.voamami_id" class="field-hint">
                            Aucun cycle disponible pour ce VOAMAMI.
                        </span>
                    </div>
                </div>
            </fieldset>

            <!-- Section: Épargne & Statut -->
            <fieldset class="form-section">
                <legend>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    Épargne &amp; Statut
                </legend>
                <div class="form-grid">
                    <div class="form-field">
                        <label for="solde_epargne">Solde d'épargne initial (MGA)</label>
                        <input
                            id="solde_epargne"
                            v-model.number="form.solde_epargne"
                            type="number"
                            min="0"
                            step="1000"
                            placeholder="0"
                        />
                        <span class="field-hint">Généralement 0 pour un nouveau membre.</span>
                    </div>
                    <div class="form-field form-field-check">
                        <label class="checkbox-label" for="actif">
                            <input
                                id="actif"
                                v-model="form.actif"
                                type="checkbox"
                                class="checkbox"
                            />
                            <span>Membre actif</span>
                        </label>
                    </div>
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
                    {{ saving ? "Enregistrement…" : (isEdit ? "Mettre à jour" : "Créer le membre") }}
                </button>
                <router-link to="/membres" class="btn btn-ghost">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Annuler
                </router-link>
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import membreService from "../../service/membre.service.js";
import voamamiService from "../../service/voamami.service.js";
import cycleService from "../../service/cycle.service.js";
import { useToast } from "../../composables/useToast.js";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const isEdit = computed(() => Boolean(route.params.id));
const todayStr = computed(() => new Date().toISOString().slice(0, 10));

const voamami = ref([]);
const cycles = ref([]);
const saving = ref(false);
const error = ref("");
const loadingForm = ref(false);
const loadError = ref("");

const form = reactive({
    voamami_id: null,
    numero_membre: null,
    nom: "",
    prenom: "",
    sexe: null,
    date_naissance: "",
    telephone: "",
    adresse: "",
    profession: "",
    role_bureau: "MEMBRE",
    cycle_actif_id: null,
    solde_epargne: 0,
    actif: true
});

function dateInput(value) {
    return value ? String(value).slice(0, 10) : "";
}

async function loadCycles(voamamiId) {
    cycles.value = [];
    if (!voamamiId) {
        form.cycle_actif_id = null;
        return;
    }
    try {
        const { data } = await cycleService.getAll();
        const allCycles = data.data ?? [];
        cycles.value = allCycles.filter(
            (c) => Number(c.voamami_id) === Number(voamamiId) && c.statut !== "CLOTURE"
        );
    } catch (e) {
        console.error("Erreur chargement cycles :", e.response?.data || e);
    }
}

async function onVoamamiChange() {
    form.cycle_actif_id = null;
    await loadCycles(form.voamami_id);
}

async function loadForm() {
    loadingForm.value = true;
    loadError.value = "";
    try {
        const { data } = await voamamiService.getAll();
        voamami.value = data.data ?? [];

        if (isEdit.value) {
            const { data } = await membreService.getById(route.params.id);
            const membre = data.data ?? data.membre ?? data;

            Object.assign(form, {
                voamami_id: Number(membre.voamami_id),
                numero_membre: Number(membre.numero_membre),
                nom: membre.nom,
                prenom: membre.prenom || "",
                sexe: membre.sexe || null,
                date_naissance: dateInput(membre.date_naissance),
                telephone: membre.telephone || "",
                adresse: membre.adresse || "",
                profession: membre.profession || "",
                role_bureau: membre.role_bureau || "MEMBRE",
                cycle_actif_id: membre.cycle_actif_id ? Number(membre.cycle_actif_id) : null,
                solde_epargne: Number(membre.solde_epargne || 0),
                actif: membre.actif === 1 || membre.actif === true
            });

            await loadCycles(form.voamami_id);
        }
    } catch (e) {
        loadError.value = e.response?.data?.message || "Erreur de chargement";
    } finally {
        loadingForm.value = false;
    }
}

async function onSubmit() {
    saving.value = true;
    error.value = "";
    try {
        const payload = {
            voamami_id: Number(form.voamami_id),
            numero_membre: Number(form.numero_membre),
            nom: form.nom,
            prenom: form.prenom || null,
            sexe: form.sexe || null,
            date_naissance: form.date_naissance || null,
            telephone: form.telephone || null,
            adresse: form.adresse || null,
            profession: form.profession || null,
            role_bureau: form.role_bureau,
            cycle_actif_id: form.cycle_actif_id ? Number(form.cycle_actif_id) : null,
            solde_epargne: Number(form.solde_epargne || 0),
            actif: form.actif ? 1 : 0
        };

        if (!payload.voamami_id) {
            error.value = "Le VOAMAMI est obligatoire.";
            return;
        }
        if (!payload.numero_membre || payload.numero_membre < 1 || payload.numero_membre > 25) {
            error.value = "Le numéro du membre doit être compris entre 1 et 25.";
            return;
        }
        if (!payload.nom.trim()) {
            error.value = "Le nom est obligatoire.";
            return;
        }
        if (payload.solde_epargne < 0) {
            error.value = "Le solde d'épargne ne peut pas être négatif.";
            return;
        }

        if (isEdit.value) {
            await membreService.update(route.params.id, payload);
            toast.success("Membre modifié avec succès.");
        } else {
            await membreService.create(payload);
            toast.success("Membre ajouté avec succès.");
        }
        await router.push("/membres");
    } catch (e) {
        error.value = e.response?.data?.message || "Erreur d'enregistrement du membre";
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
.form-field-full { grid-column: 1 / -1; }

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
.form-field input:disabled {
    background: #f8fafc;
    color: #94a3b8;
    cursor: not-allowed;
}

/* Select wrapper */
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

/* Hint under field */
.field-hint {
    font-size: 0.78rem;
    color: #94a3b8;
    margin: 0;
}

/* ===== Checkbox ===== */
.form-field-check { justify-content: center; }
.checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
}
.checkbox {
    width: 18px;
    height: 18px;
    accent-color: #2563eb;
    cursor: pointer;
}

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
</style>