const Presence = require("../models/presence.model.js");

const STATUTS = [
    "PRESENT",
    "ABSENT",
    "EXCUSE"
];

function payloadFromBody(body = {}) {
    return {
        seance_id: Number(body.seance_id),
        membre_id: Number(body.membre_id),
        statut: body.statut || "PRESENT",
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
    if (!STATUTS.includes(payload.statut)) {
        errors.push("Le statut de présence est invalide.");
    }
    if (payload.statut === "EXCUSE" && !payload.observation) {
        errors.push("Le motif d'excuse est obligatoire pour une absence excusée.");
    }

    return errors;
}

function sendControlledError(res, error) {
    const codes = [
        "CONTEXT_NOT_FOUND",
        "SEANCE_CLOSED",
        "MEMBRE_INACTIF",
        "MEMBRE_WRONG_VOAMAMI",
        "MEMBRE_WRONG_CYCLE",
        "NOT_FOUND",
        "ACCESS_DENIED",
        "CYCLE_CLOSED",
        "PAID_ABSENCE_PENALTY"
    ];

    if (codes.includes(error.code)) {
        const status = error.code === "NOT_FOUND"
            ? 404
            : error.code === "ACCESS_DENIED"
                ? 403
                : 422;
        return res.status(status).json({
            success: false,
            message: error.message
        });
    }

    if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            success: false,
            message: "La présence de ce membre existe déjà pour cette séance."
        });
    }

    return null;
}

exports.create = async (req, res, next) => {
    try {
        const payload = payloadFromBody(req.body);
        const errors = validatePayload(payload);

        if (errors.length) {
            return res.status(422).json({
                success: false,
                message: errors.join(" "),
                errors
            });
        }

        const result = await Presence.create(payload, req.user);

        return res.status(201).json({
            success: true,
            message: result.created
                ? "Présence enregistrée. Une pénalité d'absence non excusée a été créée."
                : "Présence enregistrée avec succès.",
            data: {
                ...result.presence,
                penalite_automatique_creee: result.created
            }
        });
    } catch (error) {
        console.error("Erreur création présence :", error);
        const response = sendControlledError(res, error);
        if (response) return response;
        return next(error);
    }
};

exports.findAll = async (req, res, next) => {
    try {
        const presences = await Presence.findAll({
            seance_id: req.query.seance_id,
            membre_id: req.query.membre_id,
            statut: req.query.statut,
            user: req.user
        });

        return res.json({
            success: true,
            data: presences
        });
    } catch (error) {
        console.error("Erreur liste présences :", error);
        return next(error);
    }
};

exports.findById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({
                success: false,
                message: "Identifiant de présence invalide."
            });
        }

        const presence = await Presence.findById(id, req.user);
        if (!presence) {
            return res.status(404).json({
                success: false,
                message: "Présence introuvable."
            });
        }

        return res.json({
            success: true,
            data: presence
        });
    } catch (error) {
        return next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const payload = {
            statut: req.body.statut,
            observation:
                typeof req.body.observation === "string" && req.body.observation.trim()
                    ? req.body.observation.trim()
                    : null
        };

        if (!STATUTS.includes(payload.statut)) {
            return res.status(422).json({
                success: false,
                message: "Le statut de présence est invalide."
            });
        }
        if (payload.statut === "EXCUSE" && !payload.observation) {
            return res.status(422).json({
                success: false,
                message: "Le motif d'excuse est obligatoire pour une absence excusée."
            });
        }

        const result = await Presence.update(
            Number(req.params.id),
            payload,
            req.user
        );

        if (!result.presence) {
            return res.status(404).json({
                success: false,
                message: "Présence introuvable."
            });
        }

        return res.json({
            success: true,
            message: result.created
                ? "Présence modifiée. Une pénalité d'absence non excusée a été créée."
                : result.removed
                    ? "Présence modifiée. La pénalité d'absence non excusée a été annulée."
                    : "Présence modifiée avec succès.",
            data: {
                ...result.presence,
                penalite_automatique_creee: result.created,
                penalite_automatique_supprimee: result.removed
            }
        });
    } catch (error) {
        console.error("Erreur modification présence :", error);
        const response = sendControlledError(res, error);
        if (response) return response;
        return next(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        const deleted = await Presence.delete(
            Number(req.params.id),
            req.user
        );

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Présence introuvable."
            });
        }

        return res.json({
            success: true,
            message: "Présence supprimée avec succès."
        });
    } catch (error) {
        console.error("Erreur suppression présence :", error);
        const response = sendControlledError(res, error);
        if (response) return response;
        return next(error);
    }
};
