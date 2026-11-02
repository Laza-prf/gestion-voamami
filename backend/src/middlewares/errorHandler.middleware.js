const errorHandler = (err, req, res, next) => {
    console.error("❌ Erreur serveur :");
    console.error(err);

    const statusCode = err.statusCode || err.status || 500;

    res.status(statusCode).json({
        success: false,
        message: err.message || "Une erreur interne du serveur est survenue.",

        ...(process.env.NODE_ENV === "development" && {
            error: err.name,
            stack: err.stack
        })
    });
};

module.exports = errorHandler;

