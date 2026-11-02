import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth.store.js";
import AppLayout from "../components/layouts/AppLayout.vue";

const routes = [
  { path: "/login", component: () => import("../views/auth/Login.vue") },
  {
    path: "/",
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: "", name: "dashboard", component: () => import("../views/dashboard/Dashboard.vue") },
      { path: "voamami", name: "voamami", component: () => import("../views/voamami/VoamamiList.vue"), meta: { requiresAuth: true, roles: ["ADMINISTRATEUR"] } },
      { path: "voamami/nouveau", name: "voamami-nouveau", component: () => import("../views/voamami/VoamamiForm.vue"), meta: { requiresAuth: true, roles: ["ADMINISTRATEUR"] } },
      { path: "voamami/:id/modifier", name: "voamami-modifier", component: () => import("../views/voamami/VoamamiForm.vue"), meta: { requiresAuth: true, roles: ["ADMINISTRATEUR"] } },
      { path: "utilisateurs", name: "utilisateurs", component: () => import("../views/utilisateurs/UtilisateurList.vue"), meta: { requiresAuth: true, roles: ["ADMINISTRATEUR"] } },
      { path: "utilisateurs/nouveau", name: "utilisateur-nouveau", component: () => import("../views/utilisateurs/UtilisateurForm.vue"), meta: { requiresAuth: true, roles: ["ADMINISTRATEUR"] } },
      { path: "utilisateurs/:id/modifier", name: "utilisateur-modifier", component: () => import("../views/utilisateurs/UtilisateurForm.vue"), meta: { requiresAuth: true, roles: ["ADMINISTRATEUR"] } },
      { path: "cycles", name: "cycles", component: () => import("../views/cycles/CycleList.vue"), meta: { requiresAuth: true, roles: ["ADMINISTRATEUR", "AGENT_FID"] } },
      { path: "cycles/nouveau", name: "cycle-nouveau", component: () => import("../views/cycles/CycleForm.vue"), meta: { requiresAuth: true, roles: ["ADMINISTRATEUR", "AGENT_FID"] } },
      { path: "cycles/:id/modifier", name: "cycle-modifier", component: () => import("../views/cycles/CycleForm.vue"), meta: { requiresAuth: true, roles: ["ADMINISTRATEUR", "AGENT_FID"] } },
      { path: "agr", name: "agr", component: () => import("../views/agr/agrList.vue") },
      { path: "agr/nouveau", name: "agr-nouveau", component: () => import("../views/agr/agrForm.vue") },
      { path: "agr/:id/modifier", name: "agr-modifier", component: () => import("../views/agr/agrForm.vue") },
      { path: "membres", name: "membres", component: () => import("../views/membres/MembreList.vue"), meta: { requiresAuth: true, roles: ["ADMINISTRATEUR", "AGENT_FID"] } },
      { path: "membres/nouveau", name: "membres-nouveau", component: () => import("../views/membres/MembreForm.vue"), meta: { requiresAuth: true, roles: ["ADMINISTRATEUR", "AGENT_FID"] } },
      { path: "membres/:id/modifier", name: "membres-modifier", component: () => import("../views/membres/MembreForm.vue"), meta: { requiresAuth: true, roles: ["ADMINISTRATEUR", "AGENT_FID"] } },
      { path: "seances", name: "seances", component: () => import("../views/seances/SeanceList.vue"), meta: { requiresAuth: true, roles: ["ADMINISTRATEUR", "AGENT_FID"] } },
      { path: "seances/nouveau", name: "seances-nouveau", component: () => import("../views/seances/SeanceForm.vue"), meta: { requiresAuth: true, roles: ["ADMINISTRATEUR", "AGENT_FID"] } },
      { path: "seances/:id/modifier", name: "seances-modifier", component: () => import("../views/seances/SeanceForm.vue"), meta: { requiresAuth: true, roles: ["ADMINISTRATEUR", "AGENT_FID"] } },
      { path: "operations", name: "assistant-operations", component: () => import("../views/seances/OperationWizard.vue"), meta: { requiresAuth: true, roles: ["ADMINISTRATEUR", "AGENT_FID"] } },
      { path: "seances/:seanceId/operations", name: "assistant-seance", component: () => import("../views/seances/OperationWizard.vue"), meta: { requiresAuth: true, roles: ["ADMINISTRATEUR", "AGENT_FID"] } },
      { path: "seances/:seanceId/presences", name: "seance-presences", component: () => import("../views/presences/PresenceList.vue"), meta: { requiresAuth: true, roles: ["ADMINISTRATEUR", "AGENT_FID"] } },
      {
    path: "/epargnes",
    name: "epargnes",
    component: () =>
        import("../views/epargnes/EpargneList.vue"),
    meta: {
        requiresAuth: true,
        roles: [
            "ADMINISTRATEUR",
            "AGENT_FID"
        ]
    }
},
{
    path: "/epargnes/nouveau",
    name: "epargne-nouveau",
    component: () =>
        import("../views/epargnes/EpargneForm.vue"),
    meta: {
        requiresAuth: true,
        roles: [
            "ADMINISTRATEUR",
            "AGENT_FID"
        ]
    }
},
{
    path: "/credits",
    name: "credits",
    component: () =>
        import("../views/credits/CreditList.vue"),
    meta: {
        requiresAuth: true,
        roles: [
            "ADMINISTRATEUR",
            "AGENT_FID"
        ]
    }
},
{
    path: "/credits/nouveau",
    name: "credit-nouveau",
    component: () =>
        import("../views/credits/CreditForm.vue"),
    meta: {
        requiresAuth: true,
        roles: [
            "ADMINISTRATEUR",
            "AGENT_FID"
        ]
    }
},
{
    path: "/remboursements",
    name: "remboursements",
    component: () =>
        import("../views/remboursements/RemboursementList.vue"),
    meta: {
        requiresAuth: true,
        roles: [
            "ADMINISTRATEUR",
            "AGENT_FID"
        ]
    }
},
{
    path: "/remboursements/nouveau",
    name: "remboursement-nouveau",
    component: () =>
        import("../views/remboursements/RemboursementForm.vue"),
    meta: {
        requiresAuth: true,
        roles: [
            "ADMINISTRATEUR",
            "AGENT_FID"
        ]
    }
},

{
    path: "/presences",
    name: "presences",
    component: () =>
        import("../views/presences/PresenceList.vue"),
    meta: {
        requiresAuth: true,
        roles: [
            "ADMINISTRATEUR",
            "AGENT_FID"
        ]
    }
},
{
    path: "/seances/presences",
    redirect: { name: "presences" }
},
{
    path: "/seances/:seanceId/presences/nouveau",
    name: "presence-nouveau",
    component: () =>
        import("../views/presences/PresenceForm.vue"),
    meta: {
        requiresAuth: true,
        roles: [
            "ADMINISTRATEUR",
            "AGENT_FID"
        ]
    }
},


{
    path: "/penalites",
    name: "penalites",
    component: () =>
        import("../views/penalites/PenaliteList.vue"),
    meta: {
        requiresAuth: true,
        roles: [
            "ADMINISTRATEUR",
            "AGENT_FID"
        ]
    }
},
{
    path: "/penalites/nouveau",
    name: "penalite-nouveau",
    component: () =>
        import("../views/penalites/PenaliteForm.vue"),
    meta: {
        requiresAuth: true,
        roles: [
            "ADMINISTRATEUR",
            "AGENT_FID"
        ]
    }
},

{
    path: "/caisse",
    name: "caisse",
    component: () =>
        import("../views/caisse/CaisseList.vue"),
    meta: {
        requiresAuth: true,
        roles: [
            "ADMINISTRATEUR",
            "AGENT_FID"
        ]
    }
},

{
    path: "rapports",
    name: "rapports",
    component: () => import("../views/rapports/RapportList.vue")
},
{
    path: "rapports/seances/:seanceId",
    name: "rapport-seance",
    component: () =>
        import(
            "../views/rapports/RapportSeance.vue"
        )
},


{
    path: "rapports/cycles/:cycleId",
    name: "rapport-cycle",
    component: () =>
        import(
            "../views/rapports/RapportClotureCycle.vue"
        )
}




    ],
  },
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (!auth.initialized) return auth.initAuth().then(() => guardRoute(to, auth));

  return guardRoute(to, auth);
});

function guardRoute(to, auth) {
  if (to.meta.requiresAuth && !auth.isAuthenticated) return "/login";
  if (to.meta.roles && !to.meta.roles.includes(auth.user?.role)) return "/"; // accès refusé
}

export default router;