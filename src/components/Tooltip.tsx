import React from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";
import { ImInfo } from "react-icons/im";

interface TooltipComponentProps {
  id: string;
  description: React.ReactNode;
  iconClass?: string;
  Icon?: React.ComponentType<{ className: string }>;
}

const TooltipComponent = ({ id, description, iconClass = "text-black", Icon }: TooltipComponentProps) => {
  const [portalContainer, setPortalContainer] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    const container = document.createElement("div");
    container.setAttribute("data-tooltip-portal", id);
    document.body.appendChild(container);
    setPortalContainer(container);
    return () => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, [id]);

  return (
    <div className="inline align-middle p-[1px]">
      {portalContainer &&
        createPortal(
          <Tooltip
            id={id}
            className="max-w-sm border border-primary shadow-outline-xs"
            variant="light"
            classNameArrow="shadow-outline-xs"
            opacity={1}
            clickable
            delayHide={150}
            positionStrategy="fixed"
            style={{ zIndex: 2147483647 }}
          >
            <p className="text-sm leading-normal bg-white font-medium">{description}</p>
          </Tooltip>,
          portalContainer
        )}
      <span data-tooltip-id={id}>{Icon ? <Icon className={`${iconClass} text-base cursor-pointer`} /> : <ImInfo className={`${iconClass} text-base cursor-pointer`} />}</span>
    </div>
  );
};

export default TooltipComponent;
