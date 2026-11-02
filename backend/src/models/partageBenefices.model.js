const { promisePool } = require("../config/db.js");

class PartageBenefices {
    static async findByCycle(cycleId) {
        const [rows] = await promisePool.query(
            `
            SELECT
                p.*,
                m.numero_membre,
                m.nom,
                m.prenom,
                m.role_bureau
            FROM partage_benefices p
            INNER JOIN membres m ON m.id = p.membre_id
            WHERE p.cycle_id = ?
            ORDER BY m.numero_membre ASC
            `,
            [cycleId]
        );

        return rows;
    }

    static async findByMember(cycleId, membreId) {
        const [rows] = await promisePool.query(
            `
            SELECT p.*, m.numero_membre, m.nom, m.prenom
            FROM partage_benefices p
            INNER JOIN membres m ON m.id = p.membre_id
            WHERE p.cycle_id = ? AND p.membre_id = ?
            `,
            [cycleId, membreId]
        );

        return rows[0] || null;
    }
}

module.exports = PartageBenefices;