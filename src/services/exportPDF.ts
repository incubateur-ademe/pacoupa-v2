import { Property, SolutionsResult, RecommendedSolution, NonRecommendedSolution } from "@/types";

function escapeHtml(input: unknown): string {
  if (input === null || input === undefined) return "-";
  const str = String(input);
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

function formatBoolean(value: boolean): string {
  return value ? "Oui" : "Non";
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

  return `
    <section class="section">
      <h2 class="section-title">Récapitulatif de la copropriété</h2>
      <div class="grid grid-2">
        ${rows
          .map(
            ([label, value]) => `
              <div class="row">
                <div class="label">${escapeHtml(label)}</div>
                <div class="value">${escapeHtml(value)}</div>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderSolutionCard(solutionBlock: RecommendedSolution | NonRecommendedSolution, type: "recommended" | "not-recommended"): string {
  const s = solutionBlock.solution;
  const badge = s.type === "collectif" ? "SOLUTION COLLECTIVE" : "SOLUTION INDIVIDUELLE";
  const isRecommended = type === "recommended";
  const message = isRecommended ? (solutionBlock as RecommendedSolution).message || "" : "";
  const missingConditions = !isRecommended ? (solutionBlock as NonRecommendedSolution).missingConditions || [] : [];

  return `
    <article class="card">
      <div class="card-header">
        ${s.icon ? `<img class="icon" src="${s.icon}" alt="${escapeHtml(s.title)}" />` : ""}
        <div class="header-text">
          <div class="title-line">
            <h3 class="card-title">${escapeHtml(s.title)}</h3>
            <span class="badge">${badge}</span>
          </div>
          <div class="subtitle">${s.hasHeating && s.hasEcs ? "Chauffage et eau chaude" : s.hasEcs && !s.hasHeating ? "Eau chaude uniquement" : "Chauffage uniquement"}</div>
        </div>
      </div>

      <p class="description">${escapeHtml(s.description)}</p>

      ${isRecommended && message ? `<div class="alert alert-warning">${escapeHtml(message)}</div>` : ""}
      ${
        !isRecommended && missingConditions.length
          ? `<div class="alert alert-error"><div class="alert-title">Conditions non-remplies :</div><ul>${missingConditions
              .map((c) => `<li>${escapeHtml(c.message)}</li>`)
              .join("")}</ul></div>`
          : ""
      }

      <div class="grid grid-2">
        <div>
          <div class="label">Coût du matériel</div>
          <div class="value">${escapeHtml(s.costMaterial)}</div>
        </div>
        <div>
          <div class="label">Coût de maintenance</div>
          <div class="value">${escapeHtml(s.costMaintenance)}</div>
        </div>
        <div>
          <div class="label">Évolution de la performance</div>
          <div class="value">${escapeHtml(s.dpeGain)}</div>
        </div>
        <div>
          <div class="label">Émissions de CO₂</div>
          <div class="value">${escapeHtml(s.co2Emissions)}</div>
        </div>
      </div>
    </article>
  `;
}

function renderSolutionsSection(title: string, items: Array<RecommendedSolution | NonRecommendedSolution>, type: "recommended" | "not-recommended"): string {
  if (!items.length) return "";
  return `
    <section class="section">
      <h2 class="section-title">${escapeHtml(title)}</h2>
      <div class="cards">
        ${items.map((item) => renderSolutionCard(item, type)).join("")}
      </div>
    </section>
  `;
}

export default async function printSolutionsSummary(property: Property, solutions: SolutionsResult | null): Promise<void> {
  const hasSolutions = !!solutions && (solutions.recommendedSolutions.length > 0 || solutions.nonRecommendedSolutions.length > 0);

  const html = `
    <!doctype html>
    <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Récapitulatif des solutions</title>
      <style>
        @page { size: A4; margin: 14mm; }
        * { box-sizing: border-box; }
        html, body { padding: 0; margin: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji"; color: #1b3a57; font-size: 12px; line-height: 1.4; }
        .container { width: 100%; }
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .title { font-size: 20px; font-weight: 800; margin: 0; }
        .date { color: #5b7a99; font-size: 12px; }
        .section { margin-top: 18px; break-inside: avoid; }
        .section-title { font-size: 14px; font-weight: 800; margin: 0 0 8px 0; padding-bottom: 6px; border-bottom: 2px solid #cfe3ff; }
        .grid { display: grid; gap: 8px; }
        .grid-2 { grid-template-columns: 1fr 1fr; }
        .row { display: contents; }
        .label { font-size: 10px; text-transform: uppercase; letter-spacing: .02em; color: #5b7a99; margin-bottom: 2px; }
        .value { font-weight: 700; color: #1b3a57; }
        .cards { display: grid; grid-template-columns: 1fr; gap: 10px; }
        .card { border: 1px solid #cfe3ff; border-radius: 8px; padding: 12px; background: #fff; break-inside: avoid; page-break-inside: avoid; }
        .card-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
        .icon { width: 24px; height: 24px; object-fit: contain; }
        .header-text { flex: 1; min-width: 0; }
        .title-line { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .card-title { font-size: 13px; font-weight: 800; margin: 0; }
        .badge { background: #efe8ff; color: #6b2bd8; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; white-space: nowrap; }
        .subtitle { font-size: 11px; color: #6a7d90; font-style: italic; }
        .description { margin: 6px 0 8px 0; color: #274c77; }
        .alert { border-radius: 6px; padding: 8px; margin: 8px 0; }
        .alert-warning { background: #fff7e6; border: 1px solid #ffe8b3; color: #8a6d1f; }
        .alert-error { background: #ffecec; border: 1px solid #ffc1c1; color: #8a1f1f; }
        .alert-title { font-weight: 800; margin-bottom: 4px; }
        ul { margin: 0; padding-left: 16px; }
        @media print {
          .section { break-inside: avoid; }
          .card { break-inside: avoid; page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header class="header">
          <h1 class="title">Récapitulatif des solutions</h1>
          <div class="date">${new Date().toLocaleDateString("fr-FR")}</div>
        </header>
        ${renderPropertySummary(property)}
        ${
          hasSolutions
            ? '<section class="section"><div class="alert alert-warning"><div class="alert-title">Ce sont des estimations !</div><div>Tous les chiffres des solutions sont des estimations, ils sont approximatif et ne peuvent pas servir de devis.</div></div></section>'
            : ""
        }
        ${hasSolutions ? renderSolutionsSection("Solutions recommandées", solutions!.recommendedSolutions, "recommended") : ""}
        ${hasSolutions ? renderSolutionsSection("Solutions non-recommandées", solutions!.nonRecommendedSolutions, "not-recommended") : ""}
        ${!hasSolutions ? `<section class="section"><div class="alert alert-warning">Aucune solution disponible pour l'instant.</div></section>` : ""}
      </div>
    </body>
    </html>
  `;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    iframe.remove();
    return;
  }
  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  function waitForIframeImages(doc: Document): Promise<void> {
    const imgs = Array.from(doc.images || []);
    if (!imgs.length) return Promise.resolve();
    return Promise.all(
      imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.addEventListener("load", () => resolve(), { once: true });
              img.addEventListener("error", () => resolve(), { once: true });
            })
      )
    ).then(() => undefined);
  }

  waitForIframeImages(iframeDoc).then(() => {
    setTimeout(() => {
      const cw = iframe.contentWindow;
      if (!cw) {
        iframe.remove();
        return;
      }
      const cleanup = () => {
        iframe.remove();
      };
      cw.addEventListener("afterprint", cleanup, { once: true });
      try {
        cw.focus();
        cw.print();
      } catch (_) {
        cleanup();
      }
      setTimeout(cleanup, 30000);
    }, 150);
  });
}
