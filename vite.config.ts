import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

export default defineConfig({
  server: {
    open: true,
    port: 3000,
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
  },
  define: {
    "process.env": "{}",
    global: "window",
  },
  build: {
    outDir: "build",
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks: {
          dsfr: ["@codegouvfr/react-dsfr"],
        },
      },
    },
  },
  worker: {
    format: "es",
  },
  esbuild: {
    loader: "tsx",
    include: ["src/**/*.ts", "src/**/*.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    // Pre-bundle mapbox-gl so its UMD build works under ESM in dev
    include: ["mapbox-gl"],
    esbuildOptions: {
      target: "es2020",
    },
  },

  plugins: [
    mdx({
      providerImportSource: "@mdx-js/react",
      remarkPlugins: [remarkGfm, remarkFrontmatter, [remarkMdxFrontmatter, { name: "frontmatter" }]],
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: "wrap",
            test: (node: any) => node?.tagName !== "h3",
          },
        ],
      ],
    }),
    react(),
    tsconfigPaths(),
  ],
});
