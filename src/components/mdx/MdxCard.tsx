import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { type PropsWithChildren } from "react";

type Props = {
  fullWidth?: boolean;
  title?: string;
};

type CardHeaderProps = { image?: JSX.Element; title: React.ReactNode };

export const CardHeader = ({ image, title }: CardHeaderProps) => {
  return (
    <div className="flex gap-4 items-center mt-2">
      {image && <>{image}</>}
      <h3 className="text-base font-bold leading-6 text-primary mb-0">{title}</h3>
    </div>
  );
};

type HeaderProps = {
  headerAlign?: "center" | "left" | "right";
};

const MdxCardTitle = ({ children, headerAlign }: PropsWithChildren<HeaderProps>) => {
  return (
    <div
      className={cx("flex items-center", {
        "self-start": headerAlign === "left",
        "self-center": headerAlign === "center",
        "self-end": headerAlign === "right",
      })}
    >
      <h4 className="text-xl font-semibold text-primary">{children}</h4>
    </div>
  );
};

const MdxCardBody = ({ children }: PropsWithChildren) => {
  return <div className="grow">{children}</div>;
};

type MarkerProps = {
  markerPosition: "left" | "right";
};

const MdxCardMarker = ({ markerPosition, children }: PropsWithChildren<MarkerProps>) => {
  return (
    <div
      className={cx("bg-purple-light text-purple-dark px-2 py-0.5 rounded text-xs font-bold border border-primary-light shadow-outline-xs absolute -top-3", {
        "self-start": markerPosition === "left",
        "self-end": markerPosition === "right",
      })}
    >
      {children}
    </div>
  );
};

export const MdxCard = ({ children, fullWidth }: PropsWithChildren<Props>) => {
  return (
    <>
      <div
        className={cx("border-2 border-primary shadow-outline rounded-2xl bg-white relative overflow-visible p-6 flex flex-col items-stretch w-full", {
          "max-w-lg": !fullWidth,
        })}
      >
        {children}
      </div>
    </>
  );
};

MdxCard.Title = MdxCardTitle;
MdxCard.Body = MdxCardBody;
MdxCard.Marker = MdxCardMarker;
