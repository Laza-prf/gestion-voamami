const {
    promisePool
} = require("../config/db.js");
const {
    assertMemberPresentForOperation
} = require("../utils/presence-operation.util.js");

class Epargne {
static async create(data, connection = promisePool) {
    const {
        seance_id,
        membre_id,
        nombre_parts
    } = data;

    const contextSql = `
        SELECT
            s.id AS seance_id,
            s.cycle_id,
            s.date_seance,
            s.statut AS seance_statut,
            c.statut AS cycle_statut,
            m.id AS membre_id,
            m.voamami_id AS membre_voamami_id,
            m.cycle_actif_id,
            m.actif,
            c.voamami_id AS cycle_voamami_id
        FROM seances s
        INNER JOIN cycles c
            ON c.id = s.cycle_id
        INNER JOIN membres m
            ON m.id = ?
        WHERE s.id = ?
    `;

    const [rows] =
        await connection.query(
            contextSql,
            [
                membre_id,
                seance_id
            ]
        );

    const context = rows[0];

    if (!context) {
        const error = new Error(
            "La séance ou le membre n'existe pas."
        );

        error.code = "CONTEXT_NOT_FOUND";
        throw error;
    }

    if (
        context.seance_statut !==
        "OUVERTE"
    ) {
        const error = new Error(
            "La séance est déjà clôturée."
        );

        error.code = "SEANCE_CLOSED";
        throw error;
    }

    if (
        context.cycle_statut !==
        "OUVERT"
    ) {
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
        Number(
            context.membre_voamami_id
        ) !== Number(
            context.cycle_voamami_id
        )
    ) {
        const error = new Error(
            "Le membre n'appartient pas au VOAMAMI du cycle."
        );

        error.code = "MEMBRE_WRONG_VOAMAMI";
        throw error;
    }

    if (
        Number(
            context.cycle_actif_id
        ) !== Number(
            context.cycle_id
        )
    ) {
        const error = new Error(
            "Le membre n'est pas affecté au cycle actif."
        );

        error.code = "MEMBRE_WRONG_CYCLE";
        throw error;
    }

    await assertMemberPresentForOperation(seance_id, membre_id, connection);

    const sql = `
        INSERT INTO epargnes (
            cycle_id,
            seance_id,
            membre_id,
            nombre_parts,
            montant_part,
            montant_total,
            date_epargne
        )
        VALUES (?, ?, ?, ?, 0, 0, ?)
    `;

    const [result] =
        await connection.query(sql, [
            context.cycle_id,
            context.seance_id,
            membre_id,
            nombre_parts,
            context.date_seance
        ]);

    return Epargne.findById(result.insertId, connection);
}

static async createMany(seance_id, entries) {
    const connection = await promisePool.getConnection();
    let transactionStarted = false;
    try {
        await connection.beginTransaction();
        transactionStarted = true;
        const saved = [];
        for (const entry of entries) {
            const [existing] = await connection.query(
                "SELECT 1 FROM epargnes WHERE seance_id = ? AND membre_id = ? LIMIT 1",
                [seance_id, entry.membre_id]
            );
            if (existing.length) {
                const error = new Error(
                    `Une épargne est déjà enregistrée pour le membre n° ${entry.membre_id} dans cette séance.`
                );
                error.code = "EPARGNE_EXISTS";
                throw error;
            }
            saved.push(await Epargne.create({
                seance_id,
                membre_id: entry.membre_id,
                nombre_parts: entry.nombre_parts
            }, connection));
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
                e.id,
                e.cycle_id,
                e.seance_id,
                e.membre_id,
                e.nombre_parts,
                e.montant_part,
                e.montant_total,
                e.date_epargne,
                e.created_at,

                m.numero_membre,
                m.nom AS membre_nom,
                m.prenom AS membre_prenom,

                s.numero_seance,
                s.date_seance,

                c.numero_cycle,

                v.code AS voamami_code,
                v.nom AS voamami_nom

            FROM epargnes e
            INNER JOIN membres m
                ON m.id = e.membre_id
            INNER JOIN seances s
                ON s.id = e.seance_id
            INNER JOIN cycles c
                ON c.id = e.cycle_id
            INNER JOIN voamami v
                ON v.id = c.voamami_id
        `;

        const conditions = [];
        const params = [];

        if (filters.cycle_id) {
            conditions.push("e.cycle_id = ?");
            params.push(filters.cycle_id);
        }

        if (filters.seance_id) {
            conditions.push("e.seance_id = ?");
            params.push(filters.seance_id);
        }

        if (filters.membre_id) {
            conditions.push("e.membre_id = ?");
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
            ORDER BY e.date_epargne DESC, e.id DESC
        `;

        const [rows] =
            await promisePool.query(sql, params);

        return rows;
    }

    static async findById(id, connection = promisePool, user) {
        let sql = `
            SELECT
                e.*,

                m.numero_membre,
                m.nom AS membre_nom,
                m.prenom AS membre_prenom,

                s.numero_seance,
                s.date_seance,

                c.numero_cycle,

                v.code AS voamami_code,
                v.nom AS voamami_nom

            FROM epargnes e
            INNER JOIN membres m
                ON m.id = e.membre_id
            INNER JOIN seances s
                ON s.id = e.seance_id
            INNER JOIN cycles c
                ON c.id = e.cycle_id
            INNER JOIN voamami v
                ON v.id = c.voamami_id
            WHERE e.id = ?
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

    static async delete(id) {
        const [result] =
            await promisePool.query(
                "DELETE FROM epargnes WHERE id = ?",
                [id]
            );

        return result.affectedRows > 0;
    }
}

module.exports = Epargne;
