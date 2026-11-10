const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { promisePool } = require("../config/db.js");
const {
    sendPasswordResetEmail
} = require("../services/email.service.js");

exports.login = async (req, res, next) => {
    try {
        const { email, mot_de_passe } = req.body;

        console.log("Email:", email);

        // Validation des données
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        // Rechercher l'utilisateur
        console.log(
            "Requête SQL pour trouver l'utilisateur:",
            email
        );

        const [rows] = await promisePool.query(
            `SELECT
                id,
                nom,
                prenom,
                email,
                mot_de_passe,
                role,
                actif,
                created_at,
                updated_at
             FROM utilisateurs
             WHERE email = ?`,
            [email]
        );

        // Utilisateur inexistant
        if (rows.length === 0) {
            console.log(
                "Utilisateur non trouvé:",
                email
            );

            return res.status(401).json({
                success: false,
                message: "Email ou mot de passe incorrect"
            });
        }

        const utilisateur = rows[0];

        // Vérifier si le compte est actif
        if (!utilisateur.actif) {
            console.log(
                "Utilisateur désactivé:",
                email
            );

            return res.status(403).json({
                success: false,
                message:
                    "Votre compte est désactivé. Veuillez contacter l'administrateur."
            });
        }

        // Vérifier le mot de passe
        console.log(
            "Comparaison du mot de passe pour:",
            email
        );

        const isValidPassword = await bcrypt.compare(
            mot_de_passe,
            utilisateur.mot_de_passe
        );

        console.log(
            "Mot de passe valide:",
            isValidPassword
        );

        if (!isValidPassword) {
            console.log(
                "Mot de passe incorrect:",
                email
            );

            return res.status(401).json({
                success: false,
                message: "Email ou mot de passe incorrect"
            });
        }

        // Générer le token JWT
        const token = jwt.sign(
            {
                id: utilisateur.id,
                email: utilisateur.email,
                role: utilisateur.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRE || "1d"
            }
        );

        // Ne jamais retourner le mot de passe
        delete utilisateur.mot_de_passe;

        console.log(
            "Connexion réussie:",
            email
        );

        return res.json({
            success: true,
            message: "Connexion réussie",
            token,
            utilisateur
        });

    } catch (error) {
        console.error(
            "Erreur lors de la connexion:",
            error
        );

        next(error);
    }
};


// ============================================================
// DÉCONNEXION
// ============================================================
exports.logout = async (req, res, next) => {
    try {
        const [rows] = await promisePool.query(
            `SELECT
                id,
                nom,
                prenom,
                email,
                role,
                actif,
                created_at,
                updated_at
             FROM utilisateurs
             WHERE id = ?`,
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Utilisateur non trouvé"
            });
        }

        return res.json({
            success: true,
            message: "Déconnexion réussie",
            utilisateur: rows[0]
        });

    } catch (error) {
        console.error(
            "Erreur lors de la déconnexion:",
            error
        );

        next(error);
    }
};


// ============================================================
// PROFIL UTILISATEUR
// ============================================================
exports.getProfile = async (req, res, next) => {
    try {
        const [rows] = await promisePool.query(
            `SELECT
                id,
                nom,
                prenom,
                email,
                role,
                actif,
                created_at,
                updated_at
             FROM utilisateurs
             WHERE id = ?`,
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Utilisateur non trouvé"
            });
        }

        return res.json({
            success: true,
            utilisateur: rows[0]
        });

    } catch (error) {
        console.error(
            "Erreur lors de la récupération du profil:",
            error
        );

        next(error);
    }
};


// ============================================================
// MODIFICATION DU PROFIL
// ============================================================
exports.updateProfile = async (req, res, next) => {
    try {
        const { nom, prenom, email } = req.body;

        // Validation
        if (!nom || !email) {
            return res.status(400).json({
                success: false,
                message: "Le nom et l'email sont requis"
            });
        }

        // Vérifier si l'email est déjà utilisé
        const [existingUser] = await promisePool.query(
            `SELECT id
             FROM utilisateurs
             WHERE email = ?
             AND id != ?`,
            [email, req.user.id]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Cet email est déjà utilisé"
            });
        }

        // Mettre à jour
        await promisePool.query(
            `UPDATE utilisateurs
             SET nom = ?,
                 prenom = ?,
                 email = ?
             WHERE id = ?`,
            [
                nom,
                prenom || null,
                email,
                req.user.id
            ]
        );

        // Récupérer le profil mis à jour
        const [rows] = await promisePool.query(
            `SELECT
                id,
                nom,
                prenom,
                email,
                role,
                actif,
                created_at,
                updated_at
             FROM utilisateurs
             WHERE id = ?`,
            [req.user.id]
        );

        return res.json({
            success: true,
            message: "Profil mis à jour avec succès",
            utilisateur: rows[0]
        });

    } catch (error) {
        console.error(
            "Erreur lors de la modification du profil:",
            error
        );

        next(error);
    }
};


// ============================================================
// MODIFICATION DU MOT DE PASSE
// ============================================================
exports.updatePassword = async (req, res, next) => {
    try {
        const {
            ancien_mot_de_passe,
            nouveau_mot_de_passe
        } = req.body;

        // Vérifier les données
        if (
            !ancien_mot_de_passe ||
            !nouveau_mot_de_passe
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "L'ancien et le nouveau mot de passe sont requis"
            });
        }

        // Vérifier la longueur
        if (nouveau_mot_de_passe.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Le nouveau mot de passe doit contenir au moins 6 caractères"
            });
        }

        // Récupérer le mot de passe actuel
        const [rows] = await promisePool.query(
            `SELECT mot_de_passe
             FROM utilisateurs
             WHERE id = ?`,
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Utilisateur non trouvé"
            });
        }

        // Vérifier l'ancien mot de passe
        const isValidPassword = await bcrypt.compare(
            ancien_mot_de_passe,
            rows[0].mot_de_passe
        );

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: "Ancien mot de passe incorrect"
            });
        }

        // Hasher le nouveau mot de passe
        const nouveauMotDePasseHash =
            await bcrypt.hash(
                nouveau_mot_de_passe,
                10
            );

        // Enregistrer le nouveau mot de passe
        await promisePool.query(
            `UPDATE utilisateurs
             SET mot_de_passe = ?
             WHERE id = ?`,
            [
                nouveauMotDePasseHash,
                req.user.id
            ]
        );

        return res.json({
            success: true,
            message:
                "Mot de passe modifié avec succès"
        });

    } catch (error) {
        console.error(
            "Erreur lors de la modification du mot de passe:",
            error
        );

        next(error);
    }
};

exports.changePassword = async (req, res) => {
    try {
        const {
            ancien_mot_de_passe,
            nouveau_mot_de_passe,
            confirmation
        } = req.body;

        if (
            !ancien_mot_de_passe ||
            !nouveau_mot_de_passe ||
            !confirmation
        ) {
            return res.status(400).json({
                success: false,
                message: "Tous les champs sont obligatoires."
            });
        }

        if (nouveau_mot_de_passe.length < 8) {
            return res.status(400).json({
                success: false,
                message:
                    "Le nouveau mot de passe doit contenir au moins 8 caractères."
            });
        }

        if (nouveau_mot_de_passe !== confirmation) {
            return res.status(400).json({
                success: false,
                message:
                    "Les deux nouveaux mots de passe ne correspondent pas."
            });
        }

        const utilisateurId =
            req.user?.id ||
            req.user?.utilisateur_id ||
            req.user?.userId;

        if (!utilisateurId) {
            return res.status(401).json({
                success: false,
                message: "Utilisateur non authentifié."
            });
        }

        const [rows] = await promisePool.query(
            `
            SELECT id, mot_de_passe
            FROM utilisateurs
            WHERE id = ?
            LIMIT 1
            `,
            [utilisateurId]
        );

        const utilisateur = rows[0];

        if (!utilisateur) {
            return res.status(404).json({
                success: false,
                message: "Utilisateur introuvable."
            });
        }

        const ancienMotDePasseValide =
            await bcrypt.compare(
                ancien_mot_de_passe,
                utilisateur.mot_de_passe
            );

        if (!ancienMotDePasseValide) {
            return res.status(400).json({
                success: false,
                message: "L’ancien mot de passe est incorrect."
            });
        }

        if (
            ancien_mot_de_passe ===
            nouveau_mot_de_passe
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Le nouveau mot de passe doit être différent de l’ancien."
            });
        }

        const nouveauHash = await bcrypt.hash(
            nouveau_mot_de_passe,
            12
        );

        await promisePool.query(
            `
            UPDATE utilisateurs
            SET mot_de_passe = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [nouveauHash, utilisateurId]
        );

        return res.status(200).json({
            success: true,
            message:
                "Votre mot de passe a été modifié avec succès."
        });
    } catch (error) {
        console.error(
            "Erreur modification mot de passe :",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Erreur lors de la modification du mot de passe."
        });
    }
};



exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    const responseMessage =
        "Si cette adresse correspond à un compte actif, " +
        "un lien de réinitialisation sera envoyé.";

    if (!email) {
        return res.json({
            success: true,
            message: responseMessage
        });
    }

    const [rows] = await promisePool.query(
        `
        SELECT id, nom, prenom, email
        FROM utilisateurs
        WHERE email = ?
          AND actif = 1
        LIMIT 1
        `,
        [email.trim().toLowerCase()]
    );

    const utilisateur = rows[0];

    if (!utilisateur) {
        return res.json({
            success: true,
            message: responseMessage
        });
    }

    const rawToken = crypto
        .randomBytes(32)
        .toString("hex");

    const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

    const expiresAt = new Date(
        Date.now() + 60 * 60 * 1000
    );

    // Supprimer les anciennes demandes de cet utilisateur
    await promisePool.query(
        `
        DELETE FROM password_reset_tokens
        WHERE utilisateur_id = ?
        `,
        [utilisateur.id]
    );

    await promisePool.query(
        `
        INSERT INTO password_reset_tokens (
            utilisateur_id,
            token_hash,
            expires_at
        )
        VALUES (?, ?, ?)
        `,
        [
            utilisateur.id,
            tokenHash,
            expiresAt
        ]
    );

    const resetUrl =
        `${process.env.FRONTEND_URL}` +
        `/reinitialiser-mot-de-passe?token=${rawToken}`;

    await sendPasswordResetEmail(
        utilisateur,
        resetUrl
    );

    return res.json({
        success: true,
        message: responseMessage
    });
};

exports.resetPassword = async (req, res) => {
    const {
        token,
        nouveau_mot_de_passe,
        confirmation
    } = req.body;

    if (
        !token ||
        !nouveau_mot_de_passe ||
        !confirmation
    ) {
        return res.status(400).json({
            success: false,
            message: "Tous les champs sont obligatoires."
        });
    }

    if (
        nouveau_mot_de_passe !== confirmation
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Les deux mots de passe ne correspondent pas."
        });
    }

    if (nouveau_mot_de_passe.length < 8) {
        return res.status(400).json({
            success: false,
            message:
                "Le mot de passe doit contenir au moins 8 caractères."
        });
    }

    const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const [rows] = await promisePool.query(
        `
        SELECT id, utilisateur_id
        FROM password_reset_tokens
        WHERE token_hash = ?
          AND used_at IS NULL
          AND expires_at > CURRENT_TIMESTAMP
        LIMIT 1
        `,
        [tokenHash]
    );

    const resetToken = rows[0];

    if (!resetToken) {
        return res.status(400).json({
            success: false,
            message:
                "Le lien est invalide, expiré ou déjà utilisé."
        });
    }

    const hash = await bcrypt.hash(
        nouveau_mot_de_passe,
        12
    );

    const connection =
        await promisePool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(
            `
            UPDATE utilisateurs
            SET mot_de_passe = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [
                hash,
                resetToken.utilisateur_id
            ]
        );

        await connection.query(
            `
            UPDATE password_reset_tokens
            SET used_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [resetToken.id]
        );

        await connection.commit();

        return res.json({
            success: true,
            message:
                "Votre mot de passe a été réinitialisé avec succès."
        });
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};




