const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware.js");
const caisseSocialeController = require(
    "../controllers/caisse-sociale.controller.js"
);
const idempotency = require("../middlewares/idempotency.middleware.js");

// Toutes les routes de caisse sociale nécessitent une authentification
router.use(authMiddleware);

// Vue générale des caisses sociales
router.get(
    "/",
    caisseSocialeController.list
);

// Demandes d’aide de toutes les caisses (filtrables par VOAMAMI)
router.get(
    "/aides",
    caisseSocialeController.aides
);

// Une caisse sociale par VOAMAMI
router.get(
    "/:voamamiId",
    caisseSocialeController.getByVoamami
);

// Cotisations sociales d'un VOAMAMI
router.get(
    "/:voamamiId/cotisations",
    caisseSocialeController.cotisations
);

// Ajouter une cotisation depuis la page caisse sociale
router.post(
    "/:voamamiId/cotisations",
    idempotency,
    caisseSocialeController.createCotisation
);

// Demandes d'aide d'un VOAMAMI
router.get(
    "/:voamamiId/aides",
    caisseSocialeController.aides
);

// Créer une demande d'aide
router.post(
    "/:voamamiId/aides",
    idempotency,
    caisseSocialeController.createAide
);

// Mouvements sociaux d'un VOAMAMI
router.get(
    "/:voamamiId/mouvements",
    caisseSocialeController.mouvements
);

// Décider une demande : ADMINISTRATEUR dans le contrôleur
router.patch(
    "/aides/:id/decision",
    idempotency,
    caisseSocialeController.decideAide
);

// Payer une aide accordée
router.patch(
    "/aides/:id/paiement",
    idempotency,
    caisseSocialeController.payerAide
);

router.get(
    "/seances/:seanceId/cotisations-sociales",
    authMiddleware,
    caisseSocialeController.getCotisationsBySeance
);
router.post(
    "/seances/:seanceId/cotisations-sociales",
    authMiddleware,
    idempotency,
    caisseSocialeController.createCotisationForSeance
);

module.exports = router;
