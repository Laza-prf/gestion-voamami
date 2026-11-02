const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const authMiddleware = require("../middlewares/auth.middleware.js");
const requireRole = require("../middlewares/role.middleware.js");
const agentVoamamiScope = require("../middlewares/agent-voamami-scope.middleware.js");
const voamamiController = require("../controllers/voamami.controller.js");

const validations = [
    body("code").notEmpty().withMessage("Le code est requis"),
    body("nom").notEmpty().withMessage("Le nom est requis"),
    body("date_creation").notEmpty().withMessage("La date est requis")
];

//GET /api/voamami
router.get("/", authMiddleware, agentVoamamiScope, voamamiController.findAll);

//GET /api/voamami/:id
router.get("/:id", authMiddleware, agentVoamamiScope, voamamiController.findById);

//POST /api/voamami (admi uniquement)
router.post("/",
    authMiddleware,
    requireRole("ADMINISTRATEUR"),
    validations,
    voamamiController.create
);

//PUT api/voamami/:id (admin uniquement)
router.put("/:id",
    authMiddleware,
    requireRole("ADMINISTRATEUR"),
    voamamiController.update
);

//DELETE /api/voamami/:id (admin uniquement)
router.delete("/:id",
    authMiddleware,
    requireRole("ADMINISTRATEUR"),
    voamamiController.delete
);

module.exports = router;