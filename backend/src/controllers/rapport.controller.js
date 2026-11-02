const { promisePool } = require("../config/db.js");
const Rapport = require("../models/rapport.model.js");
const PartageBenefices = require("../models/partageBenefices.model.js");
const Cycle = require("../models/cycle.model.js");
const Seance = require("../models/seance.model.js");
const {
    generateCyclePdf,
    generateSeancePdf
} = require("../utils/rapport-pdf.util.js");

function currentUser(req) {
    return {
        id: req.user?.id || null,
        role: req.user?.role || null
    };
}

function isValidRole(role) {
    return role === "ADMINISTRATEUR" || role === "AGENT_FID";
}

exports.findAll = async (req, res, next) => {
    try {
        const user = currentUser(req);

        if (!isValidRole(user.role)) {
            return res.status(403).json({
                success: false,
                message: "Rôle non autorisé pour consulter les rapports."
            });
        }

        const data = await Rapport.findAll({
            ...req.query,
            userId: user.id,
            role: user.role
        });

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

exports.findById = async (req, res, next) => {
    try {
        const user = currentUser(req);
        const data = await Rapport.findById(req.params.id, user);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Rapport introuvable ou accès refusé."
            });
        }

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

async function getSeanceReportData(seanceId, user) {
    let sql = `
        SELECT
            s.id AS seance_id,
            s.numero_seance,
            s.date_seance,
            s.statut AS seance_statut,
            c.id AS cycle_id,
            c.numero_cycle,
            v.id AS voamami_id,
            v.code AS voamami_code,
            v.nom AS voamami_nom,

            (SELECT COUNT(*) FROM presences p
             WHERE p.seance_id = s.id AND p.statut = 'PRESENT') AS total_presents,

            (SELECT COUNT(*) FROM presences p
             WHERE p.seance_id = s.id AND p.statut = 'ABSENT') AS total_absents,

            (SELECT COUNT(*) FROM presences p
             WHERE p.seance_id = s.id AND p.statut = 'EXCUSE') AS total_excuses,

            (SELECT COUNT(*) FROM presences p
             WHERE p.seance_id = s.id) AS total_presences,

            (SELECT COALESCE(SUM(e.montant_total), 0)
             FROM epargnes e WHERE e.seance_id = s.id) AS total_epargne,

            (SELECT COALESCE(SUM(cr.montant_capital), 0)
             FROM credits cr WHERE cr.seance_id = s.id) AS total_credits,

            (SELECT COALESCE(SUM(r.montant), 0)
             FROM remboursements r WHERE r.seance_id = s.id) AS total_remboursements,

            (SELECT COALESCE(SUM(pn.montant), 0)
             FROM penalites pn
             WHERE pn.seance_id = s.id AND pn.statut = 'PAYEE') AS total_penalites,

            (SELECT COALESCE(SUM(mc.montant), 0)
             FROM mouvements_caisse mc
             WHERE mc.seance_id = s.id AND mc.sens = 'ENTREE') AS total_entrees,

            (SELECT COALESCE(SUM(mc.montant), 0)
             FROM mouvements_caisse mc
             WHERE mc.seance_id = s.id AND mc.sens = 'SORTIE') AS total_sorties

        FROM seances s
        INNER JOIN cycles c ON c.id = s.cycle_id
        INNER JOIN voamami v ON v.id = c.voamami_id
        WHERE s.id = ?
    `;

    const params = [seanceId];

    if (user.role === "AGENT_FID") {
        sql += " AND v.agent_responsable_id = ?";
        params.push(user.id);
    }

    const [rows] = await promisePool.query(sql, params);
    return rows[0] || null;
}

async function getDetailedSeanceReport(seanceId, user) {
    const report = await getSeanceReportData(seanceId, user);
    if (!report) return null;

    const [presences, epargnes, credits, remboursements, penalites] =
        await Promise.all([
                promisePool.query(
                    `SELECT p.statut, p.observation, m.numero_membre, m.nom, m.prenom
                     FROM presences p
                     INNER JOIN membres m ON m.id = p.membre_id
                     WHERE p.seance_id = ?
                     ORDER BY m.numero_membre`,
                    [seanceId]
                ),
                promisePool.query(
                    `SELECT e.nombre_parts, e.montant_part, e.montant_total,
                            m.numero_membre, m.nom, m.prenom
                     FROM epargnes e
                     INNER JOIN membres m ON m.id = e.membre_id
                     WHERE e.seance_id = ?
                     ORDER BY m.numero_membre, e.id`,
                    [seanceId]
                ),
                promisePool.query(
                    `SELECT cr.montant_capital, cr.montant_interet, cr.montant_total,
                            cr.statut, m.numero_membre, m.nom, m.prenom
                     FROM credits cr
                     INNER JOIN membres m ON m.id = cr.membre_id
                     WHERE cr.seance_id = ?
                     ORDER BY m.numero_membre, cr.id`,
                    [seanceId]
                ),
                promisePool.query(
                    `SELECT r.montant_principal, r.montant_interet, r.montant,
                            m.numero_membre, m.nom, m.prenom
                     FROM remboursements r
                     INNER JOIN membres m ON m.id = r.membre_id
                     WHERE r.seance_id = ?
                     ORDER BY m.numero_membre, r.id`,
                    [seanceId]
                ),
                promisePool.query(
                    `SELECT pn.type_penalite, pn.montant, pn.statut, pn.motif,
                            m.numero_membre, m.nom, m.prenom
                     FROM penalites pn
                     INNER JOIN membres m ON m.id = pn.membre_id
                     WHERE pn.seance_id = ?
                     ORDER BY m.numero_membre, pn.id`,
                    [seanceId]
                )
            ]);

    report.solde =
        Number(report.total_entrees || 0) -
        Number(report.total_sorties || 0);
    report.presences = presences[0];
    report.epargnes = epargnes[0];
    report.credits = credits[0];
    report.remboursements = remboursements[0];
    report.penalites = penalites[0];
    return report;
}

async function getCycleReportData(cycleId, user) {
    let sql = `
            SELECT
                c.*,
                v.code AS voamami_code,
                v.nom AS voamami_nom,
                (SELECT COUNT(*) FROM seances s WHERE s.cycle_id = c.id) AS nombre_seances,
                (SELECT COUNT(*) FROM membres m
                 WHERE m.voamami_id = c.voamami_id AND m.actif = 1) AS nombre_membres,
                (SELECT COALESCE(SUM(e.montant_total), 0)
                 FROM epargnes e WHERE e.cycle_id = c.id) AS total_epargne,
                (SELECT COALESCE(SUM(cr.montant_capital), 0)
                 FROM credits cr WHERE cr.cycle_id = c.id) AS total_credits,
                (SELECT COALESCE(SUM(r.montant), 0)
                 FROM remboursements r WHERE r.cycle_id = c.id) AS total_remboursements,
                (SELECT COALESCE(SUM(r.montant_interet), 0)
                 FROM remboursements r WHERE r.cycle_id = c.id) AS total_interets,
                (SELECT COALESCE(SUM(p.montant), 0)
                 FROM penalites p
                 WHERE p.cycle_id = c.id AND p.statut = 'PAYEE') AS total_penalites,
                (SELECT COALESCE(SUM(CASE
                    WHEN mc.sens = 'ENTREE' THEN mc.montant
                    ELSE -mc.montant
                END), 0)
                FROM mouvements_caisse mc
                WHERE mc.cycle_id = c.id) AS solde_caisse
            FROM cycles c
            INNER JOIN voamami v ON v.id = c.voamami_id
            WHERE c.id = ?
        `;

    const params = [cycleId];

    if (user.role === "AGENT_FID") {
        sql += " AND v.agent_responsable_id = ?";
        params.push(user.id);
    }

    const [rows] = await promisePool.query(sql, params);
    if (!rows[0]) return null;

    return {
        ...rows[0],
        partage: await PartageBenefices.findByCycle(cycleId)
    };
}

exports.rapportSeance = async (req, res, next) => {
    try {
        const report = await getDetailedSeanceReport(
            req.params.seanceId,
            currentUser(req)
        );
        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Séance introuvable ou accès refusé."
            });
        }

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};

exports.rapportSeancePdf = async (req, res, next) => {
    try {
        const report = await getDetailedSeanceReport(
            req.params.seanceId,
            currentUser(req)
        );
        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Séance introuvable ou accès refusé."
            });
        }
        generateSeancePdf(res, report);
    } catch (error) {
        next(error);
    }
};

exports.rapportCycle = async (req, res, next) => {
    try {
        const report = await getCycleReportData(
            req.params.cycleId,
            currentUser(req)
        );
        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Cycle introuvable ou accès refusé."
            });
        }
        res.json({ success: true, data: report });
    } catch (error) {
        next(error);
    }
};

exports.rapportCyclePdf = async (req, res, next) => {
    try {
        const report = await getCycleReportData(
            req.params.cycleId,
            currentUser(req)
        );
        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Cycle introuvable ou accès refusé."
            });
        }
        generateCyclePdf(res, report);
    } catch (error) {
        next(error);
    }
};

exports.cloturerCycle = async (req, res, next) => {
    try {
        const user = currentUser(req);
        const cycleId = req.params.cycleId;

        // Vérification d'affectation avant la clôture.
        const [accessRows] = await promisePool.query(
            `
            SELECT c.id, c.numero_cycle, c.statut, v.agent_responsable_id
            FROM cycles c
            INNER JOIN voamami v ON v.id = c.voamami_id
            WHERE c.id = ?
            `,
            [cycleId]
        );

        if (!accessRows[0]) {
            return res.status(404).json({
                success: false,
                message: "Cycle introuvable."
            });
        }

        if (
            user.role === "AGENT_FID" &&
            Number(accessRows[0].agent_responsable_id) !== Number(user.id)
        ) {
            return res.status(403).json({
                success: false,
                message: "Vous ne pouvez pas clôturer ce cycle."
            });
        }

        const result = accessRows[0].statut === "CLOTURE"
            ? {
                cycle: await Cycle.findById(cycleId),
                partage: await PartageBenefices.findByCycle(cycleId)
            }
            : await Cycle.cloturer(cycleId);

        const rapportExist = await Rapport.findExistingByCycle(cycleId);
        const rapport = rapportExist || await Rapport.create({
            cycle_id: cycleId,
            type_rapport: "CLOTURE_CYCLE",
            titre: `Rapport de clôture du cycle ${result.cycle.numero_cycle}`,
            contenu: result,
            utilisateur_id: user.id
        });

        res.json({
            success: true,
            message: "Cycle clôturé et partage calculé avec succès.",
            data: {
                ...result,
                rapport
            }
        });
    } catch (error) {
        if (
            error.code === "ER_SIGNAL_EXCEPTION" ||
            error.sqlState === "45000"
        ) {
            const businessMessages = {
                "Le cycle doit etre ouvert.": "Seul un cycle ouvert peut être clôturé.",
                "Toutes les seances doivent etre cloturees avant le cycle.": "Clôturez toutes les séances avant de clôturer ce cycle.",
                "Des credits ne sont pas encore solde : cloture du cycle impossible.": "Remboursez intégralement tous les crédits avant de clôturer ce cycle."
            };
            return res.status(422).json({
                success: false,
                message: businessMessages[error.message] ||
                    "La clôture est impossible en raison des règles de gestion du cycle."
            });
        }
        next(error);
    }
};

exports.cloturerSeance = async (req, res, next) => {
    try {
        const seanceId = req.params.seanceId || req.params.id;
        if (!/^\d+$/.test(String(seanceId || ""))) {
            return res.status(400).json({
                success: false,
                message: "Identifiant de séance invalide."
            });
        }
        const user = currentUser(req);
        const [accessRows] = await promisePool.query(
            `SELECT s.id, v.agent_responsable_id
             FROM seances s
             INNER JOIN cycles c ON c.id = s.cycle_id
             INNER JOIN voamami v ON v.id = c.voamami_id
             WHERE s.id = ?`,
            [seanceId]
        );
        if (!accessRows[0]) {
            return res.status(404).json({
                success: false,
                message: "Séance introuvable."
            });
        }
        if (
            user.role === "AGENT_FID" &&
            Number(accessRows[0].agent_responsable_id) !== Number(user.id)
        ) {
            return res.status(403).json({
                success: false,
                message: "Vous ne pouvez pas clôturer cette séance."
            });
        }

        let seance;

        try {
            seance = await Seance.close(
                seanceId,
                req.body?.observation?.trim() || null
            );
        } catch (error) {
            if (error.code !== "SEANCE_ALREADY_CLOSED") throw error;
        }

        if (!seance) {
            seance = await Seance.findById(seanceId);
        }
        if (!seance) {
            return res.status(404).json({
                success: false,
                message: "Séance introuvable."
            });
        }

        const existing = await Rapport.findExistingBySeance(seanceId);
        const report = existing || await Rapport.create({
            cycle_id: seance.cycle_id,
            seance_id: seance.id,
            type_rapport: "SEANCE",
            titre: `Rapport de la séance ${seance.numero_seance}`,
            contenu: await getSeanceReportData(seanceId, user),
            utilisateur_id: user.id
        });

        return res.status(200).json({
            success: true,
            message: "Séance clôturée et rapport généré.",
            data: { seance, rapport: report }
        });
    } catch (error) {
        if (
            error.code === "SEANCE_NOT_FOUND" ||
            error.code === "SEANCE_ALREADY_CLOSED"
        ) {
            return res.status(422).json({
                success: false,
                message: error.message
            });
        }
        return next(error);
    }
};

module.exports = exports;
