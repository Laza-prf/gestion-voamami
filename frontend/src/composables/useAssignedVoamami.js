import { computed } from "vue";
import { useAuthStore } from "../stores/auth.store.js";

export function useAssignedVoamami() {
    const auth = useAuthStore();
    const isAgentFid = computed(() => auth.isAgentFid);

    function assignedVoamamiId(voamamis) {
        if (!isAgentFid.value) return null;

        const assigned = voamamis.find(
            (voamami) =>
                Number(voamami.agent_responsable_id) === Number(auth.user?.id)
        );

        return assigned?.id == null ? null : Number(assigned.id);
    }

    return { isAgentFid, assignedVoamamiId };
}
