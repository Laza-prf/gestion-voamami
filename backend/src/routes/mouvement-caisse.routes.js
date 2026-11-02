const express = require("express");
const router = express.Router();

const authMiddleware = require(
    "../middlewares/auth.middleware.js"
);

const requireRole = require(
    "../middlewares/role.middleware.js"
);

const controller = require(
    "../controllers/mouvement-caisse.controller.js"
);
const agentVoamamiScope = require(
    "../middlewares/agent-voamami-scope.middleware.js"
);

const agentOuAdmin = requireRole(
    "ADMINISTRATEUR",
    "AGENT_FID"
);

router.get(
    "/",
    authMiddleware,
    agentOuAdmin,
    agentVoamamiScope,
    controller.findAll
);

router.get(
    "/resume",
    authMiddleware,
    agentOuAdmin,
    agentVoamamiScope,
    controller.summary
);

router.get(
    "/soldes-par-voamami",
    authMiddleware,
    agentOuAdmin,
    agentVoamamiScope,
    controller.balancesByVoamami
);

router.get(
    "/:id",
    authMiddleware,
    agentOuAdmin,
    agentVoamamiScope,
    controller.findById
);

module.exports = router;
