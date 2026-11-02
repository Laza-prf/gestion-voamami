const { promisePool } = require("../config/db.js");

class Rapport {
    static async findAll({ userId = null, role = null, ...filters } = {}) {
        let sql = `
            SELECT
                r.*,
                c.numero_cycle,
                c.voamami_id,
                v.code AS voamami_code,
                v.nom AS voamami_nom,
                u.nom AS agent_nom,
                u.email AS agent_email,
                s.numero_seance,
                s.date_seance
            FROM rapports r
            INNER JOIN cycles c ON c.id = r.cycle_id
            INNER JOIN voamami v ON v.id = c.voamami_id
            LEFT JOIN utilisateurs u ON u.id = v.agent_responsable_id
            LEFT JOIN seances s ON s.id = r.seance_id
            WHERE 1 = 1
        `;

        const params = [];

        if (role === "AGENT_FID") {
            sql += " AND v.agent_responsable_id = ?";
            params.push(userId);
        }

        if (filters.cycle_id) {
            sql += " AND r.cycle_id = ?";
            params.push(filters.cycle_id);
        }

        if (filters.seance_id) {
            sql += " AND r.seance_id = ?";
            params.push(filters.seance_id);
        }

        if (filters.type_rapport) {
            sql += " AND r.type_rapport = ?";
            params.push(filters.type_rapport);
        }

        if (filters.voamami_id) {
            sql += " AND c.voamami_id = ?";
            params.push(filters.voamami_id);
        }

        sql += " ORDER BY r.date_generation DESC, r.id DESC";

        const [rows] = await promisePool.query(sql, params);
        return rows;
    }

    static async findById(id, { userId = null, role = null } = {}) {
        let sql = `
            SELECT
                r.*,
                c.numero_cycle,
                c.voamami_id,
                v.code AS voamami_code,
                v.nom AS voamami_nom,
                u.nom AS agent_nom,
                u.email AS agent_email,
                s.numero_seance,
                s.date_seance
            FROM rapports r
            INNER JOIN cycles c ON c.id = r.cycle_id
            INNER JOIN voamami v ON v.id = c.voamami_id
            LEFT JOIN utilisateurs u ON u.id = v.agent_responsable_id
            LEFT JOIN seances s ON s.id = r.seance_id
            WHERE r.id = ?
        `;

        const params = [id];

        if (role === "AGENT_FID") {
            sql += " AND v.agent_responsable_id = ?";
            params.push(userId);
        }

        const [rows] = await promisePool.query(sql, params);
        return rows[0] || null;
    }

    static async create({
        cycle_id,
        seance_id = null,
        type_rapport,
        titre,
        contenu,
        utilisateur_id = null
    }) {
        const [result] = await promisePool.query(
            `
            INSERT INTO rapports
                (cycle_id, seance_id, type_rapport, titre, contenu, utilisateur_id)
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                cycle_id,
                seance_id,
                type_rapport,
                titre,
                typeof contenu === "string"
                    ? contenu
                    : JSON.stringify(contenu),
                utilisateur_id
            ]
        );

        return this.findById(result.insertId);
    }

    static async findExistingBySeance(seanceId) {
        const [rows] = await promisePool.query(
            `
            SELECT *
            FROM rapports
            WHERE seance_id = ?
              AND type_rapport = 'SEANCE'
            ORDER BY id DESC
            LIMIT 1
            `,
            [seanceId]
        );

        return rows[0] || null;
    }

    static async findExistingByCycle(cycleId) {
        const [rows] = await promisePool.query(
            `
            SELECT *
            FROM rapports
            WHERE cycle_id = ?
              AND type_rapport = 'CLOTURE_CYCLE'
            ORDER BY id DESC
            LIMIT 1
            `,
            [cycleId]
        );

        return rows[0] || null;
    }
}

module.exports = Rapport;
