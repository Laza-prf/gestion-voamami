const { promisePool } = require("../config/db.js");

function isAgent(user) {
    return user?.role === "AGENT_FID";
}

function positiveId(value, label) {
    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error(`${label} invalide.`);
    }

    return id;
}

function optionalText(value) {
    if (value === undefined || value === null) {
        return null;
    }

    const text = String(value).trim();
    return text || null;
}

/*
 * Le db.js actuel renvoie [rows, metadata], comme mysql2.
 * Cette fonction rend le modèle compatible avec ce wrapper.
 */
function rowsFrom(result) {
    if (Array.isArray(result)) {
        const first = result[0];

        // SELECT : [rows, metadata]
        if (Array.isArray(first)) {
            return first;
        }

        // INSERT/UPDATE/DELETE avec le wrapper db.js :
        // [{ rows: [...], affectedRows: ... }, metadata]
        if (Array.isArray(first?.rows)) {
            return first.rows;
        }

        return [];
    }

    // Compatibilité avec un résultat pg natif :
    // { rows: [...] }
    if (Array.isArray(result?.rows)) {
        return result.rows;
    }

    return [];
}


function firstRow(result) {
    return rowsFrom(result)[0] || null;
}

class CaisseSociale {
    static async findAll(user) {
        const params = [];
        let restriction = "";

        if (isAgent(user)) {
            params.push(user.id);
            restriction = `AND v.agent_responsable_id = ?`;
        }

        const result = await promisePool.query(
            `
            SELECT
                s.*,
                v.code AS voamami_code,
                v.nom AS voamami_nom
            FROM v_caisse_sociale_synthese s
            INNER JOIN voamami v
                ON v.id = s.voamami_id
            WHERE 1 = 1
                ${restriction}
            ORDER BY v.nom ASC
            `,
            params
        );

        return rowsFrom(result);
    }

    static async findByVoamami(voamamiId, user) {
        const id = positiveId(voamamiId, "Identifiant VOAMAMI");
        const params = [id];
        let restriction = "";

        if (isAgent(user)) {
            params.push(user.id);
            restriction = `AND v.agent_responsable_id = ?`;
        }

        const result = await promisePool.query(
            `
            SELECT
                s.*,
                v.code AS voamami_code,
                v.nom AS voamami_nom
            FROM v_caisse_sociale_synthese s
            INNER JOIN voamami v
                ON v.id = s.voamami_id
            WHERE s.voamami_id = ?
                ${restriction}
            LIMIT 1
            `,
            params
        );

        return firstRow(result);
    }

    static async cotisations({
        voamamiId,
        membreId,
        mois,
        user
    }) {
        const id = positiveId(voamamiId, "Identifiant VOAMAMI");
        const params = [id];
        const conditions = ["c.voamami_id = ?"];

        if (membreId) {
            params.push(positiveId(membreId, "Identifiant membre"));
            conditions.push("c.membre_id = ?");
        }

        if (mois) {
            params.push(mois);
            conditions.push(
                `date_trunc('month', c.mois_concerne) = date_trunc('month', to_date(?, 'YYYY-MM'))`
            );
        }

        if (isAgent(user)) {
            params.push(user.id);
            conditions.push("v.agent_responsable_id = ?");
        }

        const result = await promisePool.query(
            `
            SELECT
                c.*,
                m.numero_membre,
                m.nom,
                m.prenom,
                v.code AS voamami_code,
                v.nom AS voamami_nom
            FROM cotisations_sociales c
            INNER JOIN membres m
                ON m.id = c.membre_id
            INNER JOIN voamami v
                ON v.id = c.voamami_id
            WHERE ${conditions.join(" AND ")}
            ORDER BY c.mois_concerne DESC,
                     c.date_paiement DESC,
                     c.id DESC
            `,
            params
        );

        return rowsFrom(result);
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

        const voamamiId = positiveId(
            voamami_id,
            "Identifiant VOAMAMI"
        );
        const membreId = positiveId(
            membre_id,
            "Identifiant membre"
        );
        const amount = Number(montant);

        if (!/^\d{4}-\d{2}$/.test(String(mois_concerne || ""))) {
            throw new Error(
                "Le mois concerné doit être au format AAAA-MM."
            );
        }

        if (!Number.isInteger(amount) || amount <= 0) {
            throw new Error(
                "Le montant doit être un entier supérieur à zéro."
            );
        }

        const caisseResult = await promisePool.query(
            `
            SELECT id
            FROM caisses_sociales
            WHERE voamami_id = ?
                AND statut = 'ACTIVE'
            LIMIT 1
            `,
            [voamamiId]
        );

        const caisseId = Number(
            caisse_sociale_id || firstRow(caisseResult)?.id
        );

        if (!caisseId) {
            throw new Error(
                "Aucune caisse sociale active n’existe pour ce VOAMAMI."
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
                ?,
                ?,
                ?,
                to_date(?, 'YYYY-MM'),
                ?,
                COALESCE(?::date, CURRENT_DATE),
                ?,
                ?,
                ?
            )
            RETURNING *
            `,
            [
                caisseId,
                voamamiId,
                membreId,
                mois_concerne,
                amount,
                date_paiement || null,
                seance_id || null,
                user?.id || null,
                optionalText(observation)
            ]
        );

        return firstRow(result);
    }

    static async getCotisationsBySeance(seanceId, user) {
        const id = positiveId(seanceId, "Identifiant séance");
        const params = [id];
        let restriction = "";

        if (isAgent(user)) {
            params.push(user.id);
            restriction = "AND v.agent_responsable_id = ?";
        }

        const result = await promisePool.query(
            `
            SELECT
                c.*,
                m.numero_membre,
                m.nom,
                m.prenom,
                v.code AS voamami_code,
                v.nom AS voamami_nom
            FROM cotisations_sociales c
            INNER JOIN membres m
                ON m.id = c.membre_id
            INNER JOIN voamami v
                ON v.id = c.voamami_id
            WHERE c.seance_id = ?
                ${restriction}
            ORDER BY c.id DESC
            `,
            params
        );

        return rowsFrom(result);
    }

    /* Signature appelée par le contrôleur : (seanceId, data, user) */
    static async createCotisationForSeance(
        seanceId,
        data,
        user
    ) {
        const sessionId = positiveId(
            seanceId,
            "Identifiant séance"
        );
        const membreId = positiveId(
            data?.membre_id,
            "Identifiant membre"
        );
        const moisConcerne = String(
            data?.mois_concerne || ""
        ).trim();
        const amount = Number(data?.montant);
        const observation = optionalText(data?.observation);

        if (!/^\d{4}-\d{2}$/.test(moisConcerne)) {
            throw new Error(
                "Le mois concerné doit être au format AAAA-MM."
            );
        }

        if (!Number.isInteger(amount) || amount <= 0) {
            throw new Error(
                "Le montant doit être un entier supérieur à zéro."
            );
        }

        if (!user?.id) {
            throw new Error(
                "Utilisateur authentifié introuvable."
            );
        }

        const client = await promisePool.connect();

        try {
            await client.query("BEGIN");

            const seanceResult = await client.query(
                `
                SELECT
                    s.id,
                    s.statut AS seance_statut,
                    c.id AS cycle_id,
                    c.voamami_id,
                    v.agent_responsable_id
                FROM seances s
                INNER JOIN cycles c
                    ON c.id = s.cycle_id
                INNER JOIN voamami v
                    ON v.id = c.voamami_id
                WHERE s.id = ?
                FOR UPDATE
                `,
                [sessionId]
            );

            const seance = firstRow(seanceResult);

            if (!seance) {
                throw new Error("Séance introuvable.");
            }

            const sessionStatus = String(
                seance.seance_statut || ""
            ).toUpperCase();

            if (
                sessionStatus !== "OUVERTE" &&
                sessionStatus !== "OUVERT"
            ) {
                throw new Error(
                    "La séance doit être ouverte."
                );
            }

            if (
                isAgent(user) &&
                Number(seance.agent_responsable_id) !==
                    Number(user.id)
            ) {
                throw new Error(
                    "Cette séance ne correspond pas à un VOAMAMI affecté."
                );
            }

            const membreResult = await client.query(
                `
                SELECT id, voamami_id, actif
                FROM membres
                WHERE id = ?
                FOR UPDATE
                `,
                [membreId]
            );

            const membre = firstRow(membreResult);

            if (!membre) {
                throw new Error("Membre introuvable.");
            }

            const active =
                membre.actif === true ||
                membre.actif === 1 ||
                membre.actif === "1";

            if (!active) {
                throw new Error("Le membre doit être actif.");
            }

            if (
                Number(membre.voamami_id) !==
                Number(seance.voamami_id)
            ) {
                throw new Error(
                    "Le membre n’appartient pas au VOAMAMI de la séance."
                );
            }

            const caisseResult = await client.query(
                `
                SELECT id
                FROM caisses_sociales
                WHERE voamami_id = ?
                    AND statut = 'ACTIVE'
                LIMIT 1
                FOR UPDATE
                `,
                [seance.voamami_id]
            );

            const caisse = firstRow(caisseResult);

            if (!caisse) {
                throw new Error(
                    "Aucune caisse sociale active pour ce VOAMAMI."
                );
            }

            const insertResult = await client.query(
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
                    ?,
                    ?,
                    ?,
                    to_date(?, 'YYYY-MM'),
                    ?,
                    CURRENT_DATE,
                    ?,
                    ?,
                    ?
                )
                RETURNING *
                `,
                [
                    caisse.id,
                    seance.voamami_id,
                    membreId,
                    moisConcerne,
                    amount,
                    sessionId,
                    user.id,
                    observation
                ]
            );

            const inserted = firstRow(insertResult);

            if (!inserted) {
                throw new Error(
                    "La cotisation n’a pas été créée."
                );
            }

            await client.query("COMMIT");
            return inserted;
        } catch (error) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "Erreur rollback cotisation sociale :",
                    rollbackError
                );
            }

            throw error;
        } finally {
            client.release();
        }
    }

    static async aides({ voamamiId, statut, user }) {
        const params = [];
        const where = [];

        if (voamamiId) {
            params.push(
                positiveId(voamamiId, "Identifiant VOAMAMI")
            );
            where.push("a.voamami_id = ?");
        }

        if (statut) {
            params.push(statut);
            where.push("a.statut = ?");
        }

        if (isAgent(user)) {
            params.push(user.id);
            where.push("v.agent_responsable_id = ?");
        }

        const result = await promisePool.query(
            `
            SELECT
                a.*,
                m.numero_membre,
                m.nom,
                m.prenom,
                v.code AS voamami_code,
                v.nom AS voamami_nom,
                s.solde_social
            FROM aides_sociales a
            INNER JOIN membres m
                ON m.id = a.membre_id
            INNER JOIN voamami v
                ON v.id = a.voamami_id
            LEFT JOIN v_caisse_sociale_synthese s
                ON s.caisse_sociale_id = a.caisse_sociale_id
            ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
            ORDER BY a.created_at DESC
            `,
            params
        );

        return rowsFrom(result);
    }

    static async createAide(data, user) {
    const {
        voamami_id,
        membre_id,
        type_aide,
        motif,
        montant_demande,
        seance_id,
        observation
    } = data;

    const voamamiId = positiveId(
        voamami_id,
        "Identifiant VOAMAMI"
    );

    const membreId = positiveId(
        membre_id,
        "Identifiant membre"
    );

    const montant = Number(
        montant_demande
    );

    const allowedTypes = [
        "ACCIDENT",
        "MALADIE_GRAVE",
        "DECES",
        "NAISSANCE",
        "AUTRE"
    ];
    const typeAide = String(type_aide || "").trim();

    if (!allowedTypes.includes(typeAide)) {
        throw new Error("Veuillez sélectionner un type d’aide valide.");
    }

    const motifText = String(motif || "").trim();
    if (!motifText) {
        throw new Error("Le motif est obligatoire.");
    }

    if (motifText.length > 1000) {
        throw new Error("Le motif ne peut pas dépasser 1000 caractères.");
    }

    if (!Number.isInteger(montant) || montant <= 0) {
        throw new Error(
            "Le montant demandé doit être un entier supérieur à zéro."
        );
    }

    if (!user?.id) {
        throw new Error(
            "Utilisateur authentifié introuvable."
        );
    }

    let seanceId = null;
    if (seance_id !== undefined && seance_id !== null && seance_id !== "") {
        seanceId = positiveId(seance_id, "Identifiant de séance");
    }

    const observationText = optionalText(observation);
    if (observationText && observationText.length > 500) {
        throw new Error(
            "L’observation ne peut pas dépasser 500 caractères."
        );
    }

    const membreResult = await promisePool.query(
        `
        SELECT
            id,
            voamami_id,
            actif
        FROM membres
        WHERE id = ?
        LIMIT 1
        `,
        [membreId]
    );

    const membre = firstRow(membreResult);

    if (!membre) {
        throw new Error(
            "Membre introuvable."
        );
    }

    const membreActif =
        membre.actif === true ||
        membre.actif === 1 ||
        membre.actif === "1";

    if (!membreActif) {
        throw new Error(
            "Le membre sélectionné est inactif."
        );
    }

    if (
        Number(membre.voamami_id) !==
        Number(voamamiId)
    ) {
        throw new Error(
            "Le membre ne correspond pas au VOAMAMI sélectionné."
        );
    }

    if (seanceId) {
        const seanceResult = await promisePool.query(
            `
            SELECT
                s.id,
                c.voamami_id
            FROM seances s
            INNER JOIN cycles c
                ON c.id = s.cycle_id
            INNER JOIN voamami v
                ON v.id = c.voamami_id
            WHERE s.id = ?
            LIMIT 1
            `,
            [seanceId]
        );
        const seance = firstRow(seanceResult);

        if (!seance) {
            throw new Error("Séance introuvable.");
        }

        if (Number(seance.voamami_id) !== voamamiId) {
            throw new Error(
                "La séance ne correspond pas au VOAMAMI sélectionné."
            );
        }
    }

    if (isAgent(user)) {
        const voamamiResult = await promisePool.query(
            `
            SELECT id
            FROM voamami
            WHERE id = ?
                AND agent_responsable_id = ?
            LIMIT 1
            `,
            [voamamiId, user.id]
        );

        if (!firstRow(voamamiResult)) {
            throw new Error(
                "Vous ne pouvez créer une demande que pour un VOAMAMI dont vous êtes responsable."
            );
        }
    }

    const caisseResult = await promisePool.query(
        `
        SELECT id
        FROM caisses_sociales
        WHERE voamami_id = ?
            AND statut = 'ACTIVE'
        LIMIT 1
        `,
        [voamamiId]
    );

    const caisse = firstRow(caisseResult);

    if (!caisse) {
        throw new Error(
            "Aucune caisse sociale active pour ce VOAMAMI."
        );
    }

    const result = await promisePool.query(
        `
        INSERT INTO aides_sociales (
            caisse_sociale_id,
            voamami_id,
            membre_id,
            type_aide,
            motif,
            montant_demande,
            seance_id,
            demandeur_id,
            observation
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
        `,
        [
            caisse.id,
            voamamiId,
            membreId,
            typeAide,
            motifText,
            montant,
            seanceId,
            user.id,
            observationText
        ]
    );

    const aide = firstRow(result);

    if (!aide) {
        throw new Error(
            "La demande d’aide n’a pas été créée."
        );
    }

    return aide;
}


    static async decideAide(
        id,
        { statut, montant_accorde, observation },
        user
    ) {
        const aideId = positiveId(id, "Identifiant demande");

        if (!["ACCORDEE", "REFUSEE"].includes(statut)) {
            throw new Error("La décision doit être ACCORDEE ou REFUSEE.");
        }

        let montantAccorde = null;
        if (statut === "ACCORDEE") {
            montantAccorde = Number(montant_accorde);
            if (!Number.isInteger(montantAccorde) || montantAccorde <= 0) {
                throw new Error(
                    "Le montant accordé doit être un entier supérieur à zéro."
                );
            }

            const demandeResult = await promisePool.query(
                `
                SELECT montant_demande, statut
                FROM aides_sociales
                WHERE id = ?
                LIMIT 1
                `,
                [aideId]
            );
            const demande = firstRow(demandeResult);

            if (demande?.statut === "DEMANDEE" &&
                montantAccorde > Number(demande.montant_demande)) {
                throw new Error(
                    "Le montant accordé ne peut pas dépasser le montant demandé."
                );
            }
        }

        const result = await promisePool.query(
            `
            UPDATE aides_sociales
            SET statut = ?,
                montant_accorde = ?,
                date_decision = CURRENT_DATE,
                decideur_id = ?,
                observation = COALESCE(?, observation),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
                AND statut = 'DEMANDEE'
            RETURNING *
            `,
            [
                statut,
                montantAccorde,
                user.id,
                optionalText(observation),
                aideId
            ]
        );

        return firstRow(result);
    }

    static async payerAide(id, user) {
        const aideId = positiveId(id, "Identifiant demande");
        if (!user?.id) {
            throw new Error("Utilisateur authentifié introuvable.");
        }

        const client = await promisePool.connect();

        try {
            await client.query("BEGIN");

            const aideResult = await client.query(
                `
                SELECT
                    id,
                    caisse_sociale_id,
                    voamami_id,
                    montant_accorde,
                    statut
                FROM aides_sociales
                WHERE id = ?
                FOR UPDATE
                `,
                [aideId]
            );
            const aide = firstRow(aideResult);

            if (!aide || aide.statut !== "ACCORDEE") {
                await client.query("ROLLBACK");
                return null;
            }

            const caisseId = positiveId(
                aide.caisse_sociale_id,
                "Identifiant caisse sociale"
            );
            const montant = Number(aide.montant_accorde);

            if (!Number.isInteger(montant) || montant <= 0) {
                throw new Error(
                    "Le montant accordé est invalide pour cette demande."
                );
            }

            const caisseResult = await client.query(
                `
                SELECT id
                FROM caisses_sociales
                WHERE id = ?
                FOR UPDATE
                `,
                [caisseId]
            );

            if (!firstRow(caisseResult)) {
                throw new Error("La caisse sociale est introuvable.");
            }

            const soldeResult = await client.query(
                `
                SELECT solde_social
                FROM v_caisse_sociale_synthese
                WHERE voamami_id = ?
                LIMIT 1
                `,
                [aide.voamami_id]
            );
            const solde = Number(firstRow(soldeResult)?.solde_social);

            if (!Number.isFinite(solde) || solde < montant) {
                throw new Error(
                    "Le solde de la caisse sociale est insuffisant pour payer cette aide."
                );
            }

            const paymentResult = await client.query(
                `
                UPDATE aides_sociales
                SET statut = 'PAYEE',
                    date_paiement = CURRENT_DATE,
                    decideur_id = COALESCE(decideur_id, ?),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                    AND statut = 'ACCORDEE'
                RETURNING *
                `,
                [user.id, aideId]
            );
            const paidAide = firstRow(paymentResult);

            if (!paidAide) {
                throw new Error(
                    "Le paiement de cette demande n’a pas pu être enregistré."
                );
            }

            await client.query("COMMIT");
            return paidAide;
        } catch (error) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "Erreur rollback paiement aide sociale :",
                    rollbackError
                );
            }

            throw error;
        } finally {
            client.release();
        }
    }

    static async mouvements(voamamiId, user) {
        const id = positiveId(voamamiId, "Identifiant VOAMAMI");
        const params = [id];
        let restriction = "";

        if (isAgent(user)) {
            params.push(user.id);
            restriction = "AND v.agent_responsable_id = ?";
        }

        const result = await promisePool.query(
            `
            SELECT
                m.*,
                v.code AS voamami_code,
                v.nom AS voamami_nom,
                me.numero_membre,
                me.nom AS membre_nom,
                me.prenom AS membre_prenom
            FROM mouvements_caisse_sociale m
            INNER JOIN voamami v
                ON v.id = m.voamami_id
            LEFT JOIN membres me
                ON me.id = m.membre_id
            WHERE m.voamami_id = ?
                ${restriction}
            ORDER BY m.date_mouvement DESC, m.id DESC
            `,
            params
        );

        return rowsFrom(result);
    }
}

module.exports = CaisseSociale;
