const Voamami = require("../models/voamami.model.js");

exports.create = async (req, res, next) => {
    try {
        const {
            code,
            nom,
            fokontany,
            commune,
            district,
            region,
            date_creation,
            statut,
            agent_responsable_id
        } = req.body;

        // Validation
        if (!code || !nom || !date_creation) {
            return res.status(400).json({
                success: false,
                message: "Les champs code, nom et date_creation sont obligatoires."
            });
        }

        // Code unique
        const existing = await Voamami.findByCode(code);
        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Ce code est déjà utilisé."
            });
        }

        const result = await Voamami.create({
            code,
            nom,
            fokontany: fokontany || null,
            commune: commune || null,
            district: district || null,
            region: region || null,
            date_creation,
            statut: statut || "ACTIF",
            agent_responsable_id: agent_responsable_id ? Number(agent_responsable_id) : null
        });

        res.status(201).json({
            success: true,
            message: "VOAMAMI créé avec succès.",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.findAll = async (req, res, next) => {
    try {
        const voamamis = await Voamami.findAll(req.user);
        res.json({ success: true, data: voamamis });
    } catch (error) {
        next(error);
    }
};

exports.findById = async (req, res, next) => {
    try {
        const voamami = await Voamami.findById(req.params.id, req.user);
        if (!voamami) {
            return res.status(404).json({
                success: false,
                message: "VOAMAMI introuvable."
            });
        }
        res.json({ success: true, data: voamami });
    } catch (error) {
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const existing = await Voamami.findById(id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "VOAMAMI introuvable."
            });
        }

        const { code } = req.body;
        if (code) {
            const codeExists = await Voamami.codeExists(code, id);
            if (codeExists) {
                return res.status(409).json({
                    success: false,
                    message: "Ce code est déjà utilisé."
                });
            }
        }

        await Voamami.update(id, {
            ...req.body,
            agent_responsable_id: req.body.agent_responsable_id
                ? Number(req.body.agent_responsable_id)
                : null
        });

        const updated = await Voamami.findById(id);
        res.json({
            success: true,
            message: "VOAMAMI mis à jour avec succès.",
            data: updated
        });
    } catch (error) {
        next(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        const id = req.params.id;
        const existing = await Voamami.findById(id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "VOAMAMI introuvable."
            });
        }

        await Voamami.delete(id);
        res.json({ success: true, message: "VOAMAMI supprimé." });
    } catch (error) {
        next(error);
    }
};