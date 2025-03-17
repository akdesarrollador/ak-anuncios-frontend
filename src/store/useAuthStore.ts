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
        console.log(`onLogin function called. Login for password: ${password}`)
        const data = await login(password)

        if(data.content && data.summary) {
            set({ password, content: data.content, summary: data.summary })
            console.log(`content and summary was returned by login and set in LS. ${data}`)
        } else set({ password: null, content: null, summary: null })
    },
    onLogout: () => {
        set({ password: null, content: null, summary: null });
        console.log('LS reset.')
    }
}), { name: "device" }));