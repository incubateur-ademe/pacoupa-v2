import { useParams, Link } from "react-router-dom";
import { findPost } from "@/lib/posts";
import { useEffect } from "react";
import { MATOMO_CATEGORIES } from "@/utils/matomo";
import { useMatomo } from "@datapunt/matomo-tracker-react";

const View = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? findPost(slug) : undefined;
  const { trackEvent } = useMatomo();

  useEffect(() => {
    if (slug) trackEvent({ category: MATOMO_CATEGORIES.blog, action: "view_post", name: slug });
  }, [slug]);

  if (!post) {
    return (
      <main style={{ maxWidth: 760, margin: "40px auto", padding: 16 }}>
        <p>Article introuvable.</p>
        <Link to="/blog">← Retour</Link>
      </main>
    );
  }

  const { Component, frontmatter } = post;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-10">
      <Link to="/blog" className="text-primary-light hover:text-primary">
        ← Retour
      </Link>
      {frontmatter.image && <img src={"/blog/" + frontmatter.image} alt={frontmatter.title} className="w-full h-[450px] object-cover object-bottom rounded-lg my-6" />}
      <h1 className="text-primary text-3xl font-bold mt-6 mb-2">{frontmatter.title}</h1>
      <div className="text-sm text-primary-lighter mb-6">{new Date(frontmatter.date || frontmatter.publishedAt || new Date().toISOString()).toLocaleDateString()}</div>
      <article className="prose max-w-none">
        <Component />
      </article>
    </main>
  );
};

export default View;
