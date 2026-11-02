<template>
    <div class="page">
        <div class="page-header">
            <div class="header-left">
                <router-link to="/seances" class="back-link" aria-label="Retour aux séances">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </router-link>
                <h1>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    Nouvelle épargne
                </h1>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="state-block">
            <div class="spinner"></div>
            <p>Chargement du contexte…</p>
        </div>

        <!-- Error global -->
        <div v-else-if="loadError" class="alert alert-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{{ loadError }}</span>
            <button class="btn-link" @click="loadForm()">Réessayer</button>
        </div>

        <!-- Form -->
        <template v-else>
            <!-- Context card -->
            <div v-if="seance" class="context-card">
                <div class="context-item">
                    <span class="context-label">VOAMAMI</span>
                    <span class="context-value">{{ seance.voamami_code }} — {{ seance.voamami_nom }}</span>
                </div>
                <div class="context-item">
                    <span class="context-label">Cycle</span>
                    <span class="context-value">{{ seance.numero_cycle }}</span>
                </div>
                <div class="context-item">
                    <span class="context-label">Séance</span>
                    <span class="context-value">S{{ seance.numero_seance }}</span>
                </div>
                <div class="context-item">
                    <span class="context-label">Date</span>
                    <span class="context-value">{{ formatDate(seance.date_seance) }}</span>
                </div>
                <div class="context-item">
                    <span class="context-label">Statut</span>
                    <span :class="['badge', seance.statut === 'OUVERTE' ? 'badge-ouverte' : 'badge-cloturee']">
                        <span class="badge-dot"></span>
                        {{ seance.statut === 'OUVERTE' ? 'Ouverte' : 'Clôturée' }}
                    </span>
                </div>
            </div>

            <form @submit.prevent="submit" class="form" novalidate>
                <!-- Section: Épargne -->
                <fieldset class="form-section">
                    <legend>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        Épargne
                    </legend>
                    <template v-if="isAssistant">
                        <p class="form-hint">
                            Saisissez de 0 à 5 parts pour chaque membre présent. Les membres sans part saisie ne seront pas enregistrés.
                        </p>
                        <div v-if="savingsRows.length" class="savings-table-wrap">
                            <table class="savings-table">
                                <thead>
                                    <tr>
                                        <th>N°</th>
                                        <th>Membre</th>
                                        <th>Parts déjà enregistrées</th>
                                        <th>Parts à enregistrer</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="row in savingsRows" :key="row.membre.id">
                                        <td>{{ row.membre.numero_membre }}</td>
                                        <td><strong>{{ row.membre.nom }} {{ row.membre.prenom || "" }}</strong></td>
                                        <td>{{ row.alreadySavedParts || "—" }}</td>
                                        <td>
                                            <input
                                                v-model.number="row.nombre_parts"
                                                type="number"
                                                min="0"
                                                max="5"
                                                step="1"
                                                :disabled="saving || row.alreadySavedParts > 0"
                                                :aria-label="`Parts pour ${row.membre.nom} ${row.membre.prenom || ''}`"
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <span v-else class="field-hint warning-hint">
                            Aucun membre présent éligible pour cette séance.
                        </span>
                        <p class="field-hint">
                            {{ selectedSavingsCount }} membre(s) à enregistrer.
                            Les épargnes déjà enregistrées pour cette séance ne peuvent pas être saisies une seconde fois.
                        </p>
                    </template>
                    <div v-else class="form-grid">
                        <div class="form-field">
                            <label for="membre_id">Membre <span class="req">*</span></label>
                            <div class="select-wrapper">
                                <select
                                    id="membre_id"
                                    v-model.number="form.membre_id"
                                    required
                                >
                                    <option :value="null" disabled>— Sélectionner un membre —</option>
                                    <option
                                        v-for="membre in membres"
                                        :key="membre.id"
                                        :value="membre.id"
                                    >
                                        N°{{ membre.numero_membre }} — {{ membre.nom }} {{ membre.prenom }}
                                    </option>
                                </select>
                                <svg class="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                            </div>
                            <span v-if="membres.length === 0" class="field-hint warning-hint">
                                Aucun membre présent éligible pour cette séance.
                            </span>
                        </div>
                        <div class="form-field">
                            <label for="nombre_parts">Nombre de parts <span class="req">*</span></label>
                            <input
                                id="nombre_parts"
                                v-model.number="form.nombre_parts"
                                type="number"
                                min="1"
                                max="5"
                                required
                            />
                            <span class="field-hint">Entre 1 et 5 parts par opération.</span>
                        </div>
                    </div>
                </fieldset>

                <!-- Hint -->
                <p class="form-hint">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    La date, le cycle et la séance sont définis automatiquement.
                </p>

                <!-- Submit error -->
                <div v-if="error" class="alert alert-error">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>{{ error }}</span>
                </div>

                <!-- Actions -->
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary" :disabled="saving || !seance">
                        <svg v-if="saving" class="spinner-sm" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="31.4" stroke-dashoffset="10" stroke-linecap="round"/></svg>
                        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        {{ saving ? "Enregistrement…" : isAssistant ? "Enregistrer toutes les épargnes" : "Enregistrer l'épargne" }}
                    </button>
                    <router-link :to="cancelLink" class="btn btn-ghost">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Annuler
                    </router-link>
                </div>
            </form>
        </template>
    </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import epargneService from "../../service/epargne.service.js";
import membreService from "../../service/membre.service.js";
import seanceService from "../../service/seance.service.js";
import presenceService from "../../service/presence.service.js";
import { useToast } from "../../composables/useToast.js";
import { excludedMemberIdsFromPresence } from "../../utils/presence.js";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const seance = ref(null);
const membres = ref([]);
const savingsRows = ref([]);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const loadError = ref("");
const isAssistant = computed(() => route.query.assistant === "1");
const cancelLink = computed(() =>
    isAssistant.value
        ? `/seances/${form.seance_id}/operations?etape=1`
        : "/seances"
);
const selectedSavingsCount = computed(() =>
    savingsRows.value.filter((row) => Number(row.nombre_parts) > 0).length
);

const form = reactive({
    seance_id: Number(route.query.seance_id) || null,
    membre_id: null,
    nombre_parts: 1
});

function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value).slice(0, 10);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

async function loadContext() {
    if (!form.seance_id) {
        throw new Error("Aucune séance n'a été sélectionnée.");
    }

    const [seanceResponse, membresResponse, presenceResponse, epargneResponse] = await Promise.all([
        seanceService.getById(form.seance_id),
        membreService.getAll(),
        presenceService.getAll({ seance_id: form.seance_id }),
        epargneService.getAll({ seance_id: form.seance_id })
    ]);

    const sd = seanceResponse.data;
    seance.value = sd.data ?? sd.seance ?? sd;

    if (!seance.value.id || !seance.value.cycle_id) {
        throw new Error("La séance ne possède pas de cycle valide.");
    }

    const excludedMemberIds = excludedMemberIdsFromPresence(presenceResponse);
    membres.value = (membresResponse.data.data ?? []).filter((m) =>
        (m.actif === 1 || m.actif === true) &&
        Number(m.cycle_actif_id) === Number(seance.value.cycle_id) &&
        !excludedMemberIds.has(Number(m.id))
    );

    if (isAssistant.value) {
        const existingParts = new Map();
        const savedEpargnes = epargneResponse.data?.data ?? [];
        if (!Array.isArray(savedEpargnes)) {
            throw new Error("Le format des épargnes reçues est invalide.");
        }
        for (const epargne of savedEpargnes) {
            const membreId = Number(epargne.membre_id);
            existingParts.set(
                membreId,
                (existingParts.get(membreId) || 0) + Number(epargne.nombre_parts || 0)
            );
        }
        savingsRows.value = membres.value
            .sort((a, b) => Number(a.numero_membre) - Number(b.numero_membre))
            .map((membre) => ({
                membre,
                nombre_parts: 0,
                alreadySavedParts: existingParts.get(Number(membre.id)) || 0
            }));
    }
}

async function loadForm() {
    loading.value = true;
    loadError.value = "";
    try {
        await loadContext();
    } catch (e) {
        loadError.value = e.response?.data?.message || e.message || "Impossible de charger la séance.";
    } finally {
        loading.value = false;
    }
}

async function submit() {
    error.value = "";

    if (!seance.value) { error.value = "La séance est introuvable."; return; }
    if (seance.value.statut !== "OUVERTE") { error.value = "Cette séance est déjà clôturée."; return; }
    if (isAssistant.value) {
        const invalidRow = savingsRows.value.find((row) =>
            !Number.isInteger(Number(row.nombre_parts)) ||
            Number(row.nombre_parts) < 0 ||
            Number(row.nombre_parts) > 5
        );
        if (invalidRow) {
            error.value = `Le nombre de parts du membre n° ${invalidRow.membre.numero_membre} doit être compris entre 0 et 5.`;
            return;
        }
        const entries = savingsRows.value
            .filter((row) => Number(row.nombre_parts) > 0)
            .map((row) => ({
                membre_id: Number(row.membre.id),
                nombre_parts: Number(row.nombre_parts)
            }));
        if (!entries.length) {
            error.value = "Saisissez au moins une part pour un membre présent.";
            return;
        }

        saving.value = true;
        try {
            const response = await epargneService.createMany({
                seance_id: Number(form.seance_id),
                entries
            });
            toast.success(response.data?.message || `${entries.length} épargne(s) enregistrée(s).`);
            await router.push(`/seances/${form.seance_id}/operations?etape=1`);
        } catch (e) {
            error.value = e.response?.data?.message || "Erreur lors de l'enregistrement groupé des épargnes.";
        } finally {
            saving.value = false;
        }
        return;
    }

    if (!form.membre_id) { error.value = "Veuillez sélectionner un membre."; return; }
    if (form.nombre_parts < 1 || form.nombre_parts > 5) {
        error.value = "Le nombre de parts doit être compris entre 1 et 5."; return;
    }

    saving.value = true;
    try {
        const payload = {
            seance_id: Number(form.seance_id),
            membre_id: Number(form.membre_id),
            nombre_parts: Number(form.nombre_parts)
        };
        const response = await epargneService.create(payload);
        toast.success(response.data?.message || "Épargne enregistrée avec succès.");
        if (route.query.assistant === "1") {
            router.push(`/seances/${form.seance_id}/operations?etape=1`);
        } else {
            router.push({ path: "/epargnes", query: { seance_id: form.seance_id } });
        }
    } catch (e) {
        error.value = e.response?.data?.message || "Erreur lors de l'enregistrement de l'épargne.";
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

/* ===== Context card ===== */
.context-card {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    padding: 1rem 1.25rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    margin-bottom: 1.5rem;
}
.context-item {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}
.context-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #94a3b8;
}
.context-value {
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
.badge-ouverte { background: #dcfce7; color: #166534; }
.badge-cloturee { background: #e2e8f0; color: #475569; }

/* ===== Form ===== */
.form { display: flex; flex-direction: column; gap: 1.25rem; }

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

.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}
.savings-table-wrap {
    overflow-x: auto;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
}
.savings-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
}
.savings-table th,
.savings-table td {
    padding: 0.7rem 0.85rem;
    border-bottom: 1px solid #e2e8f0;
    white-space: nowrap;
}
.savings-table th {
    background: #f8fafc;
    color: #64748b;
    font-size: 0.75rem;
    font-weight: 700;
}
.savings-table tr:last-child td { border-bottom: 0; }
.savings-table input {
    width: 6rem;
    padding: 0.45rem 0.6rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font: inherit;
}
.savings-table input:disabled {
    background: #f1f5f9;
    color: #64748b;
}
@media (max-width: 540px) {
    .form-grid { grid-template-columns: 1fr; }
}

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
    font-family: inherit;
}
.form-field input:focus,
.form-field select:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
}

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

.field-hint {
    font-size: 0.78rem;
    color: #94a3b8;
    margin: 0;
}
.warning-hint { color: #92400e; }

/* ===== Form hint ===== */
.form-hint {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
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