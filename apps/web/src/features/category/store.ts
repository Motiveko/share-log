import type { LogCategory, CreateCategoryDto, UpdateCategoryDto } from "@repo/interfaces";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { API } from "@web/api";
import { logger } from "@web/lib/logger";

type StateStatus = "idle" | "loading" | "success" | "error";

interface CategoryState {
  categories: LogCategory[];
  status: StateStatus;
}

interface CategoryActions {
  fetchCategories: (workspaceId: number) => Promise<void>;
  createCategory: (workspaceId: number, dto: CreateCategoryDto) => Promise<LogCategory>;
  updateCategory: (workspaceId: number, categoryId: number, dto: UpdateCategoryDto) => Promise<LogCategory>;
  deleteCategory: (workspaceId: number, categoryId: number) => Promise<void>;
  reset: () => void;
}

export type CategoryStore = CategoryState & CategoryActions;

const initialState: CategoryState = {
  categories: [],
  status: "idle",
};

export const useCategoryStore = create<CategoryStore>()(
  devtools(
    immer((set) => ({
      ...initialState,

      fetchCategories: async (workspaceId: number) => {
        try {
          set((state) => {
            state.status = "loading";
          });
          const categories = await API.category.list(workspaceId);
          set((state) => {
            state.categories = categories;
            state.status = "success";
          });
        } catch (error) {
          logger.error(error);
          set((state) => {
            state.status = "error";
          });
        }
      },

      createCategory: async (workspaceId: number, dto: CreateCategoryDto) => {
        const category = await API.category.create(workspaceId, dto);
        set((state) => {
          state.categories.push(category);
        });
        return category;
      },

      updateCategory: async (
        workspaceId: number,
        categoryId: number,
        dto: UpdateCategoryDto
      ) => {
        const category = await API.category.update(workspaceId, categoryId, dto);
        set((state) => {
          const index = state.categories.findIndex((c) => c.id === categoryId);
          if (index !== -1) {
            state.categories[index] = category;
          }
        });
        return category;
      },

      deleteCategory: async (workspaceId: number, categoryId: number) => {
        await API.category.remove(workspaceId, categoryId);
        set((state) => {
          state.categories = state.categories.filter((c) => c.id !== categoryId);
        });
      },

      reset: () => {
        set((state) => {
          Object.assign(state, initialState);
        });
      },
    })),
    { name: "category" }
  )
);
