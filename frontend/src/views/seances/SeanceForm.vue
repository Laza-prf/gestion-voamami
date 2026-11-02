<template>
    <div class="page">
        <div class="page-header">
            <div class="header-left">
                <router-link to="/seances" class="back-link" aria-label="Retour à la liste">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </router-link>
                <h1>
                    <svg v-if="!isEdit" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                    {{ isEdit ? "Modifier la séance" : "Nouvelle séance" }}
                </h1>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="state-block">
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

            <!-- Section: Cycle -->
            <fieldset class="form-section">
                <legend>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Cycle
                </legend>
                <div class="form-grid">
                    <div class="form-field form-field-full">
                        <label for="cycle_id">Cycle <span class="req">*</span></label>
                        <div class="select-wrapper">
                            <select
                                id="cycle_id"
                                v-model.number="form.cycle_id"
                                required
                                :disabled="isEdit"
                                @change="onCycleChange"
                            >
                                <option :value="null" disabled>— Sélectionner un cycle —</option>
                                <option
                                    v-for="cycle in cycles"
                                    :key="cycle.id"
                                    :value="cycle.id"
                                >
                                    {{ cycle.voamami_code }} — {{ cycle.voamami_nom }} / Cycle {{ cycle.numero_cycle }} ({{ cycle.statut }})
                                </option>
                            </select>
                            <svg class="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                        <span v-if="isEdit" class="field-hint">Le cycle d'une séance existante ne peut pas être modifié.</span>
                    </div>

                    <!-- Cycle summary -->
                    <div v-if="selectedCycle" class="form-field form-field-full">
                        <div class="cycle-summary">
                            <div class="summary-item">
                                <span class="summary-label">VOAMAMI</span>
                                <span class="summary-value">{{ selectedCycle.voamami_code }} — {{ selectedCycle.voamami_nom }}</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-label">Cycle</span>
                                <span class="summary-value">{{ selectedCycle.numero_cycle }}</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-label">Statut</span>
                                <span :class="['badge', selectedCycle.statut === 'OUVERT' ? 'badge-ouvert' : 'badge-cloture']">
                                    <span class="badge-dot"></span>
                                    {{ selectedCycle.statut }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </fieldset>

            <!-- Section: Séance -->
            <fieldset class="form-section">
                <legend>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Séance
                </legend>
                <div class="form-grid">
                    <div class="form-field">
                        <label for="numero_seance">Numéro de séance <span class="req">*</span></label>
                        <input
                            id="numero_seance"
                            v-model.number="form.numero_seance"
                            type="number"
                            min="1"
                            required
                            :disabled="!form.cycle_id"
                        />
                        <span v-if="!form.cycle_id" class="field-hint">Sélectionnez d'abord un cycle</span>
                        <span v-else class="field-hint">Numéro unique dans le cycle</span>
                    </div>
                    <div class="form-field">
                        <label for="date_seance">Date de séance <span class="req">*</span></label>
                        <input
                            id="date_seance"
                            v-model="form.date_seance"
                            type="date"

                            :min="form.date_debut || undefined"
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
                        <label for="statut">Statut de la séance</label>
                        <div class="select-wrapper">
                            <select id="statut" v-model="form.statut" :disabled="isEdit">
                                <option value="OUVERTE">Ouverte</option>
                                <option value="CLOTUREE">Clôturée</option>
                            </select>
                            <svg class="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                        <span class="field-hint">Utilisez le bouton de clôture dans la liste pour changer le statut.</span>
                    </div>
                </div>
            </fieldset>

            <!-- Section: Observation -->
            <fieldset class="form-section">
                <legend>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    Observation
                </legend>
                <div class="form-grid">
                    <div class="form-field form-field-full">
                        <label for="observation">Observation</label>
                        <textarea
                            id="observation"
                            v-model.trim="form.observation"
                            rows="4"
                            maxlength="1000"
                            placeholder="Observation éventuelle…"
                        ></textarea>
                        <span class="field-hint field-hint-right">{{ form.observation.length }}/1000</span>
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
                    {{ saving ? "Enregistrement…" : (isEdit ? "Mettre à jour" : "Créer la séance") }}
                </button>
                <router-link to="/seances" class="btn btn-ghost">
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
import seanceService from "../../service/seance.service.js";
import cycleService from "../../service/cycle.service.js";
import { useToast } from "../../composables/useToast.js";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const loading = ref(true);
const saving = ref(false);
const error = ref("");
const loadError = ref("");
const cycles = ref([]);

const isEdit = computed(() => Boolean(route.params.id));
const todayStr = computed(() => new Date().toISOString().slice(0, 10));

const form = reactive({
    cycle_id: null,
    numero_seance: null,
    date_seance: "",
    statut: "OUVERTE",
    observation: ""
});

const selectedCycle = computed(() =>
    cycles.value.find((c) => Number(c.id) === Number(form.cycle_id))
);

function formatDateInput(value) {
    return value ? String(value).slice(0, 10) : "";
}

async function loadCycles() {
    const { data } = await cycleService.getAll();
    const allCycles = data.data ?? data.cycles ?? [];
    cycles.value = allCycles.filter((cycle) => {
        if (!isEdit.value) return cycle.statut === "OUVERT";
        return cycle.statut === "OUVERT" || Number(cycle.id) === Number(form.cycle_id);
    });
}

async function loadSeance() {
    const { data } = await seanceService.getById(route.params.id);
    const seance = data.data ?? data.seance ?? data;
    form.cycle_id = Number(seance.cycle_id);
    form.numero_seance = Number(seance.numero_seance);
    form.date_seance = formatDateInput(seance.date_seance);
    form.statut = seance.statut || "OUVERTE";
    form.observation = seance.observation || "";
}

async function onCycleChange() {
    error.value = "";
    if (!form.cycle_id) return;
    const cycle = selectedCycle.value;
    if (cycle && cycle.statut !== "OUVERT") {
        error.value = "Le cycle sélectionné n'est pas ouvert.";
    }
}

async function loadForm() {
    loading.value = true;
    loadError.value = "";
    try {
        if (isEdit.value) await loadSeance();
        await loadCycles();
    } catch (e) {
        loadError.value = e.response?.data?.message || "Erreur de chargement.";
    } finally {
        loading.value = false;
    }
}

async function onSubmit() {
    error.value = "";
    if (!form.cycle_id) { error.value = "Veuillez sélectionner un cycle."; return; }
    if (!Number.isInteger(Number(form.numero_seance)) || Number(form.numero_seance) < 1) {
        error.value = "Le numéro de séance est invalide."; return;
    }
    if (!form.date_seance) { error.value = "La date de séance est obligatoire."; return; }
    if (!isEdit.value) {
        const cycle = selectedCycle.value;
        if (!cycle || cycle.statut !== "OUVERT") {
            error.value = "Une séance ne peut être créée que pour un cycle ouvert."; return;
        }
    }

    const payload = {
        cycle_id: Number(form.cycle_id),
        numero_seance: Number(form.numero_seance),
        date_seance: form.date_seance,
        statut: isEdit.value ? form.statut : "OUVERTE",
        observation: form.observation || null
    };

    saving.value = true;
    try {
        if (isEdit.value) {
            await seanceService.update(route.params.id, payload);
            toast.success("Séance modifiée avec succès.");
        } else {
            await seanceService.create(payload);
            toast.success("Séance créée avec succès.");
        }
        await router.push("/seances");
    } catch (e) {
        error.value = e.response?.data?.errors?.join(" ") || e.response?.data?.message || "Erreur lors de l'enregistrement.";
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
.form-field select,
.form-field textarea {
    width: 100%;
    padding: 0.6rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.9rem;
    color: #1e293b;
    background: #fff;
    transition: border-color 0.15s, box-shadow 0.15s;
    appearance: none;
    font-family: inherit;
}
.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
}
.form-field input::placeholder,
.form-field textarea::placeholder { color: #94a3b8; }
.form-field input:disabled,
.form-field select:disabled {
    background: #f8fafc;
    color: #94a3b8;
    cursor: not-allowed;
}
.form-field textarea { resize: vertical; min-height: 80px; }

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
.field-hint-right { text-align: right; }

/* ===== Cycle summary ===== */
.cycle-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    padding: 0.85rem 1rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
}
.summary-item {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}
.summary-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #94a3b8;
}
.summary-value {
    font-size: 0.85rem;
    font-weight: 500;
    color: #334155;
}

/* ===== Badges ===== */
.badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    white-space: nowrap;
}
.badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
}
.badge-ouvert { background: #dcfce7; color: #166534; }
.badge-cloture { background: #e2e8f0; color: #475569; }

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