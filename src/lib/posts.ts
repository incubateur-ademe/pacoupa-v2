import type { ComponentType } from "react";
export type Frontmatter = {
  title: string;
  date?: string; // fallback if present
  publishedAt?: string; // your current files use this
  excerpt?: string;
  summary?: string;
  tag?: string;
  tags?: string[];
  slug?: string;
  draft?: boolean;
  image?: string;
};

type PostModule = {
  default: ComponentType;
  frontmatter: Frontmatter;
};

// Load blog posts from existing location
const modules = import.meta.glob("@/mdx/blog/*.mdx", { eager: true }) as Record<string, PostModule>;

export type Post = {
  slug: string;
  Component: ComponentType;
  frontmatter: Frontmatter;
};

const normalizeDate = (fm: Frontmatter): string => fm.date || fm.publishedAt || new Date(0).toISOString();

const toSlug = (path: string, fm?: Frontmatter) =>
  fm?.slug ||
  path
    .split("/")
    .pop()!
    .replace(/\.mdx$/, "");

export const allPosts: Post[] = Object.entries(modules)
  .map(([path, mod]) => ({
    slug: toSlug(path, mod.frontmatter),
    Component: mod.default,
    frontmatter: mod.frontmatter,
  }))
  .filter((p) => !p.frontmatter.draft)
  .sort((a, b) => +new Date(normalizeDate(b.frontmatter)) - +new Date(normalizeDate(a.frontmatter)));

export const findPost = (slug: string) => allPosts.find((p) => p.slug === slug);
