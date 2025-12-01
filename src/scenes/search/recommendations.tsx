import React, { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { RiDownloadLine } from "react-icons/ri";
import { FaArrowUp } from "react-icons/fa6";

import Alert from "@/components/Alert";
import { RecommendedSolution, NonRecommendedSolution } from "@/types";
import Icon from "@/assets/icon.svg";
import CalcivertImage from "@/assets/calcivert.png";
import { useStore } from "@/services/store";
import printSolutionsSummary from "@/services/exportPDF";
import downloadSolutionsSummaryText from "@/services/exportText";
import { MATOMO_CATEGORIES } from "@/utils/matomo";
import { useMatomo } from "@datapunt/matomo-tracker-react";

type TabType = "recommended" | "not-recommended";

interface RecommendationsProps {
  isLoading: boolean;
  onOpenModal: () => void;
}

export default function Recommendations({ isLoading, onOpenModal }: RecommendationsProps) {
  const { property, solutions } = useStore();
  const { trackEvent } = useMatomo();
  const [activeTab, setActiveTab] = React.useState<TabType>("recommended");
  const [hasMissingFields, setHasMissingFields] = React.useState(false);

  useEffect(() => {
    if (!property.address) return setHasMissingFields(true);
    if (!property.constructionYear) return setHasMissingFields(true);
    if (!property.housingCount) return setHasMissingFields(true);
    if (!property.heatedArea) return setHasMissingFields(true);
    if (!property.heatingType) return setHasMissingFields(true);
    if (!property.heatingEnergy) return setHasMissingFields(true);
    if (!property.heatingEmitterType) return setHasMissingFields(true);
    if (!property.ecsType) return setHasMissingFields(true);
    if (!property.ecsEnergy) return setHasMissingFields(true);
    setHasMissingFields(false);
  }, [property]);

  if (isLoading) {
    return (
      <div className="space-y-10">
        {[0, 1, 2].map((idx) => (
          <SolutionCardSkeleton key={idx} />
        ))}
      </div>
    );
  }

  if (!property.address) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 px-16 py-10">
        <div className="flex flex-col items-center justify-center max-w-2xl bg-white rounded-lg p-6">
          <img src={CalcivertImage} alt="Calcivert" className="w-16 h-auto mb-2" />
          <h2 className="text-primary text-3xl font-bold mb-4 text-center">Commencez par renseigner l'adresse de votre copropriété</h2>
          <p className="text-gray-700 text-lg mb-5 text-center">
            Pour vous proposer les meilleures solutions de chauffage écologique adaptées à votre immeuble, nous avons besoin de connaître son adresse.
          </p>
          <button
            onClick={() => {
              trackEvent({ category: MATOMO_CATEGORIES.formulaire, action: "open_modal", name: "address_missing" });
              onOpenModal();
            }}
            className="button-primary text-base"
          >
            <span>Renseigner l'adresse</span>
            <FaArrowUp />
          </button>
        </div>
      </div>
    );
  }

  if (hasMissingFields) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 px-16 py-10">
        <div className="flex flex-col items-center justify-center max-w-2xl bg-white rounded-lg p-6">
          <img src={CalcivertImage} alt="Calcivert" className="w-16 h-auto mb-2" />
          <h2 className="text-primary text-3xl font-bold mb-4 text-center">Quelques informations manquantes</h2>
          <p className="text-gray-700 text-lg mb-5 text-center">
            Pour calculer les solutions les plus adaptées à votre copropriété, nous avons besoin de quelques informations supplémentaires.
          </p>
          <div className="mb-8 w-full">
            <Alert type="warning" title="Veuillez compléter le profil de votre copropriété pour obtenir des recommandations précises" />
          </div>
          <button
            onClick={() => {
              trackEvent({ category: MATOMO_CATEGORIES.formulaire, action: "open_modal", name: "complete_information" });
              onOpenModal();
            }}
            className="button-primary text-base hover:opacity-90 transition-opacity"
          >
            <span>Compléter les informations</span>
            <FaArrowUp />
          </button>
        </div>
      </div>
    );
  }

  // Tout est bon mais pas de solutions calculées
  console.log(solutions);
  if (!solutions) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 px-16 py-10">
        <div className="flex flex-col items-center justify-center max-w-2xl bg-white rounded-lg p-6">
          <img src={CalcivertImage} alt="Calcivert" className="w-16 h-auto mb-2" />
          <h2 className="text-primary text-3xl font-bold mb-4 text-center">Calcul des solutions</h2>
          <p className="text-gray-700 text-lg mb-5 text-center">Nous n'avons pas pu calculer de solutions pour votre copropriété. Veuillez réessayer ou contacter le support.</p>
          <button
            onClick={() => {
              trackEvent({ category: MATOMO_CATEGORIES.formulaire, action: "open_modal", name: "modify_information" });
              onOpenModal();
            }}
            className="button-primary text-base hover:opacity-90 transition-opacity"
          >
            <span>Modifier les informations</span>
            <FaArrowUp />
          </button>
        </div>
      </div>
    );
  }

  // Affichage des solutions
  return (
    <>
      {solutions && (solutions.recommendedSolutions.length > 0 || solutions.nonRecommendedSolutions.length > 0) ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <TabItem
                tab={{ id: "recommended", label: "Solutions recommandées", count: solutions.recommendedSolutions.length }}
                isActive={activeTab === "recommended"}
                onTabChange={(tabId: TabType) => setActiveTab(tabId)}
              />
              <TabItem
                tab={{ id: "not-recommended", label: "Solutions non-recommandées", count: solutions.nonRecommendedSolutions.length }}
                isActive={activeTab === "not-recommended"}
                onTabChange={(tabId: TabType) => setActiveTab(tabId)}
              />
            </div>
            <DownloadMenu />
          </div>

          <Alert
            className="mb-6"
            type="warning"
            title="Ce sont des estimations !"
            message="Tous les chiffres des solutions sont des estimations, ils sont approximatif et ne peuvent pas servir de devis."
          />
          {/* Tab Content */}
          <div className="space-y-10">
            {activeTab === "recommended" && solutions.recommendedSolutions.map((item, index) => <SolutionCard key={index} data={item} type="recommended" />)}
            {activeTab === "not-recommended" && solutions.nonRecommendedSolutions.map((item, index) => <SolutionCard key={index} data={item} type="not-recommended" />)}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-8 px-16 py-10">
          <div className="flex flex-col items-center justify-center max-w-2xl bg-white rounded-lg p-6">
            <img src={CalcivertImage} alt="Calcivert" className="w-16 h-auto mb-2" />
            <h2 className="text-primary text-3xl font-bold mb-4 text-center">Calcul des solutions</h2>
            <p className="text-gray-700 text-lg mb-5 text-center">Nous n'avons trouvé aucune solution compatible avec votre configuration actuelle.</p>
            <button onClick={onOpenModal} className="button-primary text-base hover:opacity-90 transition-opacity">
              <span>Modifier les informations</span>
              <FaArrowUp />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

interface SolutionCardProps {
  data: RecommendedSolution | NonRecommendedSolution;
  type: "recommended" | "not-recommended";
}

function SolutionCard({ data, type }: SolutionCardProps) {
  const solution = data.solution;
  const isRecommended = type === "recommended";
  const solutionMessage = isRecommended ? (data as RecommendedSolution).message || "" : "";
  const missingConditions = !isRecommended ? (data as NonRecommendedSolution).missingConditions || [] : [];
  const missingConditionMessages = missingConditions.map((condition) => condition.message);
  const { trackEvent } = useMatomo();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    console.log(searchParams);
  }, [searchParams]);

  return (
    <Link
      to={`/solution/${solution.slug}?${searchParams.toString()}`}
      rel="noopener noreferrer"
      onClick={() => trackEvent({ category: MATOMO_CATEGORIES.resultats, action: "click_solution", name: solution.slug })}
      className="block bg-white border border-primary-light rounded-lg shadow-outline bg-none hover:shadow-outline-xs transition-shadow duration-300"
    >
      <div className="grid grid-cols-3">
        <div className="col-span-2 p-4">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 flex-shrink-0 mt-1">
              <img src={solution.icon} alt="heat" className="w-10 h-10" />
            </div>

            <div className="flex-1">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-1 flex items-start justify-between">
                  <div className="flex flex-col w-full gap-2 mb-1">
                    <div className="grid grid-cols-[1fr,auto] items-start w-full overflow-hidden">
                      <h3 title={solution.title} className="font-bold text-primary pr-2 break-words whitespace-normal leading-tight max-w-full" style={{ wordBreak: "break-word" }}>
                        {solution.title}
                      </h3>
                      <span className="bg-purple-light text-purple-dark px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                        {solution.type === "collectif" ? "SOLUTION COLLECTIVE" : "SOLUTION INDIVIDUELLE"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 italic">
                      —{" "}
                      {solution.hasHeating && solution.hasEcs
                        ? "Chauffage et eau chaude"
                        : solution.hasEcs && !solution.hasHeating
                        ? "Eau chaude uniquement"
                        : "Chauffage uniquement"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative text-sm text-primary-light mb-3 flex items-start gap-2">
                <p>{solution.description}</p>
                <img src={Icon} alt="icon" className="absolute -left-6 top-1" />
              </div>

              {isRecommended && solutionMessage && <Alert className="mb-4" type="warning" title={solutionMessage} />}
              {!isRecommended && missingConditionMessages.length > 0 && <Alert className="mb-4" type="error" title="Conditions non-remplies :" items={missingConditionMessages} />}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">COÛT DU MATÉRIEL</div>
                  <div className="font-bold text-primary">{solution.costMaterial}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">COÛT DE MAINTENANCE</div>
                  <div className="font-bold text-primary">{solution.costMaintenance}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-l border-primary-light bg-primary-lightest rounded-r-lg p-4 flex-1">
          <div className="text-primary font-bold tracking-wide mb-5">🌿 Performance énergétique</div>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">ÉVOLUTION DE LA PERFORMANCE</div>
              {solution.dpeGain.match(/\d+/g) ? (
                <div className="flex items-center gap-2">
                  <div className="relative min-w-8 w-8 h-8 flex items-center">
                    <svg width="32" height="32" viewBox="0 0 32 32" className="absolute left-0 top-0">
                      <path
                        d="M2 6 C2 3.8 3.8 2 6 2 L20 2 C21.1 2 22.1 2.6 22.6 3.6 L28 14 C28.4 14.8 28.4 17.2 28 18 L22.6 28.4 C22.1 29.4 21.1 30 20 30 L6 30 C3.8 30 2 28.2 2 26 Z"
                        fill="#FEF3C7"
                        stroke="#D97706"
                        strokeWidth="2"
                      />
                    </svg>
                    <span className="absolute left-[44%] -translate-x-1/2 z-10 text-yellow-800 font-bold text-sm">
                      {solution.dpeGain.match(/\d+/g)?.[1] || solution.dpeGain.match(/\d+/g)?.[0] || "?"}
                    </span>
                  </div>
                  <span className="font-bold text-primary">{solution.dpeGain}</span>
                </div>
              ) : (
                <div className="font-extrabold text-primary-light italic">Pas de gain de lettre DPE</div>
              )}
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">ÉMISSIONS DE CO₂</div>
              <div className="text-sm text-primary">{solution.co2Emissions}</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface TabItemProps {
  tab: {
    id: TabType;
    label: string;
    count: number;
  };
  isActive: boolean;
  onTabChange: (tabId: TabType) => void;
}

function TabItem({ tab, isActive, onTabChange }: TabItemProps) {
  return (
    <button
      onClick={() => onTabChange(tab.id)}
      className={`px-4 py-2 rounded text-sm font-medium transition-colors ${isActive ? "bg-primary-bright text-primary" : "text-primary-light hover:text-primary"}`}
    >
      {tab.label} {tab.count && `(${tab.count})`}
    </button>
  );
}

function SolutionCardSkeleton() {
  return (
    <div className="block bg-white border border-primary-light rounded-lg shadow-outline animate-pulse">
      <div className="grid grid-cols-3">
        <div className="col-span-2 p-4">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 flex-shrink-0 mt-1 bg-gray-300 rounded" />

            <div className="flex-1">
              <div className="flex items-start gap-3 mb-8 mt-1">
                <div className="flex-1 flex items-start justify-between">
                  <div className="flex flex-col w-full gap-2 mb-1">
                    <div className="h-3 w-2/3 bg-gray-400 rounded" />
                    <div className="h-3 w-40 bg-gray-300 rounded" />
                  </div>
                </div>
              </div>

              <div className="relative mb-6">
                <div className="h-3 w-4/5 mb-2 bg-gray-400 rounded" />
                <div className="h-3 w-1/3 bg-gray-400 rounded" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="h-3 w-28 bg-gray-300 rounded mb-2" />
                  <div className="h-3 w-36 bg-gray-400 rounded" />
                </div>
                <div>
                  <div className="h-3 w-32 bg-gray-300 rounded mb-2" />
                  <div className="h-3 w-36 bg-gray-400 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-l border-primary-light bg-light rounded-r-lg p-4 flex-1">
          <div className="h-3 w-2/3 bg-gray-400 rounded mb-10" />
          <div className="space-y-6">
            <div>
              <div className="h-3 w-32 bg-gray-300 rounded mb-2" />
              <div className="h-3 w-36 bg-gray-400 rounded" />
            </div>
            <div>
              <div className="h-3 w-32 bg-gray-300 rounded mb-2" />
              <div className="h-3 w-36 bg-gray-400 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const DownloadMenu = () => {
  const { property, solutions } = useStore();
  const { trackEvent } = useMatomo();
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = React.useState(false);
  const downloadMenuRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isDownloadMenuOpen) return;
    const handleDocumentClick = (event: MouseEvent) => {
      if (!downloadMenuRef.current) return;
      if (!downloadMenuRef.current.contains(event.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsDownloadMenuOpen(false);
    };
    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isDownloadMenuOpen]);

  return (
    <div className="relative" ref={downloadMenuRef}>
      <button onClick={() => setIsDownloadMenuOpen((v) => !v)} className="flex items-start gap-x-2 text-sm text-primary border-b border-primary pb-1">
        <RiDownloadLine className="text-base" />
        <span className="font-medium">Télécharger le récapitulatif</span>
      </button>
      {isDownloadMenuOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-primary-light rounded shadow-outline z-10">
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-primary-bright"
            onClick={() => {
              if (!solutions) return;
              setIsDownloadMenuOpen(false);
              trackEvent({ category: MATOMO_CATEGORIES.impression, action: "download_summary" });
              void printSolutionsSummary(property, solutions);
            }}
          >
            Télécharger en PDF
          </button>
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-primary-bright"
            onClick={() => {
              if (!solutions) return;
              setIsDownloadMenuOpen(false);
              trackEvent({ category: MATOMO_CATEGORIES.impression, action: "download_summary_txt" });
              void downloadSolutionsSummaryText(property, solutions);
            }}
          >
            Télécharger en texte (.txt)
          </button>
        </div>
      )}
    </div>
  );
};
