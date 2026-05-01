import { create } from 'zustand';

interface UIState {
  activeFilters: Record<string, any>;
  sidebarOpen: boolean;
  selectedCandidateId: string | null;
  
  // Actions
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  toggleSidebar: (force?: boolean) => void;
  setSelectedCandidate: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeFilters: {},
  sidebarOpen: false,
  selectedCandidateId: null,

  setFilter: (key, value) => {
    set((state) => ({
      activeFilters: {
        ...state.activeFilters,
        [key]: value,
      },
    }));
  },

  clearFilters: () => {
    set({ activeFilters: {} });
  },

  toggleSidebar: (force) => {
    set((state) => ({
      sidebarOpen: force ?? !state.sidebarOpen,
    }));
  },

  setSelectedCandidate: (id) => {
    set({ selectedCandidateId: id });
  },
}));
