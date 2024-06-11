import create from 'zustand';

export const useYearsStore = create(set => ({
  startAtYear: 2014,
  endAtYear: new Date().getFullYear(),
  setStartAtYear: startAtYear => set(() => ({ startAtYear })),
  setEndAtYear: endAtYear => set(() => ({ endAtYear })),
}));
