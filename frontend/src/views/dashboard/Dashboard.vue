<template>
    <section class="dashboard">
        <header class="page-header">
            <div>
                <p class="eyebrow">Tableau de bord</p>
                <h1>
                    Bonjour{{ auth.user?.prenom ? `, ${auth.user.prenom}` : "" }}
                </h1>
                <p class="subtitle">
                    Vue d’ensemble des activités VOAMAMI.
                </p>
                <p
                    v-if="isAgent && voamamis[0]"
                    class="assigned-voamami"
                >
                    <span>Votre VOAMAMI</span>
                    <strong>
                        {{ voamamis[0].code }} — {{ voamamis[0].nom }}
                    </strong>
                </p>
            </div>

            <router-link
                to="/operations"
                class="button button-primary"
            >
                Assistant de séance →
            </router-link>
        </header>

        <div
            v-if="loading"
            class="state-card"
        >
            Chargement des indicateurs...
        </div>

        <div
            v-else-if="error"
            class="state-card state-error"
            role="alert"
        >
            <p>{{ error }}</p>
            <button
                type="button"
                class="button button-secondary"
                @click="load"
            >
                Réessayer
            </button>
        </div>

        <template v-else>
            <div class="stats-grid">
                <article class="stat-card">
                    <span class="stat-icon icon-blue">◎</span>
                    <span class="stat-label">
                        {{ isAgent ? "Mon VOAMAMI" : "Groupes VOAMAMI" }}
                    </span>
                    <strong>
                        {{ isAgent ? voamamis[0]?.code || "—" : voamamis.length }}
                    </strong>
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

            <div
                v-if="isAgent"
                class="finance-grid"
            >
                <article class="finance-card finance-savings">
                    <span>Épargne enregistrée</span>
                    <strong>{{ money(totalSavings) }}</strong>
                    <router-link to="/epargnes">
                        Voir les épargnes →
                    </router-link>
                </article>

                <article class="finance-card finance-loans">
                    <span>Crédits accordés</span>
                    <strong>{{ money(totalLoans) }}</strong>
                    <router-link to="/credits">
                        Voir les crédits →
                    </router-link>
                </article>

                <article class="finance-card finance-repayments">
                    <span>Remboursements reçus</span>
                    <strong>{{ money(totalRepayments) }}</strong>
                    <router-link to="/remboursements">
                        Voir les remboursements →
                    </router-link>
                </article>
            </div>

            <section
                class="panel balance-panel"
                aria-labelledby="balance-chart-title"
            >
                <header class="panel-header">
                    <div>
                        <h2 id="balance-chart-title">
                            {{
                                isAgent
                                    ? "Solde de caisse de mon VOAMAMI"
                                    : "Soldes de caisse par VOAMAMI"
                            }}
                        </h2>
                        <p>
                            {{
                                isAgent
                                    ? "Situation du groupe affecté · MGA"
                                    : "Top 10 des VOAMAMI selon leur solde · MGA"
                            }}
                        </p>
                    </div>

                    <router-link to="/caisse">
                        Voir les caisses
                    </router-link>
                </header>

                <div
                    v-if="balanceLoading"
                    class="chart-state"
                >
                    Chargement du graphique...
                </div>

                <div
                    v-else-if="balanceError"
                    class="chart-state chart-error"
                    role="alert"
                >
                    <span>{{ balanceError }}</span>
                    <button
                        type="button"
                        class="button button-secondary"
                        @click="loadBalances"
                    >
                        Réessayer
                    </button>
                </div>

                <div
                    v-else-if="topBalances.length === 0"
                    class="chart-state"
                >
                    Aucun solde de caisse à afficher.
                </div>

                <div
                    v-else
                    class="balance-chart-wrapper"
                >
                    <canvas
                        ref="balanceCanvas"
                        aria-label="Graphique vertical des soldes des VOAMAMI"
                    ></canvas>
                </div>
            </section>

            <section
                v-if="isAgent"
                class="panel top-members-panel"
                aria-labelledby="top-members-title"
            >
                <header class="panel-header">
                    <div>
                        <h2 id="top-members-title">
                            Membres avec les plus grandes épargnes
                        </h2>
                        <p>
                            Les cinq membres ayant les soldes d’épargne les plus élevés
                        </p>
                    </div>

                    <router-link to="/membres">
                        Voir les membres
                    </router-link>
                </header>

                <div
                    v-if="topSavingMembers.length === 0"
                    class="empty-state"
                >
                    Aucun membre avec une épargne enregistrée.
                </div>

                <div
                    v-else
                    class="top-members-list"
                >
                    <article
                        v-for="(member, index) in topSavingMembers"
                        :key="member.membre_id"
                        class="top-member-row"
                    >
                        <span class="member-rank">
                            {{ index + 1 }}
                        </span>

                        <div class="member-avatar">
                            {{ member.nom.charAt(0).toUpperCase() }}
                        </div>

                        <div class="member-info">
                            <strong>
                                {{ member.nom }} {{ member.prenom }}
                            </strong>
                            <span>
                                Membre n°{{ member.numero_membre || "—" }}
                            </span>
                        </div>

                        <strong class="member-saving">
                            {{ money(member.total_epargne) }}
                        </strong>
                    </article>
                </div>
            </section>

            <section class="panel sessions-panel">
                <header class="panel-header">
                    <div>
                        <h2>Séances récentes</h2>
                        <p>Les dernières activités enregistrées.</p>
                    </div>
                    <router-link to="/seances">
                        Toutes les séances
                    </router-link>
                </header>

                <div
                    v-if="recentSessions.length === 0"
                    class="empty-state"
                >
                    Aucune séance n’est enregistrée.
                </div>

                <div
                    v-else
                    class="session-list"
                >
                    <article
                        v-for="session in recentSessions"
                        :key="session.id"
                        class="session-row"
                    >
                        <div class="session-marker">
                            S{{ session.numero_seance || session.id }}
                        </div>

                        <div class="session-info">
                            <strong>
                                {{ session.voamami_code || "VOAMAMI" }} —
                                {{ session.voamami_nom || "Groupe" }}
                            </strong>
                            <span>
                                Cycle {{ session.numero_cycle || "—" }} ·
                                {{ formatDate(session.date_seance) }}
                            </span>
                        </div>

                        <span
                            :class="[
                                'status-badge',
                                session.statut === 'OUVERTE'
                                    ? 'status-open'
                                    : 'status-closed'
                            ]"
                        >
                            {{ session.statut === "OUVERTE" ? "Ouverte" : "Clôturée" }}
                        </span>

                        <router-link
                            v-if="session.statut === 'OUVERTE'"
                            :to="`/seances/${session.id}/operations`"
                            class="session-action"
                            aria-label="Ouvrir les opérations de cette séance"
                        >
                            →
                        </router-link>

                        <router-link
                            v-else
                            :to="{
                                name: 'rapport-seance',
                                params: { seanceId: session.id }
                            }"
                            class="session-action"
                            aria-label="Voir le rapport de cette séance"
                        >
                            →
                        </router-link>
                    </article>
                </div>
            </section>
        </template>
    </section>
</template>

<script setup>
import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    watch
} from "vue";
import Chart from "chart.js/auto";
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

const isAgent = computed(() =>
    auth.user?.role === "AGENT_FID"
);

const isAdmin = computed(() =>
    auth.user?.role === "ADMINISTRATEUR"
);

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
const balanceCanvas = ref(null);
let balanceChart = null;
let themeObserver = null;

const assignedVoamami = computed(() =>
    isAgent.value
        ? voamamis.value[0] ?? null
        : null
);

const activeMembers = computed(() =>
    members.value.filter((member) =>
        member.actif === 1 ||
        member.actif === true ||
        member.actif === "1"
    ).length
);

const openSessions = computed(() =>
    sessions.value.filter(
        (session) => session.statut === "OUVERTE"
    ).length
);

const openCycles = computed(() =>
    cycles.value.filter(
        (cycle) => cycle.statut === "OUVERT"
    ).length
);

const totalSavings = computed(() =>
    savings.value.reduce((sum, item) => {
        const amount = Number(
            item.montant_total ??
            item.montant ??
            item.montant_epargne ??
            0
        );

        return sum + amount;
    }, 0)
);

const totalLoans = computed(() =>
    credits.value.reduce((sum, item) => {
        const amount = Number(
            item.montant_capital ??
            item.montant_principal ??
            item.montant ??
            0
        );

        return sum + amount;
    }, 0)
);

const totalRepayments = computed(() =>
    repayments.value.reduce((sum, item) => {
        const amount = Number(
            item.montant ??
            item.montant_rembourse ??
            item.montant_total ??
            0
        );

        return sum + amount;
    }, 0)
);

const recentSessions = computed(() =>
    [...sessions.value]
        .sort(
            (left, right) =>
                new Date(right.date_seance) -
                new Date(left.date_seance)
        )
        .slice(0, 5)
);

const topBalances = computed(() => {
    const filteredRows = [...balances.value].filter((item) => {
        if (!isAgent.value) {
            return true;
        }

        return (
            assignedVoamami.value &&
            Number(item.voamami_id) ===
                Number(assignedVoamami.value.id)
        );
    });

    return filteredRows
        .sort(
            (left, right) =>
                Number(right.solde ?? 0) -
                Number(left.solde ?? 0)
        )
        .slice(0, isAgent.value ? 1 : 10);
});

const topSavingMembers = computed(() =>
    [...members.value]
        .filter((member) => {
            const active =
                member.actif === 1 ||
                member.actif === true ||
                member.actif === "1";

            return active && Number(member.solde_epargne || 0) > 0;
        })
        .sort(
            (left, right) =>
                Number(right.solde_epargne || 0) -
                Number(left.solde_epargne || 0)
        )
        .slice(0, 5)
        .map((member) => ({
            membre_id: Number(member.id),
            nom: member.nom || "Membre",
            prenom: member.prenom || "",
            numero_membre: member.numero_membre,
            total_epargne: Number(member.solde_epargne || 0)
        }))
);

function unwrap(response, keys = []) {
    const payload =
        response?.data?.data ??
        response?.data;

    if (Array.isArray(payload)) {
        return payload;
    }

    if (payload && typeof payload === "object") {
        for (const key of keys) {
            if (Array.isArray(payload[key])) {
                return payload[key];
            }
        }
    }

    throw new Error(
        "Le format des données du tableau de bord est invalide."
    );
}

function money(value) {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "MGA",
        minimumFractionDigits: 0
    }).format(Number(value || 0));
}

function formatDate(value) {
    if (!value) {
        return "Date non renseignée";
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? String(value).slice(0, 10)
        : date.toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric"
          });
}

function destroyBalanceChart() {
    if (balanceChart) {
        balanceChart.destroy();
        balanceChart = null;
    }
}

async function renderBalanceChart() {
    await nextTick();

    if (!balanceCanvas.value) {
        console.warn(
            "Canvas du graphique non disponible après la mise à jour du DOM."
        );
        return;
    }

    if (!topBalances.value.length) {
        destroyBalanceChart();
        return;
    }

    destroyBalanceChart();

    const labels = topBalances.value.map((item) => {
        const code =
            item.voamami_code ||
            item.code ||
            "VOAMAMI";

        const nom =
            item.voamami_nom ||
            item.nom ||
            "";

        return nom ? [code, nom] : code;
    });

    const values = topBalances.value.map((item) =>
        Number(
            item.solde ??
            item.solde_caisse ??
            item.balance ??
            0
        )
    );

    const themeStyles = getComputedStyle(document.documentElement);
    const chartText = themeStyles.getPropertyValue("--voa-chart-text").trim();
    const chartMuted = themeStyles.getPropertyValue("--voa-chart-muted").trim();
    const chartGrid = themeStyles.getPropertyValue("--voa-chart-grid").trim();
    const darkMode = document.documentElement.classList.contains("dark");
    const colors = values.map((value) => {
        if (value < 0) {
            return darkMode ? "#f87171" : "#dc2626";
        }

        return darkMode ? "#60a5fa" : "#2563eb";
    });

    balanceChart = new Chart(balanceCanvas.value, {
        type: "bar",

        data: {
            labels,
            datasets: [
                {
                    label: "Solde de caisse",
                    data: values,
                    backgroundColor: colors,
                    borderColor: colors,
                    borderWidth: 1,
                    borderRadius: 7,
                    barPercentage: 0.65,
                    categoryPercentage: 0.7,
                    maxBarThickness: 55
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    backgroundColor: darkMode ? "#1e293b" : "#0f172a",
                    titleColor: "#f8fafc",
                    bodyColor: "#f8fafc",
                    borderColor: darkMode ? "#475569" : "#1e293b",
                    borderWidth: 1,
                    callbacks: {
                        label(context) {
                            return ` ${money(context.raw)}`;
                        }
                    }
                }
            },

            scales: {
                x: {
                    ticks: {
                        color: chartText,
                        maxRotation: 0,
                        minRotation: 0,
                        autoSkip: false,
                        font: {
                            size: 11,
                            weight: "600"
                        }
                    },

                    grid: {
                        display: false
                    }
                },

                y: {
                    beginAtZero: true,

                    ticks: {
                        color: chartMuted,
                        callback(value) {
                            return money(value);
                        }
                    },

                    grid: {
                        color: chartGrid
                    }
                }
            }
        }
    });
}

async function loadBalances() {
    balanceLoading.value = true;
    balanceError.value = "";
    destroyBalanceChart();

    try {
        const response =
            await mouvementCaisseService.getBalancesByVoamami();

        console.log(
            "Réponse brute des soldes VOAMAMI :",
            response
        );

        balances.value = unwrap(response, [
            "balances",
            "soldes",
            "mouvements"
        ]);

        console.log(
            "Soldes VOAMAMI extraits :",
            balances.value
        );
    } catch (e) {
        console.error(
            "Erreur chargement soldes :",
            e.response?.data || e
        );

        balanceError.value =
            e.response?.data?.message ||
            e.message ||
            "Impossible de charger les soldes par VOAMAMI.";

        balances.value = [];
    } finally {
        balanceLoading.value = false;
    }
}

function filterAssignedVoamamiData() {
    if (!isAgent.value) {
        return;
    }

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

    const cycleIds = new Set(
        cycles.value.map((cycle) => Number(cycle.id))
    );

    const memberIds = new Set(
        members.value.map((member) => Number(member.id))
    );

    const sessionIds = new Set(
        sessions.value.map((session) => Number(session.id))
    );

    const belongsToAssignedCycle = (item) =>
        cycleIds.has(Number(item.cycle_id)) &&
        memberIds.has(Number(item.membre_id)) &&
        sessionIds.has(Number(item.seance_id));

    savings.value = savings.value.filter(
        belongsToAssignedCycle
    );

    credits.value = credits.value.filter(
        belongsToAssignedCycle
    );

    repayments.value = repayments.value.filter(
        belongsToAssignedCycle
    );
}

async function load() {
    loading.value = true;
    error.value = "";

    try {
        const [
            voamamiResponse,
            membersResponse,
            cyclesResponse,
            sessionsResponse,
            savingsResponse,
            creditsResponse,
            repaymentsResponse
        ] = await Promise.all([
            voamamiService.getAll(),
            membreService.getAll(),
            cycleService.getAll(),
            seanceService.getAll(),
            epargneService.getAll(),
            creditService.getAll(),
            remboursementService.getAll()
        ]);

        voamamis.value = unwrap(
            voamamiResponse,
            ["voamamis"]
        );

        members.value = unwrap(
            membersResponse,
            ["membres"]
        );

        cycles.value = unwrap(
            cyclesResponse,
            ["cycles"]
        );

        sessions.value = unwrap(
            sessionsResponse,
            ["seances"]
        );

        savings.value = unwrap(
            savingsResponse,
            ["epargnes"]
        );

        credits.value = unwrap(
            creditsResponse,
            ["credits"]
        );

        repayments.value = unwrap(
            repaymentsResponse,
            ["remboursements"]
        );

        filterAssignedVoamamiData();

        await loadBalances();
    } catch (e) {
        console.error(
            "Erreur chargement dashboard :",
            e.response?.data || e
        );

        error.value =
            e.response?.data?.message ||
            e.message ||
            "Impossible de charger les indicateurs.";
    } finally {
        // Le canvas est rendu ici uniquement après l'affichage du template v-else.
        loading.value = false;
    }
}

watch(
    [topBalances, loading, balanceLoading],
    async () => {
        if (
            !loading.value &&
            !balanceLoading.value &&
            !balanceError.value &&
            topBalances.value.length > 0
        ) {
            await renderBalanceChart();
            return;
        }

        if (
            !loading.value &&
            !balanceLoading.value &&
            topBalances.value.length === 0
        ) {
            destroyBalanceChart();
        }
    },
    {
        deep: true
    }
);

onMounted(() => {
    load();
    themeObserver = new MutationObserver(() => {
        if (
            !loading.value &&
            !balanceLoading.value &&
            !balanceError.value &&
            topBalances.value.length
        ) {
            renderBalanceChart();
        }
    });
    themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"]
    });
});

onBeforeUnmount(() => {
    themeObserver?.disconnect();
    destroyBalanceChart();
});
</script>

<style scoped>
.dashboard {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0.5rem;
    color: #1e293b;
}

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.eyebrow {
    margin: 0 0 0.35rem;
    color: #2563eb;
    font-size: 0.72rem;
    font-weight: 750;
    letter-spacing: 0.09em;
    text-transform: uppercase;
}

h1 {
    margin: 0;
    color: #0f172a;
    font-size: 1.8rem;
}

.subtitle,
.panel-header p {
    margin: 0.3rem 0 0;
    color: #64748b;
    font-size: 0.9rem;
}

.assigned-voamami {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.35rem 0.55rem;
    margin: 0.75rem 0 0;
    padding: 0.35rem 0.65rem;
    background: #eff6ff;
    color: #334155;
    font-size: 0.82rem;
}

.assigned-voamami span {
    color: #64748b;
}

.assigned-voamami strong {
    color: #1d4ed8;
}

.button {
    display: inline-flex;
    min-height: 2.6rem;
    align-items: center;
    justify-content: center;
    border-radius: 0.55rem;
    padding: 0.65rem 1rem;
    font-weight: 650;
    text-decoration: none;
}

.button-primary {
    background: #2563eb;
    color: #fff;
}

.button-secondary {
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #334155;
    cursor: pointer;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
}

.stat-card,
.finance-card,
.panel,
.state-card {
    border: 1px solid #e2e8f0;
    border-radius: 0.85rem;
    background: #fff;
    box-shadow: 0 1px 3px rgb(15 23 42 / 4%);
}

.stat-card {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    column-gap: 0.8rem;
    padding: 1rem;
}

.stat-icon {
    display: grid;
    width: 2.7rem;
    height: 2.7rem;
    grid-row: span 2;
    place-items: center;
    border-radius: 0.75rem;
    font-size: 1.25rem;
    font-weight: 700;
}

.icon-blue {
    background: #dbeafe;
    color: #2563eb;
}

.icon-violet {
    background: #ede9fe;
    color: #7c3aed;
}

.icon-green {
    background: #dcfce7;
    color: #16a34a;
}

.icon-amber {
    background: #fef3c7;
    color: #d97706;
}

.stat-label,
.finance-card > span {
    color: #64748b;
    font-size: 0.8rem;
}

.stat-card strong {
    color: #0f172a;
    font-size: 1.45rem;
}

.finance-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    margin-top: 1rem;
}

.finance-card {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    padding: 1.15rem;
}

.finance-card strong {
    font-size: 1.35rem;
}

.finance-card a,
.panel-header a {
    color: #2563eb;
    font-size: 0.85rem;
    font-weight: 650;
    text-decoration: none;
}

.balance-panel,
.top-members-panel,
.sessions-panel {
    margin-top: 1rem;
}

.panel {
    overflow: hidden;
    padding: 1.15rem;
}

.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.8rem;
}

.panel-header h2 {
    margin: 0;
    font-size: 1rem;
}

.balance-chart-wrapper {
    position: relative;
    width: 100%;
    height: 360px;
    margin-top: 1rem;
}

.balance-chart-wrapper canvas {
    display: block;
    width: 100% !important;
    height: 100% !important;
}

.chart-state {
    display: grid;
    min-height: 12rem;
    place-content: center;
    justify-items: center;
    gap: 0.7rem;
    color: #64748b;
    text-align: center;
}

.chart-error {
    color: #b91c1c;
}

.top-members-list {
    display: grid;
    gap: 0.25rem;
}

.top-member-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-top: 1px solid #f1f5f9;
    padding: 0.75rem 0;
}

.member-rank {
    display: grid;
    width: 1.7rem;
    height: 1.7rem;
    flex: 0 0 auto;
    place-items: center;
    border-radius: 50%;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: 0.78rem;
    font-weight: 750;
}

.member-avatar {
    display: grid;
    width: 2.2rem;
    height: 2.2rem;
    flex: 0 0 auto;
    place-items: center;
    border-radius: 50%;
    background: #dbeafe;
    color: #1d4ed8;
    font-size: 0.85rem;
    font-weight: 750;
}

.member-info {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    gap: 0.15rem;
}

.member-info strong {
    overflow: hidden;
    color: #0f172a;
    font-size: 0.85rem;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.member-info span {
    color: #64748b;
    font-size: 0.75rem;
}

.member-saving {
    flex: 0 0 auto;
    color: #15803d;
    font-size: 0.82rem;
    font-variant-numeric: tabular-nums;
}

.session-list {
    display: grid;
}

.session-row {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    border-top: 1px solid #f1f5f9;
    padding: 0.8rem 0;
}

.session-marker {
    display: grid;
    width: 2.6rem;
    height: 2.6rem;
    flex: 0 0 auto;
    place-items: center;
    border-radius: 0.65rem;
    background: #eff6ff;
    color: #2563eb;
    font-size: 0.78rem;
    font-weight: 750;
}

.session-info {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    gap: 0.2rem;
}

.session-info strong {
    overflow: hidden;
    font-size: 0.88rem;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.session-info span {
    color: #64748b;
    font-size: 0.78rem;
}

.status-badge {
    flex: 0 0 auto;
    border-radius: 999px;
    padding: 0.25rem 0.55rem;
    font-size: 0.7rem;
    font-weight: 700;
}

.status-open {
    background: #dcfce7;
    color: #166534;
}

.status-closed {
    background: #e2e8f0;
    color: #475569;
}

.session-action {
    color: #2563eb;
    font-size: 1.2rem;
    text-decoration: none;
}

.empty-state {
    padding: 1rem;
    color: #64748b;
    text-align: center;
}

.state-card {
    display: grid;
    min-height: 14rem;
    place-content: center;
    justify-items: center;
    gap: 0.75rem;
    color: #64748b;
    text-align: center;
}

.state-error {
    color: #b91c1c;
}

:global(html.dark .dashboard) {
    color: #e5eaf2;
}

:global(html.dark .dashboard h1),
:global(html.dark .dashboard h2),
:global(html.dark .dashboard .member-info strong) {
    color: #e5eaf2;
}

:global(html.dark .dashboard .stat-card),
:global(html.dark .dashboard .finance-card),
:global(html.dark .dashboard .panel),
:global(html.dark .dashboard .state-card) {
    border-color: #2b374a;
    background: #151e2e;
}

:global(html.dark .dashboard .top-member-row),
:global(html.dark .dashboard .session-row) {
    border-color: #2b374a;
}

:global(html.dark .dashboard .member-info span),
:global(html.dark .dashboard .subtitle),
:global(html.dark .dashboard .panel-header p),
:global(html.dark .dashboard .stat-label),
:global(html.dark .dashboard .finance-card > span),
:global(html.dark .dashboard .session-info span) {
    color: #9aa8bb;
}

:global(html.dark .dashboard .member-avatar),
:global(html.dark .dashboard .member-rank) {
    background: #172b48;
    color: #93c5fd;
}

:global(html.dark .dashboard .assigned-voamami) {
    background: #172b48;
    color: #cbd5e1;
}

:global(html.dark .dashboard .assigned-voamami span),
:global(html.dark .dashboard .empty-state),
:global(html.dark .dashboard .chart-state),
:global(html.dark .dashboard .state-card) {
    color: #9aa8bb;
}

:global(html.dark .dashboard .assigned-voamami strong),
:global(html.dark .dashboard .finance-card a),
:global(html.dark .dashboard .panel-header a),
:global(html.dark .dashboard .session-action) {
    color: #93c5fd;
}

:global(html.dark .dashboard .stat-icon.icon-blue) {
    background: #172b48;
    color: #93c5fd;
}

:global(html.dark .dashboard .stat-icon.icon-violet) {
    background: #30234d;
    color: #c4b5fd;
}

:global(html.dark .dashboard .stat-icon.icon-green) {
    background: #123b31;
    color: #86efac;
}

:global(html.dark .dashboard .stat-icon.icon-amber) {
    background: #45351c;
    color: #fcd34d;
}

:global(html.dark .dashboard .stat-card strong),
:global(html.dark .dashboard .finance-card strong),
:global(html.dark .dashboard .session-info strong) {
    color: #e5eaf2;
}

:global(html.dark .dashboard .member-saving) {
    color: #86efac;
}

:global(html.dark .dashboard .session-marker) {
    background: #172b48;
    color: #93c5fd;
}

:global(html.dark .dashboard .status-open) {
    background: #123b31;
    color: #86efac;
}

:global(html.dark .dashboard .status-closed) {
    background: #263449;
    color: #cbd5e1;
}

:global(html.dark .dashboard .button-secondary) {
    border-color: #3b4960;
    background: #1b2637;
    color: #cbd5e1;
}

:global(html.dark .dashboard .button-secondary:hover) {
    background: #263449;
}

@media (max-width: 900px) {
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 700px) {
    .dashboard {
        padding: 0;
    }

    .page-header {
        align-items: flex-start;
        flex-direction: column;
    }

    .finance-grid {
        grid-template-columns: 1fr;
    }

    .balance-chart-wrapper {
        height: 430px;
    }

    .session-row {
        flex-wrap: wrap;
    }

    .session-info {
        flex-basis: calc(100% - 3.5rem);
    }
}

@media (max-width: 480px) {
    .stats-grid {
        grid-template-columns: 1fr;
    }

    .panel-header {
        align-items: flex-start;
        flex-direction: column;
    }

    .panel-header a {
        align-self: flex-start;
    }
}
</style>
