type Props = {
  alt?: string;
  src: string;
};

/**
 * Image component for MDX file.
 *
 * NB: the images must be in the `public/img/blog` folder.
 *
 * Ex:
 * <MdxImage src="aaron-burden-bcn5fhJGtD8-unsplash.jpg" alt="Photo of project X"/>
 */
export const MdxImage = ({ src, alt }: Props) => {
  return (
    <figure className="mb-8 w-full">
      <img
        src={"/blog/" + src}
        alt={alt ?? "Image de décoration de l'article"}
        className="rounded-2xl w-full h-auto object-contain border-2 border-primary shadow-outline"
        loading="lazy"
        decoding="async"
      />
    </figure>
  );
};
