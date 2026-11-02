const {
    promisePool
} = require("../config/db.js");

class Membre {
    /**
     * Créer un membre
     */
    static async create(data) {
        const {
            voamami_id,
            numero_membre,
            nom,
            prenom = null,
            sexe = null,
            date_naissance = null,
            telephone = null,
            adresse = null,
            profession = null,
            role_bureau = "MEMBRE",
            cycle_actif_id = null,
            solde_epargne = 0,
            actif = true
        } = data;

        const sql = `
            INSERT INTO membres (
                voamami_id,
                numero_membre,
                nom,
                prenom,
                sexe,
                date_naissance,
                telephone,
                adresse,
                profession,
                role_bureau,
                cycle_actif_id,
                solde_epargne,
                actif
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] =
            await promisePool.query(sql, [
                voamami_id,
                numero_membre,
                nom,
                prenom,
                sexe,
                date_naissance,
                telephone,
                adresse,
                profession,
                role_bureau,
                cycle_actif_id,
                solde_epargne,
                actif
            ]);

        return {
            id: result.insertId,
            voamami_id,
            numero_membre,
            nom,
            prenom,
            sexe,
            date_naissance,
            telephone,
            adresse,
            profession,
            role_bureau,
            cycle_actif_id,
            solde_epargne,
            actif
        };
    }

    /**
     * Modifier un membre
     */
    static async update(id, data) {
        const {
            voamami_id,
            numero_membre,
            nom,
            prenom = null,
            sexe = null,
            date_naissance = null,
            telephone = null,
            adresse = null,
            profession = null,
            role_bureau = "MEMBRE",
            cycle_actif_id = null,
            solde_epargne = 0,
            actif = true
        } = data;

        const sql = `
            UPDATE membres
            SET
                voamami_id = ?,
                numero_membre = ?,
                nom = ?,
                prenom = ?,
                sexe = ?,
                date_naissance = ?,
                telephone = ?,
                adresse = ?,
                profession = ?,
                role_bureau = ?,
                cycle_actif_id = ?,
                solde_epargne = ?,
                actif = ?
            WHERE id = ?
        `;

        const [result] =
            await promisePool.query(sql, [
                voamami_id,
                numero_membre,
                nom,
                prenom,
                sexe,
                date_naissance,
                telephone,
                adresse,
                profession,
                role_bureau,
                cycle_actif_id,
                solde_epargne,
                actif,
                id
            ]);

        return result.affectedRows > 0;
    }

    /**
     * Supprimer un membre
     */
    static async delete(id) {
        const sql = `
            DELETE FROM membres
            WHERE id = ?
        `;

        const [result] =
            await promisePool.query(sql, [id]);

        return result.affectedRows > 0;
    }

    /**
     * Récupérer un membre par son identifiant
     *
     * La jointure permet de retourner :
     * - voamami_code
     * - voamami_nom
     * - numero_cycle
     * - cycle_statut
     */
    static async findById(id, user) {
        const sql = `
            SELECT
                m.id,
                m.voamami_id,
                m.numero_membre,
                m.nom,
                m.prenom,
                m.sexe,
                m.date_naissance,
                m.telephone,
                m.adresse,
                m.profession,
                m.role_bureau,
                m.cycle_actif_id,
                m.solde_epargne,
                m.actif,
                m.created_at,
                m.updated_at,

                v.code AS voamami_code,
                v.nom AS voamami_nom,

                c.numero_cycle,
                c.statut AS cycle_statut

            FROM membres m

            INNER JOIN voamami v
                ON v.id = m.voamami_id

            LEFT JOIN cycles c
                ON c.id = m.cycle_actif_id

            WHERE m.id = ?
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
     * Récupérer tous les membres
     */
    static async findAll(user) {
        let sql = `
            SELECT
                m.id,
                m.voamami_id,
                m.numero_membre,
                m.nom,
                m.prenom,
                m.sexe,
                m.date_naissance,
                m.telephone,
                m.adresse,
                m.profession,
                m.role_bureau,
                m.cycle_actif_id,
                m.solde_epargne,
                m.actif,
                m.created_at,
                m.updated_at,

                v.code AS voamami_code,
                v.nom AS voamami_nom,

                c.numero_cycle,
                c.statut AS cycle_statut

            FROM membres m

            INNER JOIN voamami v
                ON v.id = m.voamami_id

            LEFT JOIN cycles c
                ON c.id = m.cycle_actif_id

        `;

        const params = [];
        if (user?.role === "AGENT_FID") {
            sql += " WHERE v.agent_responsable_id = ?";
            params.push(user.id);
        }
        sql += " ORDER BY m.numero_membre ASC, m.id ASC";
        const [rows] =
            await promisePool.query(sql, params);

        return rows;
    }

    /**
     * Rechercher par nom ou prénom
     */
    static async findByName(search) {
        const sql = `
            SELECT
                m.*,
                v.code AS voamami_code,
                v.nom AS voamami_nom,
                c.numero_cycle,
                c.statut AS cycle_statut

            FROM membres m

            INNER JOIN voamami v
                ON v.id = m.voamami_id

            LEFT JOIN cycles c
                ON c.id = m.cycle_actif_id

            WHERE m.nom ILIKE ?
               OR m.prenom ILIKE ?

            ORDER BY m.nom, m.prenom
        `;

        const [rows] =
            await promisePool.query(sql, [
                `%${search}%`,
                `%${search}%`
            ]);

        return rows;
    }
}

module.exports = Membre;
