const jwt = require ("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        //recuperer le token du header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: "Acces refuse. Token manquant" });
        }

        //verifier le format : bearer token
        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({ message: "Acces refuse. Format de token invalide" });
        }

        const token = parts[1];
        console.log("Token reçu :", token);
        console.log("Longueur token :", token.length);
        console.log("JWT_SECRET défini :", process.env.JWT_SECRET !== undefined);   

    

        // verifier le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        //ajouter les informations de l'utilisateur decodé à la requete
        req.user = decoded;

        //Continuer vers le prochain middleware ou route
        next();


    } catch (error) {
       if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Acces refuse. Token expiré" });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Acces refuse. Token invalide" });
        }

       return res.status(500).json({ message: "Erreur serveur lors de l'authentification" });

    }

};

module.exports = authMiddleware;