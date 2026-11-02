import { ref } from "vue";

const toasts = ref([]);
let nextId = 1;

function add(type, message, duration = 4000) {
    const id = nextId++;

    toasts.value.push({
        id,
        type,
        message,
        duration
    });

    window.setTimeout(() => {
        remove(id);
    }, duration);
}

function remove(id) {
    toasts.value = toasts.value.filter(
        (toast) => toast.id !== id
    );
}

function success(message, duration = 4000) {
    add("success", message, duration);
}

function error(message, duration = 5000) {
    add("error", message, duration);
}

function warning(message, duration = 4500) {
    add("warning", message, duration);
}

function info(message, duration = 4000) {
    add("info", message, duration);
}

export function useToast() {
    return {
        toasts,
        add,
        remove,
        success,
        error,
        warning,
        info
    };
}
