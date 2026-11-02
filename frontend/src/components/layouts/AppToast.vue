<template>
    <Teleport to="body">
        <div
            class="toast-container"
            aria-live="polite"
            aria-atomic="true"
        >
            <TransitionGroup name="toast">
                <div
                    v-for="t in toasts"
                    :key="t.id"
                    :class="['toast', `toast-${t.type}`]"
                    role="alert"
                >
                    <span
                        class="toast-icon"
                        v-html="iconFor(t.type)"
                    ></span>

                    <span class="toast-msg">
                        {{ t.message }}
                    </span>

                    <button
                        type="button"
                        class="toast-close"
                        aria-label="Fermer la notification"
                        @click="remove(t.id)"
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>

                    <div
                        class="toast-progress"
                        :class="`progress-${t.type}`"
                        :style="{
                            animationDuration: `${t.duration}ms`
                        }"
                    ></div>
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>

<script setup>
import { useToast } from "../../composables/useToast.js";

const { toasts, remove } = useToast();

function iconFor(type) {
    const icons = {
        success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
        error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    return icons[type] || icons.info;
}
</script>

<style scoped>
.toast-container {
    position: fixed;
    right: 1.25rem;
    bottom: 1.25rem;
    z-index: 99999;
    display: flex;
    width: min(420px, calc(100vw - 2.5rem));
    flex-direction: column;
    align-items: stretch;
    gap: 0.65rem;
    pointer-events: none;
}

.toast {
    position: relative;
    display: flex;
    min-width: 280px;
    align-items: center;
    gap: 0.65rem;
    overflow: hidden;
    pointer-events: auto;
    border: 1px solid #e2e8f0;
    border-radius: 0.7rem;
    background: #ffffff;
    padding: 0.8rem 0.9rem;
    color: #1e293b;
    font-size: 0.85rem;
    font-weight: 550;
    box-shadow: 0 12px 30px rgb(15 23 42 / 0.16);
}

.toast-icon {
    display: flex;
    width: 1.8rem;
    height: 1.8rem;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.toast-success .toast-icon { background: #dcfce7; color: #16a34a; }
.toast-error .toast-icon { background: #fee2e2; color: #dc2626; }
.toast-warning .toast-icon { background: #fef3c7; color: #d97706; }
.toast-info .toast-icon { background: #eff6ff; color: #2563eb; }

.toast-msg {
    flex: 1;
    line-height: 1.4;
}

.toast-close {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 0.3rem;
    background: transparent;
    padding: 0.25rem;
    color: #94a3b8;
    cursor: pointer;
}

.toast-close:hover {
    background: #f1f5f9;
    color: #475569;
}

.toast-progress {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    transform-origin: left;
    animation: shrink linear forwards;
}

.progress-success { background: #22c55e; }
.progress-error { background: #ef4444; }
.progress-warning { background: #f59e0b; }
.progress-info { background: #3b82f6; }

@keyframes shrink {
    from { transform: scaleX(1); }
    to { transform: scaleX(0); }
}

.toast-enter-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.toast-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
    opacity: 0;
    transform: translateY(1.25rem) scale(0.96);
}

.toast-move {
    transition: transform 0.3s ease;
}

@media (max-width: 600px) {
    .toast-container {
        right: 0.75rem;
        bottom: max(0.75rem, env(safe-area-inset-bottom));
        left: 0.75rem;
        width: auto;
    }

    .toast {
        min-width: 0;
        width: 100%;
    }
}
</style>
