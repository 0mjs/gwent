import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const ALL_FILTER_VALUE = "All";

export type SortField =
  | "collected"
  | "name"
  | "deck"
  | "expansion"
  | "territory"
  | "type"
  | "risk";
export type SortDirection = "asc" | "desc";
export type CheckedFilter = "all" | "checked" | "unchecked";
export type MissableFilter = "all" | "safe" | "caution" | "missable";

type CardFiltersStore = {
  search: string;
  deck: string;
  expansion: string;
  territory: string;
  cardType: string;
  missableFilter: MissableFilter;
  checkedFilter: CheckedFilter;
  sortField: SortField;
  sortDirection: SortDirection;
  setSearch: (value: string) => void;
  setDeck: (value: string) => void;
  setExpansion: (value: string) => void;
  setTerritory: (value: string) => void;
  setCardType: (value: string) => void;
  setMissableFilter: (value: MissableFilter) => void;
  setCheckedFilter: (value: CheckedFilter) => void;
  clearFilters: () => void;
  toggleSort: (field: SortField) => void;
};

const initialFilterState = {
  search: "",
  deck: ALL_FILTER_VALUE,
  expansion: ALL_FILTER_VALUE,
  territory: ALL_FILTER_VALUE,
  cardType: ALL_FILTER_VALUE,
  missableFilter: "all" as MissableFilter,
  checkedFilter: "all" as CheckedFilter,
  sortField: "collected" as SortField,
  sortDirection: "desc" as SortDirection
};

export const useCardFiltersStore = create<CardFiltersStore>()(
  persist(
    (set, get) => ({
      ...initialFilterState,
      setSearch: (search) => set({ search }),
      setDeck: (deck) => set({ deck }),
      setExpansion: (expansion) => set({ expansion }),
      setTerritory: (territory) => set({ territory }),
      setCardType: (cardType) => set({ cardType }),
      setMissableFilter: (missableFilter) => set({ missableFilter }),
      setCheckedFilter: (checkedFilter) => set({ checkedFilter }),
      clearFilters: () =>
        set({
          search: "",
          deck: ALL_FILTER_VALUE,
          expansion: ALL_FILTER_VALUE,
          territory: ALL_FILTER_VALUE,
          cardType: ALL_FILTER_VALUE,
          missableFilter: "all",
          checkedFilter: "all"
        }),
      toggleSort: (field) => {
        const { sortField, sortDirection } = get();

        if (field === sortField) {
          set({ sortDirection: sortDirection === "asc" ? "desc" : "asc" });
          return;
        }

        set({ sortField: field, sortDirection: "asc" });
      }
    }),
    {
      name: "gwent-filter-state-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        search: state.search,
        deck: state.deck,
        expansion: state.expansion,
        territory: state.territory,
        cardType: state.cardType,
        missableFilter: state.missableFilter,
        checkedFilter: state.checkedFilter,
        sortField: state.sortField,
        sortDirection: state.sortDirection
      })
    }
  )
);
