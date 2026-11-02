<template>
    <Teleport to="body">
        <Transition name="confirm">
            <div v-if="modelValue" class="confirm-backdrop" @click.self="cancel">
                <section
                    class="confirm-dialog"
                    role="alertdialog"
                    aria-modal="true"
                    :aria-labelledby="titleId"
                    :aria-describedby="messageId"
                >
                    <h2 :id="titleId">{{ title }}</h2>
                    <p :id="messageId">{{ message }}</p>
                    <div class="confirm-actions">
                        <button type="button" class="cancel-button" :disabled="loading" @click="cancel">
                            Annuler
                        </button>
                        <button type="button" class="confirm-button" :disabled="loading" @click="$emit('confirm')">
                            {{ loading ? loadingLabel : confirmLabel }}
                        </button>
                    </div>
                </section>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
const props = defineProps({
    modelValue: { type: Boolean, default: false },
    title: { type: String, required: true },
    message: { type: String, required: true },
    confirmLabel: { type: String, default: "Confirmer" },
    loadingLabel: { type: String, default: "Veuillez patienter..." },
    loading: { type: Boolean, default: false }
});

const emit = defineEmits(["update:modelValue", "confirm"]);
const titleId = `confirmation-title-${Math.random().toString(36).slice(2)}`;
const messageId = `${titleId}-message`;

function cancel() {
    if (!props.loading) emit("update:modelValue", false);
}
</script>

<style scoped>
.confirm-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: rgb(15 23 42 / 55%);
}

.confirm-dialog {
    width: min(100%, 440px);
    padding: 1.5rem;
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 24px 70px rgb(15 23 42 / 25%);
}

.confirm-dialog h2 {
    margin: 0;
    color: #0f172a;
    font-size: 1.15rem;
}

.confirm-dialog p {
    margin: 0.75rem 0 1.5rem;
    color: #475569;
    line-height: 1.55;
}

.confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
}

.cancel-button,
.confirm-button {
    min-height: 40px;
    padding: 0.55rem 1rem;
    border: 0;
    border-radius: 8px;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
}

.cancel-button {
    color: #334155;
    background: #f1f5f9;
}

.confirm-button {
    color: #fff;
    background: #dc2626;
}

.cancel-button:disabled,
.confirm-button:disabled {
    cursor: wait;
    opacity: 0.65;
}

.confirm-enter-active,
.confirm-leave-active {
    transition: opacity 0.16s ease;
}

.confirm-enter-from,
.confirm-leave-to {
    opacity: 0;
}

@media (max-width: 480px) {
    .confirm-actions {
        flex-direction: column-reverse;
    }

    .confirm-actions button {
        width: 100%;
    }
}
</style>
