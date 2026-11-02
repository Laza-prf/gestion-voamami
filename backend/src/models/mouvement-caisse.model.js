const { promisePool } = require("../config/db.js");

class MouvementCaisse {
    static normalizeVoamamiId(value) {
        const id = Number(value);
        return Number.isInteger(id) && id > 0 ? id : null;
    }

    static buildFilters(filters = {}) {
        const conditions = [];
        const params = [];

        const voamamiId = this.normalizeVoamamiId(
            filters.voamami_id
        );

        if (!voamamiId) {
            const error = new Error(
                "Le VOAMAMI est obligatoire pour consulter la caisse."
            );
            error.code = "VOAMAMI_REQUIRED";
            throw error;
        }

        conditions.push("c.voamami_id = ?");
        params.push(voamamiId);

        if (filters.user?.role === "AGENT_FID") {
            conditions.push("v.agent_responsable_id = ?");
            params.push(filters.user.id);
        }

        if (filters.cycle_id) {
            conditions.push("mc.cycle_id = ?");
            params.push(Number(filters.cycle_id));
        }

        if (filters.seance_id) {
            conditions.push("mc.seance_id = ?");
            params.push(Number(filters.seance_id));
        }

        if (filters.membre_id) {
            conditions.push("mc.membre_id = ?");
            params.push(Number(filters.membre_id));
        }

        if (filters.sens) {
            conditions.push("mc.sens = ?");
            params.push(filters.sens);
        }

        if (filters.type_mouvement) {
            conditions.push("mc.type_mouvement = ?");
            params.push(filters.type_mouvement);
        }

        return { conditions, params };
    }

    static async findById(id, filters = {}) {
        const { conditions, params } = this.buildFilters(filters);
        conditions.push("mc.id = ?");
        params.push(Number(id));

        const sql = `
            SELECT
                mc.id,
                mc.cycle_id,
                mc.seance_id,
                mc.membre_id,
                mc.type_mouvement,
                mc.montant,
                mc.sens,
                mc.epargne_id,
                mc.credit_id,
                mc.remboursement_id,
                mc.penalite_id,
                mc.description,
                mc.date_mouvement,
                mc.created_at,

                c.numero_cycle,
                c.voamami_id,

                v.code AS voamami_code,
                v.nom AS voamami_nom,

                s.numero_seance,
                s.date_seance,

                m.numero_membre,
                m.nom AS membre_nom,
                m.prenom AS membre_prenom

            FROM mouvements_caisse mc
            INNER JOIN cycles c ON c.id = mc.cycle_id
            INNER JOIN voamami v ON v.id = c.voamami_id
            INNER JOIN seances s ON s.id = mc.seance_id
            LEFT JOIN membres m ON m.id = mc.membre_id
            WHERE ${conditions.join(" AND ")}
            LIMIT 1
        `;

        const [rows] = await promisePool.query(sql, params);
        return rows[0] || null;
    }

    static async findAll(filters = {}) {
        const { conditions, params } = this.buildFilters(filters);

        const sql = `
            SELECT
                mc.id,
                mc.cycle_id,
                mc.seance_id,
                mc.membre_id,
                mc.type_mouvement,
                mc.montant,
                mc.sens,
                mc.epargne_id,
                mc.credit_id,
                mc.remboursement_id,
                mc.penalite_id,
                mc.description,
                mc.date_mouvement,
                mc.created_at,

                c.numero_cycle,
                c.voamami_id,

                v.code AS voamami_code,
                v.nom AS voamami_nom,

                s.numero_seance,
                s.date_seance,

                m.numero_membre,
                m.nom AS membre_nom,
                m.prenom AS membre_prenom

            FROM mouvements_caisse mc
            INNER JOIN cycles c ON c.id = mc.cycle_id
            INNER JOIN voamami v ON v.id = c.voamami_id
            INNER JOIN seances s ON s.id = mc.seance_id
            LEFT JOIN membres m ON m.id = mc.membre_id
            WHERE ${conditions.join(" AND ")}
            ORDER BY mc.date_mouvement DESC, mc.id DESC
        `;

        const [rows] = await promisePool.query(sql, params);
        return rows;
    }

    static async getSummary(filters = {}) {
        const { conditions, params } = this.buildFilters(filters);

        const sql = `
            SELECT
                COALESCE(SUM(
                    CASE WHEN mc.sens = 'ENTREE'
                    THEN mc.montant ELSE 0 END
                ), 0) AS total_entrees,

                COALESCE(SUM(
                    CASE WHEN mc.sens = 'SORTIE'
                    THEN mc.montant ELSE 0 END
                ), 0) AS total_sorties,

                COALESCE(SUM(
                    CASE WHEN mc.sens = 'ENTREE'
                    THEN mc.montant ELSE -mc.montant END
                ), 0) AS solde

            FROM mouvements_caisse mc
            INNER JOIN cycles c ON c.id = mc.cycle_id
            INNER JOIN voamami v ON v.id = c.voamami_id
            WHERE ${conditions.join(" AND ")}
        `;

        const [rows] = await promisePool.query(sql, params);
        return rows[0] || {
            total_entrees: 0,
            total_sorties: 0,
            solde: 0
        };
    }

    static async getBalancesByVoamami(user) {
        let sql = `
            SELECT
                v.id AS voamami_id,
                v.code AS voamami_code,
                v.nom AS voamami_nom,
                COALESCE(SUM(
                    CASE
                        WHEN mc.sens = 'ENTREE' THEN mc.montant
                        WHEN mc.sens = 'SORTIE' THEN -mc.montant
                        ELSE 0
                    END
                ), 0) AS solde
            FROM voamami v
            LEFT JOIN cycles c ON c.voamami_id = v.id
            LEFT JOIN mouvements_caisse mc ON mc.cycle_id = c.id
        `;
        const params = [];

        if (user?.role === "AGENT_FID") {
            sql += " WHERE v.agent_responsable_id = ?";
            params.push(user.id);
        }

        sql += `
            GROUP BY v.id, v.code, v.nom
            ORDER BY solde DESC, v.code ASC
        `;

        const [rows] = await promisePool.query(sql, params);
        return rows.map((row) => ({
            ...row,
            solde: Number(row.solde || 0)
        }));
    }
}

module.exports = MouvementCaisse;
