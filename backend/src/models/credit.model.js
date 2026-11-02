const {
    promisePool
} = require("../config/db.js");
const {
    assertMemberPresentForOperation
} = require("../utils/presence-operation.util.js");

class Credit {
    /**
     * Créer un crédit à partir d'une séance.
     *
     * Le frontend envoie uniquement :
     * - seance_id
     * - membre_id
     * - agr_id
     * - montant_capital
     * - observation
     *
     * Le cycle et la date du crédit sont récupérés
     * automatiquement depuis la séance.
     * Les montants calculés sont ensuite complétés
     * par trg_credit_before_insert.
     */
    static async create(data, user) {
        const {
            seance_id,
            membre_id,
            agr_id = null,
            montant_capital,
            observation = null
        } = data;

        const contextSql = `
            SELECT
                s.id AS seance_id,
                s.cycle_id,
                s.date_seance,
                s.statut AS seance_statut,

                cy.statut AS cycle_statut,
                cy.voamami_id AS cycle_voamami_id,
                v.agent_responsable_id,

                m.id AS membre_id,
                m.voamami_id AS membre_voamami_id,
                m.cycle_actif_id,
                m.actif

            FROM seances s
            INNER JOIN cycles cy
                ON cy.id = s.cycle_id
            INNER JOIN voamami v
                ON v.id = cy.voamami_id
            INNER JOIN membres m
                ON m.id = ?
            WHERE s.id = ?
        `;

        const [rows] = await promisePool.query(
            contextSql,
            [membre_id, seance_id]
        );

        const context = rows[0];

        if (!context) {
            const error = new Error(
                "La séance ou le membre est introuvable."
            );
            error.code = "CONTEXT_NOT_FOUND";
            throw error;
        }

        if (
            user?.role === "AGENT_FID" &&
            Number(context.agent_responsable_id) !== Number(user.id)
        ) {
            const error = new Error("Vous ne pouvez pas gérer les crédits de ce VOAMAMI.");
            error.code = "ACCESS_DENIED";
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
                "Le cycle doit être ouvert."
            );
            error.code = "CYCLE_NOT_OPEN";
            throw error;
        }

        if (!context.actif) {
            const error = new Error(
                "Le membre est inactif."
            );
            error.code = "MEMBRE_INACTIF";
            throw error;
        }

        if (
            Number(context.cycle_voamami_id) !==
            Number(context.membre_voamami_id)
        ) {
            const error = new Error(
                "Le membre n'appartient pas au VOAMAMI du cycle."
            );
            error.code = "MEMBRE_WRONG_VOAMAMI";
            throw error;
        }

        if (
            Number(context.cycle_actif_id) !==
            Number(context.cycle_id)
        ) {
            const error = new Error(
                "Le membre n'est pas affecté au cycle actif."
            );
            error.code = "MEMBRE_WRONG_CYCLE";
            throw error;
        }

        await assertMemberPresentForOperation(seance_id, membre_id);

        const capital = Number(montant_capital);

        if (!Number.isFinite(capital) || capital <= 0) {
            const error = new Error(
                "Le montant du capital doit être supérieur à zéro."
            );
            error.code = "INVALID_CAPITAL";
            throw error;
        }

        /*
         * Les valeurs 0 seront remplacées par le trigger BEFORE INSERT :
         * taux_interet, montant_interet, montant_total et date_echeance.
         * date_echeance reçoit une valeur provisoire non nulle car la
         * colonne est NOT NULL.
         */
        const insertSql = `
            INSERT INTO credits (
                cycle_id,
                seance_id,
                membre_id,
                agr_id,
                date_credit,
                montant_capital,
                taux_interet,
                montant_interet,
                montant_total,
                date_echeance,
                statut,
                observation
            )
            VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, 'EN_COURS', ?)
        `;

        const [result] = await promisePool.query(
            insertSql,
            [
                context.cycle_id,
                context.seance_id,
                context.membre_id,
                agr_id,
                context.date_seance,
                capital,
                context.date_seance,
                observation
            ]
        );

        return Credit.findById(result.insertId, user);
    }

    static async findAll(filters = {}) {
        let sql = `
            SELECT
                c.id,
                c.cycle_id,
                c.seance_id,
                c.membre_id,
                c.agr_id,
                c.date_credit,
                c.montant_capital,
                c.taux_interet,
                c.montant_interet,
                c.montant_total,
                c.date_echeance,
                c.statut,
                c.observation,
                c.created_at,

                m.numero_membre,
                m.nom AS membre_nom,
                m.prenom AS membre_prenom,

                s.numero_seance,
                s.date_seance,

                cy.numero_cycle,

                v.code AS voamami_code,
                v.nom AS voamami_nom,

                a.libelle AS agr_libelle,

                COALESCE(
                    (
                        SELECT SUM(r.montant_principal)
                        FROM remboursements r
                        WHERE r.credit_id = c.id
                    ),
                    0
                ) AS principal_rembourse,

                COALESCE(
                    (
                        SELECT SUM(r.montant_interet)
                        FROM remboursements r
                        WHERE r.credit_id = c.id
                    ),
                    0
                ) AS interet_rembourse

            FROM credits c
            INNER JOIN membres m
                ON m.id = c.membre_id
            INNER JOIN seances s
                ON s.id = c.seance_id
            INNER JOIN cycles cy
                ON cy.id = c.cycle_id
            INNER JOIN voamami v
                ON v.id = cy.voamami_id
            LEFT JOIN agr a
                ON a.id = c.agr_id
        `;

        const conditions = [];
        const params = [];

        if (filters.cycle_id) {
            conditions.push("c.cycle_id = ?");
            params.push(filters.cycle_id);
        }

        if (filters.seance_id) {
            conditions.push("c.seance_id = ?");
            params.push(filters.seance_id);
        }

        if (filters.membre_id) {
            conditions.push("c.membre_id = ?");
            params.push(filters.membre_id);
        }

        if (filters.statut) {
            conditions.push("c.statut = ?");
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
            ORDER BY c.date_credit DESC, c.id DESC
        `;

        const [rows] = await promisePool.query(
            sql,
            params
        );

        return rows.map((credit) => {
            const principalRembourse = Number(
                credit.principal_rembourse || 0
            );

            const interetRembourse = Number(
                credit.interet_rembourse || 0
            );

            const montantTotal = Number(
                credit.montant_total || 0
            );

            return {
                ...credit,
                principal_rembourse: principalRembourse,
                interet_rembourse: interetRembourse,
                total_rembourse:
                    principalRembourse + interetRembourse,
                reste_a_payer: Math.max(
                    0,
                    montantTotal -
                        principalRembourse -
                        interetRembourse
                )
            };
        });
    }

    static async findById(id, user) {
        const credits = await Credit.findAll({ user });

        return (
            credits.find(
                (credit) => Number(credit.id) === Number(id)
            ) || null
        );
    }
}

module.exports = Credit;
