import api from "./api.js";

export default {
    getAll: () => api.get("/voamami"),
    getById: (id) => api.get(`/voamami/${id}`),
    getByAgent: (agentId) => api.get(`/voamami?agent_responsable_id=${agentId}`),
    create: (data) => api.post("/voamami", data),
    update: (id, data) => api.put(`/voamami/${id}`, data),
    remove: (id) => api.delete(`/voamami/${id}`),
};