import { create } from "zustand";
import { Property, SolutionsResult } from "../types";
interface PropertyState {
  property: Property;
  solutions: SolutionsResult | null;
  setProperty: (updates: Partial<Property>) => void;
  setSolutions: (solutions: SolutionsResult | null) => void;
}

export const useStore = create<PropertyState>((set) => ({
  // État initial de la propriété / corespondance Excel
  property: {
    address: "",
    lat: 0,
    lon: 0,
    constructionYear: 0,
    heatedArea: 0,
    type: "",
    ownerType: "",
    housingCount: "",

    energyNeedCSTB: "",
    heatingNeedCerema: undefined,
    ecsNeedCerema: undefined,

    dlceGas: "",
    dlceElectricity: "",
    dlceHeat: "",

    heatingType: "",
    heatingEnergy: "",
    heatingEmitterType: "",
    emitterTemperature: "",
    heatingBackupEnergy: "",

    ecsType: "",
    ecsEnergy: "",
    renewableProduction: "",

    heritageProtection: "",
    environmentalProtection: "",
    airQuality: "",
    icu: "",
    parcelAccessibility: "",
    outdoorTechnicalRoom: false,
    outdoorSharedSpaceAvailable: false,
    outdoorPrivateSpaceAvailable: false,
    outdoorRoofTerraceAvailable: false,

    fcuIsInPDP: false,
    fcuIsEligible: false,
    fcuDistance: 0,
    fcuNetworkUrl: "",

    geothermalWaterZoning: null,
    geothermalWaterEnergyPotential: "",
    geothermalWaterTechnicalPotential: false,

    geothermalProbeZoning: null,
    geothermalProbeCount: "",
    geothermalProbeEnergyProduction: "",
    geothermalProbeCoverageRate: 0,

    solarThermalEnergyProduction: 0,
    solarThermalCoverageRate: 0,

    envelopeQuality: "",
    hasEnvelopeInsulationWalls: false,
    hasEnvelopeInsulationRoof: false,
    hasEnvelopeInsulationFloors: false,
    hasEnvelopeInsulationWindows: false,
    constraintsHeritage: "",
    constraintsEnvironmental: "",
    constraintsAtmosphereProtection: false,
    ceremaFetchedAddress: undefined,
    fcuFetchedCoordsKey: undefined,
  },

  solutions: null,

  setProperty: (updates: Partial<Property>) =>
    set((state) => ({
      property: { ...state.property, ...updates },
    })),

  setSolutions: (solutions: SolutionsResult | null) => set({ solutions }),
}));
