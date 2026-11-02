import api from "./api.js";

export default {
    getAll: () => api.get("/cycles"),
    getById: (id) => api.get(`/cycles/${id}`),
    create: (data) => api.post("/cycles", data),
    update: (id, data) => api.put(`/cycles/${id}`, data),
    close: (id) => api.post(`/rapports/cycles/${id}/cloturer`),
    remove: (id) => api.delete(`/cycles/${id}`),
};