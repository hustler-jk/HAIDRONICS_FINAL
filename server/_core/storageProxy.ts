import type { Express } from "express";
import { ENV } from "./env";

export function isPublicProductImageKey(key: string): boolean {
  return key.startsWith("haidronics-products/") &&
    key.split("/").every(segment =>
      segment.length > 0 &&
      segment !== "." &&
      segment !== ".." &&
      /^[a-zA-Z0-9._-]+$/.test(segment)
    );
}

export async function resolvePublicProductImage(
    key: string,
    config: { forgeApiUrl: string; forgeApiKey: string },
    fetcher: typeof fetch = fetch,
): Promise<string | null> {
    if (!isPublicProductImageKey(key)) {
      return null;
    }
    if (!config.forgeApiUrl || !config.forgeApiKey) {
      throw new Error("Storage proxy not configured");
    }

    const forgeUrl = new URL(
      "v1/storage/presign/get",
      config.forgeApiUrl.replace(/\/+$/, "") + "/",
    );
    forgeUrl.searchParams.set("path", key);

    const forgeResp = await fetcher(forgeUrl, {
      headers: { Authorization: `Bearer ${config.forgeApiKey}` },
    });
    if (!forgeResp.ok) {
      const body = await forgeResp.text().catch(() => "");
      throw new Error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
    }

    const { url } = (await forgeResp.json()) as { url: string };
    if (!url) {
      throw new Error("Storage backend returned an empty signed URL");
    }
    return url;
}

export function registerStorageProxy(app: Express) {
    app.get("/manus-storage/*", async (req, res) => {
      const key = (req.params as Record<string, string>)[0];
      if (!key) {
        res.status(400).send("Missing storage key");
        return;
      }
      if (!isPublicProductImageKey(key)) {
        res.status(404).send("Storage object not found");
        return;
      }

      try {
        const url = await resolvePublicProductImage(
          key,
          { forgeApiUrl: ENV.forgeApiUrl, forgeApiKey: ENV.forgeApiKey },
        );
        if (!url) {
          res.status(404).send("Storage object not found");
          return;
        }
        res.set("Cache-Control", "no-store");
        res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
