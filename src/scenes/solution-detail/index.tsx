import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { RiDownloadLine, RiShareForwardLine } from "react-icons/ri";
import { FaPhone, FaRegCheckCircle, FaRegTimesCircle, FaShare } from "react-icons/fa";

import CalciVert from "@/assets/calcivert.png";
import IlluPac from "@/assets/Illu-PAC.png";
import icon from "@/assets/icon.svg";
import France from "@/assets/france.png";
import PLU from "@/assets/PLU.png";
import Accoustique from "@/assets/accoustique.png";
import Electricite from "@/assets/electricite.png";

// Assets
import { BiSolidInfoSquare } from "react-icons/bi";
import { MdOutlineInfo } from "react-icons/md";
import toast from "react-hot-toast";

// Import solutions
import { computeSolutions } from "@/services/solutions";
import { decodePropertyFromHash } from "@/utils";
import { SOLUTIONS } from "@/utils/solutions";
import type { Property, Solution } from "@/types";
import { Link } from "react-router-dom";
import { MATOMO_CATEGORIES } from "@/utils/matomo";
import { useMatomo } from "@datapunt/matomo-tracker-react";
import TooltipComponent from "@/components/Tooltip";
import Modal from "@/components/Modal";
import { useStore } from "@/services/store";
import { allPosts, type Post } from "@/lib/posts";

export default function SolutionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { trackEvent } = useMatomo();
  const [searchParams] = useSearchParams();
  const [isExampleOpen, setIsExampleOpen] = useState(false);
  const solutions = useStore((state) => state.solutions);
  const setProperty = useStore((state) => state.setProperty);
  const setSolutions = useStore((state) => state.setSolutions);

  const solution = useMemo(() => {
    if (!SOLUTIONS || SOLUTIONS.length === 0) {
      throw new Error("No solutions available");
    }
    return SOLUTIONS.find((s) => s.slug === slug) || SOLUTIONS[0];
  }, [slug]);

  const currentSolution = solution!;
  const nonRecommendedSolution = solutions?.nonRecommendedSolutions.find((item) => item.solution.slug === currentSolution.slug);
  const hashParam = searchParams.get("hash");

  useEffect(() => {
    if (!hashParam) return;

    hydrateSolutionsFromHash();
  }, [hashParam]);

  const hydrateSolutionsFromHash = async () => {
    const decodedProperty = decodePropertyFromHash(hashParam || "");
    if (!decodedProperty) {
      setSolutions(null);
      return;
    }

    setProperty(decodedProperty);

    if (hasMissingFields(decodedProperty)) {
      setSolutions(null);
      return;
    }

    const result = await computeSolutions(decodedProperty);

    if (!result) {
      setSolutions(null);
      return;
    }

    setSolutions(result);
  };

  return (
    <div className="mr-10 ml-14 p-6">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col items-start gap-2 relative">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">{currentSolution.title}</h1>
            <div className="px-1 py-0.5 bg-violet-100 rounded flex justify-start items-center gap-1">
              <div className="justify-start text-purple-900 text-xs font-bold">SOLUTION {currentSolution.type.toUpperCase() === "COLLECTIF" ? "COLLECTIVE" : "INDIVIDUELLE"}</div>
            </div>
          </div>
          <p className="text-gray-600">
            Solution {currentSolution.hasHeating ? "de chauffage" : ""}
            {currentSolution.hasHeating && currentSolution.hasEcs ? " et " : ""}
            {currentSolution.hasEcs ? "d'eau chaude" : ""}
            {currentSolution.hasCooling ? (currentSolution.hasHeating || currentSolution.hasEcs ? " avec rafraîchissement" : "de rafraîchissement") : ""}
          </p>
          <Link
            to={`/recherche?${searchParams.toString()}`}
            className="flex items-center gap-2 text-gray-700 absolute -left-6 top-2 bg-none"
            aria-label="Retour à la page précédente"
          >
            <IoArrowBack className="text-lg" />
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="flex items-center gap-x-2 text-sm text-gray-700 border-b border-primary pb-1"
            onClick={() => {
              if (!currentSolution.ficheEnr) return;
              trackEvent({ category: MATOMO_CATEGORIES.ctas, action: "download", name: "fiche_solution" });
              const link = document.createElement("a");
              link.href = currentSolution.ficheEnr as string;
              link.setAttribute("download", "");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <RiDownloadLine className="text-base" />
            <span>Télécharger la fiche solution</span>
          </button>
          <button
            className="flex items-center gap-x-2 text-sm text-gray-700 border-b border-primary pb-1"
            onClick={() => trackEvent({ category: MATOMO_CATEGORIES.ctas, action: "share", name: slug })}
          >
            <RiShareForwardLine className="text-base" />
            <button
              type="button"
              className="focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Lien copié dans le presse-papier");
              }}
              aria-label="Copier le lien de partage"
            >
              Partager
            </button>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-8">
        <div className="col-span-5 flex flex-col gap-16">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col justify-start items-start gap-2 relative">
              <TextWithToggle text={currentSolution.fullDescription} />
              <img src={icon} alt="icon" className="absolute -left-6 top-1" />
            </div>
            <div className="flex justify-center items-center">
              <img src={currentSolution.illustration} alt="illu-pac" className="w-3/5 h-auto pr-16" />
              <div className="w-2/5">
                <div className="px-2 flex flex-col justify-start items-start gap-4">
                  <div className="flex flex-col justify-start items-start gap-1">
                    <div className="justify-start text-base font-bold">🔊 Nuisance sonore</div>
                    <div className="justify-start text-sm font-normal">{currentSolution.noiseLevel}</div>
                  </div>
                  <div className="flex flex-col justify-start items-start gap-1">
                    <div className="justify-start text-base font-bold">👷‍♂️ Impact des travaux</div>
                    <div className="justify-start text-sm font-normal">{currentSolution.installationImpact}</div>
                  </div>
                  <div className="flex flex-col justify-start items-start gap-1">
                    <div className="justify-start text-base font-bold flex items-center gap-1">
                      📈 Coût du MWh
                      <TooltipComponent
                        id="cout-mwh"
                        description={
                          <>
                            <span className="text-sm font-normal">Mis à jour le : 05/09/2025</span>
                            <br />
                            <Link
                              to="#"
                              onClick={(e) => {
                                e.preventDefault();
                                window.open("https://www.ademe.fr/", "_blank");
                              }}
                              className="text-sm font-normal text-gray-600"
                            >
                              source : ADEME
                            </Link>
                          </>
                        }
                        Icon={() => <MdOutlineInfo className="w-5 h-5 text-gray-400" />}
                      />
                    </div>
                    <div className="justify-start text-sm font-normal">{currentSolution.costMwh}</div>
                  </div>
                  <div className="flex flex-col justify-start items-start gap-1">
                    <div className="justify-start text-base font-bold">❄️ Production de froid</div>
                    <div className="justify-start text-sm font-normal">
                      {currentSolution.hasCooling ? "Oui, cette solution permet le rafraîchissement" : "Non, cette solution ne permet pas le rafraîchissement"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="text-primary font-bold text-xl tracking-wide">Exemple d'application</div>
            {currentSolution.example && currentSolution.example.images && currentSolution.example.images.length > 0 ? (
              <div
                className="p-4 bg-white rounded-2xl border-2 border-primary-light shadow-outline flex gap-4 w-3/5 cursor-pointer hover:bg-gray-50 transition-colors"
                role="button"
                tabIndex={0}
                onClick={() => {
                  setIsExampleOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsExampleOpen(true);
                  }
                }}
              >
                <img src={France} alt="icon" className="w-14 h-14" />
                <div className="flex flex-col gap-4 w-full">
                  <div className="flex flex-col gap-1">
                    {currentSolution.example.titrePrincipal && <div className="text-neutral-900 font-bold ">{currentSolution.example.titrePrincipal}</div>}
                    {currentSolution.example.lieu && currentSolution.example.codeDepartement && (
                      <div className="text-neutral-700 font-normal">{`${currentSolution.example.lieu} (${currentSolution.example.codeDepartement})`}</div>
                    )}
                  </div>
                  <div className="w-full flex justify-end">
                    <div className="py-1 border-b border-primary w-fit flex items-center gap-1">
                      <div className="font-normal ">Voir l'exemple</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-white rounded-2xl border-2 border-gray-200 flex gap-4 w-3/5 opacity-60 items-center">
                <img src={France} alt="icon" className="w-14 h-14" />
                <div className="flex flex-col gap-1">
                  <div className="text-neutral-900 font-normal">Aucun exemple disponible</div>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col justify-start items-start gap-4">
            <div className="flex flex-col justify-center items-start gap-1">
              <div className="justify-start text-xl font-bold">Condition d'installation</div>
              <div className="justify-start text-sm font-normal">Ces conditions doivent être impérativement remplies pour permettre l'installation de la solution</div>
            </div>
            <div className="flex flex-col justify-start items-start gap-8">
              {currentSolution.emitterTypeRequired && (
                <Requirement
                  title="Type d'émetteur requis"
                  message={currentSolution.emitterTypeRequired}
                  missingMessage={nonRecommendedSolution?.missingConditions?.find((condition) => condition.requirement === "emitterTypeRequired")?.message}
                  isMissing={!!nonRecommendedSolution?.missingConditions?.find((condition) => condition.requirement === "emitterTypeRequired")}
                />
              )}

              {currentSolution.distanceRequirement && (
                <Requirement
                  title="Distance requise"
                  message={currentSolution.distanceRequirement}
                  missingMessage={nonRecommendedSolution?.missingConditions?.find((condition) => condition.requirement === "distanceRequirement")?.message}
                  isMissing={!!nonRecommendedSolution?.missingConditions?.find((condition) => condition.requirement === "distanceRequirement")}
                />
              )}

              {currentSolution.outdoorSpaceRequired && (
                <Requirement
                  title="Espace extérieur requis"
                  message={currentSolution.outdoorSpaceRequired}
                  missingMessage={nonRecommendedSolution?.missingConditions?.find((condition) => condition.requirement === "outdoorSpaceRequired")?.message}
                  isMissing={!!nonRecommendedSolution?.missingConditions?.find((condition) => condition.requirement === "outdoorSpaceRequired")}
                />
              )}

              {currentSolution.indoorSpaceRequired && (
                <Requirement
                  title="Espace intérieur requis"
                  message={currentSolution.indoorSpaceRequired}
                  missingMessage={nonRecommendedSolution?.missingConditions?.find((condition) => condition.requirement === "indoorSpaceRequired")?.message}
                  isMissing={!!nonRecommendedSolution?.missingConditions?.find((condition) => condition.requirement === "indoorSpaceRequired")}
                />
              )}

              {nonRecommendedSolution?.missingConditions?.some((condition) => condition.requirement === undefined) && (
                <div className="relative rounded flex flex-col justify-center items-start gap-1">
                  <div className="relative px-1 py-0.5 rounded text-red-700 bg-red-100 text-xs font-bold uppercase">
                    Autre conditions non remplies
                    <FaRegTimesCircle className="w-4 h-4 text-red-700 bg-red-100 rounded-full absolute -left-6 top-0.5" />
                  </div>
                  <div className="flex flex-col justify-start items-start gap-0.5">
                    {nonRecommendedSolution.missingConditions
                      .filter((condition) => condition.requirement === undefined)
                      .map((condition, idx) => (
                        <div key={idx} className="flex-1 justify-start text-sm font-normal mb-1">
                          {condition.message}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {currentSolution.otherConditions && currentSolution.otherConditions.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="text-primary font-bold text-xl tracking-wide">Autres conditions à vérifier</div>
              <div className="grid grid-cols-3 gap-4 mt-2">
                {currentSolution.otherConditions.slice(0, 3).map((condition, index) => (
                  <div key={index} className={`relative border-2 border-primary rounded-lg px-4 py-8 text-center flex flex-col items-center`}>
                    <div className="h-12 flex items-center justify-center mb-3">
                      <img src={index === 0 ? PLU : index === 1 ? Accoustique : Electricite} alt={`Condition ${index + 1}`} className="h-12 w-auto" />
                    </div>
                    <div className="text-sm font-medium mb-1">{condition.split(":")[0] || `Condition ${index + 1}`}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-4">
            <div className="text-primary font-bold text-xl tracking-wide">Bon à savoir</div>
            <div className="flex flex-col justify-start items-start gap-2 relative">
              <div className="text-neutral-900 font-bold">Description complète</div>
              <div className="justify-start text-primary text-sm font-normal">{currentSolution.fullDescription}</div>
            </div>

            {currentSolution.otherConditions && currentSolution.otherConditions.length > 3 && (
              <div className="flex flex-col justify-start items-start gap-2 relative">
                <div className="text-neutral-900 font-bold">Conditions supplémentaires</div>
                <div className="justify-start text-primary text-sm font-normal">
                  <ul className="list-disc pl-5 space-y-1">
                    {currentSolution.otherConditions.slice(3).map((condition, index) => (
                      <li key={index}>{condition}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <div className="text-primary font-bold text-xl tracking-wide">Articles associés</div>
            <RelatedArticles solution={currentSolution} />
          </div>
        </div>
        <div className="col-span-2 flex flex-col gap-6">
          <div className="flex flex-col gap-6 p-8 border-2 border-primary rounded-3xl">
            <div className="flex flex-col gap-4">
              <div className="text-primary font-bold tracking-wide">🌿 Performance énergétique</div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">ÉVOLUTION DE LA PERFORMANCE</div>
                {currentSolution.dpeGain.match(/\d+/g) ? (
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
                        {currentSolution.dpeGain.match(/\d+/g)?.[1] || currentSolution.dpeGain.match(/\d+/g)?.[0] || "?"}
                      </span>
                    </div>
                    <span className="font-bold text-primary">{currentSolution.dpeGain}</span>
                  </div>
                ) : (
                  <div className="font-extrabold text-primary-light italic">Pas de gain de lettre DPE</div>
                )}
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">ÉMISSIONS DE CO₂</div>
                <div className="font-bold text-primary">{currentSolution.co2Emissions}</div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="text-primary font-bold tracking-wide">💰 Coût</div>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">COÛT DU MATÉRIEL</div>
                  <div className="font-bold text-primary">{currentSolution.costMaterial}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">COÛT DE MAINTENANCE</div>
                  <div className="font-bold text-primary">{currentSolution.costMaintenance}</div>
                </div>
              </div>
            </div>
          </div>
          <div data-state="primary" className=" p-6 bg-green-100 rounded-2xl flex flex-col justify-start items-center gap-1">
            <div className="flex flex-col justify-center items-center gap-4">
              <img src={CalciVert} alt="icon-vert" className="w-16 h-16" />
              <div className="flex flex-col justify-start items-center gap-1">
                <div className="text-base font-bold">Cette solution vous intéresse ?</div>
                <div className="text-center text-xs font-normal">Retrouvez le contact des professionnels qui peuvent vous aider : conseiller, professionnels RGE,&nbsp;...</div>
              </div>
              <Link
                to="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.open("https://france-renov.gouv.fr/annuaires-professionnels/artisan-rge-architecte#/tab", "_blank");
                  trackEvent({ category: MATOMO_CATEGORIES.ctas, action: "contact", name: "contacter_professionnel" });
                }}
                className="button-primary text-base px-6"
              >
                <span>Contacter un professionnel</span>
                <FaPhone />
              </Link>
            </div>
          </div>
          <div className=" p-2 bg-yellow-50 rounded flex justify-start items-start gap-2">
            <div className="pt-0.5 flex justify-start items-start gap-2">
              <BiSolidInfoSquare className="w-4 h-4 mt-0.5 text-yellow-600" />
            </div>
            <div className="flex flex-col justify-start items-start gap-2">
              <div className="justify-center">
                <span className="text-sm font-bold">Ce sont des estimations ! </span>
                <span className="text-sm font-normal">Tous les chiffres des solutions sont des estimations, ils sont approximatif et ne peuvent pas servir de devis.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isExampleOpen && currentSolution.example && (
        <Modal isOpen={isExampleOpen} onClose={() => setIsExampleOpen(false)} className="max-w-[900px] max-h-[90%] overflow-y-auto">
          <div className="p-8">
            {/* Header */}
            <div className="mb-4">
              {currentSolution.example.titrePrincipal && <h2 className="text-2xl font-bold text-primary">{currentSolution.example.titrePrincipal}</h2>}
              {currentSolution.example.lieu && currentSolution.example.codeDepartement && (
                <div className="mt-1 text-gray-600 text-sm">
                  {currentSolution.example.lieu} ({currentSolution.example.codeDepartement})
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 font-medium">{currentSolution.example.estNeuf ? "Neuf" : "Rénovation"}</span>
                {typeof currentSolution.example.anneeConstruction === "number" && currentSolution.example.anneeConstruction > 0 && (
                  <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 font-medium">Construit en {currentSolution.example.anneeConstruction}</span>
                )}
                {currentSolution.example.anneeLivraison && (
                  <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 font-medium">Livré en {currentSolution.example.anneeLivraison}</span>
                )}
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {typeof currentSolution.example.nbLogements === "number" && currentSolution.example.nbLogements > 0 && (
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-xs text-gray-500">Logements</div>
                  <div className="text-base font-semibold text-primary">{currentSolution.example.nbLogements}</div>
                </div>
              )}
              {typeof currentSolution.example.nbm2 === "number" && currentSolution.example.nbm2 > 0 && (
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-xs text-gray-500">Surface</div>
                  <div className="text-base font-semibold text-primary">{`${currentSolution.example.nbm2} m²`}</div>
                </div>
              )}
              {currentSolution.example.isolation && currentSolution.example.isolation.trim().length > 0 && (
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-xs text-gray-500">Isolation</div>
                  <div className="text-base font-semibold text-primary">Oui</div>
                </div>
              )}
              {typeof currentSolution.example.estNeuf === "boolean" && (
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-xs text-gray-500">Projet</div>
                  <div className="text-base font-semibold text-primary">{currentSolution.example.estNeuf ? "Neuf" : "Rénovation"}</div>
                </div>
              )}
            </div>

            {/* Before / After */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {(currentSolution.example.avantChauffage || currentSolution.example.avantECS) && (
                <div className="rounded-xl border-2 border-primary-light p-4">
                  <div className="font-bold text-primary mb-2">Avant</div>
                  <div className="text-sm text-gray-700 space-y-1">
                    {currentSolution.example.avantChauffage && (
                      <div>
                        <span className="text-gray-500">Chauffage: </span>
                        <span className="font-medium">{currentSolution.example.avantChauffage}</span>
                      </div>
                    )}
                    {currentSolution.example.avantECS && (
                      <div>
                        <span className="text-gray-500">ECS: </span>
                        <span className="font-medium">{currentSolution.example.avantECS}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {(currentSolution.example.apresChauffage || currentSolution.example.apresECS) && (
                <div className="rounded-xl border-2 border-green-200 p-4">
                  <div className="font-bold text-green-800 mb-2">Après</div>
                  <div className="text-sm text-gray-700 space-y-1">
                    {currentSolution.example.apresChauffage && (
                      <div>
                        <span className="text-gray-500">Chauffage: </span>
                        <span className="font-medium">{currentSolution.example.apresChauffage}</span>
                      </div>
                    )}
                    {currentSolution.example.apresECS && (
                      <div>
                        <span className="text-gray-500">ECS: </span>
                        <span className="font-medium">{currentSolution.example.apresECS}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Two-column info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {currentSolution.example.avantages && currentSolution.example.avantages.length > 0 && (
                  <div>
                    <div className="text-sm font-bold text-neutral-900 mb-2">Points clés</div>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                      {currentSolution.example.avantages.map((a: string, i: number) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {currentSolution.example.detailMaterielsInstalles && currentSolution.example.detailMaterielsInstalles.length > 0 && (
                  <div>
                    <div className="text-sm font-bold text-neutral-900 mb-2">Matériels installés</div>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                      {currentSolution.example.detailMaterielsInstalles.map((m: string, i: number) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {(currentSolution.example.maitreOuvrage || currentSolution.example.bureauEtude || currentSolution.example.installateur || currentSolution.example.isolation) && (
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="text-sm font-bold text-neutral-900 mb-2">Intervenants</div>
                  {currentSolution.example.maitreOuvrage && (
                    <div>
                      <span className="text-gray-500">Maître d'ouvrage: </span>
                      <span className="font-medium">{currentSolution.example.maitreOuvrage}</span>
                    </div>
                  )}
                  {currentSolution.example.bureauEtude && (
                    <div>
                      <span className="text-gray-500">Bureau d'étude: </span>
                      <span className="font-medium">{currentSolution.example.bureauEtude}</span>
                    </div>
                  )}
                  {currentSolution.example.installateur && (
                    <div>
                      <span className="text-gray-500">Installateur: </span>
                      <span className="font-medium">{currentSolution.example.installateur}</span>
                    </div>
                  )}
                  {currentSolution.example.isolation && currentSolution.example.isolation.trim().length > 0 && (
                    <div className="mt-2">
                      <span className="text-gray-500">Isolation: </span>
                      <span className="font-medium">{currentSolution.example.isolation}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Images */}
            {currentSolution.example.images && currentSolution.example.images.length > 0 && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentSolution.example.images.map((src: string, i: number) => (
                  <img key={i} src={src} alt={`exemple-${i + 1}`} className="w-full h-auto rounded-lg border" />
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

// Component for toggling description
const TextWithToggle = ({ text }: { text: string }) => {
  const [showFullText, setShowFullText] = useState(false);
  const textRef = React.useRef<HTMLDivElement>(null);
  const [isTextOverflowing, setIsTextOverflowing] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const measure = () => {
      if (showFullText) return; // keep the toggle visible when expanded
      const overflowDelta = el.scrollHeight - el.clientHeight;
      setIsTextOverflowing(overflowDelta > 1); // tolerance to avoid rounding glitches
    };

    const rafId = requestAnimationFrame(measure);

    const resizeObserver = new ResizeObserver(() => {
      measure();
    });
    resizeObserver.observe(el);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [text, showFullText]);

  return (
    <>
      <div ref={textRef} className={`justify-start text-primary text-sm font-normal ${!showFullText ? "line-clamp-2" : ""}`}>
        {text}
      </div>
      {isTextOverflowing && (
        <button className="justify-start text-purple-secondaryDarker text-sm font-medium underline cursor-pointer" onClick={() => setShowFullText(!showFullText)}>
          {showFullText ? "Réduire la description" : "Lire la description complète"}
        </button>
      )}
    </>
  );
};

const Requirement = ({ title, message, missingMessage, isMissing }: { title: string; message: string; missingMessage: string | undefined; isMissing: boolean }) => {
  return (
    <div className="relative rounded flex flex-col justify-center items-start gap-1">
      <div className={`relative px-1 py-0.5 rounded ${isMissing ? "text-red-700 bg-red-100" : "text-green-700 bg-green-100"} text-xs font-bold uppercase`}>
        {title}
        {isMissing ? (
          <FaRegTimesCircle className="w-4 h-4 text-red-700 bg-red-100 rounded-full absolute -left-6 top-0.5" />
        ) : (
          <FaRegCheckCircle className="w-4 h-4 text-green-700 bg-green-100 rounded-full absolute -left-6 top-0.5" />
        )}
      </div>
      <div className="flex justify-start items-start gap-0.5">
        <div className="flex-1 justify-start text-sm font-normal">{isMissing ? missingMessage : message}</div>
      </div>
    </div>
  );
};

const RelatedArticles = ({ solution }: { solution: Solution }) => {
  const { trackEvent } = useMatomo();
  const [relatedArticles, setRelatedArticles] = useState<Post[]>([]);

  useEffect(() => {
    let related = [];

    const slugParts = solution.slug.toLowerCase().split("-");
    related = allPosts
      .filter((post) => {
        return slugParts.some((part) => post.frontmatter.tag?.toLowerCase().includes(part));
      })
      .slice(0, 3);

    if (related.length < 3) {
      const generalPosts = allPosts.filter((post) => post.frontmatter.tag?.toLowerCase() === "general").slice(0, 3 - related.length);
      related = [...related, ...generalPosts];
    }
    setRelatedArticles(related);
  }, [solution]);

  return (
    <div className="grid grid-cols-3 gap-4">
      {relatedArticles.map((article) => (
        <Link
          key={article.slug}
          to={`/blog/${article.slug}`}
          className="bg-white border-2 border-primary shadow-outline rounded-2xl flex flex-col overflow-hidden hover:shadow-lg transition-shadow h-full bg-none"
          aria-label={`Lire l'article ${article.frontmatter.title}`}
          onClick={() => trackEvent({ category: MATOMO_CATEGORIES.blog, action: "click_related_post", name: article.slug })}
        >
          {article.frontmatter.image && <img className="w-full object-cover h-52" src={`/blog/${article.frontmatter.image}`} alt={article.frontmatter.title} />}
          <div className="flex flex-col flex-1 justify-between items-stretch w-full">
            <div className="px-4 pt-4 flex flex-col gap-1 w-full">
              <div className="text-neutral-900 text-sm font-bold">{article.frontmatter.title}</div>
              {(article.frontmatter.summary || article.frontmatter.excerpt) && (
                <div className="text-neutral-700 text-sm">{article.frontmatter.summary || article.frontmatter.excerpt}</div>
              )}
            </div>
            <div className="px-4 pb-4 mt-4 flex items-end flex-1">
              <div className="py-1 border-b flex justify-start items-center gap-1 w-full">
                <div className="text-sm">Lire l'article</div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

const hasMissingFields = (property?: Property | null) => {
  if (!property) return true;
  if (!property.address) return true;
  if (!property.constructionYear) return true;
  if (!property.housingCount) return true;
  if (!property.heatedArea) return true;
  if (!property.heatingType) return true;
  if (!property.heatingEnergy) return true;
  if (!property.heatingEmitterType) return true;
  if (!property.ecsType) return true;
  if (!property.ecsEnergy) return true;
  return false;
};
