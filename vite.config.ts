import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

function siteSeoPlugin(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), "");
  const siteUrl = env.VITE_SITE_URL?.replace(/\/$/, "") ?? "";

  const injectSiteUrl = (html: string) => {
    if (!siteUrl) {
      return html
        .replace(/<link rel="canonical" href="__SITE_URL__\/" \/>\n\s*/g, "")
        .replaceAll("__SITE_URL__", "");
    }
    return html.replaceAll("__SITE_URL__", siteUrl);
  };

  const buildSitemap = () => {
    if (!siteUrl) return "";
    const lastmod = new Date().toISOString().slice(0, 10);
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/login</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${siteUrl}/signup</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
`;
  };

  return {
    name: "site-seo",
    transformIndexHtml(html) {
      return injectSiteUrl(html);
    },
    closeBundle() {
      const outDir = path.resolve(__dirname, "dist");
      if (!fs.existsSync(outDir)) return;

      const robotsPath = path.join(outDir, "robots.txt");
      if (fs.existsSync(robotsPath) && siteUrl) {
        const robots = fs.readFileSync(robotsPath, "utf-8").trimEnd();
        const sitemapLine = `Sitemap: ${siteUrl}/sitemap.xml`;
        if (!robots.includes(sitemapLine)) {
          fs.writeFileSync(robotsPath, `${robots}\n\n${sitemapLine}\n`);
        }
      }

      const sitemap = buildSitemap();
      if (sitemap) {
        fs.writeFileSync(path.join(outDir, "sitemap.xml"), sitemap);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), siteSeoPlugin(mode), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
