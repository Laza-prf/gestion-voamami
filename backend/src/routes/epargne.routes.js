const express = require("express");
const router = express.Router();

const authMiddleware = require(
    "../middlewares/auth.middleware.js"
);

const requireRole = require(
    "../middlewares/role.middleware.js"
);

const EpargneController = require(
    "../controllers/epargne.controller.js"
);
const agentVoamamiScope = require(
    "../middlewares/agent-voamami-scope.middleware.js"
);
const idempotency = require("../middlewares/idempotency.middleware.js");

const roles = requireRole(
    "ADMINISTRATEUR",
    "AGENT_FID"
);

router.get(
    "/",
    authMiddleware,
    roles,
    agentVoamamiScope,
    EpargneController.findAll
);

router.get(
    "/:id",
    authMiddleware,
    roles,
    agentVoamamiScope,
    EpargneController.findById
);

router.post(
    "/",
    authMiddleware,
    roles,
    agentVoamamiScope,
    idempotency,
    EpargneController.create
);

router.put(
    "/:id",
    authMiddleware,
    roles,
    agentVoamamiScope,
    idempotency,
    EpargneController.update
);

router.delete(
    "/:id",
    authMiddleware,
    requireRole("ADMINISTRATEUR"),
    agentVoamamiScope,
    EpargneController.delete
);

module.exports = router;
