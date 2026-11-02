const { Pool } = require("pg");
require("dotenv").config();

const requiredConfig = ["DB_USER", "DB_PASSWORD", "DB_NAME"];
const missingConfig = requiredConfig.filter((key) => !process.env[key]);

if (missingConfig.length > 0) {
    throw new Error(
        `Configuration PostgreSQL manquante : ${missingConfig.join(", ")}`
    );
}

const dbConfig = {
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 5432),
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
};

const pgPool = new Pool(dbConfig);

function convertPlaceholders(sql) {
    let result = "";
    let parameterIndex = 0;
    let quote = null;
    let dollarQuote = null;
    let lineComment = false;
    let blockComment = false;

    for (let index = 0; index < sql.length; index += 1) {
        const char = sql[index];
        const next = sql[index + 1];

        if (lineComment) {
            result += char;
            if (char === "\n") lineComment = false;
            continue;
        }

        if (blockComment) {
            result += char;
            if (char === "*" && next === "/") {
                result += next;
                index += 1;
                blockComment = false;
            }
            continue;
        }

        if (dollarQuote) {
            if (sql.startsWith(dollarQuote, index)) {
                result += dollarQuote;
                index += dollarQuote.length - 1;
                dollarQuote = null;
            } else {
                result += char;
            }
            continue;
        }

        if (quote) {
            result += char;
            if (char === quote) {
                if (next === quote) {
                    result += next;
                    index += 1;
                } else {
                    quote = null;
                }
            } else if (char === "\\" && next) {
                result += next;
                index += 1;
            }
            continue;
        }

        if (char === "-" && next === "-") {
            result += char + next;
            index += 1;
            lineComment = true;
        } else if (char === "/" && next === "*") {
            result += char + next;
            index += 1;
            blockComment = true;
        } else if (char === "'" || char === '"' || char === "`") {
            quote = char;
            result += char;
        } else if (char === "$") {
            const match = sql.slice(index).match(/^\$[A-Za-z_][A-Za-z_0-9]*\$|^\$\$/);
            if (match) {
                dollarQuote = match[0];
                result += dollarQuote;
                index += dollarQuote.length - 1;
            } else {
                result += char;
            }
        } else if (char === "?") {
            parameterIndex += 1;
            result += `$${parameterIndex}`;
        } else {
            result += char;
        }
    }

    return result;
}

function prepareQuery(sql) {
    const isInsert = /^\s*INSERT\s+INTO\b/i.test(sql);
    const hasReturning = /\bRETURNING\b/i.test(sql);
    let statement = convertPlaceholders(sql);

    if (isInsert && !hasReturning) {
        statement = statement.replace(/;\s*$/, "") + " RETURNING id";
    }

    return { statement, isInsert };
}

function normalizeParams(params) {
    return params.map((value) =>
        typeof value === "boolean" ? Number(value) : value
    );
}

function formatResult(result, isInsert) {
    if (isInsert) {
        return [
            {
                insertId: result.rows[0]?.id,
                affectedRows: result.rowCount,
                rows: result.rows,
            },
            undefined,
        ];
    }

    if (result.command === "UPDATE" || result.command === "DELETE") {
        return [
            { affectedRows: result.rowCount, rows: result.rows },
            undefined,
        ];
    }

    return [result.rows, undefined];
}

function wrapConnection(client) {
    return {
        async query(sql, params = []) {
            const { statement, isInsert } = prepareQuery(sql);
            const result = await client.query(statement, normalizeParams(params));
            return formatResult(result, isInsert);
        },
        beginTransaction() {
            return client.query("BEGIN");
        },
        commit() {
            return client.query("COMMIT");
        },
        rollback() {
            return client.query("ROLLBACK");
        },
        release() {
            client.release();
        },
    };
}

const promisePool = {
    async query(sql, params = []) {
        const { statement, isInsert } = prepareQuery(sql);
        const result = await pgPool.query(statement, normalizeParams(params));
        return formatResult(result, isInsert);
    },
    async getConnection() {
        const client = await pgPool.connect();
        return wrapConnection(client);
    },
};

const testConnection = async () => {
    try {
        await pgPool.query("SELECT 1");
        console.log("Connexion à PostgreSQL réussie");
        return true;
    } catch (error) {
        console.error("Erreur de connexion PostgreSQL :", error.message);
        return false;
    }
};

testConnection();

module.exports = {
    promisePool,
    testConnection,
};
