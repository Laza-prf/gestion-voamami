const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");

const authMiddleware = require("../middlewares/auth.middleware.js");
const requireRole = require("../middlewares/role.middleware.js");
const validationMiddleware = require("../middlewares/validation.middleware.js");
const userController = require("../controllers/user.controller.js");

/**
 * Lister les utilisateurs
 * Accessible uniquement à l'administrateur
 */
router.get(
    "/",
    authMiddleware,
    requireRole("ADMINISTRATEUR"),
    userController.getAll
);

/**
 * Récupérer un utilisateur
 */
router.get(
    "/:id",
    authMiddleware,
    requireRole("ADMINISTRATEUR"),
    userController.getById
);

/**
 * Créer un compte agent
 */
router.post(
    "/",
    authMiddleware,
    requireRole("ADMINISTRATEUR"),
    [
        body("nom")
            .trim()
            .notEmpty()
            .withMessage("Le nom est requis"),

        body("prenom")
            .trim()
            .notEmpty()
            .withMessage("Le prénom est requis"),

        body("email")
            .trim()
            .normalizeEmail()
            .isEmail()
            .withMessage("Email invalide"),

        body("mot_de_passe")
            .isString()
            .isLength({ min: 6 })
            .withMessage(
                "Le mot de passe doit contenir au moins 6 caractères"
            )
    ],
    validationMiddleware,
    userController.create
);

router.put(
    "/:id",
    authMiddleware,
    requireRole("ADMINISTRATEUR"),
    [
        param("id").isInt({ min: 1 }).withMessage("Identifiant utilisateur invalide"),
        body("nom").trim().notEmpty().withMessage("Le nom est requis"),
        body("prenom").trim().notEmpty().withMessage("Le prénom est requis"),
        body("email").trim().normalizeEmail().isEmail().withMessage("Email invalide"),
        body("mot_de_passe")
            .optional()
            .isLength({ min: 6 })
            .withMessage("Le mot de passe doit contenir au moins 6 caractères")
    ],
    validationMiddleware,
    userController.update
);

router.delete(
    "/:id",
    authMiddleware,
    requireRole("ADMINISTRATEUR"),
    param("id").isInt({ min: 1 }).withMessage("Identifiant utilisateur invalide"),
    validationMiddleware,
    userController.delete
);

module.exports = router;
