<template>
    <section class="page">
        <header class="head">
            <div>
                <p class="eyebrow">Caisse sociale</p>
                <h1>Cotisations sociales</h1>
                <p v-if="isAssistantSession" class="subtitle">Séance {{ seanceId }}</p>
            </div>
            <router-link
                v-if="!isAssistantSession"
                class="btn"
                to="/caisse-sociale/cotisations/nouveau"
            >
                + Nouveau versement
            </router-link>
        </header>

        <div v-if="!isAssistantSession" class="filters">
            <label>
                VOAMAMI
                <select v-model="voamamiId" :disabled="isAgentFid" @change="load">
                    <option v-if="!isAgentFid" value="">Sélectionner</option>
                    <option v-for="voamami in voamamis" :key="voamami.id" :value="voamami.id">
                        {{ voamami.code }} — {{ voamami.nom }}
                    </option>
                </select>
            </label>
            <label>
                Mois
                <input v-model="mois" type="month" @change="load">
            </label>
        </div>

        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Membre</th>
                        <th>Mois</th>
                        <th>Montant</th>
                        <th>Date</th>
                        <th>Séance</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="cotisation in rows" :key="cotisation.id">
                        <td>
                            N°{{ cotisation.numero_membre }} — {{ cotisation.nom }}
                            {{ cotisation.prenom || "" }}
                        </td>
                        <td>{{ cotisation.mois_concerne?.slice(0, 7) }}</td>
                        <td>{{ money(cotisation.montant) }}</td>
                        <td>{{ cotisation.date_paiement?.slice(0, 10) }}</td>
                        <td>{{ cotisation.seance_id || "Hors séance" }}</td>
                    </tr>
                    <tr v-if="!rows.length">
                        <td colspan="5" class="empty">Aucune cotisation.</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <router-link
            v-if="isAssistantSession"
            class="back-link"
            :to="reviewReturnLink"
        >
            Retour à la vérification
        </router-link>
    </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import caisseSocialeService from "../../service/caisse-sociale.service.js";
import voamamiService from "../../service/voamami.service.js";
import { useAssignedVoamami } from "../../composables/useAssignedVoamami.js";

const route = useRoute();
const { isAgentFid, assignedVoamamiId } = useAssignedVoamami();
const voamamis = ref([]);
const voamamiId = ref("");
const mois = ref("");
const rows = ref([]);
const error = ref("");
const seanceId = computed(() => Number(route.query.seance_id) || null);
const isAssistantSession = computed(() =>
    route.query.assistant === "1" &&
    Number.isInteger(seanceId.value) &&
    seanceId.value > 0
);
const reviewReturnLink = computed(() => ({
    path: `/seances/${seanceId.value}/operations`,
    query: {
        etape: "6",
        ...(typeof route.query.verifie === "string"
            ? { verifie: route.query.verifie }
            : {})
    }
}));

const money = value =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 })
        .format(Number(value || 0)) + " Ar";

function extractRows(response) {
    const payload = response?.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.rows)) return payload.rows;
    return [];
}

async function load() {
    error.value = "";
    if (!voamamiId.value) {
        rows.value = [];
        return;
    }

    try {
        const response = await caisseSocialeService.getCotisations(voamamiId.value, {
            mois: mois.value ? `${mois.value}-01` : undefined
        });
        rows.value = extractRows(response);
    } catch (e) {
        error.value = e.response?.data?.message || "Chargement des cotisations impossible.";
    }
}

onMounted(async () => {
    if (isAssistantSession.value) {
        try {
            rows.value = extractRows(
                await caisseSocialeService.getCotisationsBySeance(seanceId.value)
            );
        } catch (e) {
            error.value = e.response?.data?.message || "Chargement des cotisations impossible.";
        }
        return;
    }

    try {
        const response = await voamamiService.getAll();
        voamamis.value = response.data?.data ?? [];
        if (isAgentFid.value) {
            const assignedId = assignedVoamamiId(voamamis.value);
            voamamiId.value = assignedId == null ? "" : String(assignedId);
            await load();
        }
    } catch (e) {
        error.value = e.response?.data?.message || "Chargement des VOAMAMI impossible.";
    }
});
</script>

<style scoped>
.page{max-width:1100px;margin:auto;padding:2rem}.head{display:flex;justify-content:space-between;align-items:end;gap:1rem}.eyebrow{color:#2563eb;text-transform:uppercase;font-size:.75rem;font-weight:700}.subtitle{color:#64748b}.btn{background:#2563eb;color:#fff;padding:.7rem 1rem;border-radius:.6rem;text-decoration:none}.filters{display:flex;gap:1rem;margin:1.5rem 0;flex-wrap:wrap}.filters label{display:grid;gap:.3rem;font-weight:600}select,input{padding:.7rem;border:1px solid #cbd5e1;border-radius:.5rem}.table-wrap{overflow:auto;margin:1.5rem 0}table{width:100%;border-collapse:collapse;background:#fff}th,td{text-align:left;padding:.8rem;border-bottom:1px solid #e2e8f0}th{background:#f8fafc}.error{color:#991b1b;background:#fee2e2;padding:.7rem}.empty{text-align:center;color:#64748b}.back-link{display:inline-block;color:#2563eb;text-decoration:none}@media(max-width:600px){.page{padding:1rem}.head{align-items:stretch;flex-direction:column}}
</style>
