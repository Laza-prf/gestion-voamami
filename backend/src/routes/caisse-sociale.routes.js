const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware.js");
const caisseSocialeController = require(
    "../controllers/caisse-sociale.controller.js"
);

// Toutes les routes de caisse sociale nécessitent une authentification
router.use(authMiddleware);

// Vue générale des caisses sociales
router.get(
    "/",
    caisseSocialeController.list
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
    caisseSocialeController.decideAide
);

// Payer une aide accordée
router.patch(
    "/aides/:id/paiement",
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
    caisseSocialeController.createCotisationForSeance
);

module.exports = router;
