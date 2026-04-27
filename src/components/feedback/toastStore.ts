import { create } from 'zustand';
import {
  FEEDBACK_TOAST_DEFAULT_DURATION,
  FEEDBACK_TOAST_EXIT_DURATION,
  type FeedbackToastType,
} from './config';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  duration?: number;
  description?: string;
  action?: ToastAction;
}

export interface ToastItem {
  id: string;
  message: string;
  type: FeedbackToastType;
  duration?: number;
  description?: string;
  action?: ToastAction;
  closing?: boolean;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (message: string, type: FeedbackToastType, options?: ToastOptions) => string;
  dismissToast: (id: string) => void;
  removeToast: (id: string) => void;
  clear: () => void;
}

const dismissTimers = new Map<string, number>();
const removeTimers = new Map<string, number>();

function createToastId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (message, type, options) => {
    const id = createToastId();
    const duration = options?.duration ?? FEEDBACK_TOAST_DEFAULT_DURATION;

    set((state) => ({
      toasts: [
        {
          id,
          message,
          type,
          duration,
          description: options?.description,
          action: options?.action,
          closing: false,
        },
        ...state.toasts,
      ],
    }));

    const dismissTimer = window.setTimeout(() => {
      get().dismissToast(id);
    }, duration);

    dismissTimers.set(id, dismissTimer);
    return id;
  },
  dismissToast: (id) => {
    const existing = get().toasts.find((toast) => toast.id === id);
    if (!existing) return;

    const dismissTimer = dismissTimers.get(id);
    if (dismissTimer) {
      window.clearTimeout(dismissTimer);
      dismissTimers.delete(id);
    }

    const removeTimer = removeTimers.get(id);
    if (removeTimer) {
      window.clearTimeout(removeTimer);
      removeTimers.delete(id);
    }

    set((state) => ({
      toasts: state.toasts.map((toast) =>
        toast.id === id ? { ...toast, closing: true } : toast
      ),
    }));

    const scheduledRemoval = window.setTimeout(() => {
      get().removeToast(id);
    }, FEEDBACK_TOAST_EXIT_DURATION);

    removeTimers.set(id, scheduledRemoval);
  },
  removeToast: (id) => {
    const dismissTimer = dismissTimers.get(id);
    if (dismissTimer) {
      window.clearTimeout(dismissTimer);
      dismissTimers.delete(id);
    }

    const removeTimer = removeTimers.get(id);
    if (removeTimer) {
      window.clearTimeout(removeTimer);
      removeTimers.delete(id);
    }

    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
  clear: () => {
    dismissTimers.forEach((timer) => window.clearTimeout(timer));
    removeTimers.forEach((timer) => window.clearTimeout(timer));
    dismissTimers.clear();
    removeTimers.clear();
    set({ toasts: [] });
  },
}));

function addToast(message: string, type: FeedbackToastType, options?: ToastOptions) {
  return useToastStore.getState().addToast(message, type, options);
}

export const toast = {
  success: (message: string, options?: ToastOptions) => addToast(message, 'success', options),
  error: (message: string, options?: ToastOptions) => addToast(message, 'error', options),
  delete: (message: string, options?: ToastOptions) => addToast(message, 'delete', options),
  warning: (message: string, options?: ToastOptions) => addToast(message, 'warning', options),
  info: (message: string, options?: ToastOptions) => addToast(message, 'info', options),
};
