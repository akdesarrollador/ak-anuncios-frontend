import { persist } from "zustand/middleware";
import { create } from "zustand";
import login from "../api/login";

export const useAuthStore = create<any>()(persist((set) => ({
    password: null,
    content: null,
    summary: null,
    onRequestDeviceData: async (password: string) => {
        const data = await login(password)
        if(data.content && data.summary) set({ password, content: data.content, summary: data.summary })
        else set({ password: null, content: null, summary: null })
    },
    onLogin: async (password: string) => {
        const data = await login(password)

        if(data.content && data.summary) {
            set({ password, content: data.content, summary: data.summary })
        } else set({ password: null, content: null, summary: null })
    },
    onLogout: () => {
        set({ password: null, content: null, summary: null });
    }
}), { name: "device" }));