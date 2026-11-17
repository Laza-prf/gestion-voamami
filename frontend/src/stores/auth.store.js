import { defineStore } from "pinia";
import api from "../service/api.js";
import {
    configureOfflinePin,
    loadOfflineProfile,
    saveOfflineProfile,
    verifyOfflinePin
} from "../offline/offline-security.js";
import { offlineDb } from "../offline/offline-db.js";

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
        initialized: false,
        offlineUnlocked: false,
        offlineOnly: false,
        offlineUnlockRequired: false,
        offlinePinSetupRequired: false
    }),

    getters: {
        isAuthenticated: (state) =>
            Boolean(state.token || state.offlineUnlocked),

        role: (state) => state.user?.role ?? null,

        isAdmin: (state) =>
            state.user?.role === "ADMINISTRATEUR",

        isAgentFid: (state) =>
            state.user?.role === "AGENT_FID"
    },

    actions: {
        async initAuth() {
            if (!this.token) {
                await this.prepareOfflineUnlock();
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
                this.offlinePinSetupRequired = user.role !== "ADMINISTRATEUR" &&
                    !(await saveOfflineProfile(user));

                console.log("Utilisateur authentifié :", this.user);
                console.log("Rôle :", this.user.role);
            } catch (error) {
                console.error(
                    "Erreur lors de l'initialisation de l'authentification :",
                    error.response?.data || error.message
                );

                this.user = null;
                this.token = null;
                sessionStorage.removeItem("token");
                await this.prepareOfflineUnlock();
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
            this.offlineUnlocked = false;
            this.offlineOnly = false;
            this.offlineUnlockRequired = false;

            sessionStorage.setItem("token", data.token);
            this.offlinePinSetupRequired = user.role !== "ADMINISTRATEUR" &&
                !(await saveOfflineProfile(user));

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
            this.offlineUnlocked = false;
            this.offlineOnly = false;
            this.offlineUnlockRequired = false;
            this.offlinePinSetupRequired = false;
            this.initialized = true;

            sessionStorage.removeItem("token");
        },

        async prepareOfflineUnlock() {
            const profile = await loadOfflineProfile();
            this.offlineUnlockRequired = Boolean(
                profile?.pinVerifier &&
                profile.user &&
                profile.user.role !== "ADMINISTRATEUR"
            );
        },

        async configureOfflineAccess(pin) {
            if (!this.user?.id) {
                throw new Error("Connectez-vous avant de configurer l’accès hors ligne.");
            }
            await configureOfflinePin(this.user.id, pin);
            this.offlinePinSetupRequired = false;
        },

        skipOfflineAccessSetup() {
            this.offlinePinSetupRequired = false;
        },

        async unlockOffline(pin) {
            const profile = await loadOfflineProfile();
            if (profile?.pinLockUntil > Date.now()) {
                const minutes = Math.ceil((profile.pinLockUntil - Date.now()) / 60000);
                throw new Error(`Trop de tentatives. Réessayez dans ${minutes} minute(s).`);
            }
            const valid = profile && await verifyOfflinePin(profile, pin);
            if (!valid) {
                if (profile) {
                    profile.pinFailedAttempts = (profile.pinFailedAttempts || 0) + 1;
                    if (profile.pinFailedAttempts >= 5) {
                        profile.pinFailedAttempts = 0;
                        profile.pinLockUntil = Date.now() + 5 * 60 * 1000;
                    }
                    await offlineDb.offlineProfiles.put(profile);
                }
                throw new Error("Code PIN incorrect.");
            }

            profile.pinFailedAttempts = 0;
            profile.pinLockUntil = 0;
            await offlineDb.offlineProfiles.put(profile);
            this.user = profile.user;
            this.token = null;
            this.offlineUnlocked = true;
            this.offlineOnly = true;
            this.offlineUnlockRequired = false;
            this.initialized = true;
            sessionStorage.removeItem("token");
        }
    }
});
