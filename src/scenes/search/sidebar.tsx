import React from "react";
import { RiBuilding4Line, RiClipboardLine, RiEditLine, RiFireLine } from "react-icons/ri";
import { useStore } from "@/services/store";
import GeoCodeImage from "@/components/GeoCodeImage";
import { ENERGY_NAMES } from "@/utils";
import TooltipComponent from "@/components/Tooltip";
import { MdOutlineInfo } from "react-icons/md";

const Sidebar = ({ openModal }: { openModal: () => void }) => {
  const { property } = useStore();

  const envelopeQualityConfig = {
    GOOD: { width: "75%", barClass: "bg-green-500", label: "BONNE", textClass: "text-green-700" },
    MEDIUM: { width: "50%", barClass: "bg-yellow-500", label: "MOYENNE", textClass: "text-yellow-700" },
    BAD: { width: "25%", barClass: "bg-red-500", label: "MAUVAISE", textClass: "text-red-700" },
  } as const;

  const currentEnvelope =
    envelopeQualityConfig[(property.envelopeQuality as keyof typeof envelopeQualityConfig) || ""] ||
    ({ width: "0%", barClass: "bg-gray-300", label: property.envelopeQuality, textClass: "text-primary" } as const);

  return (
    <div className="w-full max-w-sm bg-white border-r-2 border-primary p-6 flex flex-col">
      {/* Système de chauffage */}

      {/* Votre copropriété */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RiBuilding4Line className="text-primary-light text-lg" />
            <h3 className="text-primary-light font-medium">Votre copropriété</h3>
          </div>
          <button
            onClick={openModal}
            className="rounded-primary border border-primary shadow-outline text-primary px-4 py-1 font-bold text-sm hover:bg-gray-100 flex items-center gap-2 focus:-ml-1"
          >
            Modifier
            <RiEditLine />
          </button>
        </div>

        <div className="ml-7">
          <GeoCodeImage width={300} height={200} zoom={16} />

          <div className="my-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">ADRESSE</div>
            <div className="text-primary-light font-bold">{property.address || "Non renseigné"}</div>
          </div>

          {property.envelopeQuality && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">QUALITÉ DE L'ENVELOPPE ÉNERGÉTIQUE</div>
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
          )}

          <button onClick={openModal} className="text-purple-medium text-sm underline">
            Voir plus d'informations
          </button>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <RiFireLine className="text-primary-light text-lg" />

          <h3 className="text-primary-light font-bold">Système de chauffage</h3>
        </div>

        <div className="space-y-8 ml-7">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">CHAUFFAGE</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {property.heatingType && (
                  <span className="bg-purple-light text-purple-dark px-2 py-1 rounded text-xs font-bold">
                    {property.heatingType === "collectif" ? "SOLUTION COLLECTIVE" : "SOLUTION INDIVIDUELLE"}
                  </span>
                )}
                <span className="text-primary">{ENERGY_NAMES[property.heatingEnergy as keyof typeof ENERGY_NAMES] || "Non renseigné"}</span>
              </div>
              <TooltipComponent
                id="info-chauffage"
                description="Informations sur le type de chauffage et l’énergie utilisée (collectif ou individuel)."
                Icon={MdOutlineInfo}
                iconClass="text-primary-lighter"
              />
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">EAU CHAUDE SANITAIRE</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {property.ecsType && (
                  <span className="bg-purple-light text-purple-dark px-2 py-1 rounded text-xs font-bold">
                    {property.ecsType === "collectif" ? "SOLUTION COLLECTIVE" : "SOLUTION INDIVIDUELLE"}
                  </span>
                )}
                <span className="text-primary">{ENERGY_NAMES[property.ecsEnergy as keyof typeof ENERGY_NAMES] || "Non renseigné"}</span>
              </div>
              <TooltipComponent
                id="info-ecs"
                description="Mode de production d’eau chaude sanitaire et énergie associée (collectif ou individuel)."
                Icon={MdOutlineInfo}
                iconClass="text-primary-lighter"
              />
            </div>
          </div>

          <button onClick={openModal} className="text-purple-medium text-sm underline">
            Voir plus d'informations
          </button>
        </div>
      </div>

      {/* Contraintes particulières */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <RiClipboardLine className="text-primary-light text-lg" />
          <h3 className="text-primary-light font-bold">Contraintes particulières</h3>
        </div>

        <div className="space-y-8 ml-7">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Zone de déploiement prioritaire d'un réseau de chaleur</div>
            <div className="flex items-center justify-between">
              <span className="text-primary">{property.fcuIsInPDP ? "Oui" : "Non"}</span>
              <TooltipComponent
                id="info-pdp"
                description="Secteur prioritaire défini par la collectivité pour développer un réseau de chaleur."
                Icon={MdOutlineInfo}
                iconClass="text-primary-lighter"
              />
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Protection patrimoniale</div>
            <div className="flex items-center justify-between">
              <span className="text-primary capitalize">{property.constraintsHeritage}</span>
              <TooltipComponent
                id="info-heritage"
                description="Bâtiment soumis à des règles de protection du patrimoine (ABF, monument historique)."
                Icon={MdOutlineInfo}
                iconClass="text-primary-lighter"
              />
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Protection environnementale</div>
            <div className="flex items-center justify-between">
              <span className="text-primary capitalize">{property.constraintsEnvironmental}</span>
              <TooltipComponent
                id="info-environment"
                description="Présence dans une zone protégée sur le plan environnemental (ex. Natura 2000)."
                Icon={MdOutlineInfo}
                iconClass="text-primary-lighter"
              />
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Protection de l'atmosphère</div>
            <div className="flex items-center justify-between">
              <span className="text-primary">{property.constraintsAtmosphereProtection ? "Oui" : "Non"}</span>
              <TooltipComponent
                id="info-atmosphere"
                description="Zone soumise à un plan de protection de l’air pouvant restreindre certains équipements."
                Icon={MdOutlineInfo}
                iconClass="text-primary-lighter"
              />
            </div>
          </div>

          <button onClick={openModal} className="text-purple-medium text-sm underline">
            Voir plus d'informations
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
