// apps/user/src/components/beginner/mascotVariantStore.ts
import { create } from "zustand";

export type MascotVariant = "studying" | "success" | "encourage";

type State = {
	variant: MascotVariant;
	setVariant: (variant: MascotVariant) => void;
	resetVariant: () => void;
};

export const useMascotVariantStore = create<State>((set) => ({
	variant: "studying",
	setVariant: (variant) => set({ variant }),
	resetVariant: () => set({ variant: "studying" }),
}));
