const crypto = require("crypto");
const { promisePool } = require("../config/db.js");

let tableReady;

async function ensureTable() {
    if (!tableReady) {
        tableReady = promisePool.query(`
            CREATE TABLE IF NOT EXISTS offline_idempotency_requests (
                user_id BIGINT NOT NULL,
                idempotency_key VARCHAR(120) NOT NULL,
                request_hash CHAR(64) NOT NULL,
                request_method VARCHAR(10) NOT NULL,
                request_path TEXT NOT NULL,
                status_code SMALLINT,
                response_body JSONB,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, idempotency_key)
            )
        `).catch((error) => {
            tableReady = null;
            throw error;
        });
    }

    await tableReady;
}

function requestHash(req) {
    return crypto
        .createHash("sha256")
        .update(JSON.stringify({
            method: req.method,
            path: req.originalUrl,
            body: req.body ?? null
        }))
        .digest("hex");
}

module.exports = async function idempotencyMiddleware(req, res, next) {
    const key = req.get("Idempotency-Key");
    if (!key) return next();

    if (!/^[A-Za-z0-9._:-]{8,120}$/.test(key)) {
        return res.status(400).json({
            success: false,
            message: "La clé d’idempotence est invalide."
        });
    }
    if (!req.user?.id) {
        return res.status(401).json({
            success: false,
            message: "Utilisateur non authentifié."
        });
    }

    try {
        await ensureTable();
        const userId = Number(req.user.id);
        const hash = requestHash(req);
        const [claim] = await promisePool.query(
            `INSERT INTO offline_idempotency_requests
                (user_id, idempotency_key, request_hash, request_method, request_path)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT (user_id, idempotency_key) DO NOTHING
             RETURNING idempotency_key`,
            [userId, key, hash, req.method, req.originalUrl]
        );

        if (!claim.rows?.length) {
            const [existingRows] = await promisePool.query(
                `SELECT request_hash, status_code, response_body
                 FROM offline_idempotency_requests
                 WHERE user_id = ? AND idempotency_key = ?`,
                [userId, key]
            );
            const existing = existingRows[0];

            if (!existing || existing.request_hash !== hash) {
                return res.status(409).json({
                    success: false,
                    code: "IDEMPOTENCY_KEY_REUSED",
                    message: "Cette clé de synchronisation a déjà été utilisée pour une autre opération."
                });
            }
            if (existing.status_code && existing.response_body !== null) {
                return res.status(existing.status_code).json(existing.response_body);
            }

            return res.status(409).json({
                success: false,
                code: "IDEMPOTENCY_IN_PROGRESS",
                message: "Le résultat de cette opération est en cours de vérification. Elle n’a pas été rejouée."
            });
        }

        let responseSaved = false;
        const sendJson = res.json.bind(res);
        res.json = (body) => {
            if (responseSaved || res.statusCode >= 500) {
                return sendJson(body);
            }
            responseSaved = true;
            promisePool.query(
                `UPDATE offline_idempotency_requests
                 SET status_code = ?, response_body = ?::jsonb, updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = ? AND idempotency_key = ?`,
                [res.statusCode, JSON.stringify(body), userId, key]
            ).then(() => sendJson(body)).catch(next);
            return res;
        };

        return next();
    } catch (error) {
        return next(error);
    }
};
