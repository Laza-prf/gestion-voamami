const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const authMiddleware = require("../middlewares/auth.middleware.js");
const authController = require("../controllers/auth.controller.js");



// ============================================================
// CONNEXION
// ============================================================
router.post(
    "/login",
    [
        body("email")
            .isEmail()
            .withMessage("Veuillez fournir un email valide"),

        body("mot_de_passe")
            .notEmpty()
            .withMessage("Le mot de passe est requis")
    ],
    authController.login
);


// ============================================================
// TEST AUTHENTIFICATION
// ============================================================
router.get(
    "/test",
    authMiddleware,
    (req, res) => {
        res.json({
            success: true,
            message: "Route auth fonctionne",
            utilisateur: req.user
        });
    }
);


// ============================================================
// DÉCONNEXION
// ============================================================
router.post(
    "/logout",
    authMiddleware,
    authController.logout
);


// ============================================================
// PROFIL
// ============================================================
router.get(
    "/profile",
    authMiddleware,
    authController.getProfile
);


// ============================================================
// MODIFICATION PROFIL
// ============================================================
router.put(
    "/profile",
    authMiddleware,
    authController.updateProfile
);


// ============================================================
// MODIFICATION MOT DE PASSE
// ============================================================
router.put(
    "/profile/password",
    authMiddleware,
    authController.updatePassword
);

router.post(
    "/forgot-password",
    authController.forgotPassword
);

router.post(
    "/reset-password",
    authController.resetPassword
);

router.patch(
    "/change-password",
    authMiddleware,
    authController.changePassword
);


module.exports = router;

