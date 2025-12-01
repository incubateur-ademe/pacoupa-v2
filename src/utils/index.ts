import { Children, isValidElement, type PropsWithChildren, type ReactNode } from "react";
import type { Property } from "../types";

export const ENERGY_NAMES = {
  FIOUL: "Fioul",
  "GPL/BUTANE/PROPANE": "GPL/Butane/Propane",
  GAZ: "Gaz",
  BOIS: "Bois",
  ELECTRIQUE: "Électrique",
  CHARBON: "Charbon",
  SOLAIRE: "Solaire",
  RF: "Réseau de froid",
  RC: "Réseau de chaleur",
};

export const slugify = (string: string) =>
  string
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const getLabelFromChildren = (children: ReactNode) => {
  let label = "";

  Children.map(children, (child) => {
    if (typeof child === "string") {
      label += child;
    } else if (isValidElement<PropsWithChildren>(child) && child.props.children) {
      label += getLabelFromChildren(child.props.children);
    }
  });

  return label;
};

// Base64 URL-safe helpers to encode/decode arbitrary UTF-8 strings
const toBase64Url = (input: string) => {
  const utf8Bytes = new TextEncoder().encode(input);
  let binary = "";
  for (let i = 0; i < utf8Bytes.length; i++) binary += String.fromCharCode(utf8Bytes[i] || 0);
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const fromBase64Url = (input: string) => {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4 || 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
};

export const encodePropertyToHash = (property: Property) => {
  // Keep JSON stable; stringify directly is fine for our use case
  const json = JSON.stringify(property);
  return toBase64Url(json);
};

export const decodePropertyFromHash = (hash: string): Property | null => {
  try {
    const json = fromBase64Url(hash);
    const parsed = JSON.parse(json);
    return parsed as Property;
  } catch {
    return null;
  }
};
