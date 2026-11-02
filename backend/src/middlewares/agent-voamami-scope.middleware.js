const { promisePool } = require("../config/db.js");

const recordScopeQueries = {
    "/api/voamami": "SELECT id AS voamami_id FROM voamami WHERE id = ?",
    "/api/cycles": "SELECT voamami_id FROM cycles WHERE id = ?",
    "/api/membres": "SELECT voamami_id FROM membres WHERE id = ?",
    "/api/seances": `
        SELECT c.voamami_id
        FROM seances s
        INNER JOIN cycles c ON c.id = s.cycle_id
        WHERE s.id = ?
    `,
    "/api/epargnes": `
        SELECT c.voamami_id
        FROM epargnes e
        INNER JOIN cycles c ON c.id = e.cycle_id
        WHERE e.id = ?
    `,
    "/api/credits": `
        SELECT c.voamami_id
        FROM credits cr
        INNER JOIN cycles c ON c.id = cr.cycle_id
        WHERE cr.id = ?
    `,
    "/api/remboursements": `
        SELECT c.voamami_id
        FROM remboursements r
        INNER JOIN cycles c ON c.id = r.cycle_id
        WHERE r.id = ?
    `,
    "/api/presences": `
        SELECT c.voamami_id
        FROM presences p
        INNER JOIN seances s ON s.id = p.seance_id
        INNER JOIN cycles c ON c.id = s.cycle_id
        WHERE p.id = ?
    `,
    "/api/penalites": `
        SELECT c.voamami_id
        FROM penalites p
        INNER JOIN cycles c ON c.id = p.cycle_id
        WHERE p.id = ?
    `,
    "/api/mouvements_caisse": `
        SELECT c.voamami_id
        FROM mouvements_caisse mc
        INNER JOIN cycles c ON c.id = mc.cycle_id
        WHERE mc.id = ?
    `,
    "/api/rapports": `
        SELECT c.voamami_id
        FROM rapports r
        INNER JOIN cycles c ON c.id = r.cycle_id
        WHERE r.id = ?
    `
};

const cycleByIdQuery = "SELECT voamami_id FROM cycles WHERE id = ?";
const memberByIdQuery = "SELECT voamami_id FROM membres WHERE id = ?";
const sessionByIdQuery = `
    SELECT c.voamami_id
    FROM seances s
    INNER JOIN cycles c ON c.id = s.cycle_id
    WHERE s.id = ?
`;
const creditByIdQuery = `
    SELECT c.voamami_id
    FROM credits cr
    INNER JOIN cycles c ON c.id = cr.cycle_id
    WHERE cr.id = ?
`;

async function getVoamamiId(query, id) {
    if (!id || !Number.isInteger(Number(id)) || Number(id) < 1) return null;
    const [rows] = await promisePool.query(query, [Number(id)]);
    return rows[0]?.voamami_id ?? null;
}

function getIdsToCheck(req) {
    const path = req.baseUrl;
    const body = req.body || {};
    const query = req.query || {};
    const ids = [];
    const add = (query, id) => {
        if (id !== undefined && id !== null && id !== "") ids.push({ query, id });
    };

    const recordId = req.params.id;
    if (recordId && recordScopeQueries[path]) {
        add(recordScopeQueries[path], recordId);
    }

    if (path === "/api/rapports") {
        add(sessionByIdQuery, req.params.seanceId);
        add(cycleByIdQuery, req.params.cycleId);
    }

    if (path === "/api/voamami") {
        add("SELECT id AS voamami_id FROM voamami WHERE id = ?", query.voamami_id);
    } else if (path === "/api/cycles") {
        add("SELECT id AS voamami_id FROM voamami WHERE id = ?", body.voamami_id);
    } else if (path === "/api/membres") {
        add("SELECT id AS voamami_id FROM voamami WHERE id = ?", body.voamami_id);
        add(cycleByIdQuery, body.cycle_actif_id);
    } else if (path === "/api/seances") {
        add(cycleByIdQuery, body.cycle_id || query.cycle_id);
    } else if (["/api/epargnes", "/api/credits", "/api/remboursements", "/api/presences", "/api/penalites"].includes(path)) {
        add(sessionByIdQuery, body.seance_id || query.seance_id);
        add(cycleByIdQuery, body.cycle_id || query.cycle_id);
        add(memberByIdQuery, body.membre_id || query.membre_id);
        if (path === "/api/remboursements") {
            add(creditByIdQuery, body.credit_id || query.credit_id);
            for (const entry of Array.isArray(body.entries) ? body.entries : []) {
                add(creditByIdQuery, entry?.credit_id);
            }
        }
        for (const entry of Array.isArray(body.entries) ? body.entries : []) {
            add(memberByIdQuery, entry?.membre_id);
        }
    } else if (path === "/api/mouvements_caisse") {
        add("SELECT id AS voamami_id FROM voamami WHERE id = ?", query.voamami_id);
    }

    return ids;
}

module.exports = async function agentVoamamiScope(req, res, next) {
    if (req.user?.role !== "AGENT_FID") return next();

    try {
        const [assignments] = await promisePool.query(
            "SELECT id FROM voamami WHERE agent_responsable_id = ?",
            [req.user.id]
        );

        if (assignments.length === 0) {
            return res.status(403).json({
                success: false,
                message: "Aucun VOAMAMI ne vous est affecté. Contactez l'administrateur."
            });
        }
        if (assignments.length > 1) {
            return res.status(403).json({
                success: false,
                message: "Plusieurs VOAMAMI vous sont affectés. Contactez l'administrateur pour définir votre groupe."
            });
        }

        const assignedVoamamiId = Number(assignments[0].id);
        if (req.baseUrl === "/api/mouvements_caisse" && !req.query?.voamami_id) {
            req.agentVoamamiId = assignedVoamamiId;
        }

        const targets = getIdsToCheck(req);
        for (const target of targets) {
            const voamamiId = await getVoamamiId(target.query, target.id);
            if (voamamiId && Number(voamamiId) !== assignedVoamamiId) {
                return res.status(403).json({
                    success: false,
                    message: "Accès refusé : cette donnée ne dépend pas de votre VOAMAMI affecté."
                });
            }
        }

        return next();
    } catch (error) {
        return next(error);
    }
};
