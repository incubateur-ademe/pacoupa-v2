import React, { useState } from "react";
import Modal from "../../components/Modal";
import { FaRegCheckCircle } from "react-icons/fa";
import { CeremaProperty } from "@/types/responses/property";

interface SelectBuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildings: CeremaProperty[];
  onApply: (building: CeremaProperty) => void;
}

const SelectBuildingModal = ({ isOpen, onClose, buildings, onApply }: SelectBuildingModalProps) => {
  const [selectedBuildingIndex, setSelectedBuildingIndex] = useState<number | null>(null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[600px] max-h-[80vh] overflow-y-auto">
      <div className="p-8">
        <h2 id="building-selection-title" className="text-2xl font-bold text-primary mb-4">
          Sélectionnez votre bâtiment
        </h2>
        <p className="text-gray-600 mb-6">Plusieurs bâtiments ont été trouvés à cette adresse. Veuillez sélectionner celui qui correspond à votre copropriété.</p>

        <div className="grid gap-4" role="radiogroup" aria-labelledby="building-selection-title">
          {buildings.map((building, index) => {
            console.log("building", building);
            return (
              <button
                key={index}
                role="radio"
                aria-checked={selectedBuildingIndex === index}
                tabIndex={0}
                className={`block text-left relative border-2 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedBuildingIndex === index ? "bg-gray-50 border-green-800" : "border-gray-300"
                }`}
                onClick={() => setSelectedBuildingIndex(index)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedBuildingIndex(index);
                  }
                }}
              >
                <div className="flex flex-col">
                  <h3 className="font-bold text-primary">{building.address || "Adresse inconnue"}</h3>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-1">
                    {building.constructionYear && <span className="bg-gray-100 px-2 py-1 rounded">Année: {building.constructionYear}</span>}

                    {building.housingCount && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {building.housingCount} logement{parseInt(building.housingCount) > 1 ? "s" : ""}
                      </span>
                    )}

                    {/* {building.heatedArea && <span className="bg-gray-100 px-2 py-1 rounded">{building.heatedArea} m²</span>} */}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {["collectif", "individuel"].includes(building.heatingType || "") && (
                      <div className="text-xs">
                        <span className="text-gray-500">Chauffage:</span> <span className="font-medium">{building.heatingType === "collectif" ? "Collectif" : "Individuel"}</span>
                      </div>
                    )}

                    {["GPL/BUTANE/PROPANE", "FIOUL", "GAZ", "RC", "BOIS", "ELECTRIQUE", "CHARBON", "SOLAIRE"].includes(building.heatingEnergy || "") && (
                      <div className="text-xs">
                        <span className="text-gray-500">Énergie:</span> <span className="font-medium">{building.heatingEnergy}</span>
                      </div>
                    )}

                    {["PLANCHER CHAUFFANT", "RADIATEURS", "CONVECTEURS"].includes(building.heatingEmitterType || "") && (
                      <div className="text-xs">
                        <span className="text-gray-500">Émetteurs:</span> <span className="font-medium">{building.heatingEmitterType}</span>
                      </div>
                    )}

                    {["collectif", "individuel"].includes(building.ecsType || "") && (
                      <div className="text-xs">
                        <span className="text-gray-500">ECS:</span> <span className="font-medium">{building.ecsType === "collectif" ? "Collectif" : "Individuel"}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedBuildingIndex === index && <FaRegCheckCircle className="w-5 h-5 text-green-800 bg-green-100 rounded-full absolute top-4 right-4" />}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => onApply(buildings[selectedBuildingIndex as number] as CeremaProperty)}
            disabled={selectedBuildingIndex === null}
            className="button-primary text-base hover:opacity-90 transition-opacity"
            aria-label="Confirmer la sélection du bâtiment"
          >
            Confirmer
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SelectBuildingModal;
