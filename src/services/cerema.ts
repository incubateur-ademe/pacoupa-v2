import { capture } from "./sentry";
import { CeremaApiResponse, CeremaFeatureAttributes } from "@/types/cerema";
import { CeremaProperty, ECS_ENERGIES, ECS_TYPES, HEATING_EMITTER_TYPES, HEATING_ENERGIES, HEATING_TYPES, StandardCeremaResponse } from "@/types/responses/property";

const CEREMA_API_URL = "https://cartagene.cerema.fr/server/rest/services/Hosted/pacoupa/FeatureServer/0/query";

export async function getCeremaData(address: string): Promise<CeremaFeatureAttributes[]> {
  try {
    const params = new URLSearchParams({
      f: "json",
      where: `adresse = '${address}'`,
      outFields: "*",
      returnGeometry: "true",
    });

    const url = `${CEREMA_API_URL}?${params.toString()}`;
    const response = await fetch(url);
    const data = (await response.json()) as CeremaApiResponse;

    return (data.features as CeremaFeatureAttributes[]) || [];
  } catch (error) {
    capture(error);
    throw new Error(`Failed to fetch CEREMA data: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function transformCeremaData(rawData: CeremaFeatureAttributes[]): StandardCeremaResponse {
  if (!rawData || !rawData.length) {
    return {
      total: 0,
      data: {
        address: null,
        constructionYear: null,
        housingCount: null,
        heatedArea: null,
        heatingNeedCerema: null,
        ecsNeedCerema: null,
        heatingType: null,
        heatingEnergy: null,
        heatingEmitterType: null,
        ecsType: null,
        ecsEnergy: null,
        constraintsHeritage: null,
        constraintsEnvironmental: null,
        constraintsAtmosphereProtection: false,
        geothermalWaterZoning: null,
        geothermalWaterEnergyPotential: null,
        geothermalProbeZoning: null,
        geothermalProbeCoverageRate: null,
        solarThermalEnergyProduction: null,
        solarThermalCoverageRate: null,
      },
    };
  }

  if (rawData.length === 1) {
    return {
      total: 1,
      data: transformSingleProperty(rawData[0]!),
    };
  }

  const allSameCharacteristics = areAllPropertiesSimilar(rawData);

  if (allSameCharacteristics) {
    return {
      total: 1,
      data: transformSingleProperty(rawData[0]!),
    };
  }

  return {
    total: rawData.length,
    data: rawData.map((feature) => transformSingleProperty(feature)),
  };
}

const energyMapping: Record<string, string> = {
  "gpl/butane/propane": "GPL/BUTANE/PROPANE",
  fioul: "FIOUL",
  gaz: "GAZ",
  "reseau de chaleur": "RC",
  bois: "BOIS",
  electricite: "ELECTRIQUE",
  charbon: "CHARBON",
  solaire: "SOLAIRE",
};

const typeMapping: Record<string, string> = {
  "plancher chauffant": "PLANCHER CHAUFFANT",
  radiateur: "RADIATEURS",
  radiateurs: "RADIATEURS",
  convecteur: "CONVECTEURS",
  convecteurs: "CONVECTEURS",
};

function areAllPropertiesSimilar(features: CeremaFeatureAttributes[]): boolean {
  if (!features || features.length <= 1) return true;

  const keyFields = [
    "annee_construction",
    "nb_logement",
    "surf_res_ind",
    "surf_res_col",
    "surf_ter",
    "besoin_res_ind_ch",
    "besoin_res_col_ch",
    "besoin_ter_ch",
    "besoin_res_ind_ecs",
    "besoin_res_col_ecs",
    "besoin_ter_ecs",
    "type_installation_chauffage",
    "type_energie_chauffage",
    "type_generateur_chauffage",
    "type_installation_ecs",
    "type_energie_ecs",
  ];

  const reference = features[0]!.attributes;

  for (let i = 1; i < features.length; i++) {
    const current = features[i]!.attributes;

    for (const field of keyFields) {
      if (reference[field] !== current[field]) {
        return false;
      }
    }
  }

  return true;
}

function transformSingleProperty(feature: CeremaFeatureAttributes): CeremaProperty {
  const attributes = feature.attributes;

  let heatingType: CeremaProperty["heatingType"] = null;
  if (HEATING_TYPES.includes(attributes.type_installation_chauffage?.toLowerCase())) {
    heatingType = attributes.type_installation_chauffage?.toLowerCase();
  }
  let heatingEnergy: CeremaProperty["heatingEnergy"] = null;
  if (HEATING_ENERGIES.includes(attributes.type_energie_chauffage?.toUpperCase())) {
    heatingEnergy = attributes.type_energie_chauffage?.toUpperCase() as CeremaProperty["heatingEnergy"];
  }
  let heatingEmitterType: CeremaProperty["heatingEmitterType"] = null;
  if (HEATING_EMITTER_TYPES.includes(attributes.type_generateur_chauffage?.toLowerCase())) {
    heatingEmitterType = attributes.type_generateur_chauffage?.toLowerCase();
  }
  let ecsType: CeremaProperty["ecsType"] = null;
  if (ECS_TYPES.includes(attributes.type_installation_ecs?.toLowerCase())) {
    ecsType = attributes.type_installation_ecs?.toLowerCase();
  }
  let ecsEnergy: CeremaProperty["ecsEnergy"] = null;
  if (ECS_ENERGIES.includes(attributes.type_energie_ecs?.toUpperCase())) {
    ecsEnergy = attributes.type_energie_ecs?.toUpperCase();
  }
  let constraintsHeritage: CeremaProperty["constraintsHeritage"] = null;
  if (attributes.ac1 === 1) constraintsHeritage = "monument historique";
  if (attributes.ac4 === 1) constraintsHeritage = "site patrimonial remarquable";
  let constraintsEnvironmental: CeremaProperty["constraintsEnvironmental"] = null;
  if (attributes.ac2 === 1) constraintsEnvironmental = "site inscrit ou classé";
  if (attributes.ac3 === 1) constraintsEnvironmental = "réserve naturelle";

  return {
    address: attributes.adresse,
    constructionYear: attributes.annee_construction ? attributes.annee_construction : null,
    housingCount: attributes.nb_logement ? attributes.nb_logement.toString() : null,
    heatedArea: (attributes.surf_res_ind || 0) + (attributes.surf_res_col || 0) + (attributes.surf_ter || 0),
    heatingNeedCerema: ((attributes.besoin_res_ind_ch || 0) + (attributes.besoin_res_col_ch || 0) + (attributes.besoin_ter_ch || 0)) * 1000,
    ecsNeedCerema: (attributes.besoin_res_ind_ecs || 0) + (attributes.besoin_res_col_ecs || 0) + (attributes.besoin_ter_ecs || 0) * 1000,
    heatingType: heatingType,
    heatingEnergy: heatingEnergy,
    heatingEmitterType: heatingEmitterType,
    ecsType: ecsType,
    ecsEnergy: ecsEnergy,
    constraintsHeritage: constraintsHeritage,
    constraintsEnvironmental: constraintsEnvironmental,
    constraintsAtmosphereProtection: constraintsEnvironmental !== null || constraintsHeritage !== null || attributes.liste_ppa ? true : false,
    geothermalWaterZoning: attributes.gmi_nappe_200,
    geothermalWaterEnergyPotential: attributes.pot_nappe_text || null,
    geothermalProbeZoning: attributes.gmi_sonde_200,
    geothermalProbeCoverageRate: attributes.couv_sondes_200,
    solarThermalEnergyProduction: attributes.prod_st_mwh_an,
    solarThermalCoverageRate: attributes.couv_st_ecs,
  };
}
