const Membre = require("../models/membre.model.js");

function buildMembrePayload(body) {
    return {
        voamami_id: Number(body.voamami_id),
        numero_membre: Number(body.numero_membre),
        nom: body.nom?.trim(),
        prenom: body.prenom?.trim() || null,
        sexe: body.sexe || null,
        date_naissance: body.date_naissance || null,
        telephone: body.telephone?.trim() || null,
        adresse: body.adresse?.trim() || null,
        profession: body.profession?.trim() || null,
        role_bureau: body.role_bureau || "MEMBRE",
        cycle_actif_id: body.cycle_actif_id
            ? Number(body.cycle_actif_id)
            : null,
        solde_epargne:
            body.solde_epargne === undefined ||
            body.solde_epargne === null ||
            body.solde_epargne === ""
                ? 0
                : Number(body.solde_epargne),
        actif:
            body.actif === false ||
            body.actif === 0 ||
            body.actif === "0"
                ? 0
                : 1
    };
}

function validateMembre(data) {
    const erreurs = [];

    if (
        !Number.isInteger(data.voamami_id) ||
        data.voamami_id < 1
    ) {
        erreurs.push("Le VOAMAMI est obligatoire.");
    }

    if (
        !Number.isInteger(data.numero_membre) ||
        data.numero_membre < 1 ||
        data.numero_membre > 25
    ) {
        erreurs.push(
            "Le numéro du membre doit être compris entre 1 et 25."
        );
    }

    if (!data.nom) {
        erreurs.push("Le nom du membre est obligatoire.");
    }

    if (
        data.sexe !== null &&
        !["M", "F"].includes(data.sexe)
    ) {
        erreurs.push("Le sexe doit être M ou F.");
    }

    const rolesAutorises = [
        "PRESIDENT",
        "SECRETAIRE",
        "TRESORIER",
        "MEMBRE"
    ];

    if (!rolesAutorises.includes(data.role_bureau)) {
        erreurs.push("Le rôle du bureau est invalide.");
    }

    if (
        !Number.isFinite(data.solde_epargne) ||
        data.solde_epargne < 0
    ) {
        erreurs.push(
            "Le solde d'épargne ne peut pas être négatif."
        );
    }

    return erreurs;
}

// Créer un membre
exports.create = async (req, res, next) => {
    try {
        const payload = buildMembrePayload(req.body);
        const erreurs = validateMembre(payload);

        if (erreurs.length > 0) {
            return res.status(422).json({
                success: false,
                message: "Données du membre invalides.",
                errors: erreurs
            });
        }

        const membre = await Membre.create(payload);

        return res.status(201).json({
            success: true,
            message: "Membre créé avec succès",
            data: membre
        });
    } catch (error) {
        console.error(
            "Erreur création membre :",
            error
        );

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message:
                    "Ce numéro de membre existe déjà dans ce VOAMAMI."
            });
        }

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(422).json({
                success: false,
                message:
                    "Le VOAMAMI ou le cycle indiqué n'existe pas."
            });
        }

        return next(error);
    }
};

// Liste des membres
exports.findAll = async (req, res, next) => {
    try {
        const membres = await Membre.findAll(req.user);

        return res.status(200).json({
            success: true,
            data: membres
        });
    } catch (error) {
        console.error(
            "Erreur récupération membres :",
            error
        );

        return next(error);
    }
};

// Récupérer un membre
exports.findById = async (req, res, next) => {
    try {
        const membre = await Membre.findById(
            req.params.id,
            req.user
        );

        if (!membre) {
            return res.status(404).json({
                success: false,
                message: "Membre introuvable"
            });
        }

        return res.status(200).json({
            success: true,
            data: membre
        });
    } catch (error) {
        console.error(
            "Erreur récupération membre :",
            error
        );

        return next(error);
    }
};

// Modifier un membre
exports.update = async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({
                success: false,
                message: "Identifiant du membre invalide."
            });
        }

        const existing = await Membre.findById(id, req.user);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Membre introuvable"
            });
        }

        const payload = buildMembrePayload(req.body);
        const erreurs = validateMembre(payload);

        if (erreurs.length > 0) {
            return res.status(422).json({
                success: false,
                message: "Données du membre invalides.",
                errors: erreurs
            });
        }

        await Membre.update(id, payload);

        const updated = await Membre.findById(id, req.user);

        return res.status(200).json({
            success: true,
            message: "Membre mis à jour avec succès",
            data: updated
        });
    } catch (error) {
        console.error(
            "Erreur modification membre :",
            error
        );

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message:
                    "Ce numéro de membre existe déjà dans ce VOAMAMI."
            });
        }

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(422).json({
                success: false,
                message:
                    "Le VOAMAMI ou le cycle indiqué n'existe pas."
            });
        }

        return next(error);
    }
};

// Supprimer un membre
exports.delete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        const existing = await Membre.findById(id, req.user);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Membre introuvable"
            });
        }

        await Membre.delete(id);

        return res.status(200).json({
            success: true,
            message: "Membre supprimé avec succès"
        });
    } catch (error) {
        console.error(
            "Erreur suppression membre :",
            error
        );

        return next(error);
    }
};
