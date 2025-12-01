declare module "*.mdx" {
  import type { ComponentType } from "react";

  export const frontmatter: {
    title: string;
    date?: string; // some of your files use publishedAt, we will map later
    excerpt?: string;
    summary?: string;
    tags?: string[];
    slug?: string;
    draft?: boolean;
    image?: string;
    publishedAt?: string;
  };

  const MDXComponent: ComponentType;
  export default MDXComponent;
}
