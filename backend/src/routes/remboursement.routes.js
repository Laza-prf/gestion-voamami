const express = require("express");
const router = express.Router();

const authMiddleware = require(
    "../middlewares/auth.middleware.js"
);

const requireRole = require(
    "../middlewares/role.middleware.js"
);

const controller = require(
    "../controllers/remboursement.controller.js"
);
const agentVoamamiScope = require(
    "../middlewares/agent-voamami-scope.middleware.js"
);

const roles = requireRole(
    "ADMINISTRATEUR",
    "AGENT_FID"
);

router.get(
    "/",
    authMiddleware,
    roles,
    agentVoamamiScope,
    controller.findAll
);

router.get(
    "/:id",
    authMiddleware,
    roles,
    agentVoamamiScope,
    controller.findById
);

router.post(
    "/",
    authMiddleware,
    roles,
    agentVoamamiScope,
    controller.create
);

module.exports = router;
