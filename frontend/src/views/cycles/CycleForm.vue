<template>
    <div class="page">
        <div class="page-header">
            <div class="header-left">
                <router-link to="/cycles" class="back-link" aria-label="Retour à la liste">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </router-link>
                <h1>
                    <svg v-if="!isEdit" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                    {{ isEdit ? "Modifier le cycle" : "Nouveau cycle" }}
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
                                    v-for="voamami in voamamis"
                                    :key="voamami.id"
                                    :value="voamami.id"
                                >
                                    {{ voamami.code }} — {{ voamami.nom }}
                                </option>
                            </select>
                            <svg class="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                    </div>
                    <div class="form-field">
                        <label for="numero_cycle">Numéro du cycle <span class="req">*</span></label>
                        <input
                            id="numero_cycle"
                            v-model.number="form.numero_cycle"
                            type="number"
                            min="1"
                            required
                            :disabled="!form.voamami_id"
                        />
                        <span v-if="!form.voamami_id" class="field-hint">Sélectionnez d'abord un VOAMAMI</span>
                    </div>
                </div>
            </fieldset>

            <!-- Section: Dates -->
            <fieldset class="form-section">
                <legend>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Dates
                </legend>
                <div class="form-grid">
                    <div class="form-field">
                        <label for="date_debut">Date de début <span class="req">*</span></label>
                        <input
                            id="date_debut"
                            v-model="form.date_debut"
                            type="date"
                            required
                            :max="todayStr"
                        />
                    </div>
                    <div class="form-field">
                        <label for="date_fin_prevue">Fin prévue</label>
                        <input
                            id="date_fin_prevue"
                            v-model="form.date_fin_prevue"
                            type="date"
                            :min="form.date_debut || undefined"
                        />
                    </div>
                    <div v-if="isEdit && form.statut === 'CLOTURE'" class="form-field">
                        <label for="date_cloture">Date de clôture</label>
                        <input
                            id="date_cloture"
                            v-model="form.date_cloture"
                            type="date"
                            :min="form.date_debut || undefined"
                            :max="todayStr"
                        />
                    </div>
                </div>
            </fieldset>

            <!-- Section: Paramètres financiers -->
            <fieldset class="form-section">
                <legend>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    Paramètres financiers
                </legend>
                <div class="form-grid">
                    <div class="form-field">
                        <label for="montant_part_epargne">Part d'épargne (MGA) <span class="req">*</span></label>
                        <input
                            id="montant_part_epargne"
                            v-model.number="form.montant_part_epargne"
                            type="number"
                            min="0"
                            step="1000"
                            required
                            placeholder="10 000"
                        />
                    </div>
                    <div class="form-field">
                        <label for="montant_penalite">Pénalité (MGA)</label>
                        <input
                            id="montant_penalite"
                            v-model.number="form.montant_penalite"
                            type="number"
                            min="0"
                            step="1000"
                            placeholder="5 000"
                        />
                    </div>
                    <div class="form-field">
                        <label for="taux_interet">Taux d'intérêt (%) <span class="req">*</span></label>
                        <input
                            id="taux_interet"
                            v-model.number="form.taux_interet"
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            required
                        />
                    </div>
                    <div class="form-field">
                        <label for="duree_credit_mois">Durée crédit (mois) <span class="req">*</span></label>
                        <input
                            id="duree_credit_mois"
                            v-model.number="form.duree_credit_mois"
                            type="number"
                            min="1"
                            max="36"
                            required
                        />
                    </div>
                </div>
            </fieldset>

            <!-- Section: Statut (edit only) -->
            <fieldset v-if="isEdit" class="form-section">
                <legend>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Statut
                </legend>
                <div class="form-grid">
                    <div class="form-field">
                        <label for="statut">Statut du cycle</label>
                        <div class="select-wrapper">
                            <select id="statut" v-model="form.statut">
                                <option value="PREPARATION">Préparation</option>
                                <option value="OUVERT">Ouvert</option>
                                <option value="CLOTURE">Clôturé</option>
                            </select>
                            <svg class="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
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
                    {{ saving ? "Enregistrement…" : (isEdit ? "Mettre à jour" : "Créer le cycle") }}
                </button>
                <router-link to="/cycles" class="btn btn-ghost">
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
import cycleService from "../../service/cycle.service.js";
import voamamiService from "../../service/voamami.service.js";
import { useToast } from "../../composables/useToast.js";

const toast = useToast();

const route = useRoute();
const router = useRouter();

const isEdit = computed(() => Boolean(route.params.id));
const todayStr = computed(() => new Date().toISOString().slice(0, 10));

const voamamis = ref([]);
const cyclesDuVoamami = ref([]);
const saving = ref(false);
const error = ref("");
const loadingForm = ref(false);
const loadError = ref("");

const form = reactive({
    voamami_id: null,
    numero_cycle: 1,
    date_debut: "",
    date_fin_prevue: "",
    date_cloture: "",
    statut: "PREPARATION",
    montant_part_epargne: null,
    montant_penalite: 0,
    taux_interet: 10,
    duree_credit_mois: 3
});

function dateInput(value) {
    return value ? String(value).slice(0, 10) : "";
}

async function loadCycles(voamamiId) {
    cyclesDuVoamami.value = [];
    if (!voamamiId) return;
    const { data } = await cycleService.getAll();
    const allCycles = data.data ?? [];
    cyclesDuVoamami.value = allCycles.filter(
        (c) => Number(c.voamami_id) === Number(voamamiId)
    );
}

async function onVoamamiChange() {
    await loadCycles(form.voamami_id);
    if (!isEdit.value) {
        const numeros = cyclesDuVoamami.value.map((c) => Number(c.numero_cycle));
        form.numero_cycle = numeros.length > 0 ? Math.max(...numeros) + 1 : 1;
    }
}

async function loadForm() {
    loadingForm.value = true;
    loadError.value = "";
    try {
        const { data } = await voamamiService.getAll();
        voamamis.value = data.data ?? [];

        if (isEdit.value) {
            const { data } = await cycleService.getById(route.params.id);
            const cycle = data.data ?? data.cycle ?? data;

            Object.assign(form, {
                voamami_id: Number(cycle.voamami_id),
                numero_cycle: Number(cycle.numero_cycle),
                date_debut: dateInput(cycle.date_debut),
                date_fin_prevue: dateInput(cycle.date_fin_prevue),
                date_cloture: dateInput(cycle.date_cloture),
                statut: cycle.statut,
                montant_part_epargne: Number(cycle.montant_part_epargne),
                montant_penalite: Number(cycle.montant_penalite || 0),
                taux_interet: Number(cycle.taux_interet),
                duree_credit_mois: Number(cycle.duree_credit_mois)
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
            numero_cycle: Number(form.numero_cycle),
            date_debut: form.date_debut,
            date_fin_prevue: form.date_fin_prevue || null,
            date_cloture: form.date_cloture || null,
            statut: form.statut,
            montant_part_epargne: Number(form.montant_part_epargne),
            montant_penalite: Number(form.montant_penalite || 0),
            taux_interet: Number(form.taux_interet),
            duree_credit_mois: Number(form.duree_credit_mois)
        };

        if (isEdit.value) {
            await cycleService.update(route.params.id, payload);

        toast.success(
                "Cycle modifié avec succès."
            );
         } else {
            await cycleService.create(payload);
            toast.success(
                "Cycle ajouté avec succès."
            );
        }
        router.push("/cycles");
    } catch (e) {
        error.value = e.response?.data?.message || "Erreur d'enregistrement du cycle";
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