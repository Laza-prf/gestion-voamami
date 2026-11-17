<template>
    <section class="page">
        <header class="head">
            <div>
                <p class="eyebrow">Caisse sociale</p>
                <h1>Mouvements sociaux</h1>
                <p class="subtitle">{{ caisseLabel }}</p>
            </div>
            <div class="header-actions">
                <router-link
                    class="button secondary"
                    :to="{ path: '/caisse-sociale/aides', query: { voamamiId } }"
                >
                    Demandes d’aide
                </router-link>
                <router-link class="button secondary" to="/caisse-sociale">
                    Caisses sociales
                </router-link>
            </div>
        </header>

        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <p v-if="caisseError" class="warning" role="status">{{ caisseError }}</p>

        <div v-if="loading" class="state">Chargement des mouvements…</div>
        <div v-else-if="error" class="state error-state">
            Impossible de charger les mouvements. Veuillez réessayer.
        </div>
        <template v-else>
            <div class="summary">
                <article class="summary-card">
                    <span>Solde social</span>
                    <strong>{{ money(caisse?.solde_social) }}</strong>
                </article>
                <article class="summary-card">
                    <span>Total des entrées</span>
                    <strong>{{ money(totalEntrees) }}</strong>
                </article>
                <article class="summary-card">
                    <span>Total des sorties</span>
                    <strong>{{ money(totalSorties) }}</strong>
                </article>
            </div>

            <div v-if="mouvements.length" class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Membre</th>
                            <th>Type</th>
                            <th>Sens</th>
                            <th>Montant</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="mouvement in mouvements" :key="mouvement.id">
                            <td>{{ formatDate(mouvement.date_mouvement) }}</td>
                            <td>
                                <template v-if="mouvement.numero_membre">
                                    N°{{ mouvement.numero_membre }} —
                                    {{ mouvement.membre_nom }}
                                    {{ mouvement.membre_prenom || "" }}
                                </template>
                                <span v-else>—</span>
                            </td>
                            <td>{{ typeLabel(mouvement.type_mouvement) }}</td>
                            <td>{{ mouvement.sens === "ENTREE" ? "Entrée" : "Sortie" }}</td>
                            <td>{{ money(mouvement.montant) }}</td>
                            <td class="description">{{ mouvement.description || "—" }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-else class="state empty-state">
                Aucun mouvement enregistré pour cette caisse sociale.
            </div>
        </template>
    </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import caisseSocialeService from "../../service/caisse-sociale.service.js";

const route = useRoute();
const voamamiId = computed(() => String(route.params.voamamiId || ""));
const mouvements = ref([]);
const caisse = ref(null);
const loading = ref(false);
const error = ref("");
const caisseError = ref("");

const caisseLabel = computed(() => {
    if (caisse.value?.voamami_code || caisse.value?.voamami_nom) {
        return `${caisse.value.voamami_code || "VOAMAMI"} — ${caisse.value.voamami_nom || ""}`;
    }
    return `VOAMAMI N°${voamamiId.value}`;
});

const totalEntrees = computed(() =>
    mouvements.value
        .filter((item) => item.sens === "ENTREE")
        .reduce((sum, item) => sum + Number(item.montant || 0), 0)
);

const totalSorties = computed(() =>
    mouvements.value
        .filter((item) => item.sens === "SORTIE")
        .reduce((sum, item) => sum + Number(item.montant || 0), 0)
);

function money(value) {
    return (
        new Intl.NumberFormat("fr-FR", {
            maximumFractionDigits: 0
        }).format(Number(value || 0)) + " Ar"
    );
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "—"
        : new Intl.DateTimeFormat("fr-FR").format(date);
}

function typeLabel(value) {
    return {
        COTISATION: "Cotisation",
        AIDE_SOCIALE: "Aide sociale",
        CORRECTION: "Correction",
        AUTRE: "Autre"
    }[value] ?? value ?? "—";
}

function extractArray(response) {
    const payload = response?.data;
    const candidates = [
        payload?.data,
        payload?.data?.rows,
        payload?.data?.mouvements,
        payload?.rows,
        payload?.mouvements
    ];
    return candidates.find(Array.isArray) ?? [];
}

async function load() {
    if (!voamamiId.value) {
        error.value = "Identifiant VOAMAMI invalide.";
        return;
    }

    loading.value = true;
    error.value = "";
    caisseError.value = "";

    const caisseRequest = caisseSocialeService
        .getByVoamami(voamamiId.value)
        .then((response) => {
            const data = response?.data?.data;
            caisse.value = Array.isArray(data) ? data[0] ?? null : data ?? null;
        })
        .catch((err) => {
            caisseError.value =
                err.response?.data?.message ||
                "Le solde de la caisse est indisponible.";
        });

    try {
        const response = await caisseSocialeService.getMouvements(voamamiId.value);
        mouvements.value = extractArray(response);
    } catch (err) {
        mouvements.value = [];
        error.value =
            err.response?.data?.message ||
            "Impossible de charger les mouvements sociaux.";
    } finally {
        await caisseRequest;
        loading.value = false;
    }
}

watch(voamamiId, load);
onMounted(load);
</script>

<style scoped>
.page {
    max-width: 1200px;
    margin: auto;
    padding: 2rem;
}

.head,
.header-actions {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
}

.eyebrow {
    margin: 0;
    color: #64748b;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
}

h1 {
    margin: 0.35rem 0;
}

.subtitle {
    margin: 0;
    color: #64748b;
}

.header-actions {
    flex-wrap: wrap;
}

.button {
    display: inline-flex;
    align-items: center;
    border: 1px solid #cbd5e1;
    border-radius: 0.5rem;
    background: #fff;
    color: #334155;
    padding: 0.65rem 0.85rem;
    font: inherit;
    text-decoration: none;
}

.summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.85rem;
    margin: 1.25rem 0;
}

.summary-card {
    display: grid;
    gap: 0.35rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.6rem;
    background: #fff;
    padding: 0.9rem 1rem;
    color: #64748b;
}

.summary-card strong {
    color: #0f172a;
    font-size: 1.2rem;
}

.table-wrap {
    overflow: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
    background: #fff;
}

th,
td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
}

th {
    background: #f8fafc;
    font-weight: 600;
}

.description {
    min-width: 180px;
}

.state {
    padding: 1.25rem;
    text-align: center;
    color: #64748b;
}

.empty-state {
    border: 1px dashed #cbd5e1;
    border-radius: 0.6rem;
    background: #f8fafc;
}

.error,
.warning {
    padding: 0.7rem 0.85rem;
    border-radius: 0.5rem;
}

.error {
    background: #f1f5f9;
    color: #334155;
}

.error-state {
    color: #334155;
}

.warning {
    background: #f8fafc;
    color: #475569;
}

@media (max-width: 650px) {
    .page {
        padding: 1rem;
    }

    .head {
        align-items: stretch;
        flex-direction: column;
    }

    .summary {
        grid-template-columns: 1fr;
    }
}
</style>
