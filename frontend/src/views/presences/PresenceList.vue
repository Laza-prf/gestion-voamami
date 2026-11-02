<template>
    <div class="page">
        <header class="page-header">
            <div>
                <h1>{{ seance ? "Présences de la séance" : "Historique des présences" }}</h1>
                <p v-if="seance" class="subtitle">
                    {{ seance.voamami_code }} — {{ seance.voamami_nom }} |
                    Cycle {{ seance.numero_cycle || seance.cycle_id }} |
                    Séance {{ seance.numero_seance || seance.id }} |
                    {{ formatDate(seance.date_seance) }}
                </p>
                <p v-else class="subtitle">Choisissez une séance pour consulter les présences enregistrées.</p>
            </div>
            <router-link
                v-if="seance && route.query.assistant === '1'"
                :to="reviewReturnLink"
                class="back-link"
            >
                Retour à la vérification
            </router-link>
            <router-link v-else-if="seance" to="/presences" class="back-link">
                Retour à l'historique
            </router-link>
        </header>

        <div v-if="loading" class="state-card">Chargement...</div>
        <div v-else-if="error && !rows.length && !sessions.length" class="state-card state-error" role="alert">
            <p>{{ error }}</p>
            <button class="button-secondary" @click="load">Réessayer</button>
        </div>

        <template v-else-if="!seanceId">
            <p v-if="error" class="error" role="alert">{{ error }}</p>
            <div v-if="!sessions.length" class="state-card">
                Aucune séance n'est disponible pour consulter les présences.
            </div>
            <div v-else class="table-card">
                <div class="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>VOAMAMI</th>
                                <th>Cycle</th>
                                <th>Séance</th>
                                <th>Date</th>
                                <th>Présent</th>
                                <th>Absent</th>
                                <th>Excusé</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in sessions" :key="item.id">
                                <td><strong>{{ item.voamami_code }} — {{ item.voamami_nom }}</strong></td>
                                <td>{{ item.numero_cycle || item.cycle_id }}</td>
                                <td>S{{ item.numero_seance || item.id }}</td>
                                <td>{{ formatDate(item.date_seance) }}</td>
                                <td>{{ historyFor(item.id).present }}</td>
                                <td>{{ historyFor(item.id).absent }}</td>
                                <td>{{ historyFor(item.id).excuse }}</td>
                                <td>
                                    <router-link :to="`/seances/${item.id}/presences`" class="button-link">
                                        Consulter
                                    </router-link>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </template>

        <template v-else-if="seance">
            <p v-if="error" class="error" role="alert">{{ error }}</p>
            <section class="table-card">
                <div class="toolbar">
                    <div class="summary">
                        <span><strong>{{ statusCounts.present }}</strong> présents</span>
                        <span><strong>{{ statusCounts.absent }}</strong> absents</span>
                        <span><strong>{{ statusCounts.excuse }}</strong> excusés</span>
                        <span><strong>{{ statusCounts.pending }}</strong> à enregistrer</span>
                        <span>{{ rows.length }} membre(s)</span>
                    </div>
                    <button
                        v-if="seance.statut === 'OUVERTE'"
                        type="button"
                        class="button-primary"
                        :disabled="savingAll"
                        @click="saveAll"
                    >
                        {{ savingAll ? "Enregistrement..." : "Enregistrer toutes les présences" }}
                    </button>
                    <span v-else class="readonly-label">Séance clôturée — historique en lecture seule</span>
                </div>

                <div class="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>N°</th>
                                <th>Membre</th>
                                <th>Statut</th>
                                <th>Motif / observation</th>
                                <th>Enregistrement</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in rows" :key="row.membre.id">
                                <td>{{ row.membre.numero_membre }}</td>
                                <td><strong>{{ row.membre.nom }} {{ row.membre.prenom || "" }}</strong></td>
                                <td>
                                    <select
                                        v-model="row.statut"
                                        :disabled="seance.statut !== 'OUVERTE' || row.saving"
                                        @change="row.saved = false"
                                    >
                                        <option value="PRESENT">Présent</option>
                                        <option value="ABSENT">Absent — non excusé</option>
                                        <option value="EXCUSE">Absent — excusé</option>
                                    </select>
                                </td>
                                <td>
                                    <input
                                        v-model.trim="row.observation"
                                        :disabled="seance.statut !== 'OUVERTE' || row.saving"
                                        :required="row.statut === 'EXCUSE'"
                                        :placeholder="row.statut === 'EXCUSE' ? 'Motif d’excuse obligatoire' : 'Facultatif'"
                                        maxlength="255"
                                        @input="row.saved = false"
                                    />
                                </td>
                                <td>
                                    <span v-if="row.saving">Enregistrement...</span>
                                    <span v-else-if="row.saved || row.id" class="saved">Enregistré</span>
                                    <span v-else>À enregistrer</span>
                                </td>
                            </tr>
                            <tr v-if="!rows.length">
                                <td colspan="5" class="empty">
                                    {{ seance.statut === "OUVERTE" ? "Aucun membre actif trouvé pour cette séance." : "Aucune présence n’a été enregistrée pour cette séance." }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </template>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import seanceService from "../../service/seance.service.js";
import membreService from "../../service/membre.service.js";
import presenceService from "../../service/presence.service.js";
import { useToast } from "../../composables/useToast.js";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const seance = ref(null);
const rows = ref([]);
const sessions = ref([]);
const history = ref([]);
const loading = ref(true);
const savingAll = ref(false);
const error = ref("");
const seanceId = computed(() => Number(route.params.seanceId) || null);
const reviewReturnLink = computed(() => ({
    path: `/seances/${seanceId.value}/operations`,
    query: {
        etape: route.query.etape === "5" ? "5" : "0",
        ...(typeof route.query.verifie === "string"
            ? { verifie: route.query.verifie }
            : {})
    }
}));
const statusCounts = computed(() => rows.value.reduce((counts, row) => {
    if (!row.saved) {
        counts.pending++;
        return counts;
    }
    if (row.statut === "PRESENT") counts.present++;
    if (row.statut === "ABSENT") counts.absent++;
    if (row.statut === "EXCUSE") counts.excuse++;
    return counts;
}, { present: 0, absent: 0, excuse: 0, pending: 0 }));

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? String(value).slice(0, 10)
        : date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function unwrap(response) {
    return response?.data?.data ?? response?.data ?? [];
}

function historyFor(id) {
    const summary = { present: 0, absent: 0, excuse: 0 };
    for (const presence of history.value) {
        if (Number(presence.seance_id) !== Number(id)) continue;
        if (presence.statut === "PRESENT") summary.present++;
        if (presence.statut === "ABSENT") summary.absent++;
        if (presence.statut === "EXCUSE") summary.excuse++;
    }
    return summary;
}

async function load() {
    loading.value = true;
    error.value = "";
    seance.value = null;
    rows.value = [];
    sessions.value = [];
    history.value = [];

    try {
        if (!seanceId.value) {
            const [sessionResponse, presenceResponse] = await Promise.all([
                seanceService.getAll(),
                presenceService.getAll()
            ]);
            const sessionData = unwrap(sessionResponse);
            sessions.value = sessionData.data ?? sessionData.seances ?? sessionData ?? [];
            history.value = unwrap(presenceResponse);
            return;
        }

        const [seanceResponse, membresResponse, presenceResponse] = await Promise.all([
            seanceService.getById(seanceId.value),
            membreService.getAll(),
            presenceService.getAll({ seance_id: seanceId.value })
        ]);
        const seanceData = unwrap(seanceResponse);
        seance.value = seanceData.data ?? seanceData.seance ?? seanceData;
        if (!seance.value?.cycle_id) throw new Error("La séance ne possède pas de cycle valide.");

        const membresData = unwrap(membresResponse);
        const membres = membresData.data ?? membresData.membres ?? membresData ?? [];
        const presenceData = unwrap(presenceResponse);
        const presences = presenceData.data ?? presenceData.presences ?? presenceData ?? [];
        const byMember = new Map();

        for (const presence of presences) {
            byMember.set(Number(presence.membre_id), {
                membre: {
                    id: presence.membre_id,
                    numero_membre: presence.numero_membre,
                    nom: presence.membre_nom,
                    prenom: presence.membre_prenom
                },
                id: presence.id,
                statut: presence.statut,
                observation: presence.observation || "",
                saved: true,
                saving: false
            });
        }

        if (seance.value.statut === "OUVERTE") {
            for (const membre of membres) {
                const actif = membre.actif === 1 || membre.actif === true;
                const sameCycle = membre.cycle_actif_id == null ||
                    Number(membre.cycle_actif_id) === Number(seance.value.cycle_id);
                const sameVoamami = Number(membre.voamami_id) === Number(seance.value.voamami_id);
                if (!actif || !sameCycle || !sameVoamami || byMember.has(Number(membre.id))) continue;
                byMember.set(Number(membre.id), {
                    membre,
                    id: null,
                    statut: "PRESENT",
                    observation: "",
                    saved: false,
                    saving: false
                });
            }
        }

        rows.value = [...byMember.values()].sort(
            (a, b) => Number(a.membre.numero_membre) - Number(b.membre.numero_membre)
        );
    } catch (e) {
        error.value = e.response?.data?.message || e.message || "Impossible de charger les présences.";
    } finally {
        loading.value = false;
    }
}

async function saveRow(row) {
    if (seance.value?.statut !== "OUVERTE") {
        throw new Error("La séance est déjà clôturée.");
    }
    row.saving = true;
    row.saved = false;
    try {
        const payload = {
            seance_id: seanceId.value,
            membre_id: Number(row.membre.id),
            statut: row.statut,
            observation: row.observation || null
        };
        const response = row.id
            ? await presenceService.update(row.id, payload)
            : await presenceService.create(payload);
        const saved = response.data?.data;
        row.id = saved?.id || row.id;
        row.saved = true;
        return {
            created: saved?.penalite_automatique_creee === true,
            removed: saved?.penalite_automatique_supprimee === true
        };
    } finally {
        row.saving = false;
    }
}

async function saveAll() {
    error.value = "";
    const invalidExcuse = rows.value.find(
        (row) => row.statut === "EXCUSE" && !row.observation.trim()
    );
    if (invalidExcuse) {
        error.value = `Le motif d'excuse est obligatoire pour le membre n° ${invalidExcuse.membre.numero_membre}.`;
        return;
    }

    savingAll.value = true;
    let createdPenalties = 0;
    let removedPenalties = 0;
    try {
        for (const row of rows.value) {
            const result = await saveRow(row);
            if (result.created) createdPenalties++;
            if (result.removed) removedPenalties++;
        }

        if (createdPenalties || removedPenalties) {
            toast.success(
                `${rows.value.length} présence(s) enregistrée(s), ${createdPenalties} pénalité(s) créée(s), ${removedPenalties} annulée(s).`
            );
        } else {
            toast.success("Toutes les présences ont été enregistrées.");
        }

        if (route.query.assistant === "1") {
            await router.push(reviewReturnLink.value);
        }
    } catch (e) {
        error.value = e.response?.data?.message || e.message || "Impossible d'enregistrer les présences.";
        toast.error(error.value);
    } finally {
        savingAll.value = false;
    }
}

watch(() => route.params.seanceId, load);
onMounted(load);
</script>

<style scoped>
.page { padding: 1.5rem; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1.25rem; }
.page-header h1 { margin: 0; color: #0f172a; font-size: 1.55rem; }
.subtitle { margin: .35rem 0 0; color: #64748b; }
.back-link, .button-link { color: #2563eb; font-weight: 600; text-decoration: none; }
.back-link:hover, .button-link:hover { text-decoration: underline; }
.state-card, .table-card { overflow: hidden; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; }
.state-card { padding: 1.5rem; color: #64748b; }
.state-error { color: #b91c1c; }
.table-scroll { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; background: #fff; }
th, td { padding: .75rem; border-bottom: 1px solid #e2e8f0; text-align: left; white-space: nowrap; }
th { background: #f8fafc; color: #475569; font-size: .82rem; }
td { color: #334155; }
select, input { min-width: 150px; padding: .55rem .65rem; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; font: inherit; }
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; padding: 1rem; border-bottom: 1px solid #e2e8f0; }
.summary { display: flex; flex-wrap: wrap; gap: 1rem; color: #64748b; }
.summary strong { color: #0f172a; }
.button-primary, .button-secondary, .button-link { display: inline-flex; align-items: center; justify-content: center; padding: .6rem .9rem; border-radius: 7px; font: inherit; font-weight: 600; text-decoration: none; }
.button-primary { border: 0; color: #fff; background: #1e293b; cursor: pointer; }
.button-primary:disabled { opacity: .6; cursor: wait; }
.button-secondary { border: 1px solid #cbd5e1; color: #334155; background: #fff; cursor: pointer; }
.button-link { border: 1px solid #bfdbfe; background: #eff6ff; }
.readonly-label, .empty { color: #64748b; }
.saved { color: #15803d; font-weight: 600; }
.error { color: #b91c1c; }
.empty { padding: 2rem; text-align: center; }
@media (max-width: 650px) {
    .page-header { flex-direction: column; }
    .toolbar { align-items: flex-start; }
    .summary { gap: .6rem; }
}
</style>
