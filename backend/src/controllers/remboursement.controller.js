const Remboursement = require(
    "../models/remboursement.model.js"
);

exports.create = async (req, res, next) => {
    if (Array.isArray(req.body.entries)) {
        return exports.createMany(req, res, next);
    }

    try {
        const payload = {
            credit_id: Number(
                req.body.credit_id
            ),
            seance_id: Number(
                req.body.seance_id
            ),
            montant_principal: Number(
                req.body.montant_principal || 0
            ),
            montant_interet: Number(
                req.body.montant_interet || 0
            ),
            observation:
                req.body.observation?.trim() ||
                null
        };

        if (
            !payload.credit_id ||
            !payload.seance_id
        ) {
            return res.status(422).json({
                success: false,
                message:
                    "Le crédit et la séance sont obligatoires."
            });
        }

        if (
            payload.montant_principal < 0 ||
            payload.montant_interet < 0
        ) {
            return res.status(422).json({
                success: false,
                message:
                    "Les montants ne peuvent pas être négatifs."
            });
        }

        if (
            payload.montant_principal === 0 &&
            payload.montant_interet === 0
        ) {
            return res.status(422).json({
                success: false,
                message:
                    "Le remboursement doit être supérieur à zéro."
            });
        }

        const remboursement =
            await Remboursement.create(
                payload
            );

        return res.status(201).json({
            success: true,
            message:
                "Remboursement enregistré avec succès.",
            data: remboursement
        });
    } catch (error) {
        console.error(
            "Erreur création remboursement :",
            error
        );

        const controlledErrors = [
            "CONTEXT_NOT_FOUND",
            "SEANCE_CLOSED",
            "WRONG_CYCLE",
            "CREDIT_ALREADY_PAID",
            "REPAYMENT_EXCEEDS_BALANCE",
            "REPAYMENT_EXISTS_IN_SESSION",
            "MEMBRE_ABSENT"
        ];

        if (
            controlledErrors.includes(
                error.code
            )
        ) {
            return res.status(422).json({
                success: false,
                message: error.message
            });
        }

        return next(error);
    }
};

exports.createMany = async (req, res, next) => {
    const seance_id = Number(req.body.seance_id);
    const entries = req.body.entries;
    if (!Number.isInteger(seance_id) || seance_id < 1 || !Array.isArray(entries) || !entries.length) {
        return res.status(422).json({
            success: false,
            message: "La séance et au moins un remboursement sont obligatoires."
        });
    }

    const creditIds = new Set();
    const payload = [];
    for (const entry of entries) {
        const credit_id = Number(entry?.credit_id);
        const montant_principal = Number(entry?.montant_principal || 0);
        const montant_interet = Number(entry?.montant_interet || 0);
        if (!Number.isInteger(credit_id) || credit_id < 1 || creditIds.has(credit_id)) {
            return res.status(422).json({
                success: false,
                message: "Chaque crédit ne peut apparaître qu'une seule fois dans la saisie."
            });
        }
        if (
            !Number.isFinite(montant_principal) ||
            !Number.isFinite(montant_interet) ||
            montant_principal < 0 ||
            montant_interet < 0 ||
            (montant_principal === 0 && montant_interet === 0)
        ) {
            return res.status(422).json({
                success: false,
                message: `Saisissez un montant valide pour le crédit n° ${credit_id}.`
            });
        }
        creditIds.add(credit_id);
        payload.push({
            credit_id,
            montant_principal,
            montant_interet,
            observation: typeof entry.observation === "string"
                ? entry.observation.trim() || null
                : null
        });
    }

    try {
        const remboursements = await Remboursement.createMany(seance_id, payload);
        return res.status(201).json({
            success: true,
            message: `${remboursements.length} remboursement(s) enregistré(s) avec succès.`,
            data: remboursements
        });
    } catch (error) {
        console.error("Erreur création groupée des remboursements :", error);
        if ([
            "CONTEXT_NOT_FOUND",
            "SEANCE_CLOSED",
            "WRONG_CYCLE",
            "CREDIT_ALREADY_PAID",
            "REPAYMENT_EXCEEDS_BALANCE",
            "REPAYMENT_EXISTS_IN_SESSION",
            "MEMBRE_ABSENT"
        ].includes(error.code)) {
            return res.status(422).json({
                success: false,
                message: error.message
            });
        }
        return next(error);
    }
};


exports.findAll = async (req, res, next) => {
    try {
        const remboursements =
            await Remboursement.findAll({
                credit_id:
                    req.query.credit_id,
                cycle_id:
                    req.query.cycle_id,
                seance_id:
                    req.query.seance_id,
                membre_id:
                    req.query.membre_id,
                user: req.user
            });

        return res.json({
            success: true,
            data: remboursements
        });
    } catch (error) {
        return next(error);
    }
};

exports.findById = async (req, res, next) => {
    try {
        const remboursement =
            await Remboursement.findById(
                req.params.id,
                undefined,
                req.user
            );

        if (!remboursement) {
            return res.status(404).json({
                success: false,
                message:
                    "Remboursement introuvable."
            });
        }

        return res.json({
            success: true,
            data: remboursement
        });
    } catch (error) {
        return next(error);
    }
};
