<template>
    <section class="page">
        <header class="page-header">
            <div>
                <router-link to="/rapports" class="back-link">← Retour aux rapports</router-link>
                <p class="eyebrow">Rapport de clôture</p>
                <h1 v-if="report">Cycle {{ report.numero_cycle }}</h1>
                <p v-if="report" class="subtitle">{{ report.voamami_code }} — {{ report.voamami_nom }}</p>
            </div>
            <span v-if="report" class="status-badge">{{ report.statut }}</span>
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

        <div v-if="loading" class="state-card">Chargement du rapport de clôture...</div>
        <div v-else-if="error" class="state-card state-error" role="alert">
            <p>{{ error }}</p>
            <button class="button button-secondary" @click="load">Réessayer</button>
        </div>
        <template v-else-if="report">
            <div class="summary-grid">
                <article class="summary-card"><span>Séances</span><strong>{{ number(report.nombre_seances) }}</strong></article>
                <article class="summary-card"><span>Membres actifs</span><strong>{{ number(report.nombre_membres) }}</strong></article>
                <article class="summary-card"><span>Épargne totale</span><strong>{{ money(report.total_epargne) }}</strong></article>
                <article class="summary-card"><span>Crédits accordés</span><strong>{{ money(report.total_credits) }}</strong></article>
                <article class="summary-card"><span>Remboursements</span><strong>{{ money(report.total_remboursements) }}</strong></article>
                <article class="summary-card"><span>Intérêts encaissés</span><strong>{{ money(report.total_interets) }}</strong></article>
                <article class="summary-card"><span>Pénalités encaissées</span><strong>{{ money(report.total_penalites) }}</strong></article>
                <article class="summary-card summary-balance"><span>Solde de caisse</span><strong>{{ money(report.solde_caisse) }}</strong></article>
            </div>

            <section class="table-card">
                <header class="table-heading">
                    <div>
                        <h2>Partage des bénéfices par membre</h2>
                        <p>{{ report.partage?.length || 0 }} membre(s)</p>
                    </div>
                </header>
                <div v-if="!report.partage?.length" class="empty-state">
                    Aucun partage n’est disponible pour ce cycle.
                </div>
                <div v-else class="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>N°</th>
                                <th>Membre</th>
                                <th>Capital</th>
                                <th>Part des intérêts</th>
                                <th>Part des pénalités</th>
                                <th>Total partagé</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in report.partage" :key="item.id">
                                <td>{{ item.numero_membre }}</td>
                                <td>{{ fullName(item) }}</td>
                                <td>{{ money(item.capital_membre) }}</td>
                                <td>{{ money(item.part_interets) }}</td>
                                <td>{{ money(item.part_penalites) }}</td>
                                <td class="total-cell">{{ money(item.montant_total_partage) }}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <th colspan="5">Total distribué</th>
                                <th>{{ money(totalPartage) }}</th>
                            </tr>
                        </tfoot>
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
const number = (value) => Number(value || 0);
const money = (value) => new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "MGA",
    minimumFractionDigits: 0
}).format(number(value));
const fullName = (item) => [item.nom, item.prenom].filter(Boolean).join(" ") || "—";
const totalPartage = computed(() =>
    (report.value?.partage || []).reduce(
        (total, item) => total + number(item.montant_total_partage),
        0
    )
);

async function load() {
    loading.value = true;
    error.value = "";
    try {
        const { data } = await rapportService.getCycleReport(route.params.cycleId);
        report.value = data.data;
        if (!report.value) throw new Error("Rapport de clôture introuvable.");
    } catch (e) {
        error.value = e.response?.data?.message || e.message || "Impossible de charger le rapport de clôture.";
    } finally {
        loading.value = false;
    }
}

async function downloadPdf() {
    if (!report.value || downloading.value) return;
    downloading.value = true;
    try {
        const response = await rapportService.downloadCyclePdf(route.params.cycleId);
        const url = URL.createObjectURL(response.data);
        const link = document.createElement("a");
        link.href = url;
        link.download = `rapport-cloture-cycle-${report.value.id}.pdf`;
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
.eyebrow { margin: .75rem 0 .25rem; color: #059669; font-size: .75rem; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; }
h1 { margin: 0 0 .25rem; font-size: 1.7rem; }
h2, p { margin: 0; }
.subtitle { color: #64748b; }
.status-badge { border-radius: 999px; background: #d1fae5; padding: .4rem .75rem; color: #047857; font-size: .78rem; font-weight: 700; }
.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap: .8rem; margin-bottom: 1rem; }
.summary-card, .table-card, .state-card { border: 1px solid #e2e8f0; border-radius: .75rem; background: #fff; }
.summary-card { display: flex; flex-direction: column; gap: .35rem; padding: 1rem; }
.summary-card span { color: #64748b; font-size: .78rem; font-weight: 650; }
.summary-card strong { font-size: 1.1rem; }
.summary-balance { border-color: #a7f3d0; background: #ecfdf5; }
.table-card { overflow: hidden; }
.table-heading { display: flex; justify-content: space-between; padding: 1rem 1.15rem; }
.table-heading h2 { margin-bottom: .25rem; font-size: 1rem; }
.table-heading p { color: #64748b; font-size: .85rem; }
.table-scroll { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: .875rem; }
th, td { padding: .75rem 1rem; border-top: 1px solid #e2e8f0; text-align: left; white-space: nowrap; }
thead { background: #f8fafc; color: #64748b; font-size: .72rem; text-transform: uppercase; }
tfoot { background: #f0fdf4; }
.total-cell, tfoot th:last-child { color: #047857; font-weight: 750; }
.empty-state { padding: 1.2rem; color: #64748b; }
.state-card { display: grid; min-height: 12rem; place-content: center; justify-items: center; gap: .75rem; color: #64748b; text-align: center; }
.state-error { color: #b91c1c; }
.button { border: 1px solid #cbd5e1; border-radius: .5rem; background: white; padding: .55rem .85rem; color: #334155; cursor: pointer; }
.button-download { border-color: #2563eb; background: #2563eb; color: #fff; }
.button-download:disabled { cursor: wait; opacity: .65; }
@media (max-width: 650px) { .page-header { align-items: flex-start; flex-direction: column; } }
</style>
