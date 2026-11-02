const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const authMiddleware = require("../middlewares/auth.middleware.js");
const requireRole = require("../middlewares/role.middleware.js");
const membreController = require("../controllers/membre.controller.js");
const agentVoamamiScope = require("../middlewares/agent-voamami-scope.middleware.js");

const validations = [
    body("voamami_id").notEmpty().withMessage("Le voamami_id est requis"),
    body("numero_membre").notEmpty().withMessage("Le numero est requis"),
    body("nom").notEmpty().withMessage("Le nom est requis"),
    body("prenom").notEmpty().withMessage("Le prenom est requis"),

];

// routes/membre.routes.js

router.get(
    "/",
    authMiddleware,
    requireRole(
        "ADMINISTRATEUR",
        "AGENT_FID"
    ),
    agentVoamamiScope,
    membreController.findAll
);

router.get(
    "/:id",
    authMiddleware,
    requireRole(
        "ADMINISTRATEUR",
        "AGENT_FID"
    ),
    agentVoamamiScope,
    membreController.findById
);

router.post(
    "/",
    authMiddleware,
    requireRole(
        "ADMINISTRATEUR",
        "AGENT_FID"
    ),
    agentVoamamiScope,
    membreController.create
);

router.put(
    "/:id",
    authMiddleware,
    requireRole(
        "ADMINISTRATEUR",
        "AGENT_FID"
    ),
    agentVoamamiScope,
    membreController.update
);

router.delete(
    "/:id",
    authMiddleware,
    requireRole("ADMINISTRATEUR"),
    agentVoamamiScope,
    membreController.delete
);


module.exports = router;
