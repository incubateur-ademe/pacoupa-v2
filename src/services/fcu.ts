import { FcuEligibilityResponse } from "@/types/responses/property";

const FCU_URL = "https://france-chaleur-urbaine.beta.gouv.fr/api/v1/eligibility";
const ERREUR_RESEAU = "Erreur réseau lors de l'appel à FCU";

export const fetchFcuEligibility = async ({ lon, lat }: { lon: number; lat: number }): Promise<FcuEligibilityResponse> => {
  const searchParams = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
  });

  const fcuRequest = new Request(FCU_URL + "?" + searchParams.toString());

  try {
    const response = await fetch(fcuRequest);

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const eligibility = await response.json();
    return eligibility as FcuEligibilityResponse;
  } catch (err) {
    console.error(ERREUR_RESEAU, err);
    throw new Error(ERREUR_RESEAU);
  }
};
