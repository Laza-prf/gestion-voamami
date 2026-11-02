<template>
    <section class="page">
        <header class="page-header">
            <div>
                <p class="eyebrow">
                    {{ auth.isAdmin ? "Supervision globale" : "Espace agent" }}
                </p>

                <h1>
                    {{ auth.isAdmin ? "Tous les rapports" : "Mes rapports" }}
                </h1>

                <p class="description">
                    <template v-if="auth.isAdmin">
                        Consultez les rapports de tous les VOAMAMI et de tous les agents.
                    </template>
                    <template v-else>
                        Consultez les rapports des VOAMAMI qui vous sont affectes.
                    </template>
                </p>

                <span class="role-badge" :class="auth.isAdmin ? 'role-admin' : 'role-agent'">
                    {{ auth.isAdmin ? "Administrateur" : "Agent FID" }}
                </span>
            </div>

            <button
                type="button"
                class="btn btn-secondary"
                :disabled="loading"
                @click="loadReports"
            >
                Actualiser
            </button>
        </header>

        <div class="access-notice" :class="auth.isAdmin ? 'notice-admin' : 'notice-agent'">
            <strong>{{ auth.isAdmin ? "Accès global" : "Accès limité à vos affectations" }}</strong>
            <span v-if="auth.isAdmin">
                Vous consultez les rapports de tous les VOAMAMI.
            </span>
            <span v-else>
                Seuls les rapports liés à vos VOAMAMI affectés sont affichés.
            </span>
        </div>

        <div class="summary-grid">
            <article class="summary-card">
                <span class="summary-label">Rapports accessibles</span>
                <strong class="summary-value">{{ reports.length }}</strong>
            </article>

            <article class="summary-card">
                <span class="summary-label">Rapports de séance</span>
                <strong class="summary-value value-blue">{{ seanceCount }}</strong>
            </article>

            <article class="summary-card">
                <span class="summary-label">Clôtures de cycle</span>
                <strong class="summary-value value-green">{{ clotureCount }}</strong>
            </article>
        </div>

        <div class="filters-card">
            <label class="field">
                <span>Type de rapport</span>
                <select v-model="filters.type_rapport">
                    <option value="">Tous les types</option>
                    <option value="SEANCE">Séance</option>
                    <option value="CLOTURE_CYCLE">Clôture de cycle</option>
                    <option value="EPARGNE">Épargne</option>
                    <option value="CREDIT">Crédit</option>
                    <option value="REMBOURSEMENT">Remboursement</option>
                </select>
            </label>

            <label class="field">
                <span>Recherche</span>
                <input
                    v-model.trim="filters.search"
                    type="search"
                    :placeholder="auth.isAdmin ? 'Titre, VOAMAMI ou agent...' : 'Titre ou VOAMAMI...'"
                />
            </label>

            <button type="button" class="btn btn-primary" @click="loadReports">
                Rechercher
            </button>
        </div>

        <div v-if="loading" class="state-card">
            <span class="spinner"></span>
            <p>Chargement des rapports...</p>
        </div>

        <div v-else-if="error" class="state-card error-card">
            <p>{{ error }}</p>
            <button type="button" class="btn btn-secondary" @click="loadReports">
                Réessayer
            </button>
        </div>

        <div v-else-if="filteredReports.length === 0" class="state-card empty-card">
            <div class="empty-icon">—</div>
            <p>
                {{ auth.isAdmin
                    ? "Aucun rapport enregistré."
                    : "Aucun rapport n'est disponible pour vos VOAMAMI affectés." }}
            </p>
        </div>

        <div v-else class="table-card">
            <div class="table-header">
                <div>
                    <h2>
                        {{ auth.isAdmin ? "Rapports de tous les VOAMAMI" : "Rapports de mes VOAMAMI" }}
                    </h2>
                    <p>{{ filteredReports.length }} résultat(s)</p>
                </div>
            </div>

            <div class="table-scroll">
                <table>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Titre</th>
                            <th>VOAMAMI</th>
                            <th v-if="auth.isAdmin">Agent</th>
                            <th>Cycle</th>
                            <th>Généré le</th>
                            <th class="actions-heading">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-for="report in filteredReports" :key="report.id">
                            <td>
                                <span
                                    class="badge"
                                    :class="report.type_rapport === 'CLOTURE_CYCLE' ? 'badge-green' : 'badge-blue'"
                                >
                                    {{ reportTypeLabel(report.type_rapport) }}
                                </span>
                            </td>

                            <td class="title-cell">{{ report.titre || "Sans titre" }}</td>
                            <td>{{ report.voamami_code || report.voamami_nom || "—" }}</td>
                            <td v-if="auth.isAdmin">{{ report.agent_nom || report.agent_email || "—" }}</td>
                            <td>{{ report.numero_cycle || report.cycle_id || "—" }}</td>
                            <td>{{ formatDate(report.date_generation) }}</td>

                            <td class="actions-cell">
                                <router-link
                                    v-if="report.type_rapport === 'CLOTURE_CYCLE'"
                                    :to="{ name: 'rapport-cycle', params: { cycleId: report.cycle_id } }"
                                    class="action-link"
                                >
                                    Voir le cycle
                                </router-link>

                                <router-link
                                    v-else-if="report.seance_id"
                                    :to="{ name: 'rapport-seance', params: { seanceId: report.seance_id } }"
                                    class="action-link"
                                >
                                    Voir la séance
                                </router-link>

                                <span v-else class="muted">—</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useAuthStore } from "../../stores/auth.store.js";
import rapportService from "../../service/rapport.service.js";

const auth = useAuthStore();
const reports = ref([]);
const loading = ref(true);
const error = ref("");

const filters = reactive({
    type_rapport: "",
    search: ""
});

const filteredReports = computed(() => {
    const search = filters.search.toLowerCase();

    return reports.value.filter((report) => {
        const typeMatches =
            !filters.type_rapport ||
            report.type_rapport === filters.type_rapport;

        const searchableText = [
            report.titre,
            report.voamami_code,
            report.voamami_nom,
            report.agent_nom,
            report.agent_email,
            report.numero_cycle
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return typeMatches &&
            (!search || searchableText.includes(search));
    });
});

const seanceCount = computed(() =>
    reports.value.filter(
        (report) => report.type_rapport === "SEANCE"
    ).length
);

const clotureCount = computed(() =>
    reports.value.filter(
        (report) => report.type_rapport === "CLOTURE_CYCLE"
    ).length
);

function reportTypeLabel(type) {
    const labels = {
        SEANCE: "Séance",
        CLOTURE_CYCLE: "Clôture",
        EPARGNE: "Épargne",
        CREDIT: "Crédit",
        REMBOURSEMENT: "Remboursement"
    };

    return labels[type] || type || "Rapport";
}

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date);
}

async function loadReports() {
    loading.value = true;
    error.value = "";

    try {
        const { data } = await rapportService.getAll({
            type_rapport: filters.type_rapport || undefined
        });

        reports.value = data.data ?? data.rapports ?? [];
    } catch (e) {
        error.value =
            e.response?.data?.message ||
            "Impossible de charger les rapports.";
    } finally {
        loading.value = false;
    }
}

onMounted(loadReports);
</script>

<style scoped>
.page { width: 100%; max-width: 1440px; margin: 0 auto; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1.5rem; margin-bottom: 1.25rem; }
.eyebrow { margin: 0 0 .35rem; color: #2563eb; font-size: .75rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
h1, h2, p { margin-top: 0; }
h1 { margin-bottom: .4rem; color: #0f172a; font-size: 1.8rem; font-weight: 750; }
h2 { margin-bottom: .3rem; color: #0f172a; font-size: 1rem; }
.description, .table-header p { margin-bottom: 0; color: #64748b; font-size: .875rem; }
.btn { min-height: 2.5rem; border: 1px solid transparent; border-radius: .5rem; padding: .6rem .9rem; font-size: .875rem; font-weight: 650; cursor: pointer; }
.btn:disabled { cursor: not-allowed; opacity: .6; }
.btn-primary { background: #2563eb; color: white; }
.btn-primary:hover { background: #1d4ed8; }
.btn-secondary { border-color: #cbd5e1; background: white; color: #334155; }
.btn-secondary:hover { background: #f8fafc; }
.role-badge { display: inline-flex; margin-top: .75rem; border-radius: 999px; padding: .3rem .65rem; font-size: .72rem; font-weight: 700; }
.role-admin { background: #ede9fe; color: #6d28d9; }
.role-agent { background: #dbeafe; color: #1d4ed8; }
.access-notice { display: flex; flex-direction: column; gap: .2rem; margin-bottom: 1.5rem; border-left: 4px solid; border-radius: .5rem; padding: .8rem 1rem; font-size: .875rem; }
.notice-admin { border-color: #7c3aed; background: #f5f3ff; color: #5b21b6; }
.notice-agent { border-color: #2563eb; background: #eff6ff; color: #1d4ed8; }
.summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
.summary-card, .filters-card, .table-card, .state-card { border: 1px solid #e2e8f0; border-radius: .875rem; background: white; box-shadow: 0 1px 2px rgb(15 23 42 / 4%); }
.summary-card { padding: 1rem 1.15rem; }
.summary-label { display: block; color: #64748b; font-size: .75rem; font-weight: 700; text-transform: uppercase; }
.summary-value { display: block; margin-top: .5rem; color: #0f172a; font-size: 1.6rem; }
.value-blue { color: #2563eb; }
.value-green { color: #059669; }
.filters-card { display: flex; align-items: flex-end; gap: 1rem; margin-bottom: 1.5rem; padding: 1rem; }
.field { display: flex; width: min(100%, 18rem); flex-direction: column; gap: .4rem; }
.field span { color: #334155; font-size: .8rem; font-weight: 650; }
.field input, .field select { width: 100%; min-height: 2.5rem; border: 1px solid #cbd5e1; border-radius: .5rem; padding: .55rem .7rem; outline: none; }
.field input:focus, .field select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgb(37 99 235 / 12%); }
.state-card { display: flex; min-height: 15rem; flex-direction: column; align-items: center; justify-content: center; gap: .8rem; padding: 1.5rem; color: #64748b; text-align: center; }
.state-card p { margin-bottom: 0; }
.error-card { border-color: #fecaca; background: #fef2f2; color: #b91c1c; }
.empty-card { border-style: dashed; }
.empty-icon { display: flex; width: 3rem; height: 3rem; align-items: center; justify-content: center; border-radius: 50%; background: #f1f5f9; color: #94a3b8; font-size: 1.5rem; }
.spinner { width: 2rem; height: 2rem; border: 4px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.table-card { overflow: hidden; }
.table-header { display: flex; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid #e2e8f0; }
.table-header h2, .table-header p { margin-bottom: 0; }
.table-scroll { overflow-x: auto; }
table { width: 100%; min-width: 900px; border-collapse: collapse; font-size: .875rem; }
thead { background: #f8fafc; }
th { padding: .85rem 1.25rem; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: .7rem; font-weight: 750; text-align: left; text-transform: uppercase; white-space: nowrap; }
td { padding: .9rem 1.25rem; border-bottom: 1px solid #f1f5f9; color: #475569; }
tbody tr:hover { background: #f8fafc; }
.title-cell { color: #0f172a; font-weight: 650; }
.actions-heading, .actions-cell { text-align: right; }
.badge { display: inline-flex; border-radius: 999px; padding: .3rem .65rem; font-size: .72rem; font-weight: 750; }
.badge-blue { background: #dbeafe; color: #1d4ed8; }
.badge-green { background: #d1fae5; color: #047857; }
.action-link { color: #2563eb; font-weight: 650; text-decoration: none; }
.action-link:hover { color: #1d4ed8; text-decoration: underline; }
.muted { color: #94a3b8; }
@media (max-width: 760px) { .page-header { flex-direction: column; } .summary-grid { grid-template-columns: 1fr; } .filters-card { align-items: stretch; flex-direction: column; } .field { width: 100%; } .table-header { flex-direction: column; gap: .5rem; } }
</style>
