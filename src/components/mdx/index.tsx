import { MDXProvider } from "@mdx-js/react";
import React from "react";
import { Link } from "react-router-dom";
import { FaArrowUp } from "react-icons/fa6";
import { useMatomo } from "@datapunt/matomo-tracker-react";

import { MdxSpacer } from "./MdxSpacer";
import { MdxImage } from "./MdxImage";
import { MdxCard, CardHeader } from "./MdxCard";
import { MdxCallout } from "./MdxCallout";
import { MdxDetails } from "./MdxDetails";
import { MdxLink } from "./Link";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { MATOMO_CATEGORIES } from "@/utils/matomo";

export const CTA = ({ eventName = "Blog" }: { eventName?: string }) => {
  const { trackEvent } = useMatomo();
  return (
    <Link
      to="/recherche"
      className="button-primary text-base flex items-center justify-center gap-2"
      onClick={() => trackEvent({ category: MATOMO_CATEGORIES.ctas, action: "click", name: eventName })}
    >
      <span>Faire le diagnostic en 3 min</span>
      <FaArrowUp />
    </Link>
  );
};

const components = {
  Spacer: MdxSpacer,
  Image: MdxImage,
  MdxCard,
  CardHeader,
  Card: MdxCard,
  Callout: MdxCallout,
  Details: MdxDetails,
  CTA,
  a: MdxLink,
  h1: (props: JSX.IntrinsicElements["h1"]) => <h1 {...props} className={cx("text-primary text-3xl font-bold no-underline mt-8 mb-4", props.className || "")} />,
  h2: (props: JSX.IntrinsicElements["h2"]) => <h2 {...props} className={cx("text-primary text-2xl font-semibold no-underline mt-8 mb-3", props.className || "")} />,
  h3: (props: JSX.IntrinsicElements["h3"]) => {
    const { children, className, ...rest } = props;
    const onlyChild = Array.isArray(children) && children.length === 1 ? children[0] : children;
    const unwrappedChildren = React.isValidElement(onlyChild) && (onlyChild as any).type === "a" ? (onlyChild as any).props.children : children;
    return (
      <h3 {...rest} className={cx("text-xl font-semibold mt-6 mb-2", className || "")}>
        {unwrappedChildren}
      </h3>
    );
  },
  p: (props: JSX.IntrinsicElements["p"]) => <p {...props} className={cx("text-gray-700 leading-relaxed my-4", props.className || "")} />,
  ul: (props: JSX.IntrinsicElements["ul"]) => <ul {...props} className={cx("list-disc pl-6 my-4 text-gray-700 space-y-2", props.className || "")} />,
  ol: (props: JSX.IntrinsicElements["ol"]) => <ol {...props} className={cx("list-decimal pl-6 my-4 text-gray-700 space-y-2", props.className || "")} />,
  li: (props: JSX.IntrinsicElements["li"]) => <li {...props} className={cx("marker:text-primary", props.className || "")} />,
  blockquote: (props: JSX.IntrinsicElements["blockquote"]) => (
    <blockquote {...props} className={cx("border-l-4 border-primary-light pl-4 italic text-gray-700 my-6", props.className || "")} />
  ),
  hr: (props: JSX.IntrinsicElements["hr"]) => <hr {...props} className={cx("my-8 border-primary-light/50", props.className || "")} />,
  img: (props: JSX.IntrinsicElements["img"]) => <img {...props} className={cx("rounded-2xl border-2 border-primary shadow-outline my-6", props.className || "")} />,
};

export const Mdx: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <MDXProvider components={components}>{children}</MDXProvider>;
};
