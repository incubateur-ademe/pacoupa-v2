// Property response types

export const HEATING_TYPES = ["collectif", "individuel"] as const;
export const HEATING_ENERGIES = ["GPL/BUTANE/PROPANE", "FIOUL", "GAZ", "RC", "BOIS", "ELECTRIQUE", "CHARBON", "SOLAIRE"] as const;
export const HEATING_EMITTER_TYPES = ["PLANCHER CHAUFFANT", "RADIATEURS", "CONVECTEURS"] as const;
export const ECS_TYPES = ["collectif", "individuel"] as const;
export const ECS_ENERGIES = ["GPL/BUTANE/PROPANE", "FIOUL", "GAZ", "RC", "BOIS", "ELECTRIQUE", "CHARBON", "SOLAIRE"] as const;
export const CONSTRAINTS_HERITAGE = ["monument historique", "site patrimonial remarquable"] as const;
export const CONSTRAINTS_ENVIRONMENTAL = ["site inscrit ou classé", "réserve naturelle"] as const;

export interface CeremaProperty {
  address: string | null;
  constructionYear: number | null;
  housingCount: string | null;
  heatedArea: number | null;
  heatingNeedCerema: number | null;
  ecsNeedCerema: number | null;
  heatingType: (typeof HEATING_TYPES)[number] | null;
  heatingEnergy: (typeof HEATING_ENERGIES)[number] | null;
  heatingEmitterType: (typeof HEATING_EMITTER_TYPES)[number] | null;
  ecsType: (typeof ECS_TYPES)[number] | null;
  ecsEnergy: (typeof ECS_ENERGIES)[number] | null;
  constraintsHeritage: (typeof CONSTRAINTS_HERITAGE)[number] | null;
  constraintsEnvironmental: (typeof CONSTRAINTS_ENVIRONMENTAL)[number] | null;
  constraintsAtmosphereProtection: boolean;
  geothermalWaterZoning: 1 | 2 | 3 | null;
  geothermalWaterEnergyPotential: string | null;
  geothermalProbeZoning: 1 | 2 | 3 | null;
  geothermalProbeCoverageRate: number | null;
  solarThermalEnergyProduction: number | null;
  solarThermalCoverageRate: number | null;
}

export interface StandardCeremaResponse {
  total: number;
  data: CeremaProperty | CeremaProperty[];
}

export interface FcuEligibilityResponse {
  distance: number;
  futurNetwork: boolean;
  gestionnaire: string;
  id: string;
  inPDP: boolean;
  isBasedOnIris: boolean;
  isEligible: boolean;
  rateCO2: number;
  rateENRR: number;
}
