const {
    promisePool
} = require("../config/db.js");

class Seance {
    /**
     * Vérifier qu'un cycle existe et qu'il est ouvert
     */
    static async getCycleOuvert(cycleId) {
        const sql = `
            SELECT
                c.id,
                c.voamami_id,
                c.numero_cycle,
                c.statut,
                v.code AS voamami_code,
                v.nom AS voamami_nom
            FROM cycles c
            INNER JOIN voamami v
                ON v.id = c.voamami_id
            WHERE c.id = ?
        `;

        const [rows] =
            await promisePool.query(
                sql,
                [cycleId]
            );

        return rows[0] || null;
    }

    /**
     * Créer une séance
     */
    static async create(data) {
        const {
            cycle_id,
            numero_seance,
            date_seance,
            statut = "OUVERTE",
            observation = null
        } = data;

        const cycle =
            await Seance.getCycleOuvert(
                cycle_id
            );

        if (!cycle) {
            const error = new Error(
                "Le cycle indiqué n'existe pas."
            );

            error.code = "CYCLE_NOT_FOUND";
            throw error;
        }

        if (cycle.statut !== "OUVERT") {
            const error = new Error(
                "Une séance ne peut être créée que pour un cycle ouvert."
            );

            error.code = "CYCLE_NOT_OPEN";
            throw error;
        }

        const sql = `
            INSERT INTO seances (
                cycle_id,
                numero_seance,
                date_seance,
                statut,
                observation
            )
            VALUES (?, ?, ?, ?, ?)
        `;

        const [result] =
            await promisePool.query(sql, [
                cycle_id,
                numero_seance,
                date_seance,
                statut,
                observation
            ]);

        return Seance.findById(
            result.insertId
        );
    }

    /**
     * Modifier une séance ouverte
     */
    static async update(id, data) {
        const existing =
            await Seance.findById(id);

        if (!existing) {
            const error = new Error(
                "Séance introuvable."
            );

            error.code = "SEANCE_NOT_FOUND";
            throw error;
        }

        if (existing.statut === "CLOTUREE") {
            const error = new Error(
                "Une séance clôturée ne peut plus être modifiée."
            );

            error.code = "SEANCE_CLOSED";
            throw error;
        }

        const {
            cycle_id = existing.cycle_id,
            numero_seance,
            date_seance,
            statut = existing.statut,
            observation = null
        } = data;

        if (
            Number(cycle_id) !==
            Number(existing.cycle_id)
        ) {
            const error = new Error(
                "Le cycle d'une séance existante ne peut pas être modifié."
            );

            error.code = "CYCLE_CHANGE_FORBIDDEN";
            throw error;
        }

        const cycle =
            await Seance.getCycleOuvert(
                cycle_id
            );

        if (!cycle) {
            const error = new Error(
                "Le cycle indiqué n'existe pas."
            );

            error.code = "CYCLE_NOT_FOUND";
            throw error;
        }

        const sql = `
            UPDATE seances
            SET
                numero_seance = ?,
                date_seance = ?,
                statut = ?,
                observation = ?
            WHERE id = ?
        `;

        await promisePool.query(sql, [
            numero_seance,
            date_seance,
            statut,
            observation,
            id
        ]);

        return Seance.findById(id);
    }

    /**
     * Clôturer une séance
     */
    static async close(id, observation = null) {
        const existing =
            await Seance.findById(id);

        if (!existing) {
            const error = new Error(
                "Séance introuvable."
            );

            error.code = "SEANCE_NOT_FOUND";
            throw error;
        }

        if (existing.statut === "CLOTUREE") {
            const error = new Error(
                "Cette séance est déjà clôturée."
            );

            error.code = "SEANCE_ALREADY_CLOSED";
            throw error;
        }

        const sql = `
            UPDATE seances
            SET
                statut = 'CLOTUREE',
                observation = COALESCE(?, observation)
            WHERE id = ?
        `;

        await promisePool.query(sql, [
            observation,
            id
        ]);

        return Seance.findById(id);
    }

    /**
     * Supprimer une séance
     */
    static async delete(id) {
        const existing =
            await Seance.findById(id);

        if (!existing) {
            return false;
        }

        if (existing.statut === "CLOTUREE") {
            const error = new Error(
                "Une séance clôturée ne peut pas être supprimée."
            );

            error.code = "SEANCE_CLOSED";
            throw error;
        }

        const sql = `
            DELETE FROM seances
            WHERE id = ?
        `;

        const [result] =
            await promisePool.query(sql, [id]);

        return result.affectedRows > 0;
    }

    /**
     * Récupérer une séance par son identifiant
     */
    static async findById(id, user) {
        let sql = `
            SELECT
                s.id,
                s.cycle_id,
                s.numero_seance,
                s.date_seance,
                s.statut,
                s.observation,
                s.created_at,

                c.numero_cycle,
                c.statut AS cycle_statut,
                c.voamami_id,

                v.code AS voamami_code,
                v.nom AS voamami_nom,

                (
                    SELECT COUNT(*)
                    FROM membres m
                    WHERE m.voamami_id = c.voamami_id
                      AND m.actif = 1
                ) AS total_membres_actifs,

                (
                    SELECT COUNT(*)
                    FROM presences p
                    WHERE p.seance_id = s.id
                      AND p.statut = 'PRESENT'
                ) AS total_presents,

                (
                    SELECT COUNT(*)
                    FROM epargnes e
                    WHERE e.seance_id = s.id
                ) AS total_operations_epargne,

                (
                    SELECT COALESCE(
                        SUM(e.montant_total),
                        0
                    )
                    FROM epargnes e
                    WHERE e.seance_id = s.id
                ) AS total_epargne,

                (
                    SELECT COALESCE(
                        SUM(r.montant),
                        0
                    )
                    FROM remboursements r
                    WHERE r.seance_id = s.id
                ) AS total_remboursements

            FROM seances s
            INNER JOIN cycles c
                ON c.id = s.cycle_id
            INNER JOIN voamami v
                ON v.id = c.voamami_id
            WHERE s.id = ?
        `;

        const params = [id];
        if (user?.role === "AGENT_FID") {
            sql += " AND v.agent_responsable_id = ?";
            params.push(user.id);
        }

        const [rows] =
            await promisePool.query(
                sql,
                params
            );

        return rows[0] || null;
    }

    /**
     * Récupérer toutes les séances
     */
    static async findAll(filters = {}) {
        let sql = `
            SELECT
                s.id,
                s.cycle_id,
                s.numero_seance,
                s.date_seance,
                s.statut,
                s.observation,
                s.created_at,

                c.numero_cycle,
                c.statut AS cycle_statut,
                c.voamami_id,

                v.code AS voamami_code,
                v.nom AS voamami_nom,

                (
                    SELECT COUNT(*)
                    FROM membres m
                    WHERE m.voamami_id = c.voamami_id
                      AND m.actif = 1
                ) AS total_membres_actifs,

                (
                    SELECT COUNT(*)
                    FROM presences p
                    WHERE p.seance_id = s.id
                      AND p.statut = 'PRESENT'
                ) AS total_presents,

                (
                    SELECT COALESCE(
                        SUM(e.montant_total),
                        0
                    )
                    FROM epargnes e
                    WHERE e.seance_id = s.id
                ) AS total_epargne,

                (
                    SELECT COALESCE(
                        SUM(r.montant),
                        0
                    )
                    FROM remboursements r
                    WHERE r.seance_id = s.id
                ) AS total_remboursements

            FROM seances s
            INNER JOIN cycles c
                ON c.id = s.cycle_id
            INNER JOIN voamami v
                ON v.id = c.voamami_id
        `;

        const params = [];
        const conditions = [];

        if (filters.cycle_id) {
            conditions.push(
                "s.cycle_id = ?"
            );

            params.push(filters.cycle_id);
        }

        if (filters.voamami_id) {
            conditions.push(
                "c.voamami_id = ?"
            );

            params.push(filters.voamami_id);
        }

        if (filters.statut) {
            conditions.push(
                "s.statut = ?"
            );

            params.push(filters.statut);
        }

        if (filters.user?.role === "AGENT_FID") {
            conditions.push("v.agent_responsable_id = ?");
            params.push(filters.user.id);
        }

        if (conditions.length > 0) {
            sql += `
                WHERE ${conditions.join(" AND ")}
            `;
        }

        sql += `
            ORDER BY
                s.date_seance DESC,
                s.numero_seance DESC
        `;

        const [rows] =
            await promisePool.query(
                sql,
                params
            );

        return rows;
    }
}

module.exports = Seance;
