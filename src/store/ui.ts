import { create } from "zustand";
import { todayKey, type CalendarView } from "@/lib/pauta";

type UiState = {
  view: CalendarView;
  cursor: string;
  selectedDate: string | null;
  selectedPostId: number | null;
  formOpen: boolean;
  editingPostId: number | null;
  settingsOpen: boolean;
  setView: (view: CalendarView) => void;
  setCursor: (cursor: string) => void;
  selectDate: (date: string | null) => void;
  selectPost: (id: number | null) => void;
  openForm: (postId?: number | null) => void;
  closeForm: () => void;
  openSettings: () => void;
  closeSettings: () => void;
};

const today = todayKey();

export const useUi = create<UiState>()((set) => ({
  view: "month",
  cursor: today,
  selectedDate: today,
  selectedPostId: null,
  formOpen: false,
  editingPostId: null,
  settingsOpen: false,
  setView: (view) => set({ view }),
  setCursor: (cursor) => set({ cursor }),
  selectDate: (selectedDate) => set({ selectedDate }),
  selectPost: (selectedPostId) => set({ selectedPostId }),
  openForm: (postId = null) =>
    set({ formOpen: true, editingPostId: postId ?? null, selectedPostId: null }),
  closeForm: () => set({ formOpen: false, editingPostId: null }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
}));
