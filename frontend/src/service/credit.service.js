import api from "./api.js";

export default {
    getAll(params = {}) {
        return api.get("/credits", { params });
    },
    getById(id) {
        return api.get(`/credits/${id}`);
    },
    create(data) {
        return api.post("/credits", data);
    }
};