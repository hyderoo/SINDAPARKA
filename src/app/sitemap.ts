import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://sindaparka.web.id";
  return ["", "/panduan", "/metode", "/peta"].map((u) => ({ url: `${base}${u}` }));
}
