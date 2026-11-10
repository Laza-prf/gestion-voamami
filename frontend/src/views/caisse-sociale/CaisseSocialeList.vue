<template>
    <section class="page">
        <header class="page-header">
            <div>
                <p class="eyebrow">Opérations solidaires</p>
                <h1>Caisse sociale</h1>
                <p class="muted">
                    Consultez les fonds sociaux et gérez les demandes d’aide
                    des VOAMAMI.
                </p>
            </div>

            <div class="actions">
                <button
                    type="button"
                    class="button secondary"
                    :disabled="loading"
                    @click="load"
                >
                    Actualiser
                </button>

                <router-link
                    class="button help"
                    to="/caisse-sociale/aides/nouveau"
                >
                    + Demander une aide
                </router-link>
            </div>
        </header>

        <p v-if="error" class="alert error">
            {{ error }}
        </p>

        <div v-if="loading" class="state-card">
            Chargement des caisses sociales…
        </div>

        <div v-else class="cards">
            <article
                v-for="caisse in caisses"
                :key="caisse.caisse_sociale_id"
                class="card"
            >
                <div class="card-top">
                    <span
                        :class="[
                            'badge',
                            caisse.statut === 'ACTIVE'
                                ? 'badge-active'
                                : 'badge-inactive'
                        ]"
                    >
                        {{ caisse.statut }}
                    </span>
                    <strong>{{ caisse.voamami_code }}</strong>
                </div>

                <h2>{{ caisse.voamami_nom }}</h2>

                <dl>
                    <div>
                        <dt>Solde social</dt>
                        <dd class="amount">
                            {{ money(caisse.solde_social) }}
                        </dd>
                    </div>

                    <div>
                        <dt>Total cotisations</dt>
                        <dd>
                            {{ money(caisse.total_cotisations) }}
                        </dd>
                    </div>

                    <div>
                        <dt>Aides payées</dt>
                        <dd>
                            {{ money(caisse.total_aides) }}
                        </dd>
                    </div>

                    <div>
                        <dt>Minimum mensuel</dt>
                        <dd>
                            {{ money(caisse.montant_minimum_mensuel) }}
                        </dd>
                    </div>
                </dl>

                <div class="card-actions">
                    <router-link
                        class="action aide"
                        :to="`/caisse-sociale/${caisse.voamami_id}/aides`"
                    >
                        Demandes d’aide
                    </router-link>

                    <router-link
                        class="action mouvement"
                        :to="`/caisse-sociale/${caisse.voamami_id}/mouvements`"
                    >
                        Mouvements sociaux
                    </router-link>
                </div>
            </article>

            <p v-if="!caisses.length" class="empty">
                Aucune caisse sociale disponible.
            </p>
        </div>
    </section>
</template>

<script setup>
import { onMounted, ref } from "vue";
import caisseSocialeService from "../../service/caisse-sociale.service.js";

const caisses = ref([]);
const loading = ref(true);
const error = ref("");

function money(value) {
    return (
        new Intl.NumberFormat("fr-FR", {
            maximumFractionDigits: 0
        }).format(Number(value || 0)) + " Ar"
    );
}

async function load() {
    loading.value = true;
    error.value = "";

    try {
        const response = await caisseSocialeService.getAll();
        const payload = response?.data;

        if (Array.isArray(payload?.data)) {
            caisses.value = payload.data;
        } else if (Array.isArray(payload)) {
            caisses.value = payload;
        } else {
            caisses.value = [];
        }
    } catch (err) {
        console.error("Erreur chargement caisse sociale :", err);
        error.value =
            err.response?.data?.message ||
            "Impossible de charger les caisses sociales.";
    } finally {
        loading.value = false;
    }
}

onMounted(load);
</script>

<style scoped>
.page {
    max-width: 1200px;
    margin: 0 auto;
    padding: clamp(1rem, 3vw, 2rem);
}

.page-header {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.eyebrow {
    margin: 0;
    color: #2563eb;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

h1 {
    margin: 0.3rem 0;
}

.muted {
    color: #64748b;
}

.actions,
.card-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
}

.button,
.action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.65rem;
    padding: 0.7rem 1rem;
    font: inherit;
    font-weight: 650;
    text-decoration: none;
    cursor: pointer;
}

.button {
    border: 0;
}

.button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
}

.secondary {
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #334155;
}

.help {
    background: #0f766e;
    color: #fff;
}

.cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
    gap: 1rem;
}

.card {
    border: 1px solid #e2e8f0;
    border-radius: 1rem;
    background: #fff;
    padding: 1.25rem;
    box-shadow: 0 8px 24px rgb(15 23 42 / 5%);
}

.card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #475569;
}

.badge {
    border-radius: 999px;
    padding: 0.25rem 0.6rem;
    font-size: 0.75rem;
    font-weight: 700;
}

.badge-active {
    background: #dcfce7;
    color: #166534;
}

.badge-inactive {
    background: #e2e8f0;
    color: #475569;
}

.card h2 {
    margin: 0.9rem 0;
    font-size: 1.2rem;
}

dl {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.9rem;
    margin: 0 0 1.15rem;
}

dt {
    color: #64748b;
    font-size: 0.78rem;
}

dd {
    margin: 0.2rem 0 0;
    font-weight: 700;
}

.amount {
    color: #047857;
    font-size: 1.1rem;
}

.action {
    padding: 0.6rem 0.75rem;
    font-size: 0.86rem;
}

.aide {
    background: #ecfdf5;
    color: #047857;
}

.mouvement {
    background: #f1f5f9;
    color: #334155;
}

.alert,
.state-card {
    border-radius: 0.65rem;
    padding: 0.85rem;
}

.error {
    background: #fee2e2;
    color: #991b1b;
}

.state-card,
.empty {
    color: #64748b;
    text-align: center;
}

.empty {
    grid-column: 1 / -1;
    padding: 2rem;
}

@media (max-width: 650px) {
    .page-header {
        align-items: stretch;
        flex-direction: column;
    }

    .actions > * {
        flex: 1;
        text-align: center;
    }

    .card-actions > * {
        flex: 1;
        text-align: center;
    }
}
</style>
