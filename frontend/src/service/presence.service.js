import api from "./api.js";

export default {
    getAll(params = {}) {
        return api.get("/presences", { params });
    },
    create(data) {
        return api.post("/presences", data);
    },
    update(id, data) {
        return api.put(`/presences/${id}`, data);
    }
};