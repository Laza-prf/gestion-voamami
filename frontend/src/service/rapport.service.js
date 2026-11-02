import api from "./api.js";

export default {
    getAll(params = {}) {
        return api.get("/rapports", {
            params
        });
    },

    getById(id) {
        return api.get(`/rapports/${id}`);
    },

    getSeanceReport(seanceId) {
        return api.get(
            `/rapports/seances/${seanceId}`
        );
    },

    downloadSeancePdf(seanceId) {
        return api.get(`/rapports/seances/${seanceId}/pdf`, {
            responseType: "blob"
        });
    },

    getCycleReport(cycleId) {
        return api.get(
            `/rapports/cycles/${cycleId}`
        );
    },

    downloadCyclePdf(cycleId) {
        return api.get(`/rapports/cycles/${cycleId}/pdf`, {
            responseType: "blob"
        });
    },

    cloturerCycle(cycleId) {
        return api.post(
            `/rapports/cycles/${cycleId}/cloturer`
        );
    }
};
