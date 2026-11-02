const {
    promisePool
} = require("../config/db.js");

class Voamami {
    /**
     * Créer un groupe VOAMAMI
     */
    static async create(data) {
        const {
            code,
            nom,
            fokontany = null,
            commune = null,
            district = null,
            region = null,
            date_creation,
            statut = "ACTIF",
            agent_responsable_id = null
        } = data;

        let sql = `
            INSERT INTO voamami (
                code,
                nom,
                fokontany,
                commune,
                district,
                region,
                date_creation,
                statut,
                agent_responsable_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] =
            await promisePool.query(sql, [
                code,
                nom,
                fokontany,
                commune,
                district,
                region,
                date_creation,
                statut,
                agent_responsable_id
            ]);

        return {
            id: result.insertId,
            code,
            nom,
            fokontany,
            commune,
            district,
            region,
            date_creation,
            statut,
            agent_responsable_id
        };
    }

    /**
     * Modifier un groupe VOAMAMI
     */
    static async update(id, data) {
        const {
            code,
            nom,
            fokontany = null,
            commune = null,
            district = null,
            region = null,
            date_creation,
            statut = "ACTIF",
            agent_responsable_id = null
        } = data;

        const sql = `
            UPDATE voamami
            SET
                code = ?,
                nom = ?,
                fokontany = ?,
                commune = ?,
                district = ?,
                region = ?,
                date_creation = ?,
                statut = ?,
                agent_responsable_id = ?
            WHERE id = ?
        `;

        const [result] =
            await promisePool.query(sql, [
                code,
                nom,
                fokontany,
                commune,
                district,
                region,
                date_creation,
                statut,
                agent_responsable_id,
                id
            ]);

        return result.affectedRows > 0;
    }

    /**
     * Supprimer un groupe VOAMAMI
     */
    static async delete(id) {
        const sql = `
            DELETE FROM voamami
            WHERE id = ?
        `;

        const [result] =
            await promisePool.query(sql, [id]);

        return result.affectedRows > 0;
    }

    /**
     * Récupérer un VOAMAMI par son identifiant
     *
     * La jointure permet d'afficher le nom
     * de l'agent responsable.
     */
    static async findById(id, user) {
        let sql = `
            SELECT
                v.id,
                v.code,
                v.nom,
                v.fokontany,
                v.commune,
                v.district,
                v.region,
                v.date_creation,
                v.statut,
                v.agent_responsable_id,
                v.created_at,
                v.updated_at,

                u.nom AS agent_nom,
                u.prenom AS agent_prenom,
                u.email AS agent_email,

                NULLIF(
                    TRIM(
                        CONCAT(
                            COALESCE(u.nom, ''),
                            ' ',
                            COALESCE(u.prenom, '')
                        )
                    ),
                    ''
                ) AS agent_responsable_nom

            FROM voamami v

            LEFT JOIN utilisateurs u
                ON u.id = v.agent_responsable_id

            WHERE v.id = ?
        `;

        const params = [id];
        if (user?.role === "AGENT_FID") {
            sql += " AND v.agent_responsable_id = ?";
            params.push(user.id);
        }

        const [rows] =
            await promisePool.query(sql, params);

        return rows[0] || null;
    }

    /**
     * Récupérer tous les VOAMAMI
     *
     * LEFT JOIN conserve les VOAMAMI
     * qui n'ont aucun agent affecté.
     */
    static async findAll(user) {
        let sql = `
            SELECT
                v.id,
                v.code,
                v.nom,
                v.fokontany,
                v.commune,
                v.district,
                v.region,
                v.date_creation,
                v.statut,
                v.agent_responsable_id,
                v.created_at,
                v.updated_at,

                u.nom AS agent_nom,
                u.prenom AS agent_prenom,
                u.email AS agent_email,

                NULLIF(
                    TRIM(
                        CONCAT(
                            COALESCE(u.nom, ''),
                            ' ',
                            COALESCE(u.prenom, '')
                        )
                    ),
                    ''
                ) AS agent_responsable_nom

            FROM voamami v

            LEFT JOIN utilisateurs u
                ON u.id = v.agent_responsable_id
        `;

        const params = [];
        if (user?.role === "AGENT_FID") {
            sql += " WHERE v.agent_responsable_id = ?";
            params.push(user.id);
        }
        sql += " ORDER BY v.id DESC";

        const [rows] =
            await promisePool.query(sql, params);

        return rows;
    }

    /**
     * Rechercher un VOAMAMI par son code
     */
    static async findByCode(code) {
        const sql = `
            SELECT
                v.id,
                v.code,
                v.nom,
                v.fokontany,
                v.commune,
                v.district,
                v.region,
                v.date_creation,
                v.statut,
                v.agent_responsable_id
            FROM voamami v
            WHERE v.code = ?
            LIMIT 1
        `;

        const [rows] =
            await promisePool.query(sql, [code]);

        return rows[0] || null;
    }

    /**
     * Vérifier si un code existe déjà
     *
     * excludeId est utilisé lors d'une modification
     * afin d'ignorer le VOAMAMI actuellement modifié.
     */
    static async codeExists(
        code,
        excludeId = null
    ) {
        let sql = `
            SELECT id
            FROM voamami
            WHERE code = ?
        `;

        const params = [code];

        if (excludeId !== null) {
            sql += `
                AND id <> ?
            `;

            params.push(excludeId);
        }

        sql += `
            LIMIT 1
        `;

        const [rows] =
            await promisePool.query(
                sql,
                params
            );

        return rows.length > 0;
    }
}

module.exports = Voamami;
