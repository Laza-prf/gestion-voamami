import { defineStore } from "pinia";
import api from "../service/api.js";

function extractUser(data) {
    // Réponses possibles :
    // { user: {...} }
    // { utilisateur: {...} }
    // { data: { user: {...} } }
    // { data: {...} }
    return (
        data?.user ??
        data?.utilisateur ??
        data?.data?.user ??
        data?.data?.utilisateur ??
        data?.data ??
        data
    );
}

export const useAuthStore = defineStore("auth", {
    state: () => ({
        user: null,
        token: sessionStorage.getItem("token"),
        initialized: false
    }),

    getters: {
        isAuthenticated: (state) => Boolean(state.token),

        role: (state) => state.user?.role ?? null,

        isAdmin: (state) =>
            state.user?.role === "ADMINISTRATEUR",

        isAgentFid: (state) =>
            state.user?.role === "AGENT_FID"
    },

    actions: {
        async initAuth() {
            if (!this.token) {
                this.initialized = true;
                return;
            }

            try {
                const response = await api.get("/auth/profile");

                const user = extractUser(response.data);

                if (!user || !user.id || !user.role) {
                    throw new Error(
                        "La réponse du profil ne contient pas un utilisateur valide"
                    );
                }

                this.user = user;

                console.log("Utilisateur authentifié :", this.user);
                console.log("Rôle :", this.user.role);
            } catch (error) {
                console.error(
                    "Erreur lors de l'initialisation de l'authentification :",
                    error.response?.data || error.message
                );

                this.clearAuth();
            } finally {
                this.initialized = true;
            }
        },

        async login(email, mot_de_passe) {
            const response = await api.post("/auth/login", {
                email,
                mot_de_passe
            });

            const { data } = response;
            const user = extractUser(data);

            if (!data?.token) {
                throw new Error("Le serveur n'a pas retourné de token");
            }

            if (!user || !user.role) {
                throw new Error(
                    "Le serveur n'a pas retourné le rôle de l'utilisateur"
                );
            }

            this.token = data.token;
            this.user = user;
            this.initialized = true;

            sessionStorage.setItem("token", data.token);

            console.log("Utilisateur connecté :", this.user);
            console.log("Rôle :", this.user.role);
        },

        async logout() {
            try {
                if (this.token) {
                    await api.post("/auth/logout");
                }
            } catch (error) {
                console.warn(
                    "La déconnexion serveur a échoué :",
                    error.response?.data || error.message
                );
            } finally {
                this.clearAuth();
            }
        },

        clearAuth() {
            this.user = null;
            this.token = null;
            this.initialized = true;

            sessionStorage.removeItem("token");
        }
    }
});
