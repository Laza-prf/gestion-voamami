const Seance = require(
    "../models/seance.model.js"
);

function normaliseDate(value) {
    return value || null;
}

function buildPayload(body) {
    return {
        cycle_id: Number(body.cycle_id),
        numero_seance: Number(
            body.numero_seance
        ),
        date_seance: normaliseDate(
            body.date_seance
        ),
        statut:
            body.statut || "OUVERTE",
        observation:
            body.observation?.trim() ||
            null
    };
}

function validatePayload(payload) {
    const errors = [];

    if (
        !Number.isInteger(payload.cycle_id) ||
        payload.cycle_id < 1
    ) {
        errors.push(
            "Le cycle est obligatoire."
        );
    }

    if (
        !Number.isInteger(
            payload.numero_seance
        ) ||
        payload.numero_seance < 1
    ) {
        errors.push(
            "Le numéro de séance doit être supérieur à zéro."
        );
    }

    if (!payload.date_seance) {
        errors.push(
            "La date de séance est obligatoire."
        );
    }

    if (
        payload.statut !== "OUVERTE" &&
        payload.statut !== "CLOTUREE"
    ) {
        errors.push(
            "Le statut de la séance est invalide."
        );
    }

    return errors;
}

/**
 * Créer une séance
 */
exports.create = async (req, res, next) => {
    try {
        const payload =
            buildPayload(req.body);

        const errors =
            validatePayload(payload);

        if (errors.length > 0) {
            return res.status(422).json({
                success: false,
                message:
                    "Données de séance invalides.",
                errors
            });
        }

        const seance =
            await Seance.create(payload);

        return res.status(201).json({
            success: true,
            message:
                "Séance créée avec succès.",
            data: seance
        });
    } catch (error) {
        console.error(
            "Erreur création séance :",
            error
        );

        if (
            error.code ===
            "ER_DUP_ENTRY"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Ce numéro de séance existe déjà pour ce cycle."
            });
        }

        if (
            error.code ===
                "CYCLE_NOT_FOUND" ||
            error.code ===
                "CYCLE_NOT_OPEN"
        ) {
            return res.status(422).json({
                success: false,
                message: error.message
            });
        }

        return next(error);
    }
};

/**
 * Liste des séances
 */
exports.findAll = async (req, res, next) => {
    try {
        const seances =
            await Seance.findAll({
                cycle_id:
                    req.query.cycle_id,
                voamami_id:
                    req.query.voamami_id,
                statut:
                    req.query.statut,
                user: req.user
            });

        return res.status(200).json({
            success: true,
            data: seances
        });
    } catch (error) {
        console.error(
            "Erreur récupération séances :",
            error
        );

        return next(error);
    }
};

/**
 * Récupérer une séance
 */
exports.findById = async (req, res, next) => {
    try {
        const seance =
            await Seance.findById(
                req.params.id,
                req.user
            );

        if (!seance) {
            return res.status(404).json({
                success: false,
                message: "Séance introuvable."
            });
        }

        return res.status(200).json({
            success: true,
            data: seance
        });
    } catch (error) {
        console.error(
            "Erreur récupération séance :",
            error
        );

        return next(error);
    }
};

/**
 * Modifier une séance ouverte
 */
exports.update = async (req, res, next) => {
    try {
        const payload =
            buildPayload(req.body);

        const errors =
            validatePayload(payload);

        if (errors.length > 0) {
            return res.status(422).json({
                success: false,
                message:
                    "Données de séance invalides.",
                errors
            });
        }

        const seance =
            await Seance.update(
                req.params.id,
                payload
            );

        return res.status(200).json({
            success: true,
            message:
                "Séance modifiée avec succès.",
            data: seance
        });
    } catch (error) {
        console.error(
            "Erreur modification séance :",
            error
        );

        if (
            error.code ===
            "ER_DUP_ENTRY"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Ce numéro de séance existe déjà pour ce cycle."
            });
        }

        if (
            error.code ===
                "SEANCE_NOT_FOUND" ||
            error.code ===
                "SEANCE_CLOSED" ||
            error.code ===
                "CYCLE_CHANGE_FORBIDDEN" ||
            error.code ===
                "CYCLE_NOT_FOUND"
        ) {
            return res.status(422).json({
                success: false,
                message: error.message
            });
        }

        return next(error);
    }
};

/**
 * Clôturer une séance
 */
exports.close = async (req, res, next) => {
    try {
        const observation =
            req.body.observation?.trim() ||
            null;

        const seance =
            await Seance.close(
                req.params.id,
                observation
            );

        return res.status(200).json({
            success: true,
            message:
                "Séance clôturée avec succès.",
            data: seance
        });
    } catch (error) {
        console.error(
            "Erreur clôture séance :",
            error
        );

        if (
            error.code ===
                "SEANCE_NOT_FOUND" ||
            error.code ===
                "SEANCE_ALREADY_CLOSED"
        ) {
            return res.status(422).json({
                success: false,
                message: error.message
            });
        }

        return next(error);
    }
};

/**
 * Supprimer une séance
 */
exports.delete = async (req, res, next) => {
    try {
        const deleted =
            await Seance.delete(
                req.params.id
            );

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Séance introuvable."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Séance supprimée avec succès."
        });
    } catch (error) {
        console.error(
            "Erreur suppression séance :",
            error
        );

        if (
            error.code ===
            "SEANCE_CLOSED"
        ) {
            return res.status(422).json({
                success: false,
                message: error.message
            });
        }

        if (
            error.code ===
            "ER_ROW_IS_REFERENCED_2"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Cette séance possède déjà des opérations et ne peut pas être supprimée."
            });
        }

        return next(error);
    }
};
