import type { StateCreator } from 'zustand';

export interface UiSlice {
  // UI state
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  language: string;

  // UI actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: string) => void;
}

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  sidebarOpen: false,
  theme: 'light',
  language: 'en',

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  setTheme: (theme: 'light' | 'dark') => set({ theme }),
  setLanguage: (language: string) => set({ language }),
});