const CaisseSociale = require("../models/caisse-sociale.model.js");

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, error, status = 400) => res.status(status).json({ success: false, message: error.message || error });

exports.list = async (req, res) => { 
    try { return ok(res, await CaisseSociale.findAll(req.user)); } catch (e) { return fail(res, e, 500); } };

exports.getByVoamami = async (req, res) => { try { const data = await CaisseSociale.findByVoamami(req.params.voamamiId, req.user); if (!data) return fail(res, "Caisse sociale introuvable", 404); return ok(res, data); } catch (e) { return fail(res, e, 500); } };
exports.cotisations = async (req, res) => { try { return ok(res, await CaisseSociale.cotisations({ ...req.query, voamamiId: req.params.voamamiId, user: req.user })); } catch (e) { return fail(res, e, 500); } };
exports.createCotisation = async (req, res) => {
    try {
        const data = await CaisseSociale.createCotisation(
            {
                ...req.body,
                voamami_id: req.params.voamamiId
            },
            req.user
        );

        return res.status(201).json({
            success: true,
            data
        });
    } catch (error) {
        console.error(
            "Erreur création cotisation sociale :",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.aides = async (req, res) => { try { return ok(res, await CaisseSociale.aides({ ...req.query, voamamiId: req.params.voamamiId, user: req.user })); } catch (e) { return fail(res, e, 500); } };
exports.createAide = async (req, res) => { try { return ok(res, await CaisseSociale.createAide({ ...req.body, voamami_id: req.params.voamamiId }, req.user), 201); } catch (e) { return fail(res, e); } };
exports.decideAide = async (req, res) => { if (req.user.role !== "ADMINISTRATEUR") return fail(res, "Accès réservé à l'administrateur", 403); try { const data = await CaisseSociale.decideAide(req.params.id, req.body, req.user); if (!data) return fail(res, "Demande introuvable ou déjà traitée", 404); return ok(res, data); } catch (e) { return fail(res, e); } };
exports.payerAide = async (req, res) => { if (req.user.role !== "ADMINISTRATEUR") return fail(res, "Accès réservé à l'administrateur", 403); try { const data = await CaisseSociale.payerAide(req.params.id, req.user); if (!data) return fail(res, "Aide non accordée ou introuvable", 404); return ok(res, data); } catch (e) { return fail(res, e); } };
exports.mouvements = async (req, res) => { try { return ok(res, await CaisseSociale.mouvements(req.params.voamamiId, req.user)); } catch (e) { return fail(res, e, 500); } };

exports.getCotisationsBySeance = async (req, res) => {
    try {
        const data = await CaisseSociale.getCotisationsBySeance(
            req.params.seanceId,
            req.user
        );
        return res.json({ success: true, data });
    } catch (error) {
        console.error("Erreur cotisations de séance :", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Impossible de charger les cotisations."
        });
    }
};

exports.createCotisationForSeance = async (req, res) => {
    try {
        const data = await CaisseSociale.createCotisationForSeance(
            req.params.seanceId,
            req.body,
            req.user
        );
        return res.status(201).json({ success: true, data });
    } catch (error) {
        console.error("Erreur création cotisation séance :", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Impossible d'enregistrer la cotisation."
        });
    }
};