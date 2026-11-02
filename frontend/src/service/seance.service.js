import api from "./api.js";

export default {
    getAll: () => api.get("/seances"),
    getById: (id) => api.get(`/seances/${id}`),
    create: (data) => api.post("/seances", data),
    update: (id, data) => api.put(`/seances/${id}`, data),
    close: (id, observation) =>
        api.post(`/seances/${id}/cloturer`, { observation }),
    remove: (id) => api.delete(`/seances/${id}`),
};