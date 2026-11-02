const Penalite = require("../models/penalite.model.js");

const STATUTS = ["IMPAYEE", "PAYEE"];

function buildPayload(body = {}) {
    return {
        seance_id: Number(body.seance_id),
        membre_id: Number(body.membre_id),
        type_penalite:
            typeof body.type_penalite === "string"
                ? body.type_penalite.trim()
                : "",
        motif:
            typeof body.motif === "string" && body.motif.trim()
                ? body.motif.trim()
                : null,
        statut: body.statut || "IMPAYEE"
    };
}

function validateCreate(payload) {
    const errors = [];
    if (!Number.isInteger(payload.seance_id) || payload.seance_id < 1) {
        errors.push("La séance est obligatoire.");
    }
    if (!Number.isInteger(payload.membre_id) || payload.membre_id < 1) {
        errors.push("Le membre est obligatoire.");
    }
    if (!payload.type_penalite) {
        errors.push("Le type de pénalité est obligatoire.");
    }
    if (!STATUTS.includes(payload.statut)) {
        errors.push("Le statut de pénalité est invalide.");
    }
    return errors;
}

function filtersFromQuery(query = {}) {
    return {
        voamami_id: query.voamami_id,
        cycle_id: query.cycle_id,
        seance_id: query.seance_id,
        membre_id: query.membre_id,
        statut: query.statut
    };
}

function validateFilters(filters) {
    if (filters.voamami_id !== undefined && filters.voamami_id !== "") {
        const id = Number(filters.voamami_id);
        if (!Number.isInteger(id) || id < 1) {
            return "voamami_id est invalide.";
        }
    }
    if (filters.statut && !STATUTS.includes(filters.statut)) {
        return "Le statut de pénalité est invalide.";
    }
    return null;
}

function controlledError(res, error) {
    const codes = [
        "CONTEXT_NOT_FOUND",
        "SEANCE_CLOSED",
        "CYCLE_NOT_OPEN",
        "MEMBRE_INACTIF",
        "MEMBRE_WRONG_VOAMAMI",
        "MEMBRE_WRONG_CYCLE",
        "MEMBRE_ABSENT",
        "NOT_FOUND",
        "PAIEMENT_IRREVERSIBLE"
    ];

    if (codes.includes(error.code)) {
        return res.status(error.code === "NOT_FOUND" ? 404 : 422).json({
            success: false,
            message: error.message
        });
    }

    if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            success: false,
            message: "Cette pénalité existe déjà."
        });
    }

    if (error.code === "ER_SIGNAL_EXCEPTION" || error.sqlState === "45000") {
        return res.status(422).json({
            success: false,
            message: error.message
        });
    }

    return null;
}

exports.create = async (req, res, next) => {
    try {
        const payload = buildPayload(req.body);
        const errors = validateCreate(payload);

        if (errors.length) {
            return res.status(422).json({
                success: false,
                message: errors.join(" "),
                errors
            });
        }

        const penalite = await Penalite.create(payload);

        return res.status(201).json({
            success: true,
            message: "Pénalité enregistrée avec succès.",
            data: penalite
        });
    } catch (error) {
        console.error("Erreur création pénalité :", error);
        const response = controlledError(res, error);
        if (response) return response;
        return next(error);
    }
};

exports.findAll = async (req, res, next) => {
    const filters = filtersFromQuery(req.query);
    const validationMessage = validateFilters(filters);

    if (validationMessage) {
        return res.status(422).json({
            success: false,
            message: validationMessage
        });
    }

    try {
        const penalites = await Penalite.findAll({ ...filters, user: req.user });
        return res.json({ success: true, data: penalites });
    } catch (error) {
        console.error("Erreur liste pénalités :", error);
        return next(error);
    }
};

exports.findById = async (req, res, next) => {
    const filters = filtersFromQuery(req.query);
    const validationMessage = validateFilters(filters);
    if (validationMessage) {
        return res.status(422).json({ success: false, message: validationMessage });
    }

    try {
        const penalite = await Penalite.findById(
            Number(req.params.id),
            { ...filters, user: req.user }
        );

        if (!penalite) {
            return res.status(404).json({
                success: false,
                message: "Pénalité introuvable dans ce contexte."
            });
        }

        return res.json({ success: true, data: penalite });
    } catch (error) {
        return next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const statut = req.body.statut;
        if (!STATUTS.includes(statut)) {
            return res.status(422).json({
                success: false,
                message: "Le statut de pénalité est invalide."
            });
        }

        const motif =
            typeof req.body.motif === "string" && req.body.motif.trim()
                ? req.body.motif.trim()
                : null;

        const penalite = await Penalite.update(
            Number(req.params.id),
            { motif, statut }
        );

        if (!penalite) {
            return res.status(404).json({
                success: false,
                message: "Pénalité introuvable."
            });
        }

        return res.json({
            success: true,
            message: statut === "PAYEE"
                ? "Pénalité payée avec succès."
                : "Pénalité modifiée avec succès.",
            data: penalite
        });
    } catch (error) {
        console.error("Erreur modification pénalité :", error);
        const response = controlledError(res, error);
        if (response) return response;
        return next(error);
    }
};
