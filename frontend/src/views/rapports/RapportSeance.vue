<template>
    <section class="page">
        <header class="page-header">
            <div>
                <router-link to="/rapports" class="back-link">← Retour aux rapports</router-link>
                <p class="eyebrow">Rapport de séance</p>
                <h1 v-if="report">Séance S{{ report.numero_seance }}</h1>
                <p v-if="report" class="subtitle">
                    {{ report.voamami_code }} — {{ report.voamami_nom }}
                    · Cycle {{ report.numero_cycle }}
                    · {{ formatDate(report.date_seance) }}
                </p>
            </div>
            <span v-if="report" :class="['badge', report.seance_statut === 'CLOTUREE' ? 'badge-closed' : 'badge-open']">
                {{ report.seance_statut === "CLOTUREE" ? "Clôturée" : "Ouverte" }}
            </span>
            <button
                v-if="report"
                type="button"
                class="button button-download"
                :disabled="downloading"
                @click="downloadPdf"
            >
                {{ downloading ? "Génération..." : "Télécharger le PDF" }}
            </button>
        </header>

        <div v-if="loading" class="state-card">Chargement du rapport...</div>
        <div v-else-if="error" class="state-card state-error" role="alert">
            <p>{{ error }}</p>
            <button class="button button-secondary" @click="load">Réessayer</button>
        </div>

        <template v-else-if="report">
            <div class="summary-grid">
                <article class="summary-card"><span>Présents</span><strong>{{ number(report.total_presents) }}</strong><small>{{ number(report.total_absents) }} absent(s), {{ number(report.total_excuses) }} excusé(s)</small></article>
                <article class="summary-card"><span>Épargne collectée</span><strong>{{ money(report.total_epargne) }}</strong></article>
                <article class="summary-card"><span>Crédits accordés</span><strong>{{ money(report.total_credits) }}</strong></article>
                <article class="summary-card"><span>Remboursements</span><strong>{{ money(report.total_remboursements) }}</strong></article>
                <article class="summary-card"><span>Pénalités encaissées</span><strong>{{ money(report.total_penalites) }}</strong></article>
                <article class="summary-card summary-balance"><span>Solde des mouvements</span><strong>{{ money(report.solde) }}</strong><small>Entrées {{ money(report.total_entrees) }} · Sorties {{ money(report.total_sorties) }}</small></article>
            </div>

            <section class="table-card">
                <h2>Présences ({{ number(report.total_presences) }} enregistrée(s))</h2>
                <div v-if="!report.presences?.length" class="empty-state">Aucune présence n’a été saisie pour cette séance.</div>
                <div v-else class="table-scroll">
                    <table>
                        <thead><tr><th>N° membre</th><th>Membre</th><th>Statut</th><th>Observation</th></tr></thead>
                        <tbody>
                            <tr v-for="item in report.presences" :key="`${item.numero_membre}-${item.statut}`">
                                <td>{{ item.numero_membre }}</td>
                                <td>{{ fullName(item) }}</td>
                                <td>{{ presenceLabel(item.statut) }}</td>
                                <td>{{ item.observation || "—" }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section v-for="section in operationSections" :key="section.key" class="table-card">
                <h2>{{ section.title }} ({{ report[section.key]?.length || 0 }})</h2>
                <div v-if="!report[section.key]?.length" class="empty-state">Aucune opération.</div>
                <div v-else class="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>Membre</th>
                                <th v-for="column in section.columns" :key="column.label">{{ column.label }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(item, index) in report[section.key]" :key="item.id || `${item.numero_membre}-${index}`">
                                <td>{{ fullName(item) }}</td>
                                <td v-for="column in section.columns" :key="column.label">
                                    {{ column.format ? column.format(item[column.key]) : (item[column.key] || "—") }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </template>
    </section>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import rapportService from "../../service/rapport.service.js";
import { useToast } from "../../composables/useToast.js";

const route = useRoute();
const toast = useToast();
const report = ref(null);
const loading = ref(true);
const downloading = ref(false);
const error = ref("");
const money = (value) => new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "MGA",
    minimumFractionDigits: 0
}).format(Number(value || 0));
const number = (value) => Number(value || 0);
const fullName = (member) => [member.nom, member.prenom].filter(Boolean).join(" ") || "—";
const operationSections = computed(() => [
    {
        key: "epargnes",
        title: "Épargnes",
        columns: [
            { key: "nombre_parts", label: "Parts" },
            { key: "montant_total", label: "Montant", format: money }
        ]
    },
    {
        key: "credits",
        title: "Crédits",
        columns: [
            { key: "montant_capital", label: "Capital", format: money },
            { key: "montant_interet", label: "Intérêts prévus", format: money },
            { key: "statut", label: "Statut" }
        ]
    },
    {
        key: "remboursements",
        title: "Remboursements",
        columns: [
            { key: "montant_principal", label: "Capital remboursé", format: money },
            { key: "montant_interet", label: "Intérêts", format: money },
            { key: "montant", label: "Total", format: money }
        ]
    },
    {
        key: "penalites",
        title: "Pénalités",
        columns: [
            { key: "type_penalite", label: "Type" },
            { key: "montant", label: "Montant", format: money },
            { key: "statut", label: "Statut" },
            { key: "motif", label: "Motif" }
        ]
    }
]);

function presenceLabel(status) {
    return { PRESENT: "Présent", ABSENT: "Absent", EXCUSE: "Excusé" }[status] || status || "—";
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? String(value).slice(0, 10)
        : date.toLocaleDateString("fr-FR", { dateStyle: "long" });
}

async function load() {
    loading.value = true;
    error.value = "";
    try {
        const { data } = await rapportService.getSeanceReport(route.params.seanceId);
        report.value = data.data;
        if (!report.value) throw new Error("Aucun rapport disponible pour cette séance.");
    } catch (e) {
        error.value = e.response?.data?.message || e.message || "Impossible de charger le rapport de séance.";
    } finally {
        loading.value = false;
    }
}

async function downloadPdf() {
    if (!report.value || downloading.value) return;
    downloading.value = true;
    try {
        const response = await rapportService.downloadSeancePdf(route.params.seanceId);
        const url = URL.createObjectURL(response.data);
        const link = document.createElement("a");
        link.href = url;
        link.download = `rapport-seance-${report.value.seance_id}.pdf`;
        document.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
        toast.error(e.response?.data?.message || "Impossible de télécharger le rapport PDF.");
    } finally {
        downloading.value = false;
    }
}

load();
</script>

<style scoped>
.page { max-width: 1200px; margin: 0 auto; padding: 1rem; color: #1e293b; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; margin-bottom: 1.25rem; }
.back-link { color: #2563eb; text-decoration: none; font-size: .875rem; }
.eyebrow { margin: .75rem 0 .25rem; color: #2563eb; font-size: .75rem; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; }
h1 { margin: 0 0 .25rem; font-size: 1.7rem; }
h2 { margin: 0; padding: 1rem 1.15rem; font-size: 1rem; }
.subtitle { color: #64748b; }
.badge { border-radius: 999px; padding: .4rem .75rem; font-size: .78rem; font-weight: 700; }
.badge-open { background: #dcfce7; color: #166534; }
.badge-closed { background: #e2e8f0; color: #475569; }
.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap: .8rem; margin-bottom: 1rem; }
.summary-card, .table-card, .state-card { border: 1px solid #e2e8f0; border-radius: .75rem; background: #fff; }
.summary-card { display: flex; flex-direction: column; gap: .35rem; padding: 1rem; }
.summary-card span { color: #64748b; font-size: .78rem; font-weight: 650; }
.summary-card strong { font-size: 1.1rem; }
.summary-card small { color: #64748b; }
.summary-balance { border-color: #bfdbfe; background: #eff6ff; }
.table-card { margin-top: 1rem; overflow: hidden; }
.table-scroll { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: .875rem; }
th, td { padding: .75rem 1rem; border-top: 1px solid #e2e8f0; text-align: left; white-space: nowrap; }
th { background: #f8fafc; color: #64748b; font-size: .72rem; text-transform: uppercase; }
.empty-state { padding: 1rem; color: #64748b; }
.state-card { display: grid; min-height: 12rem; place-content: center; justify-items: center; gap: .75rem; color: #64748b; text-align: center; }
.state-error { color: #b91c1c; }
.button { border: 1px solid #cbd5e1; border-radius: .5rem; background: white; padding: .55rem .85rem; color: #334155; cursor: pointer; }
.button-download { border-color: #2563eb; background: #2563eb; color: #fff; }
.button-download:disabled { cursor: wait; opacity: .65; }
@media (max-width: 650px) { .page-header { align-items: flex-start; flex-direction: column; } }
</style>
