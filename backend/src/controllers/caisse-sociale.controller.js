const CaisseSociale = require("../models/caisse-sociale.model.js");

function ok(res, data, status = 200) {
    return res.status(status).json({
        success: true,
        data
    });
}

function errorMessage(error, fallback = "Une erreur est survenue.") {
    if (typeof error === "string") {
        return error;
    }

    return error?.message || fallback;
}

function fail(res, error, status = 400) {
    return res.status(status).json({
        success: false,
        message: errorMessage(error)
    });
}

exports.list = async (req, res) => {
    try {
        const data = await CaisseSociale.findAll(req.user);
        return ok(res, data);
    } catch (error) {
        console.error("Erreur liste caisses sociales :", error);
        return fail(res, error, 500);
    }
};

exports.getByVoamami = async (req, res) => {
    try {
        const data = await CaisseSociale.findByVoamami(
            req.params.voamamiId,
            req.user
        );

        if (!data) {
            return fail(
                res,
                "Caisse sociale introuvable.",
                404
            );
        }

        return ok(res, data);
    } catch (error) {
        console.error("Erreur caisse sociale VOAMAMI :", error);
        return fail(res, error, 500);
    }
};

exports.cotisations = async (req, res) => {
    try {
        const data = await CaisseSociale.cotisations({
            ...req.query,
            voamamiId: req.params.voamamiId,
            user: req.user
        });

        return ok(res, data);
    } catch (error) {
        console.error("Erreur liste cotisations sociales :", error);
        return fail(res, error, 500);
    }
};

exports.createCotisation = async (req, res) => {
    try {
        const data = await CaisseSociale.createCotisation(
            {
                ...req.body,
                voamami_id: req.params.voamamiId
            },
            req.user
        );

        return ok(res, data, 201);
    } catch (error) {
        console.error("Erreur création cotisation sociale :", error);
        return fail(res, error, 400);
    }
};

exports.aides = async (req, res) => {
    try {
        const data = await CaisseSociale.aides({
            ...req.query,
            voamamiId: req.params.voamamiId ?? req.query.voamamiId,
            user: req.user
        });

        return ok(res, data);
    } catch (error) {
        console.error("Erreur liste aides sociales :", error);
        return fail(res, error, 500);
    }
};

exports.createAide = async (req, res) => {
    try {
        const voamamiId = Number(
            req.params.voamamiId
        );

        if (
            !Number.isInteger(voamamiId) ||
            voamamiId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Identifiant VOAMAMI invalide."
            });
        }

        const data =
            await CaisseSociale.createAide(
                {
                    ...req.body,
                    voamami_id: voamamiId
                },
                req.user
            );

        return res.status(201).json({
            success: true,
            message:
                "Demande d’aide créée avec succès.",
            data
        });
    } catch (error) {
        console.error(
            "Erreur création aide sociale :",
            error
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Impossible de créer la demande d’aide."
        });
    }
};


exports.decideAide = async (req, res) => {
    if (req.user?.role !== "ADMINISTRATEUR") {
        return fail(
            res,
            "Accès réservé à l’administrateur.",
            403
        );
    }

    try {
        const data = await CaisseSociale.decideAide(
            req.params.id,
            req.body,
            req.user
        );

        if (!data) {
            return fail(
                res,
                "Demande introuvable ou déjà traitée.",
                404
            );
        }

        return ok(res, data);
    } catch (error) {
        console.error("Erreur décision aide sociale :", error);
        return fail(res, error, 400);
    }
};

exports.payerAide = async (req, res) => {
    if (req.user?.role !== "ADMINISTRATEUR") {
        return fail(
            res,
            "Accès réservé à l’administrateur.",
            403
        );
    }

    try {
        const data = await CaisseSociale.payerAide(
            req.params.id,
            req.user
        );

        if (!data) {
            return fail(
                res,
                "Aide non accordée ou introuvable.",
                404
            );
        }

        return ok(res, data);
    } catch (error) {
        console.error("Erreur paiement aide sociale :", error);
        return fail(res, error, 400);
    }
};

exports.mouvements = async (req, res) => {
    try {
        const data = await CaisseSociale.mouvements(
            req.params.voamamiId,
            req.user
        );

        return ok(res, data);
    } catch (error) {
        console.error("Erreur mouvements sociaux :", error);
        return fail(res, error, 500);
    }
};

exports.getCotisationsBySeance = async (req, res) => {
    try {
        const seanceId = Number(req.params.seanceId);

        if (!Number.isInteger(seanceId) || seanceId <= 0) {
            return fail(
                res,
                "Identifiant de séance invalide.",
                400
            );
        }

        const data = await CaisseSociale.getCotisationsBySeance(
            seanceId,
            req.user
        );

        return ok(res, data);
    } catch (error) {
        console.error("Erreur cotisations de séance :", error);
        return fail(res, error, 500);
    }
};

exports.createCotisationForSeance = async (req, res) => {
    try {
        console.log(
            "Paramètres reçus pour la cotisation :",
            req.params
        );

        console.log(
            "Corps reçu pour la cotisation :",
            req.body
        );

        const seanceId = Number(
            req.params.seanceId
        );

        if (!Number.isInteger(seanceId) || seanceId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Identifiant de séance invalide."
            });
        }

        const membreId = Number(
            req.body?.membre_id
        );

        const montant = Number(
            req.body?.montant
        );

        const moisConcerne = String(
            req.body?.mois_concerne || ""
        ).trim();

        const observation =
            req.body?.observation === undefined ||
            req.body?.observation === null ||
            String(req.body.observation).trim() === ""
                ? null
                : String(req.body.observation).trim();

        if (!Number.isInteger(membreId) || membreId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Le membre est obligatoire."
            });
        }

        if (!/^\d{4}-\d{2}$/.test(moisConcerne)) {
            return res.status(400).json({
                success: false,
                message:
                    "Le mois concerné doit être au format AAAA-MM."
            });
        }

        if (!Number.isFinite(montant) || montant <= 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Le montant doit être supérieur à zéro."
            });
        }

        if (!Number.isInteger(montant)) {
            return res.status(400).json({
                success: false,
                message:
                    "Le montant doit être un nombre entier."
            });
        }

        const data =
            await CaisseSociale.createCotisationForSeance(
                seanceId,
                {
                    membre_id: membreId,
                    mois_concerne: moisConcerne,
                    montant,
                    observation
                },
                req.user
            );

        return res.status(201).json({
            success: true,
            message:
                "Cotisation sociale enregistrée avec succès.",
            data
        });
    } catch (error) {
        console.error(
            "Erreur création cotisation sociale liée à la séance :",
            error
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Impossible d’enregistrer la cotisation sociale."
        });
    }
};
