import api from "./api.js";

const mouvementCaisseService = {
    getAll(params = {}) {
        return api.get(
            "/mouvements_caisse",
            { params }
        );
    },

    getById(id) {
        return api.get(
            `/mouvements_caisse/${id}`
        );
    },

    getSummary(params = {}) {
        return api.get(
            "/mouvements_caisse/resume",
            { params }
        );
    },

    getBalancesByVoamami() {
        return api.get("/mouvements_caisse/soldes-par-voamami");
    }
};

export default mouvementCaisseService;
