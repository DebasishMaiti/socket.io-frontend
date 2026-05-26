import { useEffect } from "react";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  ogImageUrl,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
} from "@/config/seo";

type PageSeoProps = {
  title?: string;
  description?: string;
  path?: string;
  noindex?: boolean;
};

function setMeta(name: string, content: string, property = false) {
  const attr = property ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

export default function PageSeo({ title, description, path = "", noindex = false }: PageSeoProps) {
  useEffect(() => {
    const pageTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
    const pageDescription = description ?? DEFAULT_DESCRIPTION;
    const canonical = SITE_URL ? absoluteUrl(path) : "";
    const robots = noindex ? "noindex, nofollow" : "index, follow";
    const image = ogImageUrl();

    document.title = pageTitle;
    setMeta("description", pageDescription);
    setMeta("robots", robots);
    setMeta("og:title", pageTitle, true);
    setMeta("og:description", pageDescription, true);
    setMeta("og:type", "website", true);
    setMeta("og:image", image, true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", pageTitle);
    setMeta("twitter:description", pageDescription);
    setMeta("twitter:image", image);

    if (SITE_URL) {
      setMeta("og:url", canonical, true);
      setCanonical(canonical);
    }
  }, [title, description, path, noindex]);

  return null;
}
