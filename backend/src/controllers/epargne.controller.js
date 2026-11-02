const Epargne = require(
    "../models/epargne.model.js"
);

function buildPayload(body) {
    return {
        cycle_id: Number(body.cycle_id),
        seance_id: Number(body.seance_id),
        membre_id: Number(body.membre_id),
        nombre_parts: Number(body.nombre_parts),
        date_epargne:
            body.date_epargne ||
            new Date().toISOString().slice(0, 10)
    };
}

exports.create = async (req, res, next) => {
    if (Array.isArray(req.body.entries)) {
        return exports.createMany(req, res, next);
    }

    try {
        const payload = {
            seance_id: Number(
                req.body.seance_id
            ),
            membre_id: Number(
                req.body.membre_id
            ),
            nombre_parts: Number(
                req.body.nombre_parts
            )
        };

        if (
            !payload.seance_id ||
            !payload.membre_id
        ) {
            return res.status(422).json({
                success: false,
                message:
                    "La séance et le membre sont obligatoires."
            });
        }

        if (
            !Number.isInteger(
                payload.nombre_parts
            ) ||
            payload.nombre_parts < 1 ||
            payload.nombre_parts > 5
        ) {
            return res.status(422).json({
                success: false,
                message:
                    "Le nombre de parts doit être compris entre 1 et 5."
            });
        }

        const epargne =
            await Epargne.create(payload);

        return res.status(201).json({
            success: true,
            message:
                "Épargne enregistrée avec succès.",
            data: epargne
        });
    } catch (error) {
        console.error(
            "Erreur création épargne :",
            error
        );

        if (
            [
                "SEANCE_CLOSED",
                "CYCLE_NOT_OPEN",
                "MEMBRE_INACTIF",
                "MEMBRE_WRONG_VOAMAMI",
                "MEMBRE_WRONG_CYCLE",
                "MEMBRE_ABSENT",
                "CONTEXT_NOT_FOUND",
                "SEANCE_NOT_FOUND"
            ].includes(error.code)
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
            message: "La séance et au moins une épargne sont obligatoires."
        });
    }

    const memberIds = new Set();
    for (const entry of entries) {
        const membre_id = Number(entry?.membre_id);
        const nombre_parts = Number(entry?.nombre_parts);
        if (!Number.isInteger(membre_id) || membre_id < 1 || memberIds.has(membre_id)) {
            return res.status(422).json({
                success: false,
                message: "Chaque membre ne peut apparaître qu'une seule fois dans la saisie."
            });
        }
        if (!Number.isInteger(nombre_parts) || nombre_parts < 1 || nombre_parts > 5) {
            return res.status(422).json({
                success: false,
                message: `Le nombre de parts du membre n° ${membre_id} doit être compris entre 1 et 5.`
            });
        }
        memberIds.add(membre_id);
    }

    try {
        const epargnes = await Epargne.createMany(seance_id, entries.map((entry) => ({
            membre_id: Number(entry.membre_id),
            nombre_parts: Number(entry.nombre_parts)
        })));
        return res.status(201).json({
            success: true,
            message: `${epargnes.length} épargne(s) enregistrée(s) avec succès.`,
            data: epargnes
        });
    } catch (error) {
        console.error("Erreur création groupée des épargnes :", error);
        if ([
            "SEANCE_CLOSED",
            "CYCLE_NOT_OPEN",
            "MEMBRE_INACTIF",
            "MEMBRE_WRONG_VOAMAMI",
            "MEMBRE_WRONG_CYCLE",
            "MEMBRE_ABSENT",
            "EPARGNE_EXISTS",
            "CONTEXT_NOT_FOUND",
            "SEANCE_NOT_FOUND"
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
        const epargnes =
            await Epargne.findAll({
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
            data: epargnes
        });
    } catch (error) {
        return next(error);
    }
};

exports.findById = async (req, res, next) => {
    try {
        const epargne =
            await Epargne.findById(
                req.params.id,
                undefined,
                req.user
            );

        if (!epargne) {
            return res.status(404).json({
                success: false,
                message: "Épargne introuvable."
            });
        }

        return res.json({
            success: true,
            data: epargne
        });
    } catch (error) {
        return next(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        const deleted =
            await Epargne.delete(
                req.params.id
            );

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Épargne introuvable."
            });
        }

        return res.json({
            success: true,
            message:
                "Épargne supprimée avec succès."
        });
    } catch (error) {
        return next(error);
    }
};
