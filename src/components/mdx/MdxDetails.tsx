import React, { type PropsWithChildren } from "react";

type MdxDetailsComponent = React.FC<PropsWithChildren> & {
  Question: React.FC<PropsWithChildren>;
  Answer: React.FC<PropsWithChildren>;
};

const MdxDetailsImpl: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    /* using a name for all Details make it like an accordion, with only one item open maximum */
    <details name="details" className="border-2 border-primary rounded-2xl bg-white shadow-outline p-4 marker:text-primary">
      {children}
    </details>
  );
};

export const Question: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <summary className="flex items-center justify-between cursor-pointer text-xl text-primary font-semibold">
      <span>{children}</span>
    </summary>
  );
};

export const Answer: React.FC<PropsWithChildren> = ({ children }) => {
  return <div className="pt-3 text-gray-700">{children}</div>;
};

export const MdxDetails = Object.assign(MdxDetailsImpl, { Question, Answer }) as MdxDetailsComponent;
