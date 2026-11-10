const { promisePool } = require("../config/db.js");

function roleFilter(user, alias = "v") {
    if (user?.role === "AGENT_FID") {
        return { sql: ` AND ${alias}.agent_responsable_id = $1`, params: [user.id] };
    }
    return { sql: "", params: [] };
}

class CaisseSociale {
    static async findAll(user) {
        const f = roleFilter(user, "v");
        const result = await promisePool.query(
            `SELECT s.*, v.code AS voamami_code, v.nom AS voamami_nom
             FROM v_caisse_sociale_synthese s
             JOIN voamami v ON v.id = s.voamami_id
             WHERE 1=1 ${f.sql}
             ORDER BY v.nom`,
            f.params
        );
        return result.rows;
    }

    static async findByVoamami(voamamiId, user) {
        const f = roleFilter(user, "v");
        const result = await promisePool.query(
            `SELECT s.*, v.code AS voamami_code, v.nom AS voamami_nom
             FROM v_caisse_sociale_synthese s
             JOIN voamami v ON v.id = s.voamami_id
             WHERE s.voamami_id = $${f.params.length + 1} ${f.sql}`,
            [voamamiId, ...f.params]
        );
        return result.rows[0] || null;
    }

    static async cotisations({ voamamiId, membreId, mois, user }) {
        const conditions = ["c.voamami_id = $1"];
        const params = [voamamiId];
        if (membreId) { params.push(membreId); conditions.push(`c.membre_id = $${params.length}`); }
        if (mois) { params.push(mois); conditions.push(`date_trunc('month', c.mois_concerne) = date_trunc('month', $${params.length}::date)`); }
        if (user?.role === "AGENT_FID") { params.push(user.id); conditions.push(`v.agent_responsable_id = $${params.length}`); }
        const result = await promisePool.query(
            `SELECT c.*, m.numero_membre, m.nom, m.prenom, v.code AS voamami_code
             FROM cotisations_sociales c
             JOIN membres m ON m.id=c.membre_id
             JOIN voamami v ON v.id=c.voamami_id
             WHERE ${conditions.join(" AND ")}
             ORDER BY c.mois_concerne DESC, c.date_paiement DESC, c.id DESC`,
            params
        );
        return result.rows;
    }

    static async createCotisation(data, user) {
    const {
        caisse_sociale_id,
        voamami_id,
        membre_id,
        mois_concerne,
        montant,
        date_paiement,
        seance_id,
        observation
    } = data;

    const caisseResult = await promisePool.query(
        `
        SELECT id
        FROM caisses_sociales
        WHERE voamami_id = $1
          AND statut = 'ACTIVE'
        `,
        [voamami_id]
    );

    const caisseId =
        caisse_sociale_id || caisseResult.rows[0]?.id;

    if (!caisseId) {
        throw new Error(
            "Aucune caisse sociale active n'existe pour ce VOAMAMI."
        );
    }

    const result = await promisePool.query(
        `
        INSERT INTO cotisations_sociales (
            caisse_sociale_id,
            voamami_id,
            membre_id,
            mois_concerne,
            montant,
            date_paiement,
            seance_id,
            utilisateur_id,
            observation
        )
        VALUES (
            $1,
            $2,
            $3,
            date_trunc('month', $4::date)::date,
            $5,
            COALESCE($6::date, CURRENT_DATE),
            $7,
            $8,
            $9
        )
        RETURNING *
        `,
        [
            caisseId,
            voamami_id,
            membre_id,
            mois_concerne,
            montant,
            date_paiement || null,
            seance_id || null,
            user.id,
            observation || null
        ]
    );

    return result.rows[0];
}

// À intégrer dans caisse-sociale.model.js
static async getCotisationsBySeance(seanceId, user) {
    const params = [seanceId];
    let agentFilter = "";

    if (user?.role === "AGENT_FID") {
        params.push(user.id);
        agentFilter = ` AND v.agent_responsable_id = $${params.length}`;
    }

    const result = await promisePool.query(
        `SELECT c.*, m.numero_membre, m.nom, m.prenom,
                v.code AS voamami_code, v.nom AS voamami_nom
         FROM cotisations_sociales c
         JOIN membres m ON m.id = c.membre_id
         JOIN voamami v ON v.id = c.voamami_id
         WHERE c.seance_id = $1${agentFilter}
         ORDER BY c.id DESC`,
        params
    );

    return result.rows;
}

static async createCotisationForSeance(seanceId, data, user) {
    const { membre_id, mois_concerne, montant, observation } = data;
    const client = await promisePool.getConnection();

    try {
        await client.query("BEGIN");

        const seanceResult = await client.query(
            `SELECT s.id, s.statut AS seance_statut,
                    c.id AS cycle_id, c.voamami_id,
                    v.agent_responsable_id
             FROM seances s
             JOIN cycles c ON c.id = s.cycle_id
             JOIN voamami v ON v.id = c.voamami_id
             WHERE s.id = $1`,
            [seanceId]
        );
        const seance = seanceResult.rows[0];

        if (!seance) throw new Error("Séance introuvable.");
        if (seance.seance_statut !== "OUVERTE") {
            throw new Error("La séance doit être ouverte.");
        }
        if (
            user?.role === "AGENT_FID" &&
            Number(seance.agent_responsable_id) !== Number(user.id)
        ) {
            throw new Error("Cette séance ne correspond pas à un VOAMAMI affecté.");
        }

        const membreResult = await client.query(
            `SELECT id, voamami_id, actif FROM membres WHERE id = $1`,
            [membre_id]
        );
        const membre = membreResult.rows[0];
        if (!membre) throw new Error("Membre introuvable.");
        if (!membre.actif) throw new Error("Le membre doit être actif.");
        if (Number(membre.voamami_id) !== Number(seance.voamami_id)) {
            throw new Error("Le membre n'appartient pas au VOAMAMI de la séance.");
        }

        const caisseResult = await client.query(
            `SELECT id FROM caisses_sociales
             WHERE voamami_id = $1 AND statut = 'ACTIVE'`,
            [seance.voamami_id]
        );
        const caisse = caisseResult.rows[0];
        if (!caisse) throw new Error("Aucune caisse sociale active pour ce VOAMAMI.");

        const result = await client.query(
            `INSERT INTO cotisations_sociales
                (caisse_sociale_id, voamami_id, membre_id,
                 mois_concerne, montant, date_paiement,
                 seance_id, utilisateur_id, observation)
             VALUES ($1, $2, $3, date_trunc('month', $4::date)::date,
                     $5, CURRENT_DATE, $6, $7, $8)
             RETURNING *`,
            [caisse.id, seance.voamami_id, membre_id,
             mois_concerne, montant, seanceId, user.id, observation || null]
        );

        await client.query("COMMIT");
        return result.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}


    static async aides({ voamamiId, statut, user }) {
        const params = [voamamiId];
        const where = ["a.voamami_id = $1"];
        if (statut) { params.push(statut); where.push(`a.statut = $${params.length}`); }
        if (user?.role === "AGENT_FID") { params.push(user.id); where.push(`v.agent_responsable_id = $${params.length}`); }
        const result = await promisePool.query(
            `SELECT a.*, m.numero_membre, m.nom, m.prenom, v.code AS voamami_code
             FROM aides_sociales a JOIN membres m ON m.id=a.membre_id JOIN voamami v ON v.id=a.voamami_id
             WHERE ${where.join(" AND ")} ORDER BY a.created_at DESC`, params
        );
        return result.rows;
    }

    static async createAide(data, user) {
        const { caisse_sociale_id, voamami_id, membre_id, type_aide, motif, montant_demande, seance_id, observation } = data;
        const result = await promisePool.query(
            `INSERT INTO aides_sociales
             (caisse_sociale_id, voamami_id, membre_id, type_aide, motif, montant_demande, seance_id, demandeur_id, observation)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [caisse_sociale_id, voamami_id, membre_id, type_aide, motif, montant_demande, seance_id || null, user.id, observation || null]
        );
        return result.rows[0];
    }

    static async decideAide(id, { statut, montant_accorde, observation }, user) {
        const result = await promisePool.query(
            `UPDATE aides_sociales SET statut=$1, montant_accorde=$2, date_decision=CURRENT_DATE,
             decideur_id=$3, observation=COALESCE($4, observation), updated_at=CURRENT_TIMESTAMP
             WHERE id=$5 AND statut='DEMANDEE' RETURNING *`,
            [statut, montant_accorde || null, user.id, observation || null, id]
        );
        return result.rows[0] || null;
    }

    static async payerAide(id, user) {
        const result = await promisePool.query(
            `UPDATE aides_sociales SET statut='PAYEE', date_paiement=CURRENT_DATE,
             decideur_id=COALESCE(decideur_id,$1), updated_at=CURRENT_TIMESTAMP
             WHERE id=$2 AND statut='ACCORDEE' RETURNING *`,
            [user.id, id]
        );
        return result.rows[0] || null;
    }

    static async mouvements(voamamiId, user) {
        const params = [voamamiId];
        let restriction = "";
        if (user?.role === "AGENT_FID") { params.push(user.id); restriction = ` AND v.agent_responsable_id=$${params.length}`; }
        const result = await promisePool.query(
            `SELECT m.*, v.code AS voamami_code, v.nom AS voamami_nom, me.numero_membre, me.nom AS membre_nom
             FROM mouvements_caisse_sociale m JOIN voamami v ON v.id=m.voamami_id
             LEFT JOIN membres me ON me.id=m.membre_id
             WHERE m.voamami_id=$1 ${restriction} ORDER BY m.date_mouvement DESC,m.id DESC`, params
        );
        return result.rows;
    }
}

module.exports = CaisseSociale;
