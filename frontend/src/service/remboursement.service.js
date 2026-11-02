import api from "./api.js";

export default {
    getAll(params = {}) {
        return api.get("/remboursements", { params });
    },
    getById(id) {
        return api.get(`/remboursements/${id}`);
    },
    create(data) {
        return api.post("/remboursements", data);
    },
    createMany(data) {
        return api.post("/remboursements", data);
    }
};