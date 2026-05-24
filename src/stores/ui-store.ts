import { create } from "zustand";

export type ThemeMode = "dark" | "light";

type UiState = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
};

export const useUiStore = create<UiState>((set) => ({
  themeMode: "dark",
  setThemeMode: (themeMode) => set({ themeMode }),
}));
