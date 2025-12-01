/**
 * Solution type for heating and cooling solutions
 */
export type Solution = {
  slug: string;
  title: string;
  type: "collectif" | "individuel";
  description: string;
  hasHeating: boolean;
  hasEcs: boolean;
  hasCooling: boolean;
  costMaterial: string;
  costMaintenance: string;
  costMwh: string;
  dpeGain: string;
  co2Emissions: string;
  noiseLevel: string;
  installationImpact: string;
  emitterTypeRequired: string;
  distanceRequirement: string;
  indoorSpaceRequired: string;
  outdoorSpaceRequired: string;
  otherConditions: string[];
  fullDescription: string;
  icon?: string;
  illustration?: string;
  ficheEnr?: string;
  example?: {
    estNeuf?: boolean;
    titrePrincipal?: string;
    lieu?: string;
    codeDepartement?: string;
    nbLogements?: number;
    nbm2?: number;
    anneeConstruction?: number;
    avantChauffage?: string;
    avantECS?: string;
    apresChauffage?: string;
    apresECS?: string;
    isolation?: string;
    detailMaterielsInstalles?: string[];
    maitreOuvrage?: string;
    bureauEtude?: string;
    installateur?: string;
    anneeLivraison?: number;
    avantages?: string[];
    images?: string[];
  };
};

export type SolutionRequirementKey = "emitterTypeRequired" | "distanceRequirement" | "outdoorSpaceRequired" | "indoorSpaceRequired";

export type MissingCondition = {
  message: string;
  requirement?: SolutionRequirementKey;
};

export type RecommendedSolution = {
  solution: Solution;
  priority: number;
  message?: string;
};

export type NonRecommendedSolution = {
  solution: Solution;
  missingConditions: MissingCondition[];
  priority: number;
};

export type SolutionsResult = {
  recommendedSolutions: RecommendedSolution[];
  nonRecommendedSolutions: NonRecommendedSolution[];
  message: string[];
};

export type Property = {
  address: string;
  lat: number;
  lon: number;
  constructionYear: number;
  housingCount: string;
  heatedArea: number;
  type: string;
  ownerType: string;

  energyNeedCSTB: string;
  heatingNeedCerema: number | undefined;
  ecsNeedCerema: number | undefined;

  dlceGas: string;
  dlceElectricity: string;
  dlceHeat: string;

  heatingType: "collectif" | "individuel" | "";
  heatingEnergy: "FIOUL" | "GPL/BUTANE/PROPANE" | "GAZ" | "BOIS" | "ELECTRIQUE" | "CHARBON" | "SOLAIRE" | "RF" | "RC" | "";
  heatingEmitterType: "PLANCHER CHAUFFANT" | "RADIATEURS" | "CONVECTEURS" | "";
  emitterTemperature: string;
  heatingBackupEnergy: string;

  ecsType: "collectif" | "individuel" | "";
  ecsEnergy: "FIOUL" | "GPL/BUTANE/PROPANE" | "GAZ" | "BOIS" | "ELECTRIQUE" | "CHARBON" | "SOLAIRE" | "RF" | "RC" | "";
  renewableProduction: string;

  heritageProtection: string;
  environmentalProtection: string;
  airQuality: string;
  icu: string;
  parcelAccessibility: string;
  outdoorTechnicalRoom: boolean;
  outdoorSharedSpaceAvailable: boolean;
  outdoorPrivateSpaceAvailable: boolean;
  outdoorRoofTerraceAvailable: boolean;

  fcuIsInPDP: boolean;
  fcuIsEligible: boolean;
  fcuDistance: number;
  fcuNetworkUrl: string;

  geothermalWaterZoning: 1 | 2 | 3 | null;
  geothermalWaterEnergyPotential: string;
  geothermalWaterTechnicalPotential: boolean;

  geothermalProbeZoning: 1 | 2 | 3 | null;
  geothermalProbeCount: string;
  geothermalProbeEnergyProduction: string;
  geothermalProbeCoverageRate: number;

  solarThermalEnergyProduction: number;
  solarThermalCoverageRate: number;

  envelopeQuality: string;
  hasEnvelopeInsulationWalls?: boolean;
  hasEnvelopeInsulationRoof?: boolean;
  hasEnvelopeInsulationFloors?: boolean;
  hasEnvelopeInsulationWindows?: boolean;

  constraintsHeritage: "monument historique" | "site patrimonial remarquable" | "aucune" | "";
  constraintsEnvironmental: "site inscrit ou classé" | "réserve naturelle" | "aucune" | "";
  constraintsAtmosphereProtection: boolean;
  // fetch guards
  ceremaFetchedAddress?: string;
  fcuFetchedCoordsKey?: string;
};
