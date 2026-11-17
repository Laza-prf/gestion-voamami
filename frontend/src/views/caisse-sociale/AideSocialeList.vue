<template>
    <section class="page">
        <header class="head">
            <div>
                <p class="eyebrow">Caisse sociale</p>
                <h1>Demandes d’aide sociale</h1>
            </div>
            <div class="header-actions">
                <router-link class="btn secondary" to="/caisse-sociale">
                    Caisses sociales
                </router-link>
                <router-link class="btn" to="/caisse-sociale/aides/nouveau">
                    + Demander une aide
                </router-link>
            </div>
        </header>

        <div class="filters">
            <label>
                VOAMAMI
                <select v-model="voamamiId" :disabled="!isAdmin" @change="updateFilter">
                    <option v-if="isAdmin" value="">Tous les VOAMAMI</option>
                    <option
                        v-for="voamami in voamamis"
                        :key="voamami.id"
                        :value="String(voamami.id)"
                    >
                        {{ voamami.code }} — {{ voamami.nom }}
                    </option>
                </select>
            </label>
            <label>
                Statut
                <select v-model="statusFilter">
                    <option value="">Tous les statuts</option>
                    <option value="DEMANDEE">En attente</option>
                    <option value="ACCORDEE">Accordée</option>
                    <option value="REFUSEE">Refusée</option>
                    <option value="PAYEE">Payée</option>
                    <option value="ANNULEE">Annulée</option>
                </select>
            </label>
            <label class="search">
                Recherche
                <input
                    v-model.trim="search"
                    type="search"
                    placeholder="Membre, VOAMAMI ou motif"
                />
            </label>
            <button type="button" class="btn secondary" :disabled="loading" @click="load">
                {{ loading ? "Chargement…" : "Actualiser" }}
            </button>
        </div>

        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <p v-if="listError" class="error" role="alert">{{ listError }}</p>
        <p v-if="voamamiError" class="warning" role="status">
            Le filtre VOAMAMI est indisponible : {{ voamamiError }}
        </p>
        <div class="summary" aria-label="Résumé des demandes">
            <article class="summary-card">
                <span>Total des demandes</span>
                <strong>{{ rows.length }}</strong>
            </article>
            <article class="summary-card pending">
                <span>En attente</span>
                <strong>{{ countByStatus("DEMANDEE") }}</strong>
            </article>
            <article class="summary-card approved">
                <span>Accordées</span>
                <strong>{{ countByStatus("ACCORDEE") }}</strong>
            </article>
            <article class="summary-card paid">
                <span>Payées</span>
                <strong>{{ countByStatus("PAYEE") }}</strong>
            </article>
        </div>

        <div v-if="loading" class="state" role="status">
            Chargement des demandes d’aide…
        </div>
        <div v-else-if="listError" class="state error-state">
            Les demandes n’ont pas pu être chargées. Vérifiez la connexion puis
            actualisez la liste.
        </div>
        <div v-else-if="rows.length === 0" class="state empty-state">
            <strong>Aucune demande d’aide pour le moment.</strong>
            <span>Les nouvelles demandes apparaîtront ici après leur enregistrement.</span>
            <router-link class="btn" to="/caisse-sociale/aides/nouveau">
                Créer une demande
            </router-link>
        </div>
        <div v-else-if="filteredRows.length === 0" class="state empty-state">
            Aucune demande ne correspond aux filtres sélectionnés.
        </div>
        <div v-else class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>VOAMAMI</th>
                        <th>Membre</th>
                        <th>Type</th>
                        <th>Motif</th>
                        <th>Soumise le</th>
                        <th>Demandé</th>
                        <th>Accordé</th>
                        <th>Solde caisse</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="aide in filteredRows" :key="aide.id">
                        <td>{{ aide.voamami_code }} — {{ aide.voamami_nom }}</td>
                        <td>
                            N°{{ aide.numero_membre }} — {{ aide.nom }}
                            {{ aide.prenom || "" }}
                        </td>
                        <td>{{ aide.type_aide }}</td>
                        <td class="motif">{{ aide.motif }}</td>
                        <td>{{ formatDate(aide.created_at) }}</td>
                        <td>{{ money(aide.montant_demande) }}</td>
                        <td>
                            {{ aide.montant_accorde == null
                                ? "—"
                                : money(aide.montant_accorde) }}
                        </td>
                        <td>
                            {{ aide.solde_social == null
                                ? "—"
                                : money(aide.solde_social) }}
                        </td>
                        <td>
                            <span :class="['badge', `status-${aide.statut?.toLowerCase()}`]">
                                {{ statusLabel(aide.statut) }}
                            </span>
                        </td>
                        <td class="actions">
                            <template v-if="aide.statut === 'DEMANDEE' && isAdmin">
                                <button
                                    type="button"
                                    class="action-button"
                                    :disabled="workingId !== null"
                                    @click="openDecision(aide, 'ACCORDEE')"
                                >
                                    {{ workingId === aide.id && workingAction === "ACCORDEE"
                                        ? "Accord…" : "Accorder" }}
                                </button>
                                <button
                                    type="button"
                                    class="action-button"
                                    :disabled="workingId !== null"
                                    @click="openDecision(aide, 'REFUSEE')"
                                >
                                    {{ workingId === aide.id && workingAction === "REFUSEE"
                                        ? "Refus…" : "Refuser" }}
                                </button>
                            </template>
                            <button
                                v-else-if="aide.statut === 'ACCORDEE' && isAdmin"
                                type="button"
                                class="action-button"
                                :disabled="workingId !== null"
                                @click="openPayment(aide)"
                            >
                                {{ workingId === aide.id && workingAction === "PAYEE"
                                    ? "Paiement…" : "Marquer payée" }}
                            </button>
                            <span
                                v-else-if="['DEMANDEE', 'ACCORDEE'].includes(aide.statut) && !isAdmin"
                                class="no-action"
                                title="Action réservée à l’administrateur"
                            >
                                Administrateur requis
                            </span>
                            <span v-else class="no-action">—</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <Teleport to="body">
            <Transition name="modal">
                <div
                    v-if="pendingAction"
                    class="dialog-backdrop"
                    @click.self="closeActionDialog"
                >
                    <section
                        class="action-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="action-dialog-title"
                    >
                        <h2 id="action-dialog-title">{{ dialogTitle }}</h2>
                        <p>{{ dialogDescription }}</p>
                        <label v-if="pendingAction.type === 'ACCORDEE'">
                            Montant accordé (Ar)
                            <input
                                v-model.number="approvalAmount"
                                type="number"
                                min="1"
                                :max="pendingAction.aide.montant_demande"
                                step="1"
                                autofocus
                                :disabled="workingId !== null"
                            />
                            <small>
                                Montant demandé :
                                {{ money(pendingAction.aide.montant_demande) }}.
                                Le solde sera débité au paiement, pas à l’accord.
                            </small>
                        </label>
                        <p v-if="actionError" class="error" role="alert">
                            {{ actionError }}
                        </p>
                        <div class="dialog-actions">
                            <button
                                type="button"
                                class="action-button"
                                :disabled="workingId !== null"
                                @click="closeActionDialog"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                class="action-button primary-action"
                                :disabled="workingId !== null"
                                @click="confirmAction"
                            >
                                {{ workingId !== null ? "Traitement…" : dialogConfirmLabel }}
                            </button>
                        </div>
                    </section>
                </div>
            </Transition>
        </Teleport>
    </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import caisseSocialeService from "../../service/caisse-sociale.service.js";
import voamamiService from "../../service/voamami.service.js";
import { useAuthStore } from "../../stores/auth.store.js";
import { useToast } from "../../composables/useToast.js";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToast();
const isAdmin = computed(() => auth.user?.role === "ADMINISTRATEUR");
const isAgentFid = computed(() => auth.user?.role === "AGENT_FID");
const voamamis = ref([]);
const voamamiId = ref(String(route.query.voamamiId ?? route.query.voamami_id ?? ""));
const rows = ref([]);
const loading = ref(false);
const workingId = ref(null);
const workingAction = ref("");
const pendingAction = ref(null);
const approvalAmount = ref(null);
const actionError = ref("");
const error = ref("");
const listError = ref("");
const voamamiError = ref("");
const search = ref("");
const statusFilter = ref("");

const filteredRows = computed(() => {
    const query = search.value.toLocaleLowerCase("fr");

    return rows.value.filter((aide) => {
        const matchesStatus =
            !statusFilter.value || aide.statut === statusFilter.value;
        const searchable = [
            aide.voamami_code,
            aide.voamami_nom,
            aide.numero_membre,
            aide.nom,
            aide.prenom,
            aide.type_aide,
            aide.motif
        ]
            .filter((value) => value != null)
            .join(" ")
            .toLocaleLowerCase("fr");

        return matchesStatus && (!query || searchable.includes(query));
    });
});

const dialogTitle = computed(() => {
    if (pendingAction.value?.type === "ACCORDEE") {
        return "Accorder cette demande ?";
    }
    if (pendingAction.value?.type === "REFUSEE") {
        return "Refuser cette demande ?";
    }
    return "Confirmer le paiement ?";
});

const dialogDescription = computed(() => {
    const aide = pendingAction.value?.aide;
    if (!aide) {
        return "";
    }
    if (pendingAction.value.type === "ACCORDEE") {
        return `Demande de ${aide.nom} ${aide.prenom || ""} — ${money(aide.montant_demande)} demandés.`;
    }
    if (pendingAction.value.type === "REFUSEE") {
        return `La demande de ${aide.nom} ${aide.prenom || ""} sera marquée comme refusée.`;
    }

    return `Le paiement de ${money(aide.montant_accorde)} sera enregistré. Le solde passera de ${money(aide.solde_social)} à ${money(Number(aide.solde_social) - Number(aide.montant_accorde))}.`;
});

const dialogConfirmLabel = computed(() => ({
    ACCORDEE: "Accorder",
    REFUSEE: "Confirmer le refus",
    PAYEE: "Confirmer le paiement"
}[pendingAction.value?.type] ?? "Confirmer"));

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
    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("fr-FR").format(date);
}

function getErrorMessage(err, fallback) {
    return err.response?.data?.message || err.message || fallback;
}

function extractAides(responseData) {
    const candidates = [
        responseData,
        responseData?.data,
        responseData?.data?.data,
        responseData?.data?.aides,
        responseData?.data?.rows,
        responseData?.aides,
        responseData?.rows
    ];

    return candidates.find(Array.isArray) ?? null;
}

function countByStatus(status) {
    return rows.value.filter((aide) => aide.statut === status).length;
}

function statusLabel(status) {
    return {
        DEMANDEE: "En attente",
        ACCORDEE: "Accordée",
        REFUSEE: "Refusée",
        PAYEE: "Payée",
        ANNULEE: "Annulée"
    }[status] ?? status ?? "Inconnu";
}

async function load() {
    loading.value = true;
    error.value = "";
    listError.value = "";

    try {
        const response = await caisseSocialeService.getAllAides({
            voamamiId: voamamiId.value || undefined
        });
        const aides = extractAides(response?.data);

        if (!aides) {
            throw new Error(
                "La réponse du serveur ne contient pas une liste de demandes."
            );
        }

        rows.value = aides;
    } catch (err) {
        rows.value = [];
        listError.value = getErrorMessage(
            err,
            "Impossible de charger les demandes d’aide."
        );
    } finally {
        loading.value = false;
    }
}

function openDecision(aide, statut) {
    pendingAction.value = { aide, type: statut };
    approvalAmount.value = Number(aide.montant_demande);
    actionError.value = "";
    error.value = "";
}

function openPayment(aide) {
    pendingAction.value = { aide, type: "PAYEE" };
    actionError.value = "";
    error.value = "";
}

function closeActionDialog() {
    if (workingId.value !== null) {
        return;
    }
    pendingAction.value = null;
    actionError.value = "";
}

async function confirmAction() {
    if (!pendingAction.value) {
        return;
    }
    if (pendingAction.value.type === "PAYEE") {
        await pay(pendingAction.value.aide);
        return;
    }
    await decide(pendingAction.value.aide, pendingAction.value.type);
}

async function decide(aide, statut) {
    const montantAccorde = statut === "ACCORDEE"
        ? Number(approvalAmount.value)
        : null;

    if (
        statut === "ACCORDEE" &&
        (!Number.isInteger(montantAccorde) || montantAccorde <= 0)
    ) {
        actionError.value =
            "Le montant accordé doit être un entier supérieur à zéro.";
        return;
    }
    if (
        statut === "ACCORDEE" &&
        montantAccorde > Number(aide.montant_demande)
    ) {
        actionError.value =
            "Le montant accordé ne peut pas dépasser le montant demandé.";
        return;
    }

    workingId.value = aide.id;
    workingAction.value = statut;
    error.value = "";
    actionError.value = "";

    try {
        await caisseSocialeService.decideAide(aide.id, {
            statut,
            montant_accorde: montantAccorde
        });
        toast.success(
            statut === "ACCORDEE"
                ? "La demande a été accordée."
                : "La demande a été refusée."
        );
        pendingAction.value = null;
        await load();
    } catch (err) {
        toast.error(getErrorMessage(err, "Impossible de traiter cette demande."));
        actionError.value = getErrorMessage(
            err,
            "Impossible de traiter cette demande."
        );
    } finally {
        workingId.value = null;
        workingAction.value = "";
    }
}

async function pay(aide) {
    const montant = Number(aide.montant_accorde);
    const solde = Number(aide.solde_social);

    if (!Number.isFinite(solde) || montant > solde) {
        actionError.value =
            "Le solde actuel de la caisse sociale est insuffisant pour payer cette aide.";
        return;
    }

    workingId.value = aide.id;
    workingAction.value = "PAYEE";
    error.value = "";
    actionError.value = "";

    try {
        await caisseSocialeService.payerAide(aide.id);
        toast.success("Paiement enregistré et déduit du solde social.");
        pendingAction.value = null;
        await load();
    } catch (err) {
        toast.error(
            getErrorMessage(err, "Impossible d’enregistrer le paiement.")
        );
        actionError.value = getErrorMessage(
            err,
            "Impossible d’enregistrer le paiement."
        );
    } finally {
        workingId.value = null;
        workingAction.value = "";
    }
}

function updateFilter() {
    router.replace({
        query: {
            ...route.query,
            voamamiId: voamamiId.value || undefined
        }
    });
}

watch(
    () => route.query.voamamiId,
    (value) => {
        if (isAdmin.value) {
            voamamiId.value = String(value ?? "");
        }
        load();
    }
);

onMounted(async () => {
    if (route.query.created === "1") {
        toast.success("La demande d’aide a bien été enregistrée.");
        const query = { ...route.query };
        delete query.created;
        await router.replace({ query });
    }

    try {
        const { data } = await voamamiService.getAll();
        const values = [
            data?.data,
            data?.data?.voamamis,
            data?.voamamis,
            data?.rows
        ];
        voamamis.value = values.find(Array.isArray) ?? [];
        if (isAgentFid.value) {
            voamamiId.value = String(
                voamamis.value.find(
                    (voamami) => Number(voamami.agent_responsable_id) === Number(auth.user?.id)
                )?.id ?? ""
            );
        }
    } catch (err) {
        voamamiError.value = getErrorMessage(
            err,
            "Impossible de charger la liste des VOAMAMI."
        );
    }

    await load();
});
</script>

<style scoped>
.page {
    max-width: 1400px;
    margin: auto;
    padding: 2rem;
}

.head,
.header-actions,
.filters {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.eyebrow {
    color: #2563eb;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
}

.header-actions {
    flex-wrap: wrap;
}

.btn {
    display: inline-flex;
    align-items: center;
    border: 0;
    border-radius: 0.6rem;
    background: #2563eb;
    color: #fff;
    padding: 0.7rem 1rem;
    font: inherit;
    text-decoration: none;
    cursor: pointer;
}

.btn.secondary {
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #334155;
}

.btn:disabled,
.actions button:disabled {
    cursor: wait;
    opacity: 0.6;
}

.filters {
    align-items: flex-end;
    justify-content: flex-start;
    margin: 1.5rem 0;
    flex-wrap: wrap;
}

.filters label {
    display: grid;
    min-width: min(320px, 100%);
    gap: 0.3rem;
    font-weight: 600;
}

.filters .search {
    flex: 1;
}

select,
input {
    width: 100%;
    padding: 0.7rem;
    border: 1px solid #cbd5e1;
    border-radius: 0.5rem;
    background: #fff;
    font: inherit;
}

.summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.85rem;
    margin-bottom: 1.25rem;
}

.summary-card {
    display: grid;
    gap: 0.35rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    background: #fff;
    padding: 1rem;
    color: #475569;
}

.summary-card strong {
    color: #0f172a;
    font-size: 1.5rem;
}

.summary-card.pending {
    border-color: #cbd5e1;
}

.summary-card.approved,
.summary-card.paid {
    border-color: #cbd5e1;
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
}

.badge {
    display: inline-block;
    border-radius: 99px;
    background: #f1f5f9;
    color: #334155;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
}

.status-accordee,
.status-payee {
    background: #e2e8f0;
    color: #1e293b;
}

.status-refusee {
    background: #f1f5f9;
    color: #475569;
}

.warning {
    border-radius: 0.5rem;
    background: #f1f5f9;
    color: #475569;
    padding: 0.75rem 1rem;
}

.actions {
    white-space: nowrap;
}

.action-button {
    margin: 0.15rem;
    border: 1px solid #cbd5e1;
    border-radius: 0.4rem;
    background: #fff;
    color: #334155;
    padding: 0.45rem 0.6rem;
    cursor: pointer;
}

.action-button:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #94a3b8;
}

.action-button:disabled {
    cursor: wait;
    opacity: 0.6;
}

.motif {
    max-width: 260px;
    white-space: normal;
    overflow-wrap: anywhere;
}

.no-action,
.state {
    color: #64748b;
}

.state {
    padding: 1rem;
    text-align: center;
}

.empty-state {
    display: grid;
    justify-items: center;
    gap: 0.75rem;
    border: 1px dashed #cbd5e1;
    border-radius: 0.75rem;
    background: #f8fafc;
    padding: 2rem 1rem;
}

.empty-state strong {
    color: #0f172a;
}

.empty-state .btn {
    margin-top: 0.25rem;
}

.error-state {
    color: #991b1b;
}

.dialog-backdrop {
    position: fixed;
    z-index: 1000;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgb(15 23 42 / 45%);
    padding: 1rem;
}

.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.16s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.action-dialog {
    width: min(100%, 480px);
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    background: #fff;
    padding: 1.25rem;
    box-shadow: 0 16px 40px rgb(15 23 42 / 18%);
}

.action-dialog h2 {
    margin: 0 0 0.5rem;
    color: #0f172a;
    font-size: 1.2rem;
}

.action-dialog > p {
    color: #475569;
    line-height: 1.5;
}

.action-dialog label {
    display: grid;
    gap: 0.5rem;
    margin: 1rem 0;
    color: #334155;
    font-weight: 600;
}

.action-dialog small {
    color: #64748b;
    font-weight: 400;
    line-height: 1.5;
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1rem;
}

.primary-action {
    border-color: #334155;
    background: #334155;
    color: #fff;
}

.primary-action:hover:not(:disabled) {
    border-color: #1e293b;
    background: #1e293b;
}

.error {
    background: #fee2e2;
    color: #991b1b;
    padding: 0.7rem;
}

@media (max-width: 650px) {
    .page {
        padding: 1rem;
    }

    .head,
    .filters {
        align-items: stretch;
        flex-direction: column;
    }

    .summary {
        grid-template-columns: 1fr 1fr;
    }
}
</style>
