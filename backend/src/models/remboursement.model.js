const {
    promisePool
} = require("../config/db.js");
const {
    assertMemberPresentForOperation
} = require("../utils/presence-operation.util.js");

class Remboursement {
    static async create(data, connection = promisePool, requirePresence = false) {
        if (connection === promisePool) {
            const transaction = await promisePool.getConnection();
            let transactionStarted = false;
            try {
                await transaction.beginTransaction();
                transactionStarted = true;
                const remboursement = await Remboursement.create(
                    data,
                    transaction,
                    requirePresence
                );
                await transaction.commit();
                transactionStarted = false;
                return remboursement;
            } catch (error) {
                if (transactionStarted) {
                    await transaction.rollback();
                }
                throw error;
            } finally {
                transaction.release();
            }
        }

        const {
            credit_id,
            seance_id,
            montant_principal = 0,
            montant_interet = 0,
            observation = null
        } = data;

        const contextSql = `
            SELECT
                cr.id AS credit_id,
                cr.cycle_id,
                cr.membre_id,
                cr.statut AS credit_statut,
                s.id AS seance_id,
                s.cycle_id AS seance_cycle_id,
                s.date_seance,
                s.statut AS seance_statut
            FROM credits cr
            INNER JOIN seances s ON s.id = ?
            WHERE cr.id = ?
        `;
        const [rows] = await connection.query(
            `${contextSql} FOR UPDATE OF cr`,
            [seance_id, credit_id]
        );
        const context = rows[0];

        if (!context) {
            const error = new Error("Le crédit ou la séance est introuvable.");
            error.code = "CONTEXT_NOT_FOUND";
            throw error;
        }
        if (context.seance_statut !== "OUVERTE") {
            const error = new Error("La séance est déjà clôturée.");
            error.code = "SEANCE_CLOSED";
            throw error;
        }
        if (Number(context.cycle_id) !== Number(context.seance_cycle_id)) {
            const error = new Error("La séance ne correspond pas au cycle du crédit.");
            error.code = "WRONG_CYCLE";
            throw error;
        }
        if (context.credit_statut === "REMBOURSE") {
            const error = new Error("Ce crédit est déjà entièrement remboursé.");
            error.code = "CREDIT_ALREADY_PAID";
            throw error;
        }

        if (requirePresence) {
            await assertMemberPresentForOperation(
                seance_id,
                context.membre_id,
                connection
            );
        }

        const [totals] = await connection.query(
            `SELECT
                COALESCE(SUM(montant_principal), 0) AS principal_rembourse,
                COALESCE(SUM(montant_interet), 0) AS interet_rembourse
             FROM remboursements
             WHERE credit_id = ?`,
            [credit_id]
        );
        const [creditAmounts] = await connection.query(
            `SELECT montant_capital, montant_interet
             FROM credits
             WHERE id = ?`,
            [credit_id]
        );
        const principalRemaining = Number(creditAmounts[0].montant_capital) -
            Number(totals[0].principal_rembourse);
        const interestRemaining = Number(creditAmounts[0].montant_interet) -
            Number(totals[0].interet_rembourse);
        if (
            Number(montant_principal) > principalRemaining ||
            Number(montant_interet) > interestRemaining
        ) {
            const error = new Error(
                "Le remboursement dépasse le capital ou les intérêts restant à payer."
            );
            error.code = "REPAYMENT_EXCEEDS_BALANCE";
            throw error;
        }

        const montant = Number(montant_principal) + Number(montant_interet);
        const sql = `
            INSERT INTO remboursements (
                credit_id,
                cycle_id,
                seance_id,
                membre_id,
                date_remboursement,
                montant_principal,
                montant_interet,
                montant,
                observation
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await connection.query(sql, [
            context.credit_id,
            context.cycle_id,
            context.seance_id,
            context.membre_id,
            context.date_seance,
            montant_principal,
            montant_interet,
            montant,
            observation
        ]);

        return Remboursement.findById(result.insertId, connection);
    }

    static async createMany(seance_id, entries) {
        const connection = await promisePool.getConnection();
        let transactionStarted = false;
        try {
            await connection.beginTransaction();
            transactionStarted = true;
            const saved = [];
            for (const entry of [...entries].sort((a, b) => a.credit_id - b.credit_id)) {
                const [existing] = await connection.query(
                    "SELECT 1 FROM remboursements WHERE seance_id = ? AND credit_id = ? LIMIT 1",
                    [seance_id, entry.credit_id]
                );
                if (existing.length) {
                    const error = new Error(
                        `Un remboursement est déjà enregistré pour le crédit n° ${entry.credit_id} dans cette séance.`
                    );
                    error.code = "REPAYMENT_EXISTS_IN_SESSION";
                    throw error;
                }
                saved.push(await Remboursement.create({
                    ...entry,
                    seance_id
                }, connection, true));
            }
            await connection.commit();
            transactionStarted = false;
            return saved;
        } catch (error) {
            if (transactionStarted) {
                await connection.rollback();
            }
            throw error;
        } finally {
            connection.release();
        }
    }


    static async findAll(filters = {}) {
        let sql = `
            SELECT
                r.id,
                r.credit_id,
                r.cycle_id,
                r.seance_id,
                r.membre_id,
                r.date_remboursement,
                r.montant_principal,
                r.montant_interet,
                r.montant,
                r.observation,
                r.created_at,

                cr.montant_capital,
                cr.montant_total AS credit_total,
                cr.date_echeance,
                cr.statut AS credit_statut,

                m.numero_membre,
                m.nom AS membre_nom,
                m.prenom AS membre_prenom,

                s.numero_seance,

                c.numero_cycle,

                v.code AS voamami_code,
                v.nom AS voamami_nom

            FROM remboursements r
            INNER JOIN credits cr
                ON cr.id = r.credit_id
            INNER JOIN membres m
                ON m.id = r.membre_id
            INNER JOIN seances s
                ON s.id = r.seance_id
            INNER JOIN cycles c
                ON c.id = r.cycle_id
            INNER JOIN voamami v
                ON v.id = c.voamami_id
        `;

        const conditions = [];
        const params = [];

        if (filters.credit_id) {
            conditions.push("r.credit_id = ?");
            params.push(filters.credit_id);
        }

        if (filters.cycle_id) {
            conditions.push("r.cycle_id = ?");
            params.push(filters.cycle_id);
        }

        if (filters.seance_id) {
            conditions.push("r.seance_id = ?");
            params.push(filters.seance_id);
        }

        if (filters.membre_id) {
            conditions.push("r.membre_id = ?");
            params.push(filters.membre_id);
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
                r.date_remboursement DESC,
                r.id DESC
        `;

        const [rows] =
            await promisePool.query(sql, params);

        return rows;
    }

    static async findById(id, connection = promisePool, user) {
        let sql = `
            SELECT
                r.*,

                cr.montant_capital,
                cr.montant_total AS credit_total,
                cr.date_echeance,
                cr.statut AS credit_statut,

                m.numero_membre,
                m.nom AS membre_nom,
                m.prenom AS membre_prenom,

                s.numero_seance,

                c.numero_cycle,

                v.code AS voamami_code,
                v.nom AS voamami_nom

            FROM remboursements r
            INNER JOIN credits cr
                ON cr.id = r.credit_id
            INNER JOIN membres m
                ON m.id = r.membre_id
            INNER JOIN seances s
                ON s.id = r.seance_id
            INNER JOIN cycles c
                ON c.id = r.cycle_id
            INNER JOIN voamami v
                ON v.id = c.voamami_id
            WHERE r.id = ?
        `;

        const params = [id];
        if (user?.role === "AGENT_FID") {
            sql += " AND v.agent_responsable_id = ?";
            params.push(user.id);
        }
        const [rows] =
            await connection.query(sql, params);

        return rows[0] || null;
    }
}

module.exports = Remboursement;
