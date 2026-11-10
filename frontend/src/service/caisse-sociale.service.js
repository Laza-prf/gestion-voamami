import api from "./api.js";

const caisseSocialeService = {
    getAll() { return api.get("/caisse-sociale"); },
    getByVoamami(voamamiId) { return api.get(`/caisse-sociale/${voamamiId}`); },
    getCotisations(voamamiId, params = {}) { return api.get(`/caisse-sociale/${voamamiId}/cotisations`, { params }); },
    createCotisation(voamamiId, data) { return api.post(`/caisse-sociale/${voamamiId}/cotisations`, data); },
    getAides(voamamiId, params = {}) { return api.get(`/caisse-sociale/${voamamiId}/aides`, { params }); },
    createAide(voamamiId, data) { return api.post(`/caisse-sociale/${voamamiId}/aides`, data); },
    decideAide(id, data) { return api.patch(`/caisse-sociale/aides/${id}/decision`, data); },
    payerAide(id) { return api.patch(`/caisse-sociale/aides/${id}/paiement`); },
    getMouvements(voamamiId) { return api.get(`/caisse-sociale/${voamamiId}/mouvements`); },
    getCotisationsBySeance(seanceId) {
    return api.get(`/seances/${seanceId}/cotisations-sociales`);
},

createCotisationForSeance(seanceId, data) {
    return api.post(
        `/seances/${seanceId}/cotisations-sociales`,
        data
    );
},

};

export default caisseSocialeService;
