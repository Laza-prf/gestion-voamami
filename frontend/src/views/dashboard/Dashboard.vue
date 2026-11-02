<template>
    <section class="dashboard">
        <header class="page-header">
            <div>
                <p class="eyebrow">Tableau de bord</p>
                <h1>Bonjour{{ auth.user?.prenom ? `, ${auth.user.prenom}` : "" }}</h1>
                <p class="subtitle">Vue d’ensemble des activités VOAMAMI.</p>
                <p v-if="auth.isAgentFid && voamamis[0]" class="assigned-voamami">
                    <span>Votre VOAMAMI</span>
                    <strong>{{ voamamis[0].code }} — {{ voamamis[0].nom }}</strong>
                </p>
            </div>
            <router-link to="/operations" class="button button-primary">Assistant de séance →</router-link>
        </header>

        <div v-if="loading" class="state-card">Chargement des indicateurs...</div>
        <div v-else-if="error" class="state-card state-error" role="alert">
            <p>{{ error }}</p>
            <button class="button button-secondary" @click="load">Réessayer</button>
        </div>
        <template v-else>
            <div class="stats-grid">
                <article class="stat-card">
                    <span class="stat-icon icon-blue">◎</span>
                    <span class="stat-label">{{ auth.isAgentFid ? "Mon VOAMAMI" : "Groupes VOAMAMI" }}</span>
                    <strong>{{ auth.isAgentFid ? (voamamis[0]?.code || "—") : voamamis.length }}</strong>
                </article>
                <article class="stat-card">
                    <span class="stat-icon icon-violet">▤</span>
                    <span class="stat-label">Membres actifs</span>
                    <strong>{{ activeMembers }}</strong>
                </article>
                <article class="stat-card">
                    <span class="stat-icon icon-green">◷</span>
                    <span class="stat-label">Séances ouvertes</span>
                    <strong>{{ openSessions }}</strong>
                </article>
                <article class="stat-card">
                    <span class="stat-icon icon-amber">↻</span>
                    <span class="stat-label">Cycles ouverts</span>
                    <strong>{{ openCycles }}</strong>
                </article>
            </div>

            <div class="finance-grid">
                <article class="finance-card">
                    <span>Épargne enregistrée</span>
                    <strong>{{ money(totalSavings) }}</strong>
                    <router-link to="/epargnes">Voir les épargnes →</router-link>
                </article>
                <article class="finance-card">
                    <span>Crédits accordés</span>
                    <strong>{{ money(totalLoans) }}</strong>
                    <router-link to="/credits">Voir les crédits →</router-link>
                </article>
                <article class="finance-card">
                    <span>Remboursements reçus</span>
                    <strong>{{ money(totalRepayments) }}</strong>
                    <router-link to="/remboursements">Voir les remboursements →</router-link>
                </article>
            </div>

            <section class="panel balance-panel" aria-labelledby="balance-chart-title">
                <header class="panel-header">
                    <div>
                        <h2 id="balance-chart-title">{{ auth.isAgentFid ? "Solde de caisse de mon VOAMAMI" : "Soldes de caisse par VOAMAMI" }}</h2>
                        <p>{{ auth.isAgentFid ? "Situation du groupe affecté · MGA" : "Les cinq groupes ayant les soldes les plus élevés · MGA" }}</p>
                    </div>
                    <router-link to="/caisse">Voir les caisses</router-link>
                </header>

                <div v-if="balanceLoading" class="chart-state">Chargement des soldes...</div>
                <div v-else-if="balanceError" class="chart-state chart-error" role="alert">
                    {{ balanceError }}
                    <button type="button" class="button button-secondary" @click="loadBalances">
                        Réessayer
                    </button>
                </div>
                <div v-else-if="topBalances.length === 0" class="chart-state">
                    Aucun VOAMAMI à afficher.
                </div>
                <div v-else class="balance-chart" role="list" :aria-label="auth.isAgentFid ? 'Solde du VOAMAMI affecté' : 'Top cinq des soldes VOAMAMI'">
                    <article
                        v-for="(item, index) in topBalances"
                        :key="item.voamami_id"
                        class="balance-row"
                        role="listitem"
                    >
                        <div class="balance-heading">
                            <span class="balance-rank">{{ index + 1 }}</span>
                            <span class="balance-name">
                                <strong>{{ item.voamami_code }}</strong>
                                <span>{{ item.voamami_nom }}</span>
                            </span>
                            <strong class="balance-value">{{ money(item.solde) }}</strong>
                        </div>
                        <div class="balance-track" aria-hidden="true">
                            <span class="balance-zero"></span>
                            <span
                                :class="['balance-bar', item.solde < 0 ? 'negative' : 'positive']"
                                :style="balanceBarStyle(item.solde)"
                            ></span>
                        </div>
                    </article>
                </div>
            </section>

            <div class="content-grid">
                <section class="panel">
                    <header class="panel-header">
                        <div>
                            <h2>Séances récentes</h2>
                            <p>Les dernières activités enregistrées.</p>
                        </div>
                        <router-link to="/seances">Toutes les séances</router-link>
                    </header>
                    <div v-if="recentSessions.length === 0" class="empty-state">Aucune séance n’est enregistrée.</div>
                    <div v-else class="session-list">
                        <article v-for="session in recentSessions" :key="session.id" class="session-row">
                            <div class="session-marker">S{{ session.numero_seance || session.id }}</div>
                            <div class="session-info">
                                <strong>{{ session.voamami_code || "VOAMAMI" }} — {{ session.voamami_nom || "Groupe" }}</strong>
                                <span>Cycle {{ session.numero_cycle || "—" }} · {{ formatDate(session.date_seance) }}</span>
                            </div>
                            <span :class="['status-badge', session.statut === 'OUVERTE' ? 'status-open' : 'status-closed']">
                                {{ session.statut === "OUVERTE" ? "Ouverte" : "Clôturée" }}
                            </span>
                            <router-link
                                v-if="session.statut === 'OUVERTE'"
                                :to="`/seances/${session.id}/operations`"
                                class="session-action"
                                aria-label="Ouvrir les opérations de cette séance"
                            >→</router-link>
                            <router-link
                                v-else
                                :to="{ name: 'rapport-seance', params: { seanceId: session.id } }"
                                class="session-action"
                                aria-label="Voir le rapport de cette séance"
                            >→</router-link>
                        </article>
                    </div>
                </section>

                <aside class="panel quick-actions">
                    <h2>Accès rapides</h2>
                    <router-link to="/seances/nouveau"><span>＋</span>Créer une séance</router-link>
                    <router-link to="/membres"><span>♙</span>Gérer les membres</router-link>
                    <router-link to="/rapports"><span>▤</span>Consulter les rapports</router-link>
                    <router-link to="/cycles"><span>↻</span>Gérer les cycles</router-link>
                </aside>
            </div>
        </template>
    </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useAuthStore } from "../../stores/auth.store.js";
import voamamiService from "../../service/voamami.service.js";
import membreService from "../../service/membre.service.js";
import cycleService from "../../service/cycle.service.js";
import seanceService from "../../service/seance.service.js";
import epargneService from "../../service/epargne.service.js";
import creditService from "../../service/credit.service.js";
import remboursementService from "../../service/remboursement.service.js";
import mouvementCaisseService from "../../service/mouvement-caisse.service.js";

const auth = useAuthStore();
const loading = ref(true);
const error = ref("");
const voamamis = ref([]);
const members = ref([]);
const cycles = ref([]);
const sessions = ref([]);
const savings = ref([]);
const credits = ref([]);
const repayments = ref([]);
const balances = ref([]);
const balanceLoading = ref(true);
const balanceError = ref("");

const assignedVoamami = computed(() =>
    auth.isAgentFid ? voamamis.value[0] ?? null : null
);
const activeMembers = computed(() =>
    members.value.filter((member) => member.actif === 1 || member.actif === true).length
);
const openSessions = computed(() =>
    sessions.value.filter((session) => session.statut === "OUVERTE").length
);
const openCycles = computed(() =>
    cycles.value.filter((cycle) => cycle.statut === "OUVERT").length
);
const totalSavings = computed(() =>
    savings.value.reduce((sum, item) => sum + Number(item.montant_total || 0), 0)
);
const totalLoans = computed(() =>
    credits.value.reduce((sum, item) => sum + Number(item.montant_capital || 0), 0)
);
const totalRepayments = computed(() =>
    repayments.value.reduce((sum, item) => sum + Number(item.montant || 0), 0)
);
const recentSessions = computed(() =>
    [...sessions.value]
        .sort((left, right) => new Date(right.date_seance) - new Date(left.date_seance))
        .slice(0, 5)
);
const topBalances = computed(() =>
    [...balances.value]
        .filter((item) =>
            !auth.isAgentFid ||
            (assignedVoamami.value &&
                Number(item.voamami_id) === Number(assignedVoamami.value.id))
        )
        .sort((left, right) => Number(right.solde) - Number(left.solde))
        .slice(0, 5)
);
const maxBalanceMagnitude = computed(() =>
    Math.max(1, ...topBalances.value.map((item) => Math.abs(Number(item.solde) || 0)))
);

function balanceBarStyle(value) {
    const amount = Number(value) || 0;
    const width = Math.abs(amount) / maxBalanceMagnitude.value * 50;
    return amount < 0
        ? { width: `${width}%`, right: "50%" }
        : { width: `${width}%`, left: "50%" };
}

function unwrap(response, keys = []) {
    const payload = response?.data?.data ?? response?.data;
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object") {
        for (const key of keys) {
            if (Array.isArray(payload[key])) return payload[key];
        }
    }
    throw new Error("Le format des données du tableau de bord est invalide.");
}

function money(value) {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "MGA",
        minimumFractionDigits: 0
    }).format(Number(value || 0));
}

function formatDate(value) {
    if (!value) return "Date non renseignée";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? String(value).slice(0, 10)
        : date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function filterAssignedVoamamiData() {
    if (!auth.isAgentFid) return;
    if (voamamis.value.length !== 1) {
        throw new Error(
            "Le compte agent doit être affecté à un seul VOAMAMI pour afficher le tableau de bord."
        );
    }

    const voamamiId = Number(voamamis.value[0].id);
    const belongsToVoamami = (item) =>
        Number(item.voamami_id) === voamamiId;

    members.value = members.value.filter(belongsToVoamami);
    cycles.value = cycles.value.filter(belongsToVoamami);
    sessions.value = sessions.value.filter(belongsToVoamami);

    const cycleIds = new Set(cycles.value.map((cycle) => Number(cycle.id)));
    const memberIds = new Set(members.value.map((member) => Number(member.id)));
    const sessionIds = new Set(sessions.value.map((session) => Number(session.id)));
    const belongsToAssignedCycle = (item) =>
        cycleIds.has(Number(item.cycle_id)) &&
        memberIds.has(Number(item.membre_id)) &&
        sessionIds.has(Number(item.seance_id));

    savings.value = savings.value.filter(belongsToAssignedCycle);
    credits.value = credits.value.filter(belongsToAssignedCycle);
    repayments.value = repayments.value.filter(belongsToAssignedCycle);
}

async function load() {
    loading.value = true;
    error.value = "";
    try {
        const balanceRequest = loadBalances();
        const [voamamiResponse, membersResponse, cyclesResponse, sessionsResponse,
            savingsResponse, creditsResponse, repaymentsResponse] = await Promise.all([
            voamamiService.getAll(),
            membreService.getAll(),
            cycleService.getAll(),
            seanceService.getAll(),
            epargneService.getAll(),
            creditService.getAll(),
            remboursementService.getAll()
        ]);
        voamamis.value = unwrap(voamamiResponse, ["voamamis"]);
        members.value = unwrap(membersResponse, ["membres"]);
        cycles.value = unwrap(cyclesResponse, ["cycles"]);
        sessions.value = unwrap(sessionsResponse, ["seances"]);
        savings.value = unwrap(savingsResponse, ["epargnes"]);
        credits.value = unwrap(creditsResponse, ["credits"]);
        repayments.value = unwrap(repaymentsResponse, ["remboursements"]);
        filterAssignedVoamamiData();
        await balanceRequest;
    } catch (e) {
        error.value = e.response?.data?.message || e.message || "Impossible de charger les indicateurs.";
    } finally {
        loading.value = false;
    }
}

async function loadBalances() {
    balanceLoading.value = true;
    balanceError.value = "";
    try {
        const response = await mouvementCaisseService.getBalancesByVoamami();
        balances.value = unwrap(response);
    } catch (e) {
        balanceError.value =
            e.response?.data?.message ||
            e.message ||
            "Impossible de charger les soldes par VOAMAMI.";
        balances.value = [];
    } finally {
        balanceLoading.value = false;
    }
}

onMounted(load);
</script>

<style scoped>
.dashboard { max-width: 1400px; margin: 0 auto; padding: .5rem; color: #1e293b; }
.page-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
.eyebrow { margin: 0 0 .35rem; color: #2563eb; font-size: .72rem; font-weight: 750; letter-spacing: .09em; text-transform: uppercase; }
h1 { margin: 0; color: #0f172a; font-size: 1.8rem; }
.subtitle, .panel-header p { margin: .3rem 0 0; color: #64748b; font-size: .9rem; }
.assigned-voamami { display: flex; flex-wrap: wrap; align-items: baseline; gap: .35rem .55rem; margin: .75rem 0 0;; padding: .35rem .65rem; background: #eff6ff; color: #334155; font-size: .82rem; }
.assigned-voamami span { color: #64748b; }
.assigned-voamami strong { color: #1d4ed8; }
.button { display: inline-flex; align-items: center; justify-content: center; min-height: 2.6rem; border-radius: .55rem; padding: .65rem 1rem; font-weight: 650; text-decoration: none; }
.button-primary { background: #2563eb; color: #fff; }
.button-secondary { border: 1px solid #cbd5e1; background: #fff; color: #334155; cursor: pointer; }
.stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
.stat-card, .finance-card, .panel, .state-card { border: 1px solid #e2e8f0; border-radius: .85rem; background: #fff; box-shadow: 0 1px 3px rgb(15 23 42 / 4%); }
.stat-card { display: grid; grid-template-columns: auto 1fr; align-items: center; column-gap: .8rem; padding: 1rem; }
.stat-icon { display: grid; width: 2.7rem; height: 2.7rem; grid-row: span 2; place-items: center; border-radius: .75rem; font-size: 1.25rem; font-weight: 700; }
.icon-blue { background: gainsboro; color: blue; }
.icon-violet { background: gainsboro; color: purple; }
.icon-green { background: gainsboro; color: green; }
.icon-amber { background: gainsboro; color: black; }
.stat-label, .finance-card > span { color: #64748b; font-size: .8rem; }
.stat-card strong { color: #0f172a; font-size: 1.45rem; }
.finance-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; margin-top: 1rem; }
.finance-card { display: flex; flex-direction: column; gap: .45rem; padding: 1.15rem; }
.finance-card strong { font-size: 1.35rem; }
.finance-card a, .panel-header a { color: #2563eb; font-size: .85rem; font-weight: 650; text-decoration: none; }
.balance-panel { margin-top: 1rem; }
.balance-chart { display: grid; gap: 1rem; }
.balance-row { min-width: 0; }
.balance-heading { display: flex; align-items: center; gap: .7rem; }
.balance-rank { display: grid; width: 1.75rem; height: 1.75rem; flex: 0 0 auto; place-items: center; border-radius: 50%; background: #eff6ff; color: #1d4ed8; font-size: .78rem; font-weight: 750; }
.balance-name { display: flex; min-width: 0; flex: 1; align-items: baseline; gap: .45rem; }
.balance-name strong { color: #0f172a; font-size: .9rem; }
.balance-name span { overflow: hidden; color: #64748b; font-size: .82rem; text-overflow: ellipsis; white-space: nowrap; }
.balance-value { flex: 0 0 auto; color: #0f172a; font-size: .9rem; font-variant-numeric: tabular-nums; }
.balance-track { position: relative; height: .65rem; margin: .45rem 0 0 2.45rem; overflow: hidden; border-radius: 999px; background: #f1f5f9; }
.balance-zero { position: absolute; z-index: 1; top: 0; bottom: 0; left: 50%; width: 1px; background: #94a3b8; }
.balance-bar { position: absolute; top: 0; bottom: 0; border-radius: 999px; }
.balance-bar.positive { background: linear-gradient(90deg, #60a5fa, #2563eb); }
.balance-bar.negative { background: linear-gradient(90deg, #f87171, #dc2626); }
.chart-state { display: grid; min-height: 8rem; place-content: center; justify-items: center; gap: .7rem; color: #64748b; text-align: center; }
.chart-error { color: #b91c1c; }
.content-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(230px, 1fr); gap: 1rem; margin-top: 1rem; }
.panel { overflow: hidden; padding: 1.15rem; }
.panel-header { display: flex; align-items: center; justify-content: space-between; gap: .75rem; margin-bottom: .8rem; }
h2 { margin: 0; font-size: 1rem; }
.session-row { display: flex; align-items: center; gap: .8rem; border-top: 1px solid #f1f5f9; padding: .8rem 0; }
.session-marker { display: grid; width: 2.6rem; height: 2.6rem; flex: 0 0 auto; place-items: center; border-radius: .65rem; background: #eff6ff; color: #2563eb; font-size: .78rem; font-weight: 750; }
.session-info { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: .2rem; }
.session-info strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .88rem; }
.session-info span { color: #64748b; font-size: .78rem; }
.status-badge { flex: 0 0 auto; border-radius: 999px; padding: .25rem .55rem; font-size: .7rem; font-weight: 700; }
.status-open { background: #dcfce7; color: #166534; }
.status-closed { background: #e2e8f0; color: #475569; }
.session-action { color: #2563eb; font-size: 1.2rem; text-decoration: none; }
.quick-actions { display: flex; flex-direction: column; gap: .6rem; }
.quick-actions h2 { margin-bottom: .35rem; }
.quick-actions a { display: flex; align-items: center; gap: .65rem; border: 1px solid #e2e8f0; border-radius: .6rem; padding: .7rem; color: #334155; font-size: .85rem; text-decoration: none; }
.quick-actions a:hover { border-color: #93c5fd; background: #f8fbff; }
.quick-actions a span { color: #2563eb; font-size: 1.1rem; }
.empty-state { padding: 1rem; color: #64748b; text-align: center; }
.state-card { display: grid; min-height: 14rem; place-content: center; justify-items: center; gap: .75rem; color: #64748b; text-align: center; }
.state-error { color: #b91c1c; }
:global(html.dark) .dashboard { color: #e5eaf2; }
:global(html.dark) .dashboard h1,
:global(html.dark) .dashboard h2,
:global(html.dark) .balance-name strong,
:global(html.dark) .balance-value { color: #e5eaf2; }
:global(html.dark) .dashboard .stat-card,
:global(html.dark) .dashboard .finance-card,
:global(html.dark) .dashboard .panel,
:global(html.dark) .dashboard .state-card { border-color: #2b374a; background: #151e2e; }
:global(html.dark) .dashboard .session-row { border-color: #2b374a; }
:global(html.dark) .dashboard .assigned-voamami { background: #172b48; color: #e5eaf2; }
:global(html.dark) .dashboard .assigned-voamami strong { color: #93c5fd; }
:global(html.dark) .dashboard .quick-actions a { border-color: #2b374a; color: #cbd5e1; }
:global(html.dark) .dashboard .balance-track { background: #263449; }
:global(html.dark) .dashboard .balance-rank { background: #172b48; color: #93c5fd; }
:global(html.dark) .dashboard .subtitle,
:global(html.dark) .dashboard .panel-header p,
:global(html.dark) .dashboard .stat-label,
:global(html.dark) .dashboard .finance-card > span,
:global(html.dark) .dashboard .session-info span,
:global(html.dark) .dashboard .balance-name span { color: #9aa8bb; }
@media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } .content-grid { grid-template-columns: 1fr; } }
@media (max-width: 650px) { .dashboard { padding: 0; } .page-header { align-items: flex-start; flex-direction: column; } .finance-grid { grid-template-columns: 1fr; } .session-row { flex-wrap: wrap; } .session-info { flex-basis: calc(100% - 3.5rem); } .balance-heading { gap: .5rem; } .balance-name { align-items: flex-start; flex-direction: column; gap: 0; } .balance-value { font-size: .8rem; } }
</style>
