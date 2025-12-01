import { Link } from "react-router-dom";
import { allPosts } from "@/lib/posts";
import { MATOMO_CATEGORIES } from "@/utils/matomo";
import { useMatomo } from "@datapunt/matomo-tracker-react";

const List = () => {
  const { trackEvent } = useMatomo();
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-10">
      <h1 className="text-2xl font-bold mb-6">Blog</h1>
      <div className="columns-1 lg:columns-2 gap-x-4">
        {allPosts.map((p) => (
          <Link
            key={p.slug}
            to={`/blog/${p.slug}`}
            onClick={() => trackEvent({ category: MATOMO_CATEGORIES.blog, action: "click_post", name: p.slug })}
            className="mb-4 break-inside-avoid bg-white border-2 border-primary shadow-outline rounded-2xl flex flex-col justify-start items-start gap-4 overflow-hidden hover:shadow-lg transition-shadow bg-none"
          >
            {p.frontmatter.image && <img className="w-full" src={"/blog/" + p.frontmatter.image} alt={p.frontmatter.title} />}
            <div className="px-4 pb-4 flex flex-col justify-end items-end gap-4 w-full">
              <div className="flex flex-col justify-start items-start gap-1 w-full">
                <div className="justify-start text-neutral-900 text-sm font-bold">{p.frontmatter.title}</div>
                {(p.frontmatter.excerpt || p.frontmatter.summary) && <div className="justify-start text-neutral-700 text-sm">{p.frontmatter.excerpt || p.frontmatter.summary}</div>}
              </div>
              <div className="py-1 border-b flex justify-start items-center gap-1 self-start">
                <div className="justify-start text-sm">Lire l'article</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
};

export default List;
