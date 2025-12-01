import React, { ChangeEvent, useState, useEffect, useMemo } from "react";
import { BiSolidInfoSquare } from "react-icons/bi";
import { useStore } from "@/services/store";
import AutocompleteBan from "@/components/AutocompleteBan";
import { getCeremaData, transformCeremaData } from "@/services/cerema";
import { fetchFcuEligibility } from "@/services/fcu";
import { FaRegCheckCircle, FaAngleDown, FaRegBuilding } from "react-icons/fa";
import { RiFireLine, RiInformationFill, RiSurveyLine } from "react-icons/ri";
import { LuThermometerSnowflake } from "react-icons/lu";
import HeaderSideShadow from "@/assets/header-side-shadow.svg";
import Logo from "@/assets/icon.svg";
import SelectBuildingModal from "@/scenes/search/selectBuildingModal";
import { CeremaProperty } from "@/types/responses/property";

import espaceCommun from "@/assets/espace commun.png";
import espacePrivee from "@/assets/espace privée.png";
import toitTerrasse from "@/assets/Toit terrasse.png";
import { FaArrowLeft, FaArrowUp } from "react-icons/fa6";
import { Property } from "@/types";
import { encodePropertyToHash } from "@/utils";
import GeoCodeImage from "@/components/GeoCodeImage";
import { computeEnvelopQuality } from "@/services/solutions";
import Alert from "@/components/Alert";

const FCU_URL = "https://france-chaleur-urbaine.beta.gouv.fr/reseaux";

const countMissingFields = (property: Property, section: string): number => {
  let count = 0;

  if (section === "property") {
    if (!property.address) count++;
    if (!property.constructionYear) count++;
    if (!property.housingCount) count++;
    if (!property.heatedArea) count++;
  }

  if (section === "heating") {
    if (!property.heatingType) count++;
    if (!property.heatingEnergy) count++;
    if (!property.heatingEmitterType) count++;
    if (!property.ecsType) count++;
    if (!property.ecsEnergy) count++;
  }

  return count;
};

const PropertyPanel = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { property, setProperty } = useStore((state: any) => ({
    property: state.property as Property,
    setProperty: state.setProperty,
  }));
  console.log("property", property);

  const [buildingSelectionModalOpen, setBuildingSelectionModalOpen] = useState(false);
  const [buildingOptions, setBuildingOptions] = useState<CeremaProperty[]>([]);
  const [animationState, setAnimationState] = useState(false);
  const [envelopeOpen, setEnvelopeOpen] = useState(true);
  const [constraintsOpen, setConstraintsOpen] = useState(true);
  const [heatingOpen, setHeatingOpen] = useState(true);
  const [propertyOpen, setPropertyOpen] = useState(true);
  const [retrivedMessage, setRetrivedMessage] = useState<{ type: "info" | "warning" | "error" | null; title: string | null }>({
    type: null,
    title: null,
  });

  useEffect(() => {
    if (isOpen) {
      setAnimationState(true);
    } else {
      setAnimationState(false);
    }
  }, [isOpen]);

  const propertyMissingCount = countMissingFields(property, "property");
  const heatingMissingCount = countMissingFields(property, "heating");
  const totalMissingCount = propertyMissingCount + heatingMissingCount;

  useEffect(() => {
    updateEnvelopeQuality();
  }, [
    property.heatingNeedCerema,
    property.hasEnvelopeInsulationWindows,
    property.hasEnvelopeInsulationWalls,
    property.hasEnvelopeInsulationFloors,
    property.hasEnvelopeInsulationRoof,
    property.constructionYear,
  ]);

  const updateEnvelopeQuality = async () => {
    const envelopeQuality = await computeEnvelopQuality(property);
    setProperty({ envelopeQuality });
  };

  const fetchCeremaData = async (address: string) => {
    try {
      const raw = await getCeremaData(address);
      const { total, data } = transformCeremaData(raw);

      if (total <= 1) {
        applyBuildingData(data as CeremaProperty);
        setRetrivedMessage({
          type: "info",
          title: "Nous avons pu récupérer un certains nombres d'informations sur cette copropriété. Vérifiez et complétez les informations ci-dessous",
        });
        return;
      }

      if (total > 1) {
        setBuildingOptions(data as CeremaProperty[]);
        setBuildingSelectionModalOpen(true);
        setRetrivedMessage({
          type: "info",
          title: "Nous avons pu récupérer un certains nombres d'informations sur cette copropriété. Vérifiez et complétez les informations ci-dessous",
        });
      }
    } catch (error) {
      console.error("Error fetching property data:", error);
      setRetrivedMessage({ type: "error", title: "Une erreur est survenue lors de la récupération des informations. Veuillez réessayer plus tard" });
    }
  };

  // Fonction pour appliquer les données d'un bâtiment sélectionné
  const applyBuildingData = (building: CeremaProperty) => {
    console.log("Applying building data:", building);
    setProperty({
      constructionYear: building.constructionYear || "",
      housingCount: building.housingCount || "",
      heatedArea: building.heatedArea || "",
      heatingNeedCerema: building.heatingNeedCerema || "",
      ecsNeedCerema: building.ecsNeedCerema || "",
      heatingType: building.heatingType || "",
      heatingEnergy: building.heatingEnergy || "",
      heatingEmitterType: building.heatingEmitterType || "",
      ecsType: building.ecsType || "",
      ecsEnergy: building.ecsEnergy || "",
      constraintsHeritage: building.constraintsHeritage || "",
      constraintsEnvironmental: building.constraintsEnvironmental || "",
      constraintsAtmosphereProtection: building.constraintsAtmosphereProtection || false,
      geothermalWaterZoning: building.geothermalWaterZoning || null,
      geothermalWaterEnergyPotential: building.geothermalWaterEnergyPotential || "",
      geothermalProbeZoning: building.geothermalProbeZoning || null,
      geothermalProbeCoverageRate: building.geothermalProbeCoverageRate || 0,
      solarThermalEnergyProduction: building.solarThermalEnergyProduction || 0,
      solarThermalCoverageRate: building.solarThermalCoverageRate || 0,
    });
  };

  const fetchFcuData = async (lat: number, lon: number) => {
    try {
      const data = await fetchFcuEligibility({ lat, lon });
      console.log("FCU data:", data);
      setProperty({
        fcuIsInPDP: data.inPDP || false,
        fcuIsEligible: data.isEligible || false,
        fcuDistance: data.distance || 0,
        fcuNetworkUrl: FCU_URL + "/" + data.id,
      });
    } catch (error) {
      console.error("Error fetching property data:", error);
    }
  };

  // Centralized fetch triggers based on property changes, guarded in store
  useEffect(() => {
    const address = property?.address?.trim();
    if (!address) return;
    if (property.ceremaFetchedAddress === address) return;
    setProperty({ ceremaFetchedAddress: address });
    fetchCeremaData(address);
  }, [property.address]);

  useEffect(() => {
    const latNum = property?.lat != null ? Number(property.lat) : NaN;
    const lonNum = property?.lon != null ? Number(property.lon) : NaN;
    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) return;
    if (latNum === 0 && lonNum === 0) return;
    const key = `${latNum},${lonNum}`;
    if (property.fcuFetchedCoordsKey === key) return;
    setProperty({ fcuFetchedCoordsKey: key });
    fetchFcuData(latNum, lonNum);
  }, [property.lat, property.lon]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const encodedProperty = encodePropertyToHash(property);
    if (url.searchParams.get("hash") === encodedProperty) return;
    url.searchParams.set("hash", encodedProperty);
    url.hash = "";
    window.history.replaceState(null, "", url.toString());
  }, [property]);

  const invalidConfigMessages = useMemo(() => {
    if (property?.heatingEnergy === "FIOUL") {
      if (property?.heatingType === "individuel") {
        return "Pour un chauffage fioul, le type de chauffage doit être collectif pour que le simulateur fonctionne";
      }
    }
    if (property?.heatingEnergy === "ELECTRIQUE") {
      if (property?.heatingType === "collectif") {
        return "Pour un chauffage électrique, le type de chauffage doit être individuel pour que le simulateur fonctionne";
      }
    }
    if (property?.heatingEnergy === "GAZ") {
      if (property?.heatingType === "individuel") {
        if (property?.ecsEnergy && property?.ecsEnergy !== "GAZ") {
          return "Pour un chauffage individuel gaz, l'énergie principale de l'eau chaude doit être du gaz pour que le simulateur fonctionne";
        }
      }
      if (property?.heatingType === "collectif") {
        if (property?.ecsEnergy === "FIOUL") {
          return "Pour un chauffage collectif gaz, l'énergie principale de l'eau chaude ne peut pas être du fioul pour que le simulateur fonctionne";
        }
      }
    }
    if (property?.heatingEnergy === "FIOUL") {
      if (property?.ecsEnergy && property?.ecsEnergy !== "FIOUL") {
        return "Pour un chauffage fioul, l'eau chaude doit être produite en fioul pour que le simulateur fonctionne";
      }
    }
    if (property?.heatingEnergy === "ELECTRIQUE") {
      if (property?.ecsEnergy && property?.ecsEnergy !== "ELECTRIQUE") {
        return "Pour un chauffage électrique, l'eau chaude doit être produite en ballon électrique pour que le simulateur fonctionne";
      }
    }
    if (property?.heatingEnergy === "GAZ") {
      if (property?.heatingType === "individuel") {
        if (property?.ecsType && property?.ecsType !== "individuel") {
          return "Pour un chauffage individuel gaz, le type de production d'eau chaude doit être individuel pour que le simulateur fonctionne";
        }
      }
      if (property?.heatingType === "collectif") {
        if (property?.ecsEnergy === "ELECTRIQUE") {
          if (property?.ecsType === "collectif") {
            return "Pour un chauffage collectif gaz, le type de production d'eau chaude en ballon électrique doit être individuel pour que le simulateur fonctionne";
          }
        }
      }
    }
    if (property?.heatingEnergy === "FIOUL") {
      if (property?.ecsType && property?.ecsType !== "individuel") {
        return "Pour un chauffage fioul, le type de production d'eau chaude doit être individuel pour que le simulateur fonctionne";
      }
    }
    return "";
  }, [property?.heatingEnergy, property?.heatingType, property?.ecsEnergy, property?.ecsType]);

  return (
    <div className="fixed top-0 left-0 right-0 mt-[110px] z-30 flex">
      {/* Background overlay with opacity transition */}
      <div className={`absolute top-0 left-0 right-0 h-full bg-black/30 transition-opacity duration-300 ease-in-out ${animationState ? "opacity-100" : "opacity-0"}`}></div>

      {/* Modal de sélection de bâtiments */}
      <SelectBuildingModal
        isOpen={buildingSelectionModalOpen}
        onClose={() => setBuildingSelectionModalOpen(false)}
        onApply={(building: CeremaProperty) => {
          console.log("applying building data", building);
          applyBuildingData(building);
          setBuildingSelectionModalOpen(false);
        }}
        buildings={buildingOptions}
      />

      {/* Main panel - 70% width */}
      <div
        className={`w-[70%] bg-white overflow-y-auto min-h-[calc(100vh-110px)] flex flex-col justify-between max-h-[calc(100vh-110px)] shadow-xl border-r-2 border-primary transition-transform duration-500 ease-in-out ${
          animationState ? "translate-x-0" : "-translate-x-full"
        } z-10`}
      >
        <div className="p-6 mx-8">
          {retrivedMessage.type && retrivedMessage.title && (property.address !== "" || property.address !== null) && (
            <div className="flex items-start gap-2 p-2 mb-4 bg-blue-light rounded">
              <div className="pt-0.5">
                <div className="w-4 h-4 relative">
                  <RiInformationFill className="w-4 h-4 absolute left-0.5 top-0.5 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <p className="text-blue-600 text-sm font-normal font-['Marianne']">{retrivedMessage.title}</p>
                {totalMissingCount > 0 && (
                  <div className="py-0.5 border-b border-purple-secondaryDarker w-fit">
                    <span className="text-sm font-semibold text-purple-secondaryDarker">
                      {totalMissingCount} information{totalMissingCount > 1 ? "s" : ""} manquante{totalMissingCount > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section Copropriété */}
          <div className="flex justify-between items-center mb-6">
            <div className="relative flex items-center gap-2">
              <FaRegBuilding className="w-5 h-5 absolute -left-8 top-1/2 -translate-y-1/2" />

              <h2 className="text-xl font-bold text-primary">Votre copropriété</h2>
              {propertyMissingCount > 0 && (
                <span className="text-sm font-medium text-purple-secondaryDarker underline">
                  {propertyMissingCount} information{propertyMissingCount > 1 ? "s" : ""} manquante{propertyMissingCount > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <button className="p-2 rounded-full hover:bg-gray-100" onClick={() => setPropertyOpen((v) => !v)} aria-expanded={propertyOpen} aria-controls="property-section">
              <FaAngleDown className={`w-4 h-4 transition-transform duration-300 ${propertyOpen ? "rotate-0" : "rotate-180"}`} />
            </button>
          </div>

          <div className="space-y-8">
            <div
              id="property-section"
              className={`overflow-hidden transition-all duration-300 space-y-8 ease-in-out ${propertyOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}
            >
              <div className="flex items-start justify-between gap-24">
                <div className="space-y-8 flex-1">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">ADRESSE</div>
                    <AutocompleteBan
                      onChange={({ address, lat, lon }) => {
                        if (!address) return;
                        setProperty({ address, lat, lon });
                        fetchCeremaData(address);
                        fetchFcuData(lat, lon);
                      }}
                    />
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">ANNÉE DE CONSTRUCTION</div>
                    <input
                      type="text"
                      name="constructionYear"
                      className={`text-primary-light font-bold border-2 rounded p-2 w-1/4 focus:border-green-dark ${
                        !property.constructionYear ? "border-purple" : "border-primary"
                      }`}
                      value={property.constructionYear}
                      placeholder="Année de construction"
                      onChange={(e) => {
                        setProperty({ constructionYear: e.target.value });
                      }}
                    />
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">NOMBRE DE LOGEMENT</div>
                    <input
                      type="text"
                      name="housingCount"
                      className={`text-primary-light font-bold border-2 rounded p-2 w-1/4 focus:border-green-dark ${!property.housingCount ? "border-purple" : "border-primary"}`}
                      placeholder="Nombre de logements"
                      value={property.housingCount}
                      onChange={(e) => {
                        setProperty({ housingCount: e.target.value });
                      }}
                    />
                  </div>

                  {/* <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">SURFACE CHAUFFÉE</div>
                    <div className={`flex items-center border-2 rounded w-1/4 focus-within:border-primary ${!property.heatedArea ? "border-purple" : "border-primary"}`}>
                      <input
                        type="text"
                        name="heatedArea"
                        placeholder="Surface chauffée"
                        className="text-primary-light font-bold p-2 flex-1 border-none focus:outline-none w-1/4"
                        value={property.heatedArea}
                        onChange={(e) => {
                          setProperty({ heatedArea: e.target.value });
                        }}
                      />
                      <span className="px-2 py-2">m²</span>
                    </div>
                  </div> */}
                </div>

                <GeoCodeImage width={300} height={200} zoom={16} />
              </div>

              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">TYPE D'ESPACE EXTÉRIEUR DISPONIBLE</div>
                <div className="grid grid-cols-3 gap-4 mt-2 pb-1 w-2/3">
                  <div
                    className={`relative border-2 border-primary rounded-lg p-4 text-center flex flex-col items-center cursor-pointer hover:bg-gray-100 transition-shadow duration-300 ${
                      property.outdoorSharedSpaceAvailable ? "bg-gray-50 shadow-none" : "shadow-outline "
                    }`}
                    onClick={() => setProperty({ outdoorSharedSpaceAvailable: !property.outdoorSharedSpaceAvailable })}
                  >
                    <div className="h-12 flex items-center justify-center mb-3">
                      <img src={espaceCommun} alt="Espace commun" className="h-12 w-auto" />
                    </div>
                    <div className="text-xs font-medium mb-1">Extérieur commun</div>
                    <div className="text-xs text-gray-500">Proche chaufferie</div>
                    {property.outdoorSharedSpaceAvailable && <FaRegCheckCircle className="w-5 h-5 text-primary bg-green-100 rounded-full absolute top-2 right-2" />}
                  </div>
                  <div
                    className={`relative border-2 border-primary rounded-lg p-4 text-center flex flex-col items-center cursor-pointer hover:bg-gray-100 transition-shadow duration-300 ${
                      property.outdoorPrivateSpaceAvailable ? "bg-gray-50 shadow-none" : "shadow-outline "
                    }`}
                    onClick={() => setProperty({ outdoorPrivateSpaceAvailable: !property.outdoorPrivateSpaceAvailable })}
                  >
                    <div className="h-12 flex items-center justify-center mb-3">
                      <img src={espacePrivee} alt="Espace privé" className="h-12 w-auto" />
                    </div>
                    <div className="text-xs font-medium mb-1">Extérieur privé</div>
                    <div className="text-xs text-gray-500 mb-2">Balcon, cours, jardin...</div>
                    {property.outdoorPrivateSpaceAvailable && <FaRegCheckCircle className="w-5 h-5 text-primary bg-green-100 rounded-full absolute top-2 right-2" />}
                  </div>
                  <div
                    className={`relative border-2 border-primary rounded-lg p-4 text-center flex flex-col items-center cursor-pointer hover:bg-gray-100 transition-shadow duration-300 ${
                      property.outdoorRoofTerraceAvailable ? "bg-gray-50 shadow-none" : "shadow-outline "
                    }`}
                    onClick={() => setProperty({ outdoorRoofTerraceAvailable: !property.outdoorRoofTerraceAvailable })}
                  >
                    <div className="h-12 flex items-center justify-center mb-3">
                      <img src={toitTerrasse} alt="Toit terrasse" className="h-12 w-auto" />
                    </div>
                    <div className="text-xs font-medium mb-1">Toit terrasse</div>
                    <div className="text-xs text-gray-500">Commun</div>
                    {property.outdoorRoofTerraceAvailable && <FaRegCheckCircle className="w-5 h-5 text-primary bg-green-100 rounded-full absolute top-2 right-2" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Système de chauffage */}
            <div className="mt-12">
              <div className="flex justify-between items-center mb-6">
                <div className="relative flex items-center gap-2">
                  <RiFireLine className="w-6 h-6 absolute -left-8 top-1/2 -translate-y-1/2 text-primary" />
                  <h2 className="text-xl font-bold text-primary">Système de chauffage</h2>
                  {heatingMissingCount > 0 && (
                    <span className="text-sm font-medium text-purple-secondaryDarker underline">
                      {heatingMissingCount} information{heatingMissingCount > 1 ? "s" : ""} manquante{heatingMissingCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <button className="p-2 rounded-full hover:bg-gray-100" onClick={() => setHeatingOpen((v) => !v)} aria-expanded={heatingOpen} aria-controls="envelope-section">
                  <FaAngleDown className={`w-4 h-4 transition-transform duration-300 ${heatingOpen ? "rotate-0" : "rotate-180"}`} />
                </button>
              </div>
              <div
                id="envelope-section"
                className={`overflow-hidden transition-all duration-300 flex flex-col gap-4 ease-in-out ${heatingOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}
              >
                <div className="flex flex-wrap gap-4">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">CHAUFFAGE</div>
                    <div className="relative">
                      <select
                        className={`w-full text-primary-light font-bold appearance-none bg-transparent focus:outline-none border-2 rounded p-2 pr-20 relative focus:border-green-dark ${
                          !property.heatingType ? "border-purple" : "border-primary"
                        }`}
                        value={property.heatingType || ""}
                        onChange={(e) => {
                          console.log("new heatingType", e.target.value);
                          setProperty({ heatingType: e.target.value });
                        }}
                      >
                        <option value="" disabled>
                          Sélectionner
                        </option>
                        <option value="collectif">Solution collective</option>
                        <option value="individuel">Solution individuelle</option>
                      </select>
                      <FaAngleDown className="pointer-events-none w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">ÉNERGIE</div>
                    <div className="relative">
                      <select
                        className={`w-full text-primary-light font-bold appearance-none bg-transparent focus:outline-none border-2 rounded p-2 pr-12 relative focus:border-green-dark ${
                          !property.heatingEnergy ? "border-purple" : "border-primary"
                        }`}
                        value={property.heatingEnergy || ""}
                        onChange={(e) => setProperty({ heatingEnergy: e.target.value })}
                      >
                        <option value="" disabled>
                          Sélectionner
                        </option>
                        <option value="FIOUL">Fioul</option>
                        <option value="GAZ">Gaz</option>
                        <option value="ELECTRIQUE">Électrique</option>
                        <option value="BOIS">Bois</option>
                        <option value="CHARBON">Charbon</option>
                        <option value="SOLAIRE">Solaire</option>
                        <option value="RC">Réseau de chaleur</option>
                      </select>
                      <FaAngleDown className="pointer-events-none w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">TYPE</div>
                    <div className="relative">
                      <select
                        className={`w-full text-primary-light font-bold appearance-none bg-transparent focus:outline-none border-2 rounded p-2 pr-16 relative focus:border-green-dark ${
                          !property.heatingEmitterType ? "border-purple" : "border-primary"
                        }`}
                        value={property.heatingEmitterType || ""}
                        onChange={(e) => setProperty({ heatingEmitterType: e.target.value })}
                      >
                        <option value="" disabled>
                          Sélectionner
                        </option>
                        <option value="PLANCHER CHAUFFANT">Plancher chauffant</option>
                        <option value="RADIATEURS">Radiateurs</option>
                        <option value="CONVECTEURS">Convecteurs</option>
                      </select>
                      <FaAngleDown className="pointer-events-none w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">EAU CHAUDE SANITAIRE</div>
                    <div className="relative">
                      <select
                        className={`w-full text-primary-light font-bold appearance-none bg-transparent focus:outline-none border-2 rounded p-2 pr-20 relative focus:border-green-dark ${
                          !property.ecsType ? "border-purple" : "border-primary"
                        }`}
                        value={property.ecsType || ""}
                        onChange={(e) => setProperty({ ecsType: e.target.value })}
                      >
                        <option value="" disabled>
                          Sélectionner
                        </option>
                        <option value="collectif">Solution collective</option>
                        <option value="individuel">Solution individuelle</option>
                      </select>
                      <FaAngleDown className="pointer-events-none w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">ÉNERGIE</div>
                    <div className="relative">
                      <select
                        className={`w-full text-primary-light font-bold appearance-none bg-transparent focus:outline-none border-2 rounded p-2 pr-12 relative focus:border-green-dark ${
                          !property.ecsEnergy ? "border-purple" : "border-primary"
                        }`}
                        value={property.ecsEnergy || ""}
                        onChange={(e) => setProperty({ ecsEnergy: e.target.value })}
                      >
                        <option value="" disabled>
                          Sélectionner
                        </option>
                        <option value="FIOUL">Fioul</option>
                        <option value="GAZ">Gaz</option>
                        <option value="ELECTRIQUE">Électrique</option>
                        <option value="BOIS">Bois</option>
                        <option value="CHARBON">Charbon</option>
                        <option value="SOLAIRE">Solaire</option>
                        <option value="RC">Réseau de chaleur</option>
                      </select>
                      <FaAngleDown className="pointer-events-none w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
                    </div>
                  </div>
                </div>
                {invalidConfigMessages.length > 0 && <Alert type="error" title="Configuration non prise en charge" message={invalidConfigMessages} className="mt-2" />}
              </div>
            </div>

            {/* Section: Enveloppe énergétique */}
            <div className="mt-12">
              <div className="flex justify-between items-center mb-6">
                <div className="relative flex items-center gap-2">
                  <LuThermometerSnowflake className="w-6 h-6 absolute -left-8 top-1/2 -translate-y-1/2 text-primary" />
                  <h2 className="text-xl font-bold text-primary">Enveloppe énergétique</h2>
                </div>
                <button className="p-2 rounded-full hover:bg-gray-100" onClick={() => setEnvelopeOpen((v) => !v)} aria-expanded={envelopeOpen} aria-controls="envelope-section">
                  <FaAngleDown className={`w-4 h-4 transition-transform duration-300 ${envelopeOpen ? "rotate-0" : "rotate-180"}`} />
                </button>
              </div>

              <div id="envelope-section" className={`overflow-hidden transition-all duration-300 ease-in-out ${envelopeOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="flex justify-between items-center gap-4 w-full">
                  <div className="space-y-4 w-1/2">
                    <div className="text-sm font-normal mb-4">GESTES D'ISOLATION EFFECTUÉS IL Y A MOINS DE 15 ANS</div>
                    <div className="flex items-center">
                      <div className="relative mr-3">
                        <input
                          type="checkbox"
                          id="isolation-walls"
                          className="w-5 h-5 border-2 border-primary rounded opacity-0 absolute z-10 cursor-pointer"
                          checked={property.hasEnvelopeInsulationWalls}
                          onChange={(e) => setProperty({ hasEnvelopeInsulationWalls: e.target.checked })}
                        />
                        <div className={`w-5 h-5 border-2 rounded ${property.hasEnvelopeInsulationWalls ? "bg-primary border-primary" : "bg-white border-primary"}`}>
                          {property.hasEnvelopeInsulationWalls && (
                            <svg className="w-3 h-3 mx-auto mt-0.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                        </div>
                      </div>
                      <label htmlFor="isolation-walls" className="text-base">
                        Isolation des murs
                      </label>
                    </div>

                    <div className="flex items-center">
                      <div className="relative mr-3">
                        <input
                          type="checkbox"
                          id="isolation-roof"
                          className="w-5 h-5 border-2 border-primary rounded opacity-0 absolute z-10 cursor-pointer"
                          checked={property.hasEnvelopeInsulationRoof}
                          onChange={(e) => setProperty({ hasEnvelopeInsulationRoof: e.target.checked })}
                        />
                        <div className={`w-5 h-5 border-2 rounded ${property.hasEnvelopeInsulationRoof ? "bg-primary border-primary" : "bg-white border-primary"}`}>
                          {property.hasEnvelopeInsulationRoof && (
                            <svg className="w-3 h-3 mx-auto mt-0.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                        </div>
                      </div>
                      <label htmlFor="isolation-roof" className="text-base">
                        Isolation du toit
                      </label>
                    </div>

                    <div className="flex items-center">
                      <div className="relative mr-3">
                        <input
                          type="checkbox"
                          id="isolation-floors"
                          className="w-5 h-5 border-2 border-primary rounded opacity-0 absolute z-10 cursor-pointer"
                          checked={property.hasEnvelopeInsulationFloors}
                          onChange={(e) => setProperty({ hasEnvelopeInsulationFloors: e.target.checked })}
                        />
                        <div className={`w-5 h-5 border-2 rounded ${property.hasEnvelopeInsulationFloors ? "bg-primary border-primary" : "bg-white border-primary"}`}>
                          {property.hasEnvelopeInsulationFloors && (
                            <svg className="w-3 h-3 mx-auto mt-0.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                        </div>
                      </div>
                      <label htmlFor="isolation-floors" className="text-base">
                        Isolation des sols
                      </label>
                    </div>

                    <div className="flex items-center">
                      <div className="relative mr-3">
                        <input
                          type="checkbox"
                          id="isolation-windows"
                          className="w-5 h-5 border-2 border-primary rounded opacity-0 absolute z-10 cursor-pointer"
                          checked={property.hasEnvelopeInsulationWindows}
                          onChange={(e) => setProperty({ hasEnvelopeInsulationWindows: e.target.checked })}
                        />
                        <div className={`w-5 h-5 border-2 rounded ${property.hasEnvelopeInsulationWindows ? "bg-primary border-primary" : "bg-white border-primary"}`}>
                          {property.hasEnvelopeInsulationWindows && (
                            <svg className="w-3 h-3 mx-auto mt-0.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                        </div>
                      </div>
                      <label htmlFor="isolation-windows" className="text-base">
                        Changement des huisseries
                      </label>
                    </div>
                  </div>

                  <div
                    className={`${
                      property.envelopeQuality === "GOOD"
                        ? "bg-green-50"
                        : property.envelopeQuality === "MEDIUM"
                        ? "bg-yellow-50"
                        : property.envelopeQuality === "BAD"
                        ? "bg-red-50"
                        : "bg-gray-50"
                    } p-4 pl-12 rounded-md flex flex-col items-start w-1/2 gap-4`}
                  >
                    <div className="relative">
                      <img src={Logo} className="w-5 absolute -left-8 top-0 text-primary" />
                      <p className="text-sm text-primary">
                        Nous calculons la qualité de l’enveloppe à partir des données public de votre bâtiment et des potentiel travaux d’isolation réalisés
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-2">
                      <div className="text-sm font-light">ESTIMATION DE LA QUALITÉ DE L'ENVELOPPE ÉNERGÉTIQUE</div>
                      <div
                        className={`text-sm font-medium rounded-full w-fit p-2 ${
                          property.envelopeQuality === "GOOD"
                            ? "text-green-700 bg-green-200"
                            : property.envelopeQuality === "MEDIUM"
                            ? "text-yellow-700 bg-yellow-200"
                            : property.envelopeQuality === "BAD"
                            ? "text-red-700 bg-red-200"
                            : "text-primary bg-gray-200"
                        }`}
                      >
                        {property.envelopeQuality === "GOOD"
                          ? "BONNE"
                          : property.envelopeQuality === "MEDIUM"
                          ? "MOYENNE"
                          : property.envelopeQuality === "BAD"
                          ? "MAUVAISE"
                          : property.envelopeQuality || ""}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Contraintes particulières */}
            <div className="mt-12">
              <div className="flex justify-between items-center mb-6">
                <div className="relative flex items-center gap-2">
                  <RiSurveyLine className="w-6 h-6 absolute -left-8 top-1/2 -translate-y-1/2 text-primary" />
                  <h2 className="text-xl font-bold text-primary">Contraintes particulières</h2>
                </div>
                <button
                  className="p-2 rounded-full hover:bg-gray-100"
                  onClick={() => setConstraintsOpen((v) => !v)}
                  aria-expanded={constraintsOpen}
                  aria-controls="constraints-section"
                >
                  <FaAngleDown className={`w-4 h-4 transition-transform duration-300 ${constraintsOpen ? "rotate-0" : "rotate-180"}`} />
                </button>
              </div>

              <div
                id="constraints-section"
                className={`flex flex-col gap-4 overflow-hidden transition-all duration-300 ease-in-out ${constraintsOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}
              >
                <div className="mb-4">
                  <div className="text-base font-medium mb-2">ZONE DE DÉPLOIEMENT PRIORITAIRE D'UN RÉSEAU DE CHALEUR</div>
                  <div className="flex items-center gap-2">
                    <div className="flex border border-primary/10 rounded-md">
                      <button
                        className={[
                          "px-4 py-2 text-primary-light font-bold focus:outline-none focus:ring-0 w-full transition-colors duration-300 hover:bg-primary/10 rounded-md rounded-r-none border",
                          property.fcuIsInPDP ? "border-primary " : "border-transparent",
                        ].join(" ")}
                        onClick={() => setProperty({ fcuIsInPDP: true })}
                      >
                        Oui
                      </button>
                      <button
                        className={[
                          "px-4 py-2 text-primary-light font-bold focus:outline-none focus:ring-0 w-full transition-colors duration-300 hover:bg-primary/10 rounded-md rounded-l-none border",
                          !property.fcuIsInPDP ? "border-primary" : "border-transparent",
                        ].join(" ")}
                        onClick={() => setProperty({ fcuIsInPDP: false })}
                      >
                        Non
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div>
                    <div className="text-base font-medium mb-2">PROTECTION PATRIMONIALE</div>
                    <div className="relative w-80">
                      <select
                        className={`w-full text-primary-light font-bold appearance-none bg-transparent focus:outline-none border-2 rounded p-2 pr-20 relative focus:border-green-dark ${
                          !property.constraintsHeritage ? "border-purple" : "border-primary"
                        }`}
                        value={property.constraintsHeritage || ""}
                        onChange={(e) => setProperty({ constraintsHeritage: e.target.value })}
                      >
                        <option value="" disabled>
                          Sélectionner
                        </option>
                        <option value="monument historique">Monument historique</option>
                        <option value="site patrimonial remarquable">Site patrimonial remarquable</option>
                        <option value="aucune">Aucune</option>
                      </select>
                      <FaAngleDown className="pointer-events-none w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div>
                    <div className="text-base font-medium mb-2">PROTECTION ENVIRONNEMENTALE</div>
                    <div className="relative w-64">
                      <select
                        className={`w-full text-primary-light font-bold appearance-none bg-transparent focus:outline-none border-2 rounded p-2 pr-20 relative focus:border-green-dark ${
                          !property.constraintsEnvironmental ? "border-purple" : "border-primary"
                        }`}
                        value={property.constraintsEnvironmental || ""}
                        onChange={(e) => {
                          setProperty({ constraintsEnvironmental: e.target.value });
                        }}
                      >
                        <option value="" disabled>
                          Sélectionner
                        </option>
                        <option value="site inscrit ou classé">Site inscrit ou classé</option>
                        <option value="réserve naturelle">Réserve naturelle</option>
                        <option value="aucune">Aucune</option>
                      </select>
                      <FaAngleDown className="pointer-events-none w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-base font-medium mb-2">PROTECTION DE L'ATMOSPHÈRE</div>
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-md">
                      <button
                        className={[
                          "px-4 py-2 text-primary-light font-bold focus:outline-none focus:ring-0 w-full transition-colors duration-300 hover:bg-primary/10 rounded-md rounded-r-none border",
                          property.constraintsAtmosphereProtection ? "border-primary " : "border-primary/10",
                        ].join(" ")}
                        onClick={() => setProperty({ constraintsAtmosphereProtection: true })}
                      >
                        Oui
                      </button>
                      <button
                        className={[
                          "px-4 py-2 text-primary-light font-bold focus:outline-none focus:ring-0 w-full transition-colors duration-300 hover:bg-primary/10 rounded-md rounded-l-none border",
                          !property.constraintsAtmosphereProtection ? "border-primary " : "border-primary/10",
                        ].join(" ")}
                        onClick={() => setProperty({ constraintsAtmosphereProtection: false })}
                      >
                        Non
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save/Cancel buttons with shadow effect */}
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="bg-white border-t-2 border-primary">
          <div className="relative z-50">
            <div className="relative z-10 flex items-center gap-8 p-4 px-8">
              <button onClick={onClose} className="button-primary text-base">
                <span>Enregistrer</span>
                <FaArrowUp />
              </button>
              <button onClick={onClose} className="button-secondary">
                <FaArrowLeft />
                <span>Annuler</span>
              </button>
            </div>
            <img src={HeaderSideShadow} alt="side-shadow" className="absolute top-0 right-0 h-full z-20" />
          </div>
        </div>
      </div>

      {/* Dark overlay - 30% width */}
      <div className="w-[30%] z-10" onClick={onClose}></div>
    </div>
  );
};

export default PropertyPanel;
