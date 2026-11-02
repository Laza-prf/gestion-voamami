const express = require("express" );
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialiser la connexion à la base de données
require("./src/config/db.js");

// Middlewares généraux
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require("./src/routes/auth.routes.js");
const userRoutes = require("./src/routes/users.routes.js");
const voamamiRoutes = require("./src/routes/voamami.routes.js");
const cycleRoutes = require("./src/routes/cycle.routes.js");
const membreRoutes = require("./src/routes/membre.routes.js");
const agrRoutes = require("./src/routes/agr.routes.js");
const seanceRoutes = require("./src/routes/seance.routes.js");
const epargneRoutes = require("./src/routes/epargne.routes.js");
const creditRoutes = require("./src/routes/credit.routes.js");
const remboursementRoutes = require("./src/routes/remboursement.routes.js");
const presenceRoutes = require("./src/routes/presence.routes.js");
const penaliteRoutes = require("./src/routes/penalite.routes.js");
const mouvementCaisseRoutes = require("./src/routes/mouvement-caisse.routes.js");
const rapportRoutes = require("./src/routes/rapport.routes.js");

// Middleware de gestion des erreurs
const errorHandler = require(
    "./src/middlewares/errorHandler.middleware.js"
);

// Route de test
app.get("/health", (req, res) => {
    res.json({
        success: true,
        status: "ok",
        message: "API VOAMAMY fonctionne correctement"
    });
});

// Routes API actives
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/voamami", voamamiRoutes);
app.use("/api/cycles", cycleRoutes);
app.use("/api/membres", membreRoutes);
app.use("/api/agr", agrRoutes);
app.use("/api/seances", seanceRoutes);
app.use("/api/epargnes", epargneRoutes);
app.use("/api/credits", creditRoutes);
app.use("/api/remboursements", remboursementRoutes);
app.use("/api/presences", presenceRoutes);
app.use("/api/penalites", penaliteRoutes);
app.use("/api/mouvements_caisse", mouvementCaisseRoutes);
app.use("/api/rapports", rapportRoutes);

// Route 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route introuvable : ${req.method} ${req.originalUrl}`
    });
});

// Gestionnaire global des erreurs
app.use(errorHandler);

// Démarrage
app.listen(PORT, () => {
    console.log("==========================================");
    console.log("Serveur VOAMAMY démarré");
    console.log(`Port : ${PORT}`);
    console.log(`URL : http://localhost:${PORT}` );
    console.log(`Health : http://localhost:${PORT}/health` );
    console.log("==========================================");
});
