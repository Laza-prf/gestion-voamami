const { promisePool } = require("../config/db.js");

const AUTO_PENALTY_TYPE = "ABSENCE NON EXCUSÉE";
const AUTO_PENALTY_MOTIF = "[AUTO:PRESENCE] Absence sans motif d'excuse";
const LEGACY_AUTO_PENALTY_MOTIF = "Absence sans motif d'excuse";

class Presence {
    static async getContext(seance_id, membre_id, connection = promisePool) {
        const [rows] = await connection.query(
            `
            SELECT
                s.id AS seance_id,
                s.cycle_id,
                s.date_seance,
                s.statut AS seance_statut,
                c.statut AS cycle_statut,
                c.montant_penalite,
                c.voamami_id AS cycle_voamami_id,
                v.agent_responsable_id,
                m.id AS membre_id,
                m.voamami_id AS membre_voamami_id,
                m.cycle_actif_id,
                m.actif
            FROM seances s
            INNER JOIN cycles c ON c.id = s.cycle_id
            INNER JOIN voamami v ON v.id = c.voamami_id
            INNER JOIN membres m ON m.id = ?
            WHERE s.id = ?
            `,
            [membre_id, seance_id]
        );

        return rows[0] || null;
    }

    static async validateContext(seance_id, membre_id, user, connection = promisePool) {
        const context = await Presence.getContext(seance_id, membre_id, connection);

        if (!context) {
            const error = new Error("La séance ou le membre est introuvable.");
            error.code = "CONTEXT_NOT_FOUND";
            throw error;
        }
        if (
            user?.role === "AGENT_FID" &&
            Number(context.agent_responsable_id) !== Number(user.id)
        ) {
            const error = new Error("Vous ne pouvez pas gérer les présences de ce VOAMAMI.");
            error.code = "ACCESS_DENIED";
            throw error;
        }
        if (context.seance_statut !== "OUVERTE") {
            const error = new Error("La séance est déjà clôturée.");
            error.code = "SEANCE_CLOSED";
            throw error;
        }
        if (context.cycle_statut !== "OUVERT") {
            const error = new Error("Le cycle doit être ouvert pour modifier les présences.");
            error.code = "CYCLE_CLOSED";
            throw error;
        }
        if (!context.actif) {
            const error = new Error("Le membre est inactif.");
            error.code = "MEMBRE_INACTIF";
            throw error;
        }
        if (Number(context.cycle_voamami_id) !== Number(context.membre_voamami_id)) {
            const error = new Error("Le membre n'appartient pas au VOAMAMI de la séance.");
            error.code = "MEMBRE_WRONG_VOAMAMI";
            throw error;
        }
        if (
            context.cycle_actif_id !== null &&
            Number(context.cycle_actif_id) !== Number(context.cycle_id)
        ) {
            const error = new Error("Le membre n'est pas affecté au cycle de la séance.");
            error.code = "MEMBRE_WRONG_CYCLE";
            throw error;
        }

        return context;
    }

    static async updateAbsencePenalty(connection, context, membre_id, statut) {
        const [penalties] = await connection.query(
            `SELECT id, statut
             FROM penalites
             WHERE seance_id = ? AND membre_id = ? AND type_penalite = ?
               AND motif IN (?, ?)
             FOR UPDATE`,
            [
                context.seance_id,
                membre_id,
                AUTO_PENALTY_TYPE,
                AUTO_PENALTY_MOTIF,
                LEGACY_AUTO_PENALTY_MOTIF
            ]
        );

        if (statut === "ABSENT") {
            if (penalties.length) {
                return { created: false, removed: false };
            }

            await connection.query(
                `INSERT INTO penalites
                    (cycle_id, seance_id, membre_id, type_penalite, montant, date_penalite, motif, statut)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'IMPAYEE')`,
                [
                    context.cycle_id,
                    context.seance_id,
                    membre_id,
                    AUTO_PENALTY_TYPE,
                    Number(context.montant_penalite || 0),
                    context.date_seance,
                    AUTO_PENALTY_MOTIF
                ]
            );
            return { created: true, removed: false };
        }

        if (penalties.some((penalty) => penalty.statut === "PAYEE")) {
            const error = new Error(
                "Cette absence a déjà donné lieu à une pénalité payée et ne peut plus être corrigée."
            );
            error.code = "PAID_ABSENCE_PENALTY";
            throw error;
        }
        if (!penalties.length) {
            return { created: false, removed: false };
        }

        await connection.query(
            `DELETE FROM penalites
             WHERE seance_id = ? AND membre_id = ? AND type_penalite = ?
               AND motif IN (?, ?) AND statut = 'IMPAYEE'`,
            [
                context.seance_id,
                membre_id,
                AUTO_PENALTY_TYPE,
                AUTO_PENALTY_MOTIF,
                LEGACY_AUTO_PENALTY_MOTIF
            ]
        );
        return { created: false, removed: true };
    }

    static async create(data, user) {
        const {
            seance_id,
            membre_id,
            statut = "PRESENT",
            observation = null
        } = data;
        const connection = await promisePool.getConnection();

        try {
            await connection.beginTransaction();
            const context = await Presence.validateContext(
                seance_id,
                membre_id,
                user,
                connection
            );
            const [result] = await connection.query(
                `INSERT INTO presences (seance_id, membre_id, statut, observation)
                 VALUES (?, ?, ?, ?)`,
                [seance_id, membre_id, statut, observation]
            );
            const penalty = await Presence.updateAbsencePenalty(
                connection,
                context,
                membre_id,
                statut
            );
            await connection.commit();

            return {
                presence: await Presence.findById(result.insertId, user),
                ...penalty
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async update(id, data, user) {
        const connection = await promisePool.getConnection();

        try {
            await connection.beginTransaction();
            const [rows] = await connection.query(
                "SELECT id, seance_id, membre_id FROM presences WHERE id = ? FOR UPDATE",
                [id]
            );
            const existing = rows[0];
            if (!existing) {
                const error = new Error("Présence introuvable.");
                error.code = "NOT_FOUND";
                throw error;
            }

            const context = await Presence.validateContext(
                existing.seance_id,
                existing.membre_id,
                user,
                connection
            );
            await connection.query(
                "UPDATE presences SET statut = ?, observation = ? WHERE id = ?",
                [data.statut, data.observation ?? null, id]
            );
            const penalty = await Presence.updateAbsencePenalty(
                connection,
                context,
                existing.membre_id,
                data.statut
            );
            await connection.commit();

            return {
                presence: await Presence.findById(id, user),
                ...penalty
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async findById(id, user) {
        let sql = `
            SELECT
                p.id,
                p.seance_id,
                p.membre_id,
                p.statut,
                p.observation,
                p.created_at,
                s.numero_seance,
                s.date_seance,
                s.statut AS seance_statut,
                c.id AS cycle_id,
                c.numero_cycle,
                v.id AS voamami_id,
                v.code AS voamami_code,
                v.nom AS voamami_nom,
                m.numero_membre,
                m.nom AS membre_nom,
                m.prenom AS membre_prenom
            FROM presences p
            INNER JOIN seances s ON s.id = p.seance_id
            INNER JOIN cycles c ON c.id = s.cycle_id
            INNER JOIN voamami v ON v.id = c.voamami_id
            INNER JOIN membres m ON m.id = p.membre_id
            WHERE p.id = ?
        `;
        const params = [id];
        if (user?.role === "AGENT_FID") {
            sql += " AND v.agent_responsable_id = ?";
            params.push(user.id);
        }

        const [rows] = await promisePool.query(sql, params);
        return rows[0] || null;
    }

    static async findAll(filters = {}) {
        let sql = `
            SELECT
                p.id,
                p.seance_id,
                p.membre_id,
                p.statut,
                p.observation,
                p.created_at,
                s.numero_seance,
                s.date_seance,
                s.statut AS seance_statut,
                c.id AS cycle_id,
                c.numero_cycle,
                v.id AS voamami_id,
                v.code AS voamami_code,
                v.nom AS voamami_nom,
                m.numero_membre,
                m.nom AS membre_nom,
                m.prenom AS membre_prenom
            FROM presences p
            INNER JOIN seances s ON s.id = p.seance_id
            INNER JOIN cycles c ON c.id = s.cycle_id
            INNER JOIN voamami v ON v.id = c.voamami_id
            INNER JOIN membres m ON m.id = p.membre_id
        `;
        const conditions = [];
        const params = [];

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
        if (filters.user?.role === "AGENT_FID") {
            conditions.push("v.agent_responsable_id = ?");
            params.push(filters.user.id);
        }
        if (conditions.length) {
            sql += ` WHERE ${conditions.join(" AND ")} `;
        }
        sql += " ORDER BY s.date_seance DESC, m.numero_membre ASC, p.id ASC";

        const [rows] = await promisePool.query(sql, params);
        return rows;
    }

    static async delete(id, user) {
        const connection = await promisePool.getConnection();

        try {
            await connection.beginTransaction();
            const [rows] = await connection.query(
                "SELECT id, seance_id, membre_id FROM presences WHERE id = ? FOR UPDATE",
                [id]
            );
            const existing = rows[0];
            if (!existing) {
                await connection.rollback();
                return false;
            }

            const context = await Presence.validateContext(
                existing.seance_id,
                existing.membre_id,
                user,
                connection
            );
            await Presence.updateAbsencePenalty(
                connection,
                context,
                existing.membre_id,
                "PRESENT"
            );
            const [result] = await connection.query(
                "DELETE FROM presences WHERE id = ?",
                [id]
            );
            await connection.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = Presence;
