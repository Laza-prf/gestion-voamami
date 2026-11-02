<template>
    <div class="page">
        <div class="page-header">
            <div>
                <h1>Groupes VOAMAMI</h1>
                <p class="subtitle">{{ voamami.length }} groupe(s) enregistré(s)</p>
            </div>
            <router-link to="/voamami/nouveau" class="btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nouveau groupe
            </router-link>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="state-block">
            <div class="spinner"></div>
            <p>Chargement des données…</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="state-block state-error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p>{{ error }}</p>
            <button class="btn-secondary" @click="load">Réessayer</button>
        </div>

        <!-- Empty -->
        <div v-else-if="voamami.length === 0" class="state-block">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
            <p>Aucun groupe enregistré.</p>
            <router-link to="/voamami/nouveau" class="btn-primary">Créer le premier groupe</router-link>
        </div>

        <!-- Table -->
        <div v-else class="table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Nom</th>
                        <th>Fokontany</th>
                        <th>Commune</th>
                        <th>District</th>
                        <th>Région</th>
                        <th>Statut</th>
                        <th>Agent responsable</th>
                        <th class="col-actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(v, i) in voamami" :key="v.id" :class="{ 'row-even': i % 2 === 0 }">
                        <td><code class="code-badge">{{ v.code }}</code></td>
                        <td class="td-bold">{{ v.nom }}</td>
                        <td>{{ v.fokontany }}</td>
                        <td>{{ v.commune }}</td>
                        <td>{{ v.district }}</td>
                        <td>{{ v.region }}</td>
                        <td>
                            <span :class="['badge', 'badge-' + v.statut.toLowerCase().replace(/\s/g, '-')]">
                                <span class="badge-dot"></span>
                                {{ v.statut }}
                            </span>
                        </td>
                        <td>
                            <span v-if="v.agent_responsable_nom" class="agent-cell">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                {{ v.agent_responsable_nom }}
                            </span>
                            <span v-else class="muted">—</span>
                        </td>
                        <td class="col-actions">
                            <div class="actions">
                                <router-link
                                    :to="`/voamami/${v.id}/modifier`"
                                    class="icon-btn icon-btn-edit"
                                    title="Modifier"
                                    aria-label="Modifier"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                                </router-link>
                                <button
                                    class="icon-btn icon-btn-delete"
                                    title="Supprimer"
                                    aria-label="Supprimer"
                                    @click="askDelete(v)"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
 <Teleport to="body">
    <Transition name="modal">
        <div
            v-if="showDeleteDialog"
            class="modal-backdrop"
            @click.self="cancelDelete"
        >
            <section
                class="confirm-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-title"
            >
                <h2 id="delete-title">
                    Supprimer ce groupe ?
                </h2>

                <p>
                    Voulez-vous supprimer
                    <strong>
                        {{ selectedVoamami?.nom }}
                    </strong>
                    ?
                </p>



                <div class="confirm-actions">
                    <button
                        type="button"
                        class="btn-secondary"
                        :disabled="deleting"
                        @click="cancelDelete"
                    >
                        Annuler
                    </button>

                    <button
                        type="button"
                        class="btn-danger"
                        :disabled="deleting"
                        @click="confirmDelete"
                    >
                        {{
                            deleting
                                ? "Suppression..."
                                : "Supprimer"
                        }}
                    </button>
                </div>
            </section>
        </div>
    </Transition>
</Teleport>


</template>

<script setup>
import { ref, onMounted } from "vue";
import voamamiService from "../../service/voamami.service.js";
import { useToast } from "../../composables/useToast.js";

const toast = useToast();

const voamami = ref([]);
const loading = ref(true);
const error = ref("");

const showDeleteDialog = ref(false);
const selectedVoamami = ref(null);

async function load() {
    loading.value = true;
    error.value = "";
    try {
        const { data } = await voamamiService.getAll();
        voamami.value = data.data;
    } catch (e) {
        error.value = e.response?.data?.message || "Erreur de chargement";
        toast.error("Impossible de charger les groupes.");  // ← TOAST
    } finally {
        loading.value = false;
    }
}

function askDelete(voamamiItem) {
    selectedVoamami.value = voamamiItem;
    showDeleteDialog.value = true;
}

function cancelDelete() {
    showDeleteDialog.value = false;
    selectedVoamami.value = null;
}

async function confirmDelete() {
    if (!selectedVoamami.value) return;

    const id = selectedVoamami.value.id;

    try {
        await voamamiService.remove(id);

        voamami.value = voamami.value.filter(
            (item) => item.id !== id
        );

        toast.success(
            "Groupe supprimé avec succès."
        );
    } catch (e) {
        toast.error(
            e.response?.data?.message ||
            "Suppression impossible."
        );
    } finally {
        cancelDelete();
    }
}

onMounted(load);
</script>

<style scoped>
/* ===== Page layout ===== */
.page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
}

.page-header h1 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    color: #0f172a;
}

.subtitle {
    margin: 0.25rem 0 0;
    font-size: 0.85rem;
    color: #64748b;
}

/* ===== Buttons ===== */
.btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: #2563eb;
    color: #fff;
    padding: 0.55rem 1.1rem;
    border-radius: 8px;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: background 0.15s;
}
.btn-primary:hover { background: #1d4ed8; }

.btn-secondary {
    background: #f1f5f9;
    color: #334155;
    padding: 0.45rem 1rem;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 0.15s;
}
.btn-secondary:hover { background: #e2e8f0; }

/* ===== State blocks (loading / error / empty) ===== */
.state-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 1rem;
    text-align: center;
    color: #64748b;
    gap: 0.75rem;
}
.state-block p { margin: 0; font-size: 0.95rem; }
.state-error svg { color: #dc2626; }

.spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e2e8f0;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== Table wrapper (scroll horizontal sur mobile) ===== */
.table-wrapper {
    overflow-x: auto;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    background: #fff;
}

/* ===== Table ===== */
.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    min-width: 900px;
}

.data-table thead {
    background: #f8fafc;
    border-bottom: 2px solid #e2e8f0;
}

.data-table th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #64748b;
    white-space: nowrap;
}

.data-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
}

.data-table tbody tr {
    transition: background 0.1s;
}
.data-table tbody tr:hover {
    background: #f8fafc;
}
.data-table tbody tr.row-even {
    background: #fcfcfd;
}
.data-table tbody tr.row-even:hover {
    background: #f1f5f9;
}
.data-table tbody tr:last-child td {
    border-bottom: none;
}

/* ===== Specific cells ===== */
.td-bold { font-weight: 600; }

.code-badge {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    color: #475569;
}

.muted { color: #cbd5e1; }

.agent-cell {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: #475569;
}
.agent-cell svg { flex-shrink: 0; }

/* ===== Badges ===== */
.badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.65rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
}
.badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
}

.badge-actif {
    background: #dcfce7;
    color: #166534;
}
.badge-inactif,
.badge-cloture {
    background: #fee2e2;
    color: #991b1b;
}
.badge-en-cours {
    background: #fef9c3;
    color: #854d0e;
}

/* ===== Actions (icon buttons) ===== */
.col-actions { width: 90px; text-align: right; }

.actions {
    display: inline-flex;
    gap: 0.35rem;
    justify-content: flex-end;
}

.icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: 1px solid transparent;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.15s;
}

.icon-btn-edit {
    color: #2563eb;
    background: #eff6ff;
    border-color: #bfdbfe;
}
.icon-btn-edit:hover {
    background: #dbeafe;
    border-color: #93c5fd;
}

.icon-btn-delete {
    color: #dc2626;
    background: #fef2f2;
    border-color: #fecaca;
}

.icon-btn-delete:hover {
    background: #fee2e2;
    border-color: #fca5a5;
}

.modal-backdrop {
    position: fixed;
    z-index: 10000;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(15 23 42 / 0.48);
    padding: 1rem;
}

.confirm-dialog {
    width: min(100%, 420px);
    border: 1px solid #e2e8f0;
    border-radius: 1rem;
    background: #ffffff;
    padding: 1.5rem;
    box-shadow: 0 20px 50px rgb(15 23 42 / 0.24);
}

.confirm-icon {
    display: flex;
    width: 2.75rem;
    height: 2.75rem;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    border-radius: 50%;
    background: #fee2e2;
    color: #dc2626;
    font-size: 1.25rem;
    font-weight: 700;
}

.confirm-dialog h2 {
    margin-bottom: 0.5rem;
    color: #0f172a;
    font-size: 1.15rem;
    font-weight: 700;
}

.confirm-dialog p {
    color: #64748b;
    line-height: 1.5;
}

.confirm-dialog strong {
    color: #1e293b;
}

.confirm-warning {
    margin-top: 0.5rem;
    color: #dc2626 !important;
    font-size: 0.875rem;
}

.confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
}

.btn-secondary,
.btn-danger {
    border: 0;
    border-radius: 2.5rem;
    padding: 0.2rem 2rem;
    cursor: pointer;
    font: inherit;
    font-weight: 600;
}

.btn-secondary {
    background: #f1f5f9;
    color: #334155;
}

.btn-secondary:hover {
    background: #e2e8f0;
}

.btn-danger {
    background: #dc2626;
    color: #ffffff;
}

.btn-danger:hover {
    background: #b91c1c;
}

.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.2s ease;
}

.modal-enter-active .confirm-dialog,
.modal-leave-active .confirm-dialog {
    transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-from .confirm-dialog,
.modal-leave-to .confirm-dialog {
    transform: translateY(0.75rem) scale(0.97);
}

@media (max-width: 600px) {
    .confirm-dialog {
        padding: 1.25rem;
    }

    .confirm-actions {
        flex-direction: column-reverse;
    }

    .btn-secondary,
    .btn-danger {
        width: 100%;
    }
}

</style>

