const express = require("express");
const router = express.Router();

const authMiddleware = require(
    "../middlewares/auth.middleware.js"
);

const requireRole = require(
    "../middlewares/role.middleware.js"
);

const controller = require(
    "../controllers/presence.controller.js"
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
    "/:id",
    authMiddleware,
    agentOuAdmin,
    agentVoamamiScope,
    controller.findById
);

router.post(
    "/",
    authMiddleware,
    agentOuAdmin,
    agentVoamamiScope,
    controller.create
);

router.put(
    "/:id",
    authMiddleware,
    agentOuAdmin,
    agentVoamamiScope,
    controller.update
);

router.delete(
    "/:id",
    authMiddleware,
    agentOuAdmin,
    agentVoamamiScope,
    controller.delete
);

module.exports = router;
