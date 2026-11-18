import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { PRIVATE_PATH_PREFIXES, SITE_HOST, SITE_URL } from "@/lib/site";

/** Индексируется только основной домен: копии сайта на других адресах закрыты целиком. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host")?.toLowerCase() ?? "";
  const isCanonicalHost = host === SITE_HOST || host === `www.${SITE_HOST}`;

  if (!isCanonicalHost) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...PRIVATE_PATH_PREFIXES],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
