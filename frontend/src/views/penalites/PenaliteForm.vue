<template>
    <div class="page">
        <div class="page-header">
            <div class="header-left">
                <router-link :to="{ path: '/penalites', query: { seance_id: form.seance_id } }" class="back-link" aria-label="Retour à la liste">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </router-link>
                <h1>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Nouvelle pénalité
                </h1>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="state-block">
            <div class="spinner"></div>
            <p>Chargement…</p>
        </div>

        <!-- Error global -->
        <div v-else-if="error && !seance" class="alert alert-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{{ error }}</span>
        </div>

        <!-- Form -->
        <form v-else @submit.prevent="submit" class="form" novalidate>

            <!-- Context card -->
            <div class="context-card">
                <div class="context-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>Contexte de la séance</span>
                </div>
                <div class="context-grid">
                    <div class="context-item">
                        <span class="context-label">VOAMAMI</span>
                        <span class="context-value">{{ seance.voamami_code }} — {{ seance.voamami_nom }}</span>
                    </div>
                    <div class="context-item">
                        <span class="context-label">Cycle</span>
                        <span class="context-value">{{ seance.numero_cycle || seance.cycle_id }}</span>
                    </div>
                    <div class="context-item">
                        <span class="context-label">Séance</span>
                        <span class="context-value">S{{ seance.numero_seance || seance.id }}</span>
                    </div>
                    <div class="context-item">
                        <span class="context-label">Date</span>
                        <span class="context-value">{{ formatDate(seance.date_seance) }}</span>
                    </div>
                </div>
            </div>

            <!-- Section: Membre -->
            <fieldset class="form-section">
                <legend>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Membre
                </legend>
                <div class="form-grid">
                    <div class="form-field form-field-full">
                        <label for="membre_id">Membre concerné <span class="req">*</span></label>
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
                                    N° {{ membre.numero_membre }} — {{ membre.nom }} {{ membre.prenom }}
                                </option>
                            </select>
                            <svg class="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                        <span v-if="membres.length === 0" class="field-hint warning-hint">
                            Aucun membre présent éligible pour cette séance.
                        </span>
                    </div>
                </div>
            </fieldset>

            <!-- Section: Pénalité -->
            <fieldset class="form-section">
                <legend>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Pénalité
                </legend>
                <div class="form-grid">
                    <div class="form-field">
                        <label for="type_penalite">Type <span class="req">*</span></label>
                        <div class="select-wrapper">
                            <select id="type_penalite" v-model="form.type_penalite" required>
                                <option value="ABSENCE">Absence</option>
                                <option value="RETARD">Retard</option>
                                <option value="AUTRE">Autre</option>
                            </select>
                            <svg class="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                    </div>
                    <div class="form-field">
                        <label for="statut">Statut initial</label>
                        <div class="select-wrapper">
                            <select id="statut" v-model="form.statut">
                                <option value="IMPAYEE">Impayée</option>
                                <option value="PAYEE">Payée immédiatement</option>
                            </select>
                            <svg class="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                    </div>
                    <div class="form-field form-field-full">
                        <label for="motif">Motif</label>
                        <textarea
                            id="motif"
                            v-model.trim="form.motif"
                            rows="3"
                            maxlength="255"
                            placeholder="Détail de la pénalité…"
                        ></textarea>
                        <span class="field-hint field-hint-right">{{ form.motif.length }}/255</span>
                    </div>
                </div>
            </fieldset>

            <!-- Hint -->
            <p class="info-hint">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                Le montant, le cycle et la date sont définis automatiquement par la séance.
            </p>

            <!-- Submit error -->
            <div v-if="error" class="alert alert-error">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{{ error }}</span>
            </div>

            <!-- Actions -->
            <div class="form-actions">
                <button type="submit" class="btn btn-primary" :disabled="saving || !membres.length">
                    <svg v-if="saving" class="spinner-sm" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="31.4" stroke-dashoffset="10" stroke-linecap="round"/></svg>
                    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {{ saving ? "Enregistrement…" : "Enregistrer la pénalité" }}
                </button>
                <router-link :to="{ path: '/penalites', query: { seance_id: form.seance_id } }" class="btn btn-ghost">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Annuler
                </router-link>
            </div>
        </form>
    </div>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import seanceService from "../../service/seance.service.js";
import membreService from "../../service/membre.service.js";
import penaliteService from "../../service/penalite.service.js";
import presenceService from "../../service/presence.service.js";
import { useToast } from "../../composables/useToast.js";
import { excludedMemberIdsFromPresence } from "../../utils/presence.js";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const seance = ref(null);
const membres = ref([]);
const loading = ref(true);
const saving = ref(false);
const error = ref("");

const form = reactive({
    seance_id: Number(route.query.seance_id) || null,
    membre_id: null,
    type_penalite: "ABSENCE",
    motif: "",
    statut: "IMPAYEE"
});

function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value).slice(0, 10);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

async function loadContext() {
    if (!form.seance_id) throw new Error("Aucune séance sélectionnée.");

    const [s, m, presenceResponse] = await Promise.all([
        seanceService.getById(form.seance_id),
        membreService.getAll(),
        presenceService.getAll({ seance_id: form.seance_id })
    ]);

    const sdata = s.data.data ?? s.data.seance ?? s.data;
    seance.value = sdata;

    if (!seance.value?.cycle_id) {
        throw new Error("La séance ne possède pas de cycle valide.");
    }
    if (seance.value.statut !== "OUVERTE") {
        throw new Error("La séance est déjà clôturée.");
    }

    const membresData = m.data.data ?? m.data.membres ?? m.data ?? [];
    const excludedMemberIds = excludedMemberIdsFromPresence(presenceResponse);
    membres.value = membresData.filter((membre) =>
        (membre.actif === 1 || membre.actif === true) &&
        Number(membre.cycle_actif_id) === Number(seance.value.cycle_id) &&
        !excludedMemberIds.has(Number(membre.id))
    );
}

async function submit() {
    error.value = "";
    if (!form.membre_id) { error.value = "Veuillez sélectionner un membre."; return; }
    if (!form.type_penalite) { error.value = "Le type est obligatoire."; return; }

    saving.value = true;
    try {
        const response = await penaliteService.create({
            seance_id: Number(form.seance_id),
            membre_id: Number(form.membre_id),
            type_penalite: form.type_penalite,
            motif: form.motif || null,
            statut: form.statut
        });
        toast.success(response.data?.message || "Pénalité enregistrée avec succès.");
        if (route.query.assistant === "1") {
            router.push(`/seances/${form.seance_id}/operations?etape=4`);
        } else {
            router.push({ path: "/penalites", query: { seance_id: form.seance_id } });
        }
    } catch (e) {
        error.value = e.response?.data?.message || "Erreur lors de l'enregistrement.";
    } finally { saving.value = false; }
}

onMounted(async () => {
    try { await loadContext(); }
    catch (e) { error.value = e.response?.data?.message || e.message || "Impossible de charger la séance."; }
    finally { loading.value = false; }
});
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
    align-items: flex-start;
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
.alert-error svg { flex-shrink: 0; margin-top: 0.1rem; }

/* ===== Context card ===== */
.context-card {
    padding: 1rem 1.25rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    margin-bottom: 1.5rem;
}
.context-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #64748b;
    margin-bottom: 0.75rem;
}
.context-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
}
.context-item {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}
.context-label {
    font-size: 0.68rem;
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
.form-field textarea { resize: vertical; min-height: 70px; }

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

/* Hint */
.field-hint {
    font-size: 0.78rem;
    color: #94a3b8;
    margin: 0;
}
.field-hint-right { text-align: right; }
.warning-hint { color: #92400e; }

/* Info hint */
.info-hint {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.82rem;
    color: #64748b;
    margin: 0;
}
.info-hint svg { flex-shrink: 0; color: #94a3b8; }

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