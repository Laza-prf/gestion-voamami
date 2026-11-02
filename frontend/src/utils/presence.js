export function excludedMemberIdsFromPresence(response) {
    const presences = response?.data?.data;
    if (!Array.isArray(presences)) {
        throw new Error("Le format des présences reçues est invalide.");
    }

    return new Set(
        presences
            .filter((presence) =>
                presence.statut === "ABSENT" || presence.statut === "EXCUSE"
            )
            .map((presence) => Number(presence.membre_id))
    );
}
