<template>
    <div class="page">
        <h1>Nouvelle présence</h1>

        <p v-if="loading">Chargement...</p>

        <form v-else class="form" @submit.prevent="submit">
            <div v-if="seance" class="context-card">
                <strong>Séance {{ seance.numero_seance || seance.id }}</strong>
                <span>{{ seance.voamami_code }} - {{ seance.voamami_nom }}</span>
                <span>Date : {{ formatDate(seance.date_seance) }}</span>
            </div>

            <label>
                Membre
                <select v-model.number="form.membre_id" required>
                    <option :value="null" disabled>-- Sélectionner --</option>
                    <option v-for="membre in membres" :key="membre.id" :value="membre.id">
                        N° {{ membre.numero_membre }} - {{ membre.nom }} {{ membre.prenom || "" }}
                    </option>
                </select>
            </label>

            <label>
                Statut
                <select v-model="form.statut" required>
                    <option value="PRESENT">Présent</option>
                    <option value="ABSENT">Absent</option>
                    <option value="EXCUSE">Excusé</option>
                </select>
            </label>

            <label>
                {{ form.statut === "EXCUSE" ? "Motif d'excuse" : "Observation" }}
                <input
                    v-model.trim="form.observation"
                    :required="form.statut === 'EXCUSE'"
                    :placeholder="form.statut === 'EXCUSE' ? 'Motif obligatoire' : 'Facultatif'"
                    maxlength="255"
                />
            </label>

            <p v-if="error" class="error">{{ error }}</p>
            <button :disabled="saving">{{ saving ? "Enregistrement..." : "Enregistrer" }}</button>
        </form>
    </div>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import seanceService from "../../service/seance.service.js";
import membreService from "../../service/membre.service.js";
import presenceService from "../../service/presence.service.js";
import { useToast } from "../../composables/useToast.js";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const seance = ref(null);
const membres = ref([]);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const seanceId = Number(route.params.seanceId || route.query.seance_id);
const form = reactive({ membre_id: null, statut: "PRESENT", observation: "" });

function formatDate(value) { return value ? String(value).slice(0, 10) : "-"; }

async function load() {
    if (!Number.isInteger(seanceId) || seanceId < 1) throw new Error("Identifiant de séance invalide.");
    const [s, m] = await Promise.all([
        seanceService.getById(seanceId),
        membreService.getAll()
    ]);
    const sdata = s.data.data ?? s.data.seance ?? s.data;
    seance.value = sdata;
    if (seance.value.statut !== "OUVERTE") throw new Error("La séance est déjà clôturée.");
    const membresData = m.data.data ?? m.data.membres ?? m.data ?? [];
    membres.value = membresData.filter((x) =>
        (x.actif === 1 || x.actif === true) &&
        Number(x.voamami_id) === Number(seance.value.voamami_id) &&
        (x.cycle_actif_id == null || Number(x.cycle_actif_id) === Number(seance.value.cycle_id))
    );
}

async function submit() {
    error.value = "";
    if (!form.membre_id) { error.value = "Veuillez sélectionner un membre."; return; }
    if (form.statut === "EXCUSE" && !form.observation.trim()) {
        error.value = "Le motif d'excuse est obligatoire.";
        return;
    }
    saving.value = true;
    try {
        const response = await presenceService.create({
            seance_id: seanceId,
            membre_id: Number(form.membre_id),
            statut: form.statut,
            observation: form.observation || null
        });
        toast.success(response.data?.message || "Présence enregistrée.");
        await router.push(`/seances/${seanceId}/presences`);
    } catch (e) {
        error.value = e.response?.data?.message || "Erreur lors de l'enregistrement.";
    } finally { saving.value = false; }
}

onMounted(async () => {
    try { await load(); }
    catch (e) { error.value = e.response?.data?.message || e.message || "Chargement impossible."; }
    finally { loading.value = false; }
});
</script>

<style scoped>
.page { max-width: 650px; padding: 1.5rem; }
.form { display: flex; flex-direction: column; gap: 1rem; }
.form label { display: flex; flex-direction: column; gap: .35rem; font-weight: 600; }
select, input { padding: .65rem; border: 1px solid #cbd5e1; border-radius: 6px; font: inherit; }
.context-card { display: flex; flex-direction: column; gap: .35rem; padding: 1rem; border-left: 4px solid #2563eb; background: #eff6ff; }
button { padding: .65rem 1rem; border: 0; border-radius: 6px; color: white; background: #1e293b; cursor: pointer; }
button:disabled { opacity: .6; }
.error { color: #b91c1c; }
</style>
