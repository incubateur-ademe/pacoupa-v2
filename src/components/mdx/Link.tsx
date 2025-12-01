import { Link } from "react-router-dom";
import { MATOMO_CATEGORIES } from "@/utils/matomo";
import { useMatomo } from "@datapunt/matomo-tracker-react";

export const MdxLink = (props: JSX.IntrinsicElements["a"]) => {
  const { trackEvent } = useMatomo();
  if (typeof props.href === "undefined") {
    return null;
  }
  const href = props.href;
  const isInternalLink = href.startsWith("/");
  const isExternalHttp = href.startsWith("http://") || href.startsWith("https://");

  if (isInternalLink)
    return (
      <Link to={href} onClick={() => trackEvent({ category: MATOMO_CATEGORIES.blog, action: "click_internal_link", name: href })}>
        {props.children}
      </Link>
    );
  if (isExternalHttp)
    return (
      <a {...props} target="_blank" rel="nofollow noopener noreferrer" onClick={() => trackEvent({ category: MATOMO_CATEGORIES.blog, action: "click_outbound", name: href })}>
        {props.children}
      </a>
    );

  return <a {...props}>{props.children}</a>;
};
