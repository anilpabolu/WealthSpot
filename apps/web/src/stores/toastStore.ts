import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

interface ToastState {
  toasts: Toast[]
  dismissInterval: number
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  setDismissInterval: (ms: number) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  dismissInterval: 3000,

  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  setDismissInterval: (ms) => set({ dismissInterval: ms }),
}))
