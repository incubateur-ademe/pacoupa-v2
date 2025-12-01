import { Property, SolutionsResult, RecommendedSolution, NonRecommendedSolution } from "@/types";

function formatBoolean(value: boolean): string {
  return value ? "Oui" : "Non";
}

function joinLines(lines: Array<string | null | undefined>): string {
  return lines.filter((l): l is string => typeof l === "string" && l.length > 0).join("\n");
}

function renderPropertySummary(property: Property): string {
  const rows: Array<[string, string]> = [
    ["Adresse", property.address || "-"],
    ["Année de construction", property.constructionYear ? String(property.constructionYear) : "-"],
    ["Nombre de logements", property.housingCount != null ? String(property.housingCount) : "-"],
    ["Surface chauffée (m²)", property.heatedArea != null ? String(property.heatedArea) : "-"],
    ["Chauffage - Type", property.heatingType || "-"],
    ["Chauffage - Énergie", property.heatingEnergy || "-"],
    ["Chauffage - Émetteurs", property.heatingEmitterType || "-"],
    ["ECS - Type", property.ecsType || "-"],
    ["ECS - Énergie", property.ecsEnergy || "-"],
    ["Qualité d'enveloppe", property.envelopeQuality || "-"],
    ["Réseau de chaleur à proximité (PDP)", formatBoolean(property.fcuIsInPDP)],
    ["Distance au réseau de chaleur (m)", property.fcuDistance ? String(property.fcuDistance) : "-"],
  ];

  const lines: string[] = ["Récapitulatif de la copropriété:"];
  for (const [label, value] of rows) {
    lines.push(`- ${label}: ${value}`);
  }
  return lines.join("\n");
}

function solutionSubtitle(s: RecommendedSolution["solution"]): string {
  if (s.hasHeating && s.hasEcs) return "Chauffage et eau chaude";
  if (s.hasEcs && !s.hasHeating) return "Eau chaude uniquement";
  return "Chauffage uniquement";
}

function renderSolutionItem(solutionBlock: RecommendedSolution | NonRecommendedSolution, type: "recommended" | "not-recommended"): string {
  const s = solutionBlock.solution;
  const badge = s.type === "collectif" ? "SOLUTION COLLECTIVE" : "SOLUTION INDIVIDUELLE";
  const isRecommended = type === "recommended";
  const message = isRecommended ? (solutionBlock as RecommendedSolution).message || "" : "";
  const missingConditions = !isRecommended ? (solutionBlock as NonRecommendedSolution).missingConditions || [] : [];

  const parts: string[] = [];
  parts.push(`${s.title} (${badge})`);
  parts.push(`— ${solutionSubtitle(s)}`);
  if (s.description) parts.push(s.description);
  if (isRecommended && message) parts.push(`Remarque: ${message}`);
  if (!isRecommended && missingConditions.length) {
    parts.push("Conditions non-remplies:");
    for (const cond of missingConditions) parts.push(`- ${cond.message}`);
  }
  parts.push(`Coût du matériel: ${s.costMaterial}`);
  parts.push(`Coût de maintenance: ${s.costMaintenance}`);
  parts.push(`Évolution de la performance: ${s.dpeGain}`);
  parts.push(`Émissions de CO₂: ${s.co2Emissions}`);
  return parts.join("\n");
}

function renderSolutionsSection(title: string, items: Array<RecommendedSolution | NonRecommendedSolution>, type: "recommended" | "not-recommended"): string {
  if (!items.length) return "";
  const lines: string[] = [title + ":"];
  for (const item of items) {
    lines.push(renderSolutionItem(item, type));
    lines.push("------------------------------");
  }
  return lines.join("\n");
}

export default async function downloadSolutionsSummaryText(property: Property, solutions: SolutionsResult | null): Promise<void> {
  const hasSolutions = !!solutions && (solutions.recommendedSolutions.length > 0 || solutions.nonRecommendedSolutions.length > 0);

  const sections: string[] = [];
  sections.push("Récapitulatif des solutions");
  sections.push(`Date: ${new Date().toLocaleDateString("fr-FR")}`);
  sections.push("");
  sections.push(renderPropertySummary(property));
  sections.push("");

  if (hasSolutions) {
    sections.push("ATTENTION - Ce sont des estimations !");
    sections.push("Tous les chiffres des solutions sont des estimations, ils sont approximatifs et ne peuvent pas servir de devis.");
    sections.push("");
    sections.push(
      joinLines([
        renderSolutionsSection("Solutions recommandées", solutions!.recommendedSolutions, "recommended"),
        renderSolutionsSection("Solutions non-recommandées", solutions!.nonRecommendedSolutions, "not-recommended"),
      ])
    );
  } else {
    sections.push("Aucune solution disponible pour l'instant.");
  }

  const finalText = sections.filter(Boolean).join("\n");

  const blob = new Blob([finalText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "recapitulatif-solutions.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
