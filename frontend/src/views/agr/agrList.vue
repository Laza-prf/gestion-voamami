<template>
    <div class="page">
        <div class="page-header">
            <h1>Activités génératrices de revenus</h1>

            <router-link
                to="/agr/nouveau"
                class="btn-primary"
            >
                + Nouvel AGR
            </router-link>
        </div>

        <p v-if="loading">
            Chargement...
        </p>

        <p
            v-else-if="error"
            class="error"
        >
            {{ error }}
        </p>

        <table v-else>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Libellé</th>
                    <th>Description</th>
                    <th>Statut</th>
                    <th>Actions</th>
                </tr>
            </thead>

            <tbody>
                <tr
                    v-for="agr in agrs"
                    :key="agr.id"
                >
                    <td>
                        {{ agr.id }}
                    </td>

                    <td>
                        <strong>
                            {{ agr.libelle }}
                        </strong>
                    </td>

                    <td>
                        {{ agr.description || "-" }}
                    </td>

                    

                    <td>
                        <span
                            :class="[
                                'badge',
                                agr.actif
                                    ? 'actif'
                                    : 'inactif'
                            ]"
                        >
                            {{
                                agr.actif
                                    ? "Actif"
                                    : "Inactif"
                            }}
                        </span>
                    </td>

                    <td class="actions">
                        <router-link
                            :to="`/agr/${agr.id}/modifier`"
                        >
                            Modifier
                        </router-link>

                        <button
                            type="button"
                            @click="onDelete(agr.id)"
                        >
                            Supprimer
                        </button>
                    </td>
                </tr>

                <tr v-if="agrs.length === 0">
                    <td colspan="6">
                        Aucun AGR enregistré.
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <ConfirmationDialog
        v-model="showDeleteDialog"
        title="Supprimer cet AGR ?"
        message="Cette action est irréversible."
        confirm-label="Supprimer"
        loading-label="Suppression..."
        :loading="deleting"
        @confirm="confirmDelete"
    />
</template>

<script setup>
import {
    ref,
    onMounted
} from "vue";

import agrService from "../../service/agr.service.js";
import { useToast } from "../../composables/useToast.js";
import ConfirmationDialog from "../../components/ConfirmationDialog.vue";

const toast = useToast();
const agrs = ref([]);
const loading = ref(true);
const error = ref("");
const showDeleteDialog = ref(false);
const selectedAgrId = ref(null);
const deleting = ref(false);


async function loadAgrs() {
    loading.value = true;
    error.value = "";

    try {
        const { data } =
            await agrService.getAll();

        console.log(
            "AGR reçus :",
            data
        );

        agrs.value =
            data.data ??
            data.agr ??
            [];
    } catch (e) {
        console.error(
            "Erreur chargement AGR :",
            e.response?.data || e
        );

        error.value =
            e.response?.data?.message ||
            "Erreur de chargement des AGR";
    } finally {
        loading.value = false;
    }
}

function onDelete(id) {
    selectedAgrId.value = id;
    showDeleteDialog.value = true;
}

async function confirmDelete() {
    if (selectedAgrId.value === null || deleting.value) return;
    const id = selectedAgrId.value;
    deleting.value = true;
    try {
        await agrService.remove(id);
        agrs.value = agrs.value.filter((agr) => agr.id !== id);
        toast.success("AGR supprimé avec succès.");
        showDeleteDialog.value = false;
        selectedAgrId.value = null;
    } catch (e) {
        console.error("Erreur suppression AGR :", e.response?.data || e);
        toast.error(e.response?.data?.message || "Suppression impossible");
    } finally {
        deleting.value = false;
    }
}

onMounted(loadAgrs);
</script>

<style scoped>
.page {
    padding: 1.5rem;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

table {
    width: 100%;
    border-collapse: collapse;
}

th,
td {
    text-align: left;
    padding: 0.7rem;
    border-bottom: 1px solid #e2e8f0;
}

.actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
}

.actions a {
    color: #2563eb;
    text-decoration: none;
}

.actions button {
    border: none;
    background: #fee2e2;
    color: #991b1b;
    padding: 0.35rem 0.6rem;
    border-radius: 4px;
    cursor: pointer;
}

.badge {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
}

.badge.actif {
    background: #dcfce7;
    color: #166534;
}

.badge.inactif {
    background: #fee2e2;
    color: #991b1b;
}

.btn-primary {
    background: #1e293b;
    color: white;
    padding: 0.55rem 1rem;
    border-radius: 6px;
    text-decoration: none;
}

.error {
    color: #b91c1c;
}
</style>
