const Agr = require("../models/agr.model.js");

exports.create = async (req, res, next) => {
    try {
        const {

            libelle,
            description,
            actif
        } = req.body;


     const id = await Agr.create({
            id, libelle, description, actif
        });

        res.status(201).json({
            succes: true,
            message: "AGR cree avec succes",
            id
        });

    } catch (error) {
        next(error);
    }
};

exports.findAll = async (req, res, next) => {
    try {
        const agrs = await Agr.findAll();

        return res.json({
            success: true,
            data: agrs
        });
    } catch (error) {
        console.error(
            "Erreur récupération AGR :",
            error
        );

        return next(error);
    }
};


exports.findById = async (req, res, next) => {
    try {
        const agr = await Agr.findById(
            req.params.id
        );

        if (!agr) {
            return res.status(404).json({
                success: false,
                message: "AGR introuvable"
            });
        }

        return res.json({
            success: true,
            data: agr
        });
    } catch (error) {
        return next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const existing = await Agr.findById(id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "AGR introuvable"
            });
        }

        await Agr.update(id, req.body);

        const updated = await Agr.findById(id);
        res.json({ success: true, message: "Agr mise a jour", data: updated });
    } catch (error) {
        mext(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        const id = req.params.id;
        const existing = await Agr.findById(id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "AGR introuvable"
            });
        }

        await Agr.delete(id);
        res.json({ success: true, message: "AGR supprime"});
    } catch (error) {
        next(error);
    }

};




