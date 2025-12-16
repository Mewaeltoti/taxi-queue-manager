import { create } from "zustand";

export const useQueueStore = create((set) => ({
  queue: [],
  loading: false,

  setQueue: (queue) => set({ queue }),
  addTaxiLocal: (taxi) =>
    set((state) => ({ queue: [...state.queue, taxi] })),
  removeTaxiLocal: (id) =>
    set((state) => ({
      queue: state.queue.filter((t) => t.id !== id),
    })),
  setLoading: (loading) => set({ loading }),
}));
