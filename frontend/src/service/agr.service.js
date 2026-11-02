import api from "./api.js";

export default {
    getAll: () => api.get("/agr"),
    getById: (id) => api.get(`/agr/${id}`),
    create: (data) => api.post("/agr", data),
    update: (id, data) => api.put(`/agr/${id}`, data),
    remove: (id) => api.delete(`/agr/${id}`),
};