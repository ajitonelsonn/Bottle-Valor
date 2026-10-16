import type { MaterialId } from "@/lib/types";

export type MaterialDefinition = {
  id: MaterialId;
  label: string;
  shortLabel: string;
  /** Whether BotleValor currently accepts this material. */
  available: boolean;
  /** Estimated kilograms of material diverted per item (demo factor). */
  kgPerItem: number;
  /** Estimated kilograms of CO2e avoided per item (demo factor). */
  co2KgPerItem: number;
};

/**
 * Registry of recyclable materials. The UI reads from this list, so adding a
 * new material later is a data change, not a redesign.
 */
export const MATERIALS: Record<MaterialId, MaterialDefinition> = {
  "plastic-bottle": {
    id: "plastic-bottle",
    label: "Plastic bottle (PET)",
    shortLabel: "Plastic bottles",
    available: true,
    kgPerItem: 0.025,
    co2KgPerItem: 0.06,
  },
  "aluminium-can": {
    id: "aluminium-can",
    label: "Aluminium can",
    shortLabel: "Cans",
    available: false,
    kgPerItem: 0.015,
    co2KgPerItem: 0.1,
  },
  "glass-bottle": {
    id: "glass-bottle",
    label: "Glass bottle",
    shortLabel: "Glass",
    available: false,
    kgPerItem: 0.35,
    co2KgPerItem: 0.1,
  },
  paper: {
    id: "paper",
    label: "Paper & cardboard",
    shortLabel: "Paper",
    available: false,
    kgPerItem: 0.1,
    co2KgPerItem: 0.05,
  },
};

export const MATERIAL_LIST = Object.values(MATERIALS);
export const AVAILABLE_MATERIALS = MATERIAL_LIST.filter((m) => m.available);
