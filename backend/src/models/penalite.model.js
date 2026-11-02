const { promisePool } = require("../config/db.js");
const {
    assertMemberPresentForOperation
} = require("../utils/presence-operation.util.js");

class Penalite {
    static async getContext(seance_id, membre_id) {
        const sql = `
            SELECT
                s.id AS seance_id,
                s.cycle_id,
                s.date_seance,
                s.statut AS seance_statut,
                c.statut AS cycle_statut,
                c.voamami_id AS cycle_voamami_id,
                m.id AS membre_id,
                m.voamami_id AS membre_voamami_id,
                m.cycle_actif_id,
                m.actif
            FROM seances s
            INNER JOIN cycles c ON c.id = s.cycle_id
            INNER JOIN membres m ON m.id = ?
            WHERE s.id = ?
        `;

        const [rows] = await promisePool.query(sql, [
            membre_id,
            seance_id
        ]);

        return rows[0] || null;
    }

    static async validateContext(seance_id, membre_id) {
        const context = await Penalite.getContext(
            seance_id,
            membre_id
        );

        if (!context) {
            const error = new Error(
                "La séance ou le membre est introuvable."
            );
            error.code = "CONTEXT_NOT_FOUND";
            throw error;
        }

        if (context.seance_statut !== "OUVERTE") {
            const error = new Error(
                "La séance est déjà clôturée."
            );
            error.code = "SEANCE_CLOSED";
            throw error;
        }

        if (context.cycle_statut !== "OUVERT") {
            const error = new Error(
                "Le cycle doit être ouvert pour enregistrer une pénalité."
            );
            error.code = "CYCLE_NOT_OPEN";
            throw error;
        }

        if (!context.actif) {
            const error = new Error("Le membre est inactif.");
            error.code = "MEMBRE_INACTIF";
            throw error;
        }

        if (
            Number(context.cycle_voamami_id) !==
            Number(context.membre_voamami_id)
        ) {
            const error = new Error(
                "Le membre n'appartient pas au VOAMAMI de la séance."
            );
            error.code = "MEMBRE_WRONG_VOAMAMI";
            throw error;
        }

        if (
            context.cycle_actif_id !== null &&
            Number(context.cycle_actif_id) !== Number(context.cycle_id)
        ) {
            const error = new Error(
                "Le membre n'est pas affecté au cycle de la séance."
            );
            error.code = "MEMBRE_WRONG_CYCLE";
            throw error;
        }

        return context;
    }

    static async create(data) {
        const {
            seance_id,
            membre_id,
            type_penalite,
            motif = null,
            statut = "IMPAYEE"
        } = data;

        const context = await Penalite.validateContext(
            seance_id,
            membre_id
        );
        await assertMemberPresentForOperation(seance_id, membre_id);

        const sql = `
            INSERT INTO penalites (
                cycle_id,
                seance_id,
                membre_id,
                type_penalite,
                montant,
                date_penalite,
                motif,
                statut
            )
            VALUES (?, ?, ?, ?, 0, ?, ?, ?)
        `;

        const [result] = await promisePool.query(sql, [
            context.cycle_id,
            context.seance_id,
            context.membre_id,
            type_penalite,
            context.date_seance,
            motif,
            statut
        ]);

        return Penalite.findById(result.insertId);
    }

    static async update(id, data) {
        const existing = await Penalite.findById(id);

        if (!existing) {
            const error = new Error("Pénalité introuvable.");
            error.code = "NOT_FOUND";
            throw error;
        }

        if (existing.statut === "PAYEE" && data.statut !== "PAYEE") {
            const error = new Error(
                "Une pénalité déjà payée ne peut pas redevenir impayée."
            );
            error.code = "PAIEMENT_IRREVERSIBLE";
            throw error;
        }

        if (existing.statut === "IMPAYEE") {
            await Penalite.validateContext(
                existing.seance_id,
                existing.membre_id
            );
        }

        const sql = `
            UPDATE penalites
            SET motif = ?, statut = ?
            WHERE id = ?
        `;

        const [result] = await promisePool.query(sql, [
            data.motif ?? null,
            data.statut,
            id
        ]);

        return result.affectedRows > 0
            ? Penalite.findById(id)
            : null;
    }

    static async findById(id, filters = {}) {
        let sql = Penalite.selectSql();
        const conditions = ["p.id = ?"];
        const params = [id];

        Penalite.addFilters(conditions, params, filters);
        sql += ` WHERE ${conditions.join(" AND ")} LIMIT 1`;

        const [rows] = await promisePool.query(sql, params);
        return rows[0] || null;
    }

    static selectSql() {
        return `
            SELECT
                p.id,
                p.cycle_id,
                p.seance_id,
                p.membre_id,
                p.type_penalite,
                p.montant,
                p.date_penalite,
                p.motif,
                p.statut,
                p.created_at,
                s.numero_seance,
                s.date_seance,
                s.statut AS seance_statut,
                c.numero_cycle,
                c.statut AS cycle_statut,
                c.voamami_id,
                v.code AS voamami_code,
                v.nom AS voamami_nom,
                m.numero_membre,
                m.nom AS membre_nom,
                m.prenom AS membre_prenom
            FROM penalites p
            INNER JOIN seances s ON s.id = p.seance_id
            INNER JOIN cycles c ON c.id = p.cycle_id
            INNER JOIN voamami v ON v.id = c.voamami_id
            INNER JOIN membres m ON m.id = p.membre_id
        `;
    }

    static addFilters(conditions, params, filters = {}) {
        if (filters.user?.role === "AGENT_FID") {
            conditions.push("v.agent_responsable_id = ?");
            params.push(filters.user.id);
        }
        if (filters.voamami_id) {
            conditions.push("c.voamami_id = ?");
            params.push(filters.voamami_id);
        }
        if (filters.cycle_id) {
            conditions.push("p.cycle_id = ?");
            params.push(filters.cycle_id);
        }
        if (filters.seance_id) {
            conditions.push("p.seance_id = ?");
            params.push(filters.seance_id);
        }
        if (filters.membre_id) {
            conditions.push("p.membre_id = ?");
            params.push(filters.membre_id);
        }
        if (filters.statut) {
            conditions.push("p.statut = ?");
            params.push(filters.statut);
        }
    }

    static async findAll(filters = {}) {
        const sqlBase = Penalite.selectSql();
        const conditions = [];
        const params = [];

        Penalite.addFilters(conditions, params, filters);

        let sql = sqlBase;
        if (conditions.length) {
            sql += ` WHERE ${conditions.join(" AND ")} `;
        }
        sql += " ORDER BY p.date_penalite DESC, p.id DESC";

        const [rows] = await promisePool.query(sql, params);
        return rows;
    }
}

module.exports = Penalite;
