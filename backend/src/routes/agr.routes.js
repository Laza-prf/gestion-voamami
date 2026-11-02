const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const authMiddleware = require("../middlewares/auth.middleware.js");
const requireRole = require("../middlewares/role.middleware.js");
const agrController = require("../controllers/agr.controller.js");

const validations = [
    body("libelle").notEmpty().withMessage("Le libelle est requis"),
    body("description").notEmpty().withMessage("La description est requise"),
]
    

//GET /api/agr
router.get("/", authMiddleware, agrController.findAll);

//GET /api/agr/:id
router.get("/:id", authMiddleware, agrController.findById);

//POST /api/agr (agent uniquement)
router.post("/", authMiddleware, agrController.create);

//PUT /api/agr/:id (agent uniquement)
router.put("/:id", authMiddleware,  agrController.update);

//DELETE /api/agr/:id (agent uniquement)
router.delete("/:id", authMiddleware, agrController.delete);

module.exports = router;
