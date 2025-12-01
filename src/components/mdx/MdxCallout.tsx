import { type PropsWithChildren } from "react";
import Alert from "../Alert";

type Props = {
  title?: string;
  type: "error" | "info" | "neutral" | "pacoupa" | "success" | "warning";
};

type AlertType = "warning" | "success" | "error" | "info";

export const MdxCallout = ({ children, type, title }: PropsWithChildren<Props>) => {
  const typeMap: Record<NonNullable<Props["type"]>, AlertType> = {
    error: "error",
    info: "info",
    neutral: "info",
    pacoupa: "success",
    success: "success",
    warning: "warning",
  };

  const mappedType: AlertType = type ? typeMap[type] : "info";

  return (
    <Alert title={title} type={mappedType}>
      {children}
    </Alert>
  );
};
