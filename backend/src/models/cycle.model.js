const { promisePool } = require('../config/db.js');

class Cycle {
    //creer un nouveau cycle
    static async create(data) {
        const {

            voamami_id,
            numero_cycle,
            date_debut,
            date_fin_prevue,
            date_cloture,
            statut = "PREPARATION",
            montant_part_epargne,
            montant_penalite,
            taux_interet,
            duree_credit_mois
        } = data;

        const sql = 'INSERT INTO cycles (voamami_id, numero_cycle, date_debut, date_fin_prevue, date_cloture, statut, montant_part_epargne, montant_penalite, taux_interet, duree_credit_mois) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

        const [result] = await promisePool.query(sql, [

            voamami_id,
            numero_cycle,
            date_debut,
            date_fin_prevue,
            date_cloture,
            statut,
            montant_part_epargne,
            montant_penalite,
            taux_interet,
            duree_credit_mois
        ]);

        return {
            id: result.insertId,
            voamami_id,
            numero_cycle,
            date_debut,
            date_fin_prevue,
            date_cloture,
            statut,
            montant_part_epargne,
            montant_penalite,
            taux_interet,
            duree_credit_mois
        };

    }

    //Mettre a jour un cycle existant
    static async update(id,data) {
        const {

            voamami_id,
            numero_cycle,
            date_debut,
            date_fin_prevue,
            date_cloture,
            statut,
            montant_part_epargne,
            montant_penalite,
            taux_interet,
            duree_credit_mois
        } = data;

        const sql = 'UPDATE cycles SET voamami_id = ?, numero_cycle = ?, date_debut = ?, date_fin_prevue = ?, date_cloture = ?, statut = ?, montant_part_epargne = ?, montant_penalite = ?, taux_interet = ?, duree_credit_mois = ? WHERE id = ?';

        const [result] = await promisePool.query(sql, [
            voamami_id,
            numero_cycle,
            date_debut,
            date_fin_prevue,
            date_cloture,
            statut,
            montant_part_epargne,
            montant_penalite,
            taux_interet,
            duree_credit_mois,
            id
        ]);

        return result.affectedRows;
    }

    //Supprimer un cycle
    static async delete(id) {
        const sql = 'DELETE FROM cycles WHERE id = ?';
        const [result] = await promisePool.query(sql, [id]);
        return result.affectedRows;
    }

    //Récupérer un cycle par son ID
    static async findById(id, user) {
      let sql = `
        SELECT
            c.id,
            c.voamami_id,
            c.numero_cycle,
            c.date_debut,
            c.date_fin_prevue,
            c.date_cloture,
            c.statut,
            c.montant_part_epargne,
            c.montant_penalite,
            c.taux_interet,
            c.duree_credit_mois,
            c.created_at,
            c.updated_at,

            v.code AS voamami_code,
            v.nom AS voamami_nom

        FROM cycles c
        INNER JOIN voamami v
            ON v.id = c.voamami_id

        WHERE c.id = ?
    `;

    const params = [id];
    if (user?.role === "AGENT_FID") {
        sql += " AND v.agent_responsable_id = ?";
        params.push(user.id);
    }
    const [rows] = await promisePool.query(sql, params);

    return rows[0] || null;
    }

    //Récupérer tous les cycles
    static async findAll(user) {
    let sql = `
        SELECT
            c.id,
            c.voamami_id,
            c.numero_cycle,
            c.date_debut,
            c.date_fin_prevue,
            c.date_cloture,
            c.statut,
            c.montant_part_epargne,
            c.montant_penalite,
            c.taux_interet,
            c.duree_credit_mois,
            c.created_at,
            c.updated_at,

            v.code AS voamami_code,
            v.nom AS voamami_nom

        FROM cycles c
        INNER JOIN voamami v
            ON v.id = c.voamami_id

    `;

    const params = [];
    if (user?.role === "AGENT_FID") {
        sql += " WHERE v.agent_responsable_id = ?";
        params.push(user.id);
    }
    sql += " ORDER BY c.id DESC";
    const [rows] = await promisePool.query(sql, params);

    return rows;
}

    static async cloturer(id) {
    const connection = await promisePool.getConnection();

    try {
        await connection.beginTransaction();

        // La procédure SQL effectue toutes les vérifications métier.
        await connection.query(
            "CALL cloturer_cycle(?)",
            [id]
        );

        const [cycleRows] = await connection.query(
            `
            SELECT
                c.*,
                v.code AS voamami_code,
                v.nom AS voamami_nom
            FROM cycles c
            INNER JOIN voamami v ON v.id = c.voamami_id
            WHERE c.id = ?
            `,
            [id]
        );

        if (!cycleRows[0]) {
            throw new Error("Cycle introuvable après clôture.");
        }

        const [partageRows] = await connection.query(
            `
            SELECT
                p.*,
                m.numero_membre,
                m.nom,
                m.prenom
            FROM partage_benefices p
            INNER JOIN membres m ON m.id = p.membre_id
            WHERE p.cycle_id = ?
            ORDER BY m.numero_membre
            `,
            [id]
        );

        await connection.commit();

        return {
            cycle: cycleRows[0],
            partage: partageRows
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}


}

module.exports = Cycle;
