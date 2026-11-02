const { promisePool } = require("../config/db.js");

class Agr {
    // Creer nouveau AGR
    static async create(data) {
        const {

            libelle,
            description = null,
            actif = true
        } = data;

        const sql = 'INSERT INTO agr (libelle, description, actif) VALUES (?, ?, ?)';

        const [result] = await promisePool.query(sql, [

            libelle,
            description,

            actif
        ]);

        return {

            libelle,
            description,

            actif
        };
    }

    //Mise a jour
    static async update(id,data) {
        const {
            libelle,
            description = null,

            actif = true
        } = data;

        const sql = 'UPDATE agr SET libelle = ?, description = ?, actif = ? WHERE id = ?';

        const [result] = await promisePool.query(sql, [
            libelle,
            description,

            actif,
            id
        ]);

        return result.affectedRows > 0;
    }

    //Suppression
    static async delete(id) {
        const sql = 'DELETE FROM agr WHERE id = ?';
        const [result] = await promisePool.query(sql, [id]);
        return result.affectedRows > 0;
    }

    static async findAll() {
        const sql = `
            SELECT
                id,
                libelle,
                description,
                actif
            FROM agr
            ORDER BY id DESC
        `;

        const [rows] =
            await promisePool.query(sql);

        return rows;
    }

    static async findById(id) {
        const sql = `
            SELECT
                id,
                libelle,
                description,
                actif
            FROM agr
            WHERE id = ?
        `;

        const [rows] =
            await promisePool.query(sql, [id]);

        return rows[0] || null;
    }
}

module.exports = Agr;