import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export type Theme = "light" | "dark";

interface ThemeState {
  state: Theme;
}

interface ThemeActions {
  set: (theme: Theme) => void;
  toggle: () => void;
}

export type ThemeStore = ThemeState & ThemeActions;

const initialTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
  ? "dark"
  : "light";

document.documentElement.classList.toggle("dark", initialTheme === "dark");

const toggleTheme = (theme: Theme) => (theme === "light" ? "dark" : "light");

export const useThemeStore = create<ThemeStore>()(
  devtools(
    immer((set) => ({
      state: initialTheme,
      set: (theme) => {
        set((state) => {
          state.state = theme;
        });
      },
      toggle: () => {
        set((state) => {
          state.state = toggleTheme(state.state);
        });
      },
    })),
    { name: "theme" }
  )
);
