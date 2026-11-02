const bcrypt = require("bcryptjs");
const { promisePool } = require("../config/db.js");

/**
 * Récupérer la liste des utilisateurs
 */
exports.getAll = async (req, res, next) => {
    try {
        const [rows] = await promisePool.query(
            `
            SELECT
                id,
                nom,
                prenom,
                email,
                role,
                actif,
                created_at,
                updated_at
            FROM utilisateurs
            ORDER BY created_at DESC
            `
        );

        return res.status(200).json({
            success: true,
            utilisateurs: rows
        });
    } catch (error) {
        console.error(
            "Erreur lors de la récupération des utilisateurs :",
            error
        );

        return next(error);
    }
};

/**
 * Récupérer un utilisateur par son identifiant
 */
exports.getById = async (req, res, next) => {
    try {
        const [rows] = await promisePool.query(
            `
            SELECT
                id,
                nom,
                prenom,
                email,
                role,
                actif,
                created_at,
                updated_at
            FROM utilisateurs
            WHERE id = ?
            `,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Utilisateur introuvable"
            });
        }

        return res.status(200).json({
            success: true,
            utilisateur: rows[0]
        });
    } catch (error) {
        return next(error);
    }
};

/**
 * Créer un compte agent
 */
exports.create = async (req, res, next) => {
    try {
        const {
            nom,
            prenom,
            email,
            mot_de_passe
        } = req.body;

        const motDePasseHash = await bcrypt.hash(
            mot_de_passe,
            12
        );

        // Le rôle est imposé côté serveur.
        const role = "AGENT_FID";

        const [result] = await promisePool.query(
            `
            INSERT INTO utilisateurs
                (nom, prenom, email, mot_de_passe, role)
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                nom,
                prenom,
                email,
                motDePasseHash,
                role
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Compte agent créé avec succès",
            utilisateur: {
                id: result.insertId,
                nom,
                prenom,
                email,
                role,
                actif: true
            }
        });
    } catch (error) {
        console.error(
            "Erreur lors de la création de l'utilisateur :",
            error
        );

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Cette adresse email est déjà utilisée"
            });
        }

        return next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const { nom, prenom, email, mot_de_passe } = req.body;
        const [existing] = await promisePool.query(
            "SELECT id FROM utilisateurs WHERE id = ?",
            [req.params.id]
        );
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Utilisateur introuvable"
            });
        }

        const values = [nom, prenom, email];
        let sql = "UPDATE utilisateurs SET nom = ?, prenom = ?, email = ?";

        if (mot_de_passe) {
            const motDePasseHash = await bcrypt.hash(mot_de_passe, 12);
            sql += ", mot_de_passe = ?";
            values.push(motDePasseHash);
        }

        sql += " WHERE id = ?";
        values.push(req.params.id);

        await promisePool.query(sql, values);

        return res.status(200).json({
            success: true,
            message: "Utilisateur modifié avec succès"
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Cette adresse email est déjà utilisée"
            });
        }

        return next(error);
    }
};

exports.delete = async (req, res, next) => {
    if (Number(req.params.id) === Number(req.user.id)) {
        return res.status(422).json({
            success: false,
            message: "Vous ne pouvez pas supprimer votre propre compte"
        });
    }

    try {
        const [result] = await promisePool.query(
            "DELETE FROM utilisateurs WHERE id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Utilisateur introuvable"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Utilisateur supprimé avec succès"
        });
    } catch (error) {
        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                success: false,
                message: "Cet utilisateur est associé à des données et ne peut pas être supprimé"
            });
        }

        return next(error);
    }
};
