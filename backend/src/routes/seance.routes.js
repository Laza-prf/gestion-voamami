const express = require("express");
const router = express.Router();




const {
    body
} = require("express-validator");

const authMiddleware = require(
    "../middlewares/auth.middleware.js"
);

const requireRole = require(
    "../middlewares/role.middleware.js"
);

const validationMiddleware = require(
    "../middlewares/validation.middleware.js"
);

const seanceController = require(
    "../controllers/seance.controller.js"
);
const agentVoamamiScope = require(
    "../middlewares/agent-voamami-scope.middleware.js"
);
const rapportController = require(
    "../controllers/rapport.controller.js"
);

const caisseSocialeController = require(
    "../controllers/caisse-sociale.controller.js"
);

const adminOrAgent = requireRole(
    "ADMINISTRATEUR",
    "AGENT_FID"
);

const createUpdateValidation = [
    body("cycle_id")
        .exists()
        .withMessage(
            "Le cycle est obligatoire."
        )
        .bail()
        .isInt({ min: 1 })
        .withMessage(
            "Le cycle est invalide."
        ),

    body("numero_seance")
        .exists()
        .withMessage(
            "Le numéro de séance est obligatoire."
        )
        .bail()
        .isInt({ min: 1 })
        .withMessage(
            "Le numéro de séance est invalide."
        ),

    body("date_seance")
        .exists()
        .withMessage(
            "La date de séance est obligatoire."
        )
        .bail()
        .isISO8601()
        .withMessage(
            "La date de séance est invalide."
        ),

    body("statut")
        .optional()
        .isIn([
            "OUVERTE",
            "CLOTUREE"
        ])
        .withMessage(
            "Le statut de la séance est invalide."
        ),

    body("observation")
        .optional({ nullable: true })
        .isString()
        .withMessage(
            "L'observation doit être une chaîne de caractères."
        )
];

router.get(
    "/",
    authMiddleware,
    adminOrAgent,
    agentVoamamiScope,
    seanceController.findAll
);

router.get(
    "/:id",
    authMiddleware,
    adminOrAgent,
    agentVoamamiScope,
    seanceController.findById
);

router.post(
    "/",
    authMiddleware,
    adminOrAgent,
    agentVoamamiScope,
    createUpdateValidation,
    validationMiddleware,
    seanceController.create
);

router.put(
    "/:id",
    authMiddleware,
    adminOrAgent,
    agentVoamamiScope,
    createUpdateValidation,
    validationMiddleware,
    seanceController.update
);

router.post(
    "/:id/cloturer",
    authMiddleware,
    adminOrAgent,
    agentVoamamiScope,
    [
        body("observation")
            .optional({ nullable: true })
            .isString()
            .withMessage(
                "L'observation est invalide."
            )
    ],
    validationMiddleware,
    rapportController.cloturerSeance
);

router.delete(
    "/:id",
    authMiddleware,
    requireRole("ADMINISTRATEUR"),
    agentVoamamiScope,
    seanceController.delete
);

router.post(
    "/:seanceId/cotisations-sociales",
    authMiddleware,
    caisseSocialeController.createCotisationForSeance
);

router.get(
    "/:seanceId/cotisations-sociales",
    authMiddleware,
    caisseSocialeController.getCotisationsBySeance
);


module.exports = router;
