const { promisePool } = require("../config/db.js");

class Utilisateur {

    // Creer un nouvel utilisateur
    static async create(data) {
        const {
            nom,
            prenom,
            email,
            mot_de_passe,
            role = "AGENT_FID",
            actif = true,
        } = data;
        const sql = 'INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, actif) VALUES (?, ?, ?, ?, ?, ?)';
        const [result] = await promisePool.query(sql, [
            nom,
            prenom,
            email,
            mot_de_passe,
            role,
            actif
        ]);
        return result.insertId;
    }

    // Trouver un utilisateur par son email
    static async findByEmail(email) {
        const [rows] = await promisePool.query(
            'SELECT id, nom, prenom, email, mot_de_passe, role, actif FROM utilisateurs WHERE email = ?',
            [email]
        );
        return rows[0] || null;
    }

    // Trouver un utilisateur par son ID
    static async findById(id) {
        const [rows] = await promisePool.query(
            'SELECT id, nom, prenom, email, mot_de_passe, role, actif FROM utilisateurs WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    // Mettre à jour un utilisateur
    static async update(id, data) {
        const {
            nom,
            prenom,
            email,
            mot_de_passe,
            role,
            actif
        } = data;
        const [result] = await promisePool.query(
            'UPDATE utilisateurs SET nom = ?, prenom = ?, email = ?, mot_de_passe = ?, role = ?, actif = ? WHERE id = ?',
            [nom, prenom, email, mot_de_passe, role, actif, id]
        );
        return result.affectedRows > 0;
    }

    // Modifier le mot de passe d'un utilisateur
    static async updatePassword(id, motDePasseHash) {
        const [result] = await promisePool.query(
            'UPDATE utilisateurs SET mot_de_passe = ? WHERE id = ?',
            [motDePasseHash, id]
        );
        return result.affectedRows > 0;
    }

    // Supprimer un utilisateur
    static async delete(id) {
        const [result] = await promisePool.query(
            'DELETE FROM utilisateurs WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

}

module.exports = Utilisateur;   