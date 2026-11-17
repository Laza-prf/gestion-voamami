import { offlineDb, OFFLINE_OWNER_KEY } from "./offline-db.js";

const encoder = new TextEncoder();
const ITERATIONS = 310000;

function toBase64(bytes) {
    return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function fromBase64(value) {
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function derivePinVerifier(pin, salt) {
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(pin),
        "PBKDF2",
        false,
        ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt,
            iterations: ITERATIONS,
            hash: "SHA-256"
        },
        key,
        256
    );
    return toBase64(bits);
}

export async function saveOfflineProfile(user) {
    const userId = Number(user?.id);
    if (!Number.isInteger(userId) || userId < 1) {
        throw new Error("Impossible d’enregistrer le profil hors ligne.");
    }

    const existing = await offlineDb.offlineProfiles.get(userId);
    await offlineDb.offlineProfiles.put({
        userId,
        user: {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            role: user.role
        },
        pinSalt: existing?.pinSalt ?? null,
        pinVerifier: existing?.pinVerifier ?? null,
        updatedAt: Date.now()
    });
    localStorage.setItem(OFFLINE_OWNER_KEY, String(userId));
    return Boolean(existing?.pinVerifier);
}

export async function configureOfflinePin(userId, pin) {
    const profile = await offlineDb.offlineProfiles.get(Number(userId));
    if (!profile) {
        throw new Error("Le profil hors ligne est introuvable.");
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    profile.pinSalt = toBase64(salt);
    profile.pinVerifier = await derivePinVerifier(pin, salt);
    profile.updatedAt = Date.now();
    await offlineDb.offlineProfiles.put(profile);
}

export async function loadOfflineProfile() {
    const userId = Number(localStorage.getItem(OFFLINE_OWNER_KEY));
    if (!Number.isInteger(userId) || userId < 1) return null;
    return (await offlineDb.offlineProfiles.get(userId)) ?? null;
}

export async function verifyOfflinePin(profile, pin) {
    if (!profile?.pinSalt || !profile?.pinVerifier) return false;
    const actual = await derivePinVerifier(pin, fromBase64(profile.pinSalt));
    return actual === profile.pinVerifier;
}
