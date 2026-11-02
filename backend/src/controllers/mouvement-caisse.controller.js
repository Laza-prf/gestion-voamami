const MouvementCaisse = require(
    "../models/mouvement-caisse.model.js"
);

const SENS = ["ENTREE", "SORTIE"];
const TYPES = [
    "EPARGNE",
    "CREDIT",
    "REMBOURSEMENT_CAPITAL",
    "REMBOURSEMENT_INTERET",
    "PENALITE"
];

function filtersFromQuery(query = {}) {
    return {
        voamami_id: query.voamami_id,
        cycle_id: query.cycle_id,
        seance_id: query.seance_id,
        membre_id: query.membre_id,
        sens: query.sens,
        type_mouvement: query.type_mouvement
    };
}

function scopedFilters(req) {
    const filters = filtersFromQuery(req.query);
    if (req.user?.role === "AGENT_FID" && !filters.voamami_id) {
        filters.voamami_id = req.agentVoamamiId;
    }
    return filters;
}

function validateFilters(filters) {
    const voamamiId = Number(filters.voamami_id);

    if (!Number.isInteger(voamamiId) || voamamiId < 1) {
        return "Le paramètre voamami_id est obligatoire et doit être valide.";
    }

    if (filters.sens && !SENS.includes(filters.sens)) {
        return "Le sens du mouvement est invalide.";
    }

    if (
        filters.type_mouvement &&
        !TYPES.includes(filters.type_mouvement)
    ) {
        return "Le type de mouvement est invalide.";
    }

    return null;
}

function sendError(res, error) {
    if (error.code === "VOAMAMI_REQUIRED") {
        return res.status(422).json({
            success: false,
            message: error.message
        });
    }

    return null;
}

exports.findAll = async (req, res, next) => {
    const filters = scopedFilters(req);
    const validationMessage = validateFilters(filters);

    if (validationMessage) {
        return res.status(422).json({
            success: false,
            message: validationMessage
        });
    }

    try {
        const mouvements = await MouvementCaisse.findAll({ ...filters, user: req.user });

        return res.json({
            success: true,
            voamami_id: Number(filters.voamami_id),
            data: mouvements
        });
    } catch (error) {
        console.error("Erreur liste mouvements de caisse :", error);
        const response = sendError(res, error);
        if (response) return response;
        return next(error);
    }
};

exports.findById = async (req, res, next) => {
    const filters = scopedFilters(req);
    const validationMessage = validateFilters(filters);

    if (validationMessage) {
        return res.status(422).json({
            success: false,
            message: validationMessage
        });
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({
            success: false,
            message: "Identifiant de mouvement invalide."
        });
    }

    try {
        const mouvement = await MouvementCaisse.findById(id, { ...filters, user: req.user });

        if (!mouvement) {
            return res.status(404).json({
                success: false,
                message: "Mouvement introuvable dans ce VOAMAMI."
            });
        }

        return res.json({
            success: true,
            data: mouvement
        });
    } catch (error) {
        console.error("Erreur détail mouvement :", error);
        const response = sendError(res, error);
        if (response) return response;
        return next(error);
    }
};

exports.summary = async (req, res, next) => {
    const filters = scopedFilters(req);
    const validationMessage = validateFilters(filters);

    if (validationMessage) {
        return res.status(422).json({
            success: false,
            message: validationMessage
        });
    }

    try {
        const summary = await MouvementCaisse.getSummary({ ...filters, user: req.user });

        return res.json({
            success: true,
            voamami_id: Number(filters.voamami_id),
            data: {
                total_entrees: Number(summary.total_entrees || 0),
                total_sorties: Number(summary.total_sorties || 0),
                solde: Number(summary.solde || 0)
            }
        });
    } catch (error) {
        console.error("Erreur résumé caisse :", error);
        const response = sendError(res, error);
        if (response) return response;
        return next(error);
    }
};

exports.balancesByVoamami = async (req, res, next) => {
    try {
        const balances = await MouvementCaisse.getBalancesByVoamami(req.user);
        return res.json({
            success: true,
            data: balances
        });
    } catch (error) {
        console.error("Erreur récupération des soldes par VOAMAMI :", error);
        return next(error);
    }
};
