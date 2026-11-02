const { promisePool } = require("../config/db.js");

async function assertMemberPresentForOperation(
    seanceId,
    membreId,
    connection = promisePool
) {
    const [rows] = await connection.query(
        `SELECT 1
         FROM presences
         WHERE seance_id = ? AND membre_id = ? AND statut <> 'PRESENT'
         LIMIT 1`,
        [seanceId, membreId]
    );

    if (rows.length) {
        const error = new Error(
            "Un membre absent ou excusé ne peut pas être sélectionné pour cette opération."
        );
        error.code = "MEMBRE_ABSENT";
        throw error;
    }
}

module.exports = { assertMemberPresentForOperation };
