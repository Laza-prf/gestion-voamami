const Cycle = require("../models/cycle.model.js");

exports.create = async (req, res, next) => {
    try {
        const {
            voamami_id, numero_cycle, date_debut, date_fin_prevue, date_cloture, statut, montant_part_epargne, montant_penalite, taux_interet, duree_credit_mois
        } = req.body;

        const id = await Cycle.create({
            voamami_id, numero_cycle, date_debut, date_fin_prevue, date_cloture, statut, montant_part_epargne, montant_penalite, taux_interet, duree_credit_mois
        });

        res.status(201).json({
            succes: true,
            message: "Cycle cree avec succes",
            id
        });

    } catch (error) {
        next(error);
    }
};

exports.findAll = async (req, res, next) => {
    try {
        const cycles = await Cycle.findAll(req.user);
        res.json({ success: true, data: cycles });

        } catch (error) {
            next(error);
    }
};

exports.findById = async (req, res, next) => {
    try {
        const cycles = await Cycle.findById(req.params.id, req.user);
        if (!cycles) {
            return res.status(401).json({
                succes: false,
                message: "Cycle introuvable"
            });
        }

        res.json({ success: true, data: cycles });
    } catch (error) {
        next(error);
    }

};

exports.update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const existing = await Cycle.findById(id, req.user);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Cycle introuvable"
            });
        }

        await Cycle.update(id, req.body);

        const updated = await Cycle.findById(id, req.user);
        res.json({ success: true, message: "Cycle mise a jour", data: updated });
    } catch (error) {
        next(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        const id = req.params.id;
        const existing = await Cycle.findById(id, req.user);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Cycle introuvable"
            });
        }

        await Cycle.delete(id);
        res.json({ success: true, message: "Cycle supprime"});
    } catch (error) {
        next(error);
    }
};