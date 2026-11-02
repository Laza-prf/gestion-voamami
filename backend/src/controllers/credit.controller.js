const Credit = require("../models/credit.model.js");

function toNullableId(value) {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function buildPayload(body = {}) {
    return {
        seance_id: Number(body.seance_id),
        membre_id: Number(body.membre_id),
        agr_id: toNullableId(body.agr_id),
        montant_capital: Number(body.montant_capital),
        observation:
            typeof body.observation === "string" && body.observation.trim()
                ? body.observation.trim()
                : null
    };
}

function validatePayload(payload) {
    const errors = [];

    if (!Number.isInteger(payload.seance_id) || payload.seance_id < 1) {
        errors.push("La séance est obligatoire.");
    }

    if (!Number.isInteger(payload.membre_id) || payload.membre_id < 1) {
        errors.push("Le membre est obligatoire.");
    }

    if (
        !Number.isFinite(payload.montant_capital) ||
        payload.montant_capital <= 0
    ) {
        errors.push(
            "Le montant du capital doit être supérieur à zéro."
        );
    }

    return errors;
}

function controlledError(error) {
    return [
        "CONTEXT_NOT_FOUND",
        "SEANCE_CLOSED",
        "CYCLE_NOT_OPEN",
        "MEMBRE_INACTIF",
        "MEMBRE_WRONG_VOAMAMI",
        "MEMBRE_WRONG_CYCLE",
        "MEMBRE_ABSENT",
        "INVALID_CAPITAL",
        "ACCESS_DENIED"
    ].includes(error.code);
}

exports.create = async (req, res, next) => {
    try {
        const payload = buildPayload(req.body);
        const errors = validatePayload(payload);

        if (errors.length > 0) {
            return res.status(422).json({
                success: false,
                message: errors.join(" "),
                errors
            });
        }

        const credit = await Credit.create(payload, req.user);

        return res.status(201).json({
            success: true,
            message: "Crédit accordé avec succès.",
            data: credit
        });
    } catch (error) {
        console.error("Erreur création crédit :", error);

        // Erreurs SIGNAL SQLSTATE '45000' émises par les triggers.
        if (
            controlledError(error) ||
            error.code === "ER_SIGNAL_EXCEPTION" ||
            error.sqlState === "45000"
        ) {
            return res.status(error.code === "ACCESS_DENIED" ? 403 : 422).json({
                success: false,
                message: error.message || "Crédit refusé par une règle métier."
            });
        }

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(422).json({
                success: false,
                message: "La séance, le membre ou l'AGR indiqué n'existe pas."
            });
        }

        return next(error);
    }
};

exports.findAll = async (req, res, next) => {
    try {
        const credits = await Credit.findAll({
            cycle_id: req.query.cycle_id,
            seance_id: req.query.seance_id,
            membre_id: req.query.membre_id,
            statut: req.query.statut,
            user: req.user
        });

        return res.json({
            success: true,
            data: credits
        });
    } catch (error) {
        console.error("Erreur liste crédits :", error);
        return next(error);
    }
};

exports.findById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({
                success: false,
                message: "Identifiant de crédit invalide."
            });
        }

        const credit = await Credit.findById(id, req.user);

        if (!credit) {
            return res.status(404).json({
                success: false,
                message: "Crédit introuvable."
            });
        }

        return res.json({
            success: true,
            data: credit
        });
    } catch (error) {
        console.error("Erreur détail crédit :", error);
        return next(error);
    }
};
