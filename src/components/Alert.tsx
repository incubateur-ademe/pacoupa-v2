import React from "react";
import { RiErrorWarningFill, RiCheckboxCircleFill, RiInformationFill } from "react-icons/ri";

interface AlertProps {
  type?: "warning" | "success" | "error" | "info";
  title?: string;
  message?: string;
  items?: string[];
  className?: string;
  children?: React.ReactNode;
}

const Alert = ({ type = "warning", title, message, items = [], className = "", children }: AlertProps) => {
  const alertConfig = {
    warning: {
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      iconColor: "text-yellow-600",
      textColor: "text-yellow-600",
      icon: RiErrorWarningFill,
      defaultTitle: "Attention :",
    },
    success: {
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      iconColor: "text-green-600",
      textColor: "text-green-600",
      icon: RiCheckboxCircleFill,
      defaultTitle: "Succès :",
    },
    error: {
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      iconColor: "text-red-600",
      textColor: "text-red-600",
      icon: RiErrorWarningFill,
      defaultTitle: "Erreur :",
    },
    info: {
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
      textColor: "text-blue-600",
      icon: RiInformationFill,
      defaultTitle: "Information :",
    },
  };

  const config = alertConfig[type] || alertConfig.warning;
  const IconComponent = config.icon;

  return (
    <div className={`rounded-lg ${config.bgColor} p-2 ${className}`}>
      <div className="flex gap-1">
        <IconComponent className={`w-4 h-4 flex-shrink-0 ${config.iconColor} mt-0.5`} />
        <div className="flex-1">
          <h3 className={`font-normal text-sm ${config.textColor}`}>{title || config.defaultTitle}</h3>

          {children && <div className={`text-sm ${config.textColor}`}>{children}</div>}
          {message && <p className={`text-sm ${config.textColor}`}>{message}</p>}

          {items && items.length > 0 && (
            <ul className="space-y-1 mt-2">
              {items.map((item, index) => (
                <li key={index} className={`flex items-start gap-2 text-sm font-semibold ${config.textColor}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${config.iconColor.replace("text-", "bg-")} mt-1 flex-shrink-0`}></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alert;
