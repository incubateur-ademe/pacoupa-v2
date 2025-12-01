import React from "react";
import { Link } from "react-router-dom";

import ReactDOM from "react-dom/client";
import App from "./App";
import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";
import "./index.css";
import { Mdx } from "@/components/mdx";
import { createInstance, MatomoProvider } from "@datapunt/matomo-tracker-react";

startReactDsfr({
  defaultColorScheme: "light",
  Link,
});

const matomoInstance = createInstance({
  urlBase: "http://localhost:3000",
  siteId: 1,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* <MatomoProvider value={matomoInstance}> */}
    <Mdx>
      <App />
    </Mdx>
    {/* </MatomoProvider> */}
  </React.StrictMode>
);
