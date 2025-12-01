import React, { useEffect } from "react";
import { Route, Routes } from "react-router-dom";

import View from "./view";
import List from "./list";
import { MATOMO_CATEGORIES } from "@/utils/matomo";
import { useMatomo } from "@datapunt/matomo-tracker-react";

const Blog = () => {
  const { trackEvent } = useMatomo();
  useEffect(() => {
    trackEvent({ category: MATOMO_CATEGORIES.blog, action: "view_list" });
  }, []);
  return (
    <Routes>
      <Route path="/" element={<List />} />
      <Route path="/:slug" element={<View />} />
    </Routes>
  );
};

export default Blog;
