import { Property, SolutionsResult, MissingCondition } from "../types";
import { SOLUTIONS } from "../utils/solutions";

const computeEnvelopQuality = async (property: Property): Promise<string> => {
  // Check for isolation measures
  const isolationMeasures = [
    property.hasEnvelopeInsulationWindows,
    property.hasEnvelopeInsulationWalls,
    property.hasEnvelopeInsulationFloors,
    property.hasEnvelopeInsulationRoof,
  ].filter(Boolean).length;

  if (isolationMeasures >= 4 || property.constructionYear >= 2005) {
    return "GOOD";
  }

  if (property.constructionYear >= 1998 && property.constructionYear <= 2005 && isolationMeasures >= 2) {
    return "MEDIUM";
  }

  return "BAD";
};

const computeSolutions = async (property: Property) => {
  console.log(property.heatingType, property.ecsType);
  if (property.heatingType === "collectif" && property.ecsType === "collectif") {
    console.log("computeScenarioChColEcsCol");
    return computeScenarioChColEcsCol(property);
  }
  if (property.heatingType === "collectif" && property.ecsType === "individuel") {
    console.log("computeScenarioChColEcsIndiv");
    return computeScenarioChColEcsIndiv(property);
  }
  if (property.heatingType === "individuel" && property.ecsType === "individuel" && property.heatingEnergy === "GAZ" && property.ecsEnergy === "GAZ") {
    console.log("computeScenarioChIndivEcsIndivGaz");
    return computeScenarioChIndivEcsIndivGaz(property);
  }
  if (property.heatingType === "individuel" && property.ecsType === "individuel" && property.heatingEnergy === "ELECTRIQUE" && property.ecsEnergy === "ELECTRIQUE") {
    console.log("computeScenarioChIndivEcsIndivElectricity");
    return computeScenarioChIndivEcsIndivElectricity(property);
  }

  let data: SolutionsResult = {
    recommendedSolutions: [],
    nonRecommendedSolutions: [],
    message: [],
  };
  return data;
};

const computeScenarioChColEcsCol = async (property: Property): Promise<SolutionsResult> => {
  let data: SolutionsResult = {
    recommendedSolutions: [],
    nonRecommendedSolutions: [],
    message: [],
  };
  if (["RC", "SOLAIRE", "BOIS"].includes(property.heatingEnergy)) {
    data.message.push("Félicitations vous êtes déjà en énergie renouvelable");
    return data;
  }

  if (["RC", "SOLAIRE", "BOIS"].includes(property.ecsEnergy)) {
    data.message.push("Félicitations vous êtes déjà en énergie renouvelable");
  }

  // Check if property is in a priority deployment zone for a heat network
  if (property.fcuIsInPDP) {
    data.message.push(
      "Vous êtes en zone de déploiement prioritaire d'un réseau de chaleur. Il est possible qu'une demande de raccordement au réseau soit obligatoire en cas de changement de système de chauffage."
    );
  }

  // Check if property is in a potential or high potential zone for heat network development
  if (property.fcuIsEligible) {
    data.message.push("Vous êtes en zone de potentiel pour le développement d'un réseau de chaleur, informez vous sur un projet en cours.");
  }

  // RC : solution privilégiée si émetteur est plancher chauffant à eau ou radiateur à eau et distance < 100m
  const heatNetworkSolution = SOLUTIONS.find((s) => s.slug === "reseau-chaleur");
  if (heatNetworkSolution) {
    const hasCompatibleEmitter = property.heatingEmitterType === "PLANCHER CHAUFFANT" || property.heatingEmitterType === "RADIATEURS";
    const isCloseToNetwork = property.fcuDistance < 100;

    if (hasCompatibleEmitter && isCloseToNetwork) {
      data.recommendedSolutions.push({
        solution: heatNetworkSolution,
        priority: 1,
      });
    } else {
      const missingConditions: MissingCondition[] = [];

      if (!hasCompatibleEmitter) {
        missingConditions.push({
          message: "Émetteur de chaleur non conforme (nécessite plancher chauffant à eau ou radiateur à eau)",
          requirement: "emitterTypeRequired",
        });
      }

      if (!isCloseToNetwork) {
        missingConditions.push({
          message: "Distance au réseau de chaleur supérieure à 100m",
          requirement: "distanceRequirement",
        });
      }

      data.nonRecommendedSolutions.push({
        solution: heatNetworkSolution,
        missingConditions: missingConditions,
        priority: 1,
      });
    }
  }

  const waterWaterHeatPumpSolution = SOLUTIONS.find((s) => s.slug === "pac-eau-eau-nappe-chauffage-ecs");
  if (waterWaterHeatPumpSolution) {
    const missingConditions: MissingCondition[] = [];

    if (property.geothermalWaterZoning === 1 || property.geothermalWaterZoning === 2) {
      missingConditions.push({ message: "Zone GMI non favorable" });
    }

    if (["très fort", "fort"].includes(property.geothermalWaterEnergyPotential)) {
      missingConditions.push({ message: "Potentiel énergétique insuffisant" });
    }

    if (!property.geothermalWaterTechnicalPotential) {
      missingConditions.push({ message: "Potentiel technique non favorable" });
    }

    if (
      (property.heatingEmitterType !== "PLANCHER CHAUFFANT" &&
        (property.heatingEmitterType !== "RADIATEURS" || (property.heatingNeedCerema && property.heatingNeedCerema > 100))) ||
      property.constructionYear < 2005
    ) {
      missingConditions.push({ message: "Système d'émission non adapté", requirement: "emitterTypeRequired" });
    }

    if (missingConditions.length > 0) {
      data.nonRecommendedSolutions.push({
        solution: waterWaterHeatPumpSolution,
        missingConditions: missingConditions,
        priority: 2,
      });
    } else {
      data.recommendedSolutions.push({
        solution: waterWaterHeatPumpSolution,
        priority: 2,
      });
    }
  }

  const groundWaterHeatPumpSolution = SOLUTIONS.find((s) => s.slug === "pac-eau-eau-sonde-chauffage-ecs");
  if (groundWaterHeatPumpSolution) {
    const missingConditions: MissingCondition[] = [];

    if (property.geothermalProbeZoning === 1 || property.geothermalProbeZoning === 2) {
      missingConditions.push({ message: "Zone GMI non favorable" });
    }

    if (property.geothermalProbeCoverageRate < 30) {
      missingConditions.push({ message: "Taux de couverture insuffisant" });
    }

    if (
      (property.heatingEmitterType !== "PLANCHER CHAUFFANT" &&
        (property.heatingEmitterType !== "RADIATEURS" || (property.heatingNeedCerema && property.heatingNeedCerema > 100))) ||
      property.constructionYear < 2005
    ) {
      missingConditions.push({ message: "Système d'émission non adapté", requirement: "emitterTypeRequired" });
    }

    if (missingConditions.length > 0) {
      data.nonRecommendedSolutions.push({
        solution: groundWaterHeatPumpSolution,
        missingConditions: missingConditions,
        priority: 3,
      });
    } else {
      data.recommendedSolutions.push({
        solution: groundWaterHeatPumpSolution,
        priority: 3,
      });
    }
  }

  // Biomasse (chaudière)
  const biomassSolution = SOLUTIONS.find((s) => s.slug === "biomasse-chaudiere");
  if (biomassSolution) {
    const missingConditions: MissingCondition[] = [];

    if (!(property.heatingEmitterType === "PLANCHER CHAUFFANT" || property.heatingEmitterType === "RADIATEURS")) {
      missingConditions.push({
        message: "Émetteur de chaleur non conforme (nécessite plancher chauffant à eau ou radiateur à eau)",
        requirement: "emitterTypeRequired",
      });
    }

    if (!(property.outdoorSharedSpaceAvailable || property.outdoorPrivateSpaceAvailable || property.outdoorRoofTerraceAvailable || property.outdoorTechnicalRoom)) {
      missingConditions.push({
        message: "Espace extérieur insuffisant pour le stockage du combustible et les livraisons",
        requirement: "outdoorSpaceRequired",
      });
    }

    if (missingConditions.length > 0) {
      data.nonRecommendedSolutions.push({
        solution: biomassSolution,
        missingConditions: missingConditions,
        priority: 4,
      });
    } else {
      data.recommendedSolutions.push({
        solution: biomassSolution,
        priority: 4,
      });
    }
  }

  // PAC Air/Eau collective (chauffage + ECS)
  const airWaterHeatPumpWithEcsSolution = SOLUTIONS.find((s) => s.slug === "pac-air-eau-collectif-chauffage-ecs");
  if (airWaterHeatPumpWithEcsSolution) {
    const missingConditions: MissingCondition[] = [];

    if (!(property.outdoorSharedSpaceAvailable || property.outdoorPrivateSpaceAvailable || property.outdoorRoofTerraceAvailable || property.outdoorTechnicalRoom)) {
      missingConditions.push({
        message: "Espace extérieur insuffisant pour l'unité extérieure",
        requirement: "outdoorSpaceRequired",
      });
    }

    if (
      (property.heatingEmitterType !== "PLANCHER CHAUFFANT" &&
        (property.heatingEmitterType !== "RADIATEURS" || (property.heatingNeedCerema && property.heatingNeedCerema > 100))) ||
      property.constructionYear < 2005
    ) {
      missingConditions.push({ message: "Système d'émission non adapté", requirement: "emitterTypeRequired" });
    }

    if (missingConditions.length > 0) {
      data.nonRecommendedSolutions.push({
        solution: airWaterHeatPumpWithEcsSolution,
        missingConditions: missingConditions,
        priority: 5,
      });
    } else {
      data.recommendedSolutions.push({
        solution: airWaterHeatPumpWithEcsSolution,
        priority: 5,
      });
    }
  }

  // Hybridation PAC aéro + chaudière (chauffage + ECS)
  const hybridHeatPumpWithEcsSolution = SOLUTIONS.find((s) => s.slug === "hybride-pac-chaudiere-chauffage-ecs");
  if (hybridHeatPumpWithEcsSolution) {
    const missingConditions: MissingCondition[] = [];

    if (!(property.outdoorSharedSpaceAvailable || property.outdoorPrivateSpaceAvailable || property.outdoorRoofTerraceAvailable || property.outdoorTechnicalRoom)) {
      missingConditions.push({
        message: "Espace extérieur insuffisant pour l'unité extérieure",
        requirement: "outdoorSpaceRequired",
      });
    }

    if (!(property.heatingEmitterType === "PLANCHER CHAUFFANT" || property.heatingEmitterType === "RADIATEURS")) {
      missingConditions.push({
        message: "Émetteur de chaleur non conforme (nécessite plancher chauffant à eau ou radiateur à eau)",
        requirement: "emitterTypeRequired",
      });
    }

    if (missingConditions.length > 0) {
      data.nonRecommendedSolutions.push({
        solution: hybridHeatPumpWithEcsSolution,
        missingConditions: missingConditions,
        priority: 6,
      });
    } else {
      data.recommendedSolutions.push({
        solution: hybridHeatPumpWithEcsSolution,
        priority: 6,
      });
    }
  }

  // Solaire thermique (ECS uniquement)
  const solarThermalSolution = SOLUTIONS.find((s) => s.slug === "solaire-thermique");
  if (solarThermalSolution) {
    const missingConditions: MissingCondition[] = [];

    // C51 : Toiture terrasse disponible
    if (!property.outdoorRoofTerraceAvailable) {
      missingConditions.push({ message: "Toiture terrasse non disponible", requirement: "outdoorSpaceRequired" });
    }

    // C50 : Taux de couverture > 30%
    if (property.solarThermalCoverageRate <= 30) {
      missingConditions.push({ message: "Taux de couverture solaire insuffisant (>30% requis)" });
    }

    if (missingConditions.length > 0) {
      data.nonRecommendedSolutions.push({
        solution: solarThermalSolution,
        missingConditions: missingConditions,
        priority: 7,
      });
    } else {
      data.recommendedSolutions.push({
        solution: solarThermalSolution,
        priority: 7,
      });
    }
  }

  // PAC sur capteurs atmosphériques (ECS uniquement)
  const atmosphericCaptorHeatPumpSolution = SOLUTIONS.find((s) => s.slug === "pac-capteurs-atmospheriques-ecs");
  if (atmosphericCaptorHeatPumpSolution) {
    const missingConditions: MissingCondition[] = [];

    // C51 : Toiture terrasse disponible
    if (!property.outdoorRoofTerraceAvailable) {
      missingConditions.push({ message: "Toiture terrasse non disponible", requirement: "outdoorSpaceRequired" });
    }

    // C33 : Place extérieure disponible
    if (!(property.outdoorSharedSpaceAvailable || property.outdoorPrivateSpaceAvailable || property.outdoorRoofTerraceAvailable || property.outdoorTechnicalRoom)) {
      missingConditions.push({ message: "Espace extérieur insuffisant", requirement: "outdoorSpaceRequired" });
    }

    if (missingConditions.length > 0) {
      data.nonRecommendedSolutions.push({
        solution: atmosphericCaptorHeatPumpSolution,
        missingConditions: missingConditions,
        priority: 8,
      });
    } else {
      data.recommendedSolutions.push({
        solution: atmosphericCaptorHeatPumpSolution,
        priority: 8,
      });
    }
  }

  // PAC sur eaux grises/eau (ECS uniquement)
  const greyWaterHeatPumpSolution = SOLUTIONS.find((s) => s.slug === "pac-eaux-grises-ecs");
  if (greyWaterHeatPumpSolution) {
    // Pas de critère technique bloquant, mais toujours ajoutée avec une alerte
    data.recommendedSolutions.push({
      solution: greyWaterHeatPumpSolution,
      priority: 9,
      message: "Nécessite la mise en place d'un circuit de récupération des eaux grises",
    });
  }

  // PAC air/eau dédiée à l'ECS
  const airWaterEcsHeatPumpSolution = SOLUTIONS.find((s) => s.slug === "pac-air-eau-ecs");
  if (airWaterEcsHeatPumpSolution) {
    const missingConditions: MissingCondition[] = [];

    // C33 et/ou C51 : Espace extérieur disponible ou toiture terrasse
    if (!(property.outdoorSharedSpaceAvailable || property.outdoorPrivateSpaceAvailable || property.outdoorRoofTerraceAvailable || property.outdoorTechnicalRoom)) {
      missingConditions.push({
        message: "Espace extérieur insuffisant pour l'unité extérieure",
        requirement: "outdoorSpaceRequired",
      });
    }

    if (missingConditions.length > 0) {
      data.nonRecommendedSolutions.push({
        solution: airWaterEcsHeatPumpSolution,
        missingConditions: missingConditions,
        priority: 10,
      });
    } else {
      data.recommendedSolutions.push({
        solution: airWaterEcsHeatPumpSolution,
        priority: 10,
      });
    }
  }

  return data;
};

const computeScenarioChColEcsIndiv = async (property: Property): Promise<SolutionsResult> => {
  let data: SolutionsResult = {
    recommendedSolutions: [],
    nonRecommendedSolutions: [],
    message: [],
  };

  if (!["GAZ", "FIOUL", "ELECTRIQUE"].includes(property.heatingEnergy) || !["GAZ", "ELECTRIQUE"].includes(property.ecsEnergy)) {
    return data;
  }

  // 1. RC : solution privilégiée si émetteur compatible et distance < 200m
  const heatNetworkSolution = SOLUTIONS.find((s) => s.slug === "reseau-chaleur");
  if (heatNetworkSolution) {
    const missingConditions: MissingCondition[] = [];

    if (property.heatingEmitterType !== "PLANCHER CHAUFFANT" && property.heatingEmitterType !== "RADIATEURS") {
      missingConditions.push({
        message: "Émetteur de chaleur non conforme (nécessite plancher chauffant à eau ou radiateur à eau)",
        requirement: "emitterTypeRequired",
      });
    }

    if (property.fcuDistance > 200) {
      missingConditions.push({
        message: "Distance au réseau de chaleur supérieure à 200m",
        requirement: "distanceRequirement",
      });
    }

    if (missingConditions.length > 0) {
      data.nonRecommendedSolutions.push({
        solution: heatNetworkSolution,
        missingConditions: missingConditions,
        priority: 1,
      });
    } else {
      data.recommendedSolutions.push({
        solution: heatNetworkSolution,
        priority: 1,
      });
    }
  }

  // 2a. Géothermie nappe (chauffage seul)
  const waterWaterHeatPumpSolution = SOLUTIONS.find((s) => s.slug === "pac-eau-eau-nappe-chauffage");
  if (waterWaterHeatPumpSolution) {
    const missingConditions: MissingCondition[] = [];

    if (property.geothermalWaterZoning === 1 || property.geothermalWaterZoning === 2) {
      missingConditions.push({ message: "Zone GMI non favorable (nécessite zone orange ou vert)" });
    }

    if (!["très fort", "fort"].includes(property.geothermalWaterEnergyPotential)) {
      missingConditions.push({ message: "Potentiel énergétique insuffisant (nécessite très fort ou fort)" });
    }

    if (!property.geothermalWaterTechnicalPotential) {
      missingConditions.push({ message: "Potentiel technique non favorable" });
    }

    if (
      (property.heatingEmitterType !== "PLANCHER CHAUFFANT" &&
        (property.heatingEmitterType !== "RADIATEURS" || (property.heatingNeedCerema && property.heatingNeedCerema > 100))) ||
      property.constructionYear < 2005
    ) {
      missingConditions.push({
        message: "Système d'émission non adapté (nécessite plancher chauffant ou radiateurs avec besoin < 100 kWh/m² ou bâtiment construit après 2005)",
        requirement: "emitterTypeRequired",
      });
    }

    if (missingConditions.length > 0) {
      data.nonRecommendedSolutions.push({
        solution: waterWaterHeatPumpSolution,
        missingConditions: missingConditions,
        priority: 2,
      });
    } else {
      data.recommendedSolutions.push({
        solution: waterWaterHeatPumpSolution,
        priority: 2,
      });
    }
  }

  // 2b. Géothermie sondes (chauffage seul)
  const groundWaterHeatPumpSolution = SOLUTIONS.find((s) => s.slug === "pac-eau-eau-sonde-chauffage");
  if (groundWaterHeatPumpSolution) {
    const missingConditions: MissingCondition[] = [];

    if (property.geothermalProbeZoning === 1 || property.geothermalProbeZoning === 2) {
      missingConditions.push({ message: "Zone GMI non favorable (nécessite zone orange ou vert)" });
    }

    if (property.geothermalProbeCoverageRate < 30) {
      missingConditions.push({ message: "Taux de couverture insuffisant (>30% requis)" });
    }

    if (
      (property.heatingEmitterType !== "PLANCHER CHAUFFANT" &&
        (property.heatingEmitterType !== "RADIATEURS" || (property.heatingNeedCerema && property.heatingNeedCerema > 100))) ||
      property.constructionYear < 2005
    ) {
      missingConditions.push({
        message: "Système d'émission non adapté (nécessite plancher chauffant ou radiateurs avec besoin < 100 kWh/m² ou bâtiment construit après 2005)",
        requirement: "emitterTypeRequired",
      });
    }

    if (missingConditions.length > 0) {
      data.nonRecommendedSolutions.push({
        solution: groundWaterHeatPumpSolution,
        missingConditions: missingConditions,
        priority: 3,
      });
    } else {
      data.recommendedSolutions.push({
        solution: groundWaterHeatPumpSolution,
        priority: 3,
      });
    }
  }

  // 2c. Biomasse (chaudière) - Produit aussi l'ECS
  const biomassSolution = SOLUTIONS.find((s) => s.slug === "biomasse-chaudiere");
  if (biomassSolution) {
    const missingConditions: MissingCondition[] = [];

    if (!(property.heatingEmitterType === "PLANCHER CHAUFFANT" || property.heatingEmitterType === "RADIATEURS")) {
      missingConditions.push({
        message: "Émetteur de chaleur non conforme (nécessite plancher chauffant à eau ou radiateur à eau)",
        requirement: "emitterTypeRequired",
      });
    }

    if (!(property.outdoorSharedSpaceAvailable || property.outdoorPrivateSpaceAvailable || property.outdoorRoofTerraceAvailable || property.outdoorTechnicalRoom)) {
      missingConditions.push({
        message: "Espace extérieur insuffisant pour le stockage du combustible et les livraisons",
        requirement: "outdoorSpaceRequired",
      });
    }

    if (missingConditions.length > 0) {
      data.nonRecommendedSolutions.push({
        solution: biomassSolution,
        missingConditions: missingConditions,
        priority: 4,
      });
    } else {
      data.recommendedSolutions.push({
        solution: biomassSolution,
        priority: 4,
      });
    }
  }

  // 3. PAC Air/Eau collective (chauffage seul)
  const airWaterHeatPumpSolution = SOLUTIONS.find((s) => s.slug === "pac-air-eau-collectif-chauffage");
  if (airWaterHeatPumpSolution) {
    const missingConditions: MissingCondition[] = [];

    if (!(property.outdoorSharedSpaceAvailable || property.outdoorPrivateSpaceAvailable || property.outdoorRoofTerraceAvailable || property.outdoorTechnicalRoom)) {
      missingConditions.push({
        message: "Espace extérieur insuffisant pour l'unité extérieure",
        requirement: "outdoorSpaceRequired",
      });
    }

    if (
      (property.heatingEmitterType !== "PLANCHER CHAUFFANT" &&
        (property.heatingEmitterType !== "RADIATEURS" || (property.heatingNeedCerema && property.heatingNeedCerema > 100))) ||
      property.constructionYear < 2005
    ) {
      missingConditions.push({
        message: "Système d'émission non adapté (nécessite plancher chauffant ou radiateurs avec besoin < 100 kWh/m² ou bâtiment construit après 2005)",
        requirement: "emitterTypeRequired",
      });
    }

    if (missingConditions.length > 0) {
      data.nonRecommendedSolutions.push({
        solution: airWaterHeatPumpSolution,
        missingConditions: missingConditions,
        priority: 5,
      });
    } else {
      data.recommendedSolutions.push({
        solution: airWaterHeatPumpSolution,
        priority: 5,
      });
    }
  }

  // 4. Hybridation PAC aéro + chaudière (chauffage seul)
  const hybridHeatPumpSolution = SOLUTIONS.find((s) => s.slug === "hybride-pac-chaudiere-chauffage");
  if (hybridHeatPumpSolution) {
    const missingConditions: MissingCondition[] = [];

    if (!(property.outdoorSharedSpaceAvailable || property.outdoorPrivateSpaceAvailable || property.outdoorRoofTerraceAvailable || property.outdoorTechnicalRoom)) {
      missingConditions.push({
        message: "Espace extérieur insuffisant pour l'unité extérieure",
        requirement: "outdoorSpaceRequired",
      });
    }

    if (property.heatingNeedCerema && property.heatingNeedCerema <= 100) {
      missingConditions.push({ message: "Besoin de chauffage insuffisant (l'hybridation est pertinente uniquement si besoin > 100 kWh/m²)" });
    }

    if (!(property.heatingEmitterType === "PLANCHER CHAUFFANT" || property.heatingEmitterType === "RADIATEURS")) {
      missingConditions.push({
        message: "Émetteur de chaleur non conforme (nécessite plancher chauffant à eau ou radiateur à eau)",
        requirement: "emitterTypeRequired",
      });
    }

    if (missingConditions.length > 0) {
      data.nonRecommendedSolutions.push({
        solution: hybridHeatPumpSolution,
        missingConditions: missingConditions,
        priority: 6,
      });
    } else {
      data.recommendedSolutions.push({
        solution: hybridHeatPumpSolution,
        priority: 6,
      });
    }
  }

  // 5a. Chauffe-eau thermodynamique avec unité extérieure
  const heatPumpWaterHeaterExteriorSolution = SOLUTIONS.find((s) => s.slug === "chauffe-eau-thermodynamique-exterieur");
  if (heatPumpWaterHeaterExteriorSolution) {
    const missingConditions: MissingCondition[] = [];

    if (!property.outdoorPrivateSpaceAvailable) {
      missingConditions.push({
        message: "Espace privé extérieur non disponible (balcon, terrasse, jardin privatif requis)",
        requirement: "outdoorSpaceRequired",
      });
    }

    if (missingConditions.length > 0) {
      data.nonRecommendedSolutions.push({
        solution: heatPumpWaterHeaterExteriorSolution,
        missingConditions: missingConditions,
        priority: 7,
      });
    } else {
      data.recommendedSolutions.push({
        solution: heatPumpWaterHeaterExteriorSolution,
        priority: 7,
      });
    }
  }

  // 5b. Chauffe-eau thermodynamique sans unité extérieure
  const heatPumpWaterHeaterInteriorSolution = SOLUTIONS.find((s) => s.slug === "chauffe-eau-thermodynamique-interieur");
  if (heatPumpWaterHeaterInteriorSolution) {
    // Toujours recommandé mais avec une alerte sur l'encombrement
    data.recommendedSolutions.push({
      solution: heatPumpWaterHeaterInteriorSolution,
      priority: 8,
      message: "Attention à l'encombrement intérieur (taille d'un gros ballon d'eau chaude)",
    });
  }

  return data;
};

const computeScenarioChIndivEcsIndivGaz = async (property: Property): Promise<SolutionsResult> => {
  let data: SolutionsResult = {
    recommendedSolutions: [],
    nonRecommendedSolutions: [],
    message: [],
  };

  if (!["GAZ"].includes(property.heatingEnergy) || !["GAZ", "ELECTRIQUE"].includes(property.ecsEnergy)) {
    data.message.push("Énergie de chauffage ou d'ECS non compatible");
    return data;
  }

  // 1a. PAC air/eau avec unité extérieure (chauffage + ECS)
  const pacAirEauAvecUextSolution = SOLUTIONS.find((s) => s.slug === "pac-air-eau-individuel-unite-exterieure");
  if (pacAirEauAvecUextSolution) {
    const missingConditions: MissingCondition[] = [];

    if (!property.outdoorPrivateSpaceAvailable) {
      missingConditions.push({
        message: "Espace privé extérieur non disponible (balcon, terrasse, jardin privatif requis)",
        requirement: "outdoorSpaceRequired",
      });
    }

    if (
      property.heatingEmitterType !== "PLANCHER CHAUFFANT" &&
      (property.heatingEmitterType !== "RADIATEURS" || (property.heatingNeedCerema && property.heatingNeedCerema > 100)) &&
      property.constructionYear <= 2005
    ) {
      missingConditions.push({
        message: "Système d'émission non adapté (nécessite plancher chauffant ou radiateurs avec besoin < 100 kWh/m² ou bâtiment construit après 2005)",
        requirement: "emitterTypeRequired",
      });
    }

    if (missingConditions.length > 0) {
      data.nonRecommendedSolutions.push({
        solution: pacAirEauAvecUextSolution,
        missingConditions: missingConditions,
        priority: 1,
      });
    } else {
      data.recommendedSolutions.push({
        solution: pacAirEauAvecUextSolution,
        priority: 1,
      });
    }
  }

  // 1b. PAC air/eau sans unité extérieure (chauffage + ECS)
  const pacAirEauSansUextSolution = SOLUTIONS.find((s) => s.slug === "pac-air-eau-individuel-sans-unite-exterieure");
  if (pacAirEauSansUextSolution) {
    const missingConditions: MissingCondition[] = [];

    if (
      property.heatingEmitterType !== "PLANCHER CHAUFFANT" &&
      (property.heatingEmitterType !== "RADIATEURS" || (property.heatingNeedCerema && property.heatingNeedCerema > 100)) &&
      property.constructionYear <= 2005
    ) {
      missingConditions.push({
        message: "Système d'émission non adapté (nécessite plancher chauffant ou radiateurs avec besoin < 100 kWh/m² ou bâtiment construit après 2005)",
        requirement: "emitterTypeRequired",
      });
    }

    if (missingConditions.length > 0) {
      data.nonRecommendedSolutions.push({
        solution: pacAirEauSansUextSolution,
        missingConditions: missingConditions,
        priority: 2,
      });
    } else {
      data.recommendedSolutions.push({
        solution: pacAirEauSansUextSolution,
        priority: 2,
      });
    }
  }

  // 1c. PAC air extrait/eau (chauffage + ECS)
  const pacAirExtraitEauSolution = SOLUTIONS.find((s) => s.slug === "pac-air-extrait-eau");
  if (pacAirExtraitEauSolution) {
    const missingConditions: MissingCondition[] = [];

    if (
      property.heatingEmitterType !== "PLANCHER CHAUFFANT" &&
      (property.heatingEmitterType !== "RADIATEURS" || (property.heatingNeedCerema && property.heatingNeedCerema > 100)) &&
      property.constructionYear <= 2005
    ) {
      missingConditions.push({
        message: "Système d'émission non adapté (nécessite plancher chauffant ou radiateurs avec besoin < 100 kWh/m² ou bâtiment construit après 2005)",
        requirement: "emitterTypeRequired",
      });
    }

    if (missingConditions.length > 0) {
      data.nonRecommendedSolutions.push({
        solution: pacAirExtraitEauSolution,
        missingConditions: missingConditions,
        priority: 3,
      });
    } else {
      data.recommendedSolutions.push({
        solution: pacAirExtraitEauSolution,
        priority: 3,
      });
    }
  }

  // 2a. Chauffe-eau thermodynamique avec unité extérieure (ECS uniquement)
  const cetAvecUextSolution = SOLUTIONS.find((s) => s.slug === "chauffe-eau-thermodynamique-exterieur");
  if (cetAvecUextSolution) {
    const missingConditions: MissingCondition[] = [];

    if (!property.outdoorPrivateSpaceAvailable) {
      missingConditions.push({
        message: "Espace privé extérieur non disponible (balcon, terrasse, jardin privatif requis)",
        requirement: "outdoorSpaceRequired",
      });
    }

    if (missingConditions.length > 0) {
      data.nonRecommendedSolutions.push({
        solution: cetAvecUextSolution,
        missingConditions: missingConditions,
        priority: 4,
      });
    } else {
      data.recommendedSolutions.push({
        solution: cetAvecUextSolution,
        priority: 4,
      });
    }
  }

  // 2b. Chauffe-eau thermodynamique sans unité extérieure (ECS uniquement)
  const cetSansUextSolution = SOLUTIONS.find((s) => s.slug === "chauffe-eau-thermodynamique-interieur");
  if (cetSansUextSolution) {
    data.recommendedSolutions.push({
      solution: cetSansUextSolution,
      priority: 5,
      message: "Attention à l'encombrement intérieur (taille d'un gros ballon d'eau chaude)",
    });
  }

  return data;
};

const computeScenarioChIndivEcsIndivElectricity = async (property: Property): Promise<SolutionsResult> => {
  let data: SolutionsResult = {
    recommendedSolutions: [],
    nonRecommendedSolutions: [],
    message: [],
  };

  if (!["ELECTRIQUE"].includes(property.heatingEnergy) || !["ELECTRIQUE"].includes(property.ecsEnergy)) {
    data.message.push("Énergie de chauffage ou d'ECS non compatible");
    return data;
  }

  // 1. PAC air/air (chauffage uniquement)
  const pacAirAirSolution = SOLUTIONS.find((s) => s.slug === "pac-air-air");
  if (pacAirAirSolution) {
    const missingConditions: MissingCondition[] = [];

    if (!property.outdoorPrivateSpaceAvailable) {
      missingConditions.push({
        message: "Espace privé extérieur non disponible (balcon, terrasse, jardin privatif requis)",
        requirement: "outdoorSpaceRequired",
      });
    }

    if (missingConditions.length > 0) {
      data.nonRecommendedSolutions.push({
        solution: pacAirAirSolution,
        missingConditions: missingConditions,
        priority: 1,
      });
    } else {
      data.recommendedSolutions.push({
        solution: pacAirAirSolution,
        priority: 1,
      });
    }
  }

  // 2a. Chauffe-eau thermodynamique avec unité extérieure (ECS uniquement)
  const cetAvecUextSolution = SOLUTIONS.find((s) => s.slug === "chauffe-eau-thermodynamique-exterieur");
  if (cetAvecUextSolution) {
    const missingConditions: MissingCondition[] = [];

    if (!property.outdoorPrivateSpaceAvailable) {
      missingConditions.push({
        message: "Espace privé extérieur non disponible (balcon, terrasse, jardin privatif requis)",
        requirement: "outdoorSpaceRequired",
      });
    }

    if (missingConditions.length > 0) {
      data.nonRecommendedSolutions.push({
        solution: cetAvecUextSolution,
        missingConditions: missingConditions,
        priority: 2,
      });
    } else {
      data.recommendedSolutions.push({
        solution: cetAvecUextSolution,
        priority: 2,
      });
    }
  }

  // 2b. Chauffe-eau thermodynamique sans unité extérieure (ECS uniquement)
  const cetSansUextSolution = SOLUTIONS.find((s) => s.slug === "chauffe-eau-thermodynamique-interieur");
  if (cetSansUextSolution) {
    data.recommendedSolutions.push({
      solution: cetSansUextSolution,
      priority: 3,
      message: "Attention à l'encombrement intérieur (taille d'un gros ballon d'eau chaude)",
    });
  }

  return data;
};

export { computeEnvelopQuality, computeSolutions };
