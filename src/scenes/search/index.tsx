import React, { useState, useEffect } from "react";

import Sidebar from "./sidebar";
import PropertyPanel from "./PropertyPanel";
import Recommendations from "./recommendations";
import { computeEnvelopQuality, computeSolutions } from "@/services/solutions";

import { useStore } from "@/services/store";
import { encodePropertyToHash, decodePropertyFromHash } from "@/utils";
import { MATOMO_CATEGORIES } from "@/utils/matomo";
import { useMatomo } from "@datapunt/matomo-tracker-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Search() {
  const { property, setSolutions, setProperty } = useStore();
  const { trackEvent } = useMatomo();
  const location = useLocation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const hasMissingFields = (decodedProperty = property) => {
    if (!decodedProperty.address) return true;
    if (!decodedProperty.constructionYear) return true;
    if (!decodedProperty.housingCount) return true;
    if (!decodedProperty.heatedArea) return true;
    if (!decodedProperty.heatingType) return true;
    if (!decodedProperty.heatingEnergy) return true;
    if (!decodedProperty.heatingEmitterType) return true;
    if (!decodedProperty.ecsType) return true;
    if (!decodedProperty.ecsEnergy) return true;
    return false;
  };

  useEffect(() => {
    if (!isModalOpen) {
      const timer = setTimeout(() => {
        setIsPanelVisible(false);
      }, 600);
      return () => clearTimeout(timer);
    }
    setIsPanelVisible(true);
  }, [isModalOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isPanelVisible) return;

    const scrollY = window.scrollY;
    const { body, documentElement } = document;

    const previousBodyStyles = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    const previousHtmlOverflow = documentElement.style.overflow;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    documentElement.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousBodyStyles.overflow;
      body.style.position = previousBodyStyles.position;
      body.style.top = previousBodyStyles.top;
      body.style.width = previousBodyStyles.width;
      documentElement.style.overflow = previousHtmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [isPanelVisible]);

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    let hashValue = currentUrl.searchParams.get("hash") || "";
    if (!hashValue) {
      setIsModalOpen(true);
      setIsPanelVisible(true);
      return;
    }
    fetchDataFromHash(hashValue);
    if (location.state?.fromHome) {
      setIsModalOpen(true);
      setIsPanelVisible(true);
    }
  }, []);

  const fetchDataFromHash = async (hashValue: string) => {
    setIsLoading(true);
    const decoded = decodePropertyFromHash(hashValue);
    if (!decoded) return;

    setProperty(decoded);
    if (hasMissingFields(decoded)) {
      setSolutions(null);
      setIsLoading(false);
      return;
    }

    const result = await computeSolutions(decoded);
    const envelopeQuality = await computeEnvelopQuality(decoded);
    setProperty({ ...decoded, envelopeQuality });
    if (!result) {
      setSolutions(null);
      setIsLoading(false);
      return;
    }
    setSolutions(result);
    setIsLoading(false);
  };

  const findSolutions = async () => {
    setIsModalOpen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setIsLoading(true);
    trackEvent({ category: MATOMO_CATEGORIES.formulaire, action: "close_modal", name: "property_panel" });

    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log("hasMissingFields", hasMissingFields());
    if (hasMissingFields()) {
      setSolutions(null);
      setIsLoading(false);
      return;
    }
    const result = await computeSolutions(property);
    console.log("result", result);
    const envelopeQuality = await computeEnvelopQuality(property);
    setProperty({ envelopeQuality });
    trackEvent({
      category: MATOMO_CATEGORIES.resultats,
      action: "compute_solutions",
      name: result ? `solutions_found_${result.recommendedSolutions.length}` : "no_solutions_found",
    });
    if (!result) {
      setSolutions(null);
      setIsLoading(false);
      return;
    }

    setSolutions(result);
    const encodedProperty = encodePropertyToHash(property);
    const params = new URLSearchParams(location.search);
    params.set("hash", encodedProperty);
    const searchString = params.toString();
    navigate(`${location.pathname}${searchString ? `?${searchString}` : ""}`, { replace: true });
    setIsLoading(false);
  };

  return (
    <div className="w-full relative flex items-stretch min-h-screen">
      <Sidebar openModal={() => setIsModalOpen(true)} />
      <div className="transition-all duration-300 ease-in-out">{isPanelVisible && <PropertyPanel isOpen={isModalOpen} onClose={findSolutions} />}</div>
      <div className={`flex-1 mx-auto p-10 bg-light`}>
        <Recommendations isLoading={isLoading} onOpenModal={() => setIsModalOpen(true)} />
      </div>
    </div>
  );
}
