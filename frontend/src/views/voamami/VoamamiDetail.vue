<template>
    <div class="page" v-if="voamami">
        <div class="page-header">
            <h1>{{ voamami.nom }} <span class="code">({{ voamami.code }})</span></h1>
            <router-link :to="`/voamami/${voamami.id}/modifier`" class="btn-primary">Modifier</router-link>
        </div>

        <dl>
            <dt>Fokontany</dt><dd>{{ voamami.fokontany || "-" }}</dd>
            <dt>Commune</dt><dd>{{ voamami.commune || "-" }}</dd>
            <dt>District</dt><dd>{{ voamami.district || "-" }}</dd>
            <dt>Région</dt><dd>{{ voamami.region || "-" }}</dd>
            <dt>Statut</dt><dd>{{ voamami.statut }}</dd>
            <dt>Agent responsable</dt><dd>{{ voamami.agent_responsable_nom || `#${voamami.agent_responsable_id}` || "-" }}</dd>
        </dl>

        <router-link to="/voamami">&larr; Retour à la liste</router-link>
    </div>
    <p v-else-if="error" class="error">{{ error }}</p>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import voamamiService from "../../service/voamami.service.js";

const route = useRoute();
const voamami = ref(null);
const error = ref("");

onMounted(async () => {
    try {
        const { data } = await voamamiService.getById(route.params.id);
        voamami.value = data.data;
    } catch (e) {
        error.value = e.response?.data?.message || "Groupe introuvable";
    }
});
</script>

<style scoped>
dl { display: grid; grid-template-columns: 160px 1fr; row-gap: 0.5rem; margin: 1rem 0; }
dt { font-weight: 600; color: #475569; }
.code { font-weight: 400; color: #64748b; }
</style>