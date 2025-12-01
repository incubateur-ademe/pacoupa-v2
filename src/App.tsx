import React, { useEffect } from "react";
import { BrowserRouter, Outlet, Route, useLocation, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Home from "@/scenes/home";
import Search from "@/scenes/search";
import SolutionDetail from "@/scenes/solution-detail";
import Blog from "@/scenes/blog";

import Layout from "@/components/Layout";

import { environment } from "@/config";
import { initSentry } from "./services/sentry";
import { useMatomo } from "@datapunt/matomo-tracker-react";

const App = () => {
  if (environment === "production") initSentry();

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<UserLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/recherche" element={<Search />} />
          <Route path="/solution/:slug" element={<SolutionDetail />} />
          <Route path="/blog/*" element={<Blog />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "",
          duration: 3000,
          style: {
            background: "#fff",
            color: "#333",
            boxShadow: "4px 4px 0 0 #304436",
            borderRadius: "4px",
            padding: "12px 16px",
          },
        }}
        gutter={8}
        containerStyle={{}}
        containerClassName=""
      />
    </BrowserRouter>
  );
};

const UserLayout = () => {
  const location = useLocation();
  const { trackPageView, enableLinkTracking } = useMatomo();

  useEffect(() => {
    window.scrollTo(0, 0);
    trackPageView({ documentTitle: document.title || location.pathname });
  }, [location.pathname]);

  useEffect(() => {
    enableLinkTracking();
  }, []);

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default App;
