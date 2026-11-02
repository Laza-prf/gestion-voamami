const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware.js");
const requireRole = require("../middlewares/role.middleware.js");
const rapportController = require("../controllers/rapport.controller.js");
const agentVoamamiScope = require("../middlewares/agent-voamami-scope.middleware.js");

router.use(authMiddleware);
router.use(requireRole("ADMINISTRATEUR", "AGENT_FID"));

// Routes spécifiques avant /:id
router.get(
    "/seances/:seanceId",
    agentVoamamiScope,
    rapportController.rapportSeance
);

router.get(
    "/seances/:seanceId/pdf",
    agentVoamamiScope,
    rapportController.rapportSeancePdf
);

router.get(
    "/cycles/:cycleId",
    agentVoamamiScope,
    rapportController.rapportCycle
);

router.get(
    "/cycles/:cycleId/pdf",
    agentVoamamiScope,
    rapportController.rapportCyclePdf
);

router.post(
    "/cycles/:cycleId/cloturer",
    agentVoamamiScope,
    rapportController.cloturerCycle
);

router.get(
    "/",
    agentVoamamiScope,
    rapportController.findAll
);

router.get(
    "/:id",
    agentVoamamiScope,
    rapportController.findById
);

module.exports = router;
