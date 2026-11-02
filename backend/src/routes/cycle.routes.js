const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const authMiddleware = require("../middlewares/auth.middleware.js");
const requireRole = require("../middlewares/role.middleware.js");
const agentVoamamiScope = require("../middlewares/agent-voamami-scope.middleware.js");
const cycleController = require("../controllers/cycle.controller.js");

const validations = [
    body("voamami_id").notEmpty().withMessage("Le voamami_id est requis"),
    body("numero_cycle").notEmpty().withMessage("Le numero_cycle est requis"),
    body("date_debut").notEmpty().withMessage("La date_debut est requise"),
    body("date_fin_prevue").notEmpty().withMessage("La date_fin_prevue est requise"),
    body("montant_part_epargne").notEmpty().withMessage("Le montant_part_epargne est requis"),
    body("montant_penalite").notEmpty().withMessage("Le montant_penalite est requis"),
    body("taux_interet").notEmpty().withMessage("Le taux_interet est requis"),
    body("duree_credit_mois").notEmpty().withMessage("La duree_credit_mois est requise")    
]

//GET /api/cyles
router.get("/", authMiddleware, agentVoamamiScope, cycleController.findAll);

//GET /api/cycles/:id
router.get("/:id", authMiddleware, agentVoamamiScope, cycleController.findById);

//POST /api/cycles (agent uniquement)
router.post("/", authMiddleware, agentVoamamiScope, cycleController.create);

//PUT /api/membres/:id (agent uniquement)
router.put("/:id", authMiddleware, agentVoamamiScope, cycleController.update);

//DELETE /api/membres/:id (agent uniquement)
router.delete("/:id", authMiddleware, agentVoamamiScope, cycleController.delete);

module.exports = router;
