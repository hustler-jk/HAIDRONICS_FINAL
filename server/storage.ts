// Preconfigured storage helpers for Manus WebDev templates
// Uploads via Forge Server presigned URL to S3 (PUT direct).
// Downloads return /manus-storage/{key} paths served via 307 redirect.

import { ENV } from "./_core/env";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";

function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;

  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY",
    );
  }

  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  if (ENV.supabaseUrl && ENV.supabaseServiceRoleKey) {
    const bucket = ENV.supabaseStorageBucket || "haidronics-media";
    const uploadUrl = `${ENV.supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/${encodeURIComponent(bucket)}/${key.split("/").map(encodeURIComponent).join("/")}`;
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.supabaseServiceRoleKey}`,
        apikey: ENV.supabaseServiceRoleKey,
        "Content-Type": contentType,
        "x-upsert": "false",
      },
      body: typeof data === "string" ? data : new Blob([data as any], { type: contentType }),
    });
    if (!response.ok) {
      const details = (await response.text()).slice(0, 400);
      throw new Error(`Supabase Storage upload failed (${response.status}): ${details}`);
    }
    return { key, url: `${ENV.supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${encodeURIComponent(bucket)}/${key.split("/").map(encodeURIComponent).join("/")}` };
  }
  if (!ENV.isProduction && (!ENV.forgeApiUrl || !ENV.forgeApiKey)) {
    const publicDir = resolve(process.cwd(), "client", "public", "uploads");
    const filePath = resolve(publicDir, key);
    if (!filePath.startsWith(`${publicDir}${sep}`)) throw new Error("Invalid upload path.");
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, typeof data === "string" ? data : data);
    return { key, url: `/uploads/${key.split("/").map(encodeURIComponent).join("/")}` };
  }
  const { forgeUrl, forgeKey } = getForgeConfig();

  // 1. Get presigned PUT URL from Forge
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);

  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }

  const { url: s3Url } = (await presignResp.json()) as { url: string };
  if (!s3Url) throw new Error("Forge returned empty presign URL");

  // 2. PUT file directly to S3
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });

  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });

  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }

  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = normalizeKey(relKey);

  const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
  getUrl.searchParams.set("path", key);

  const resp = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Storage signed URL failed (${resp.status}): ${msg}`);
  }

  const { url } = (await resp.json()) as { url: string };
  return url;
}

export async function storageDeletePublicImage(imageUrl: string): Promise<"deleted" | "external" | "unsupported"> {
  if (ENV.supabaseUrl && ENV.supabaseServiceRoleKey) {
    const supabaseBase = new URL(ENV.supabaseUrl);
    const url = new URL(imageUrl, supabaseBase);
    const bucket = ENV.supabaseStorageBucket || "haidronics-media";
    const publicPrefix = `/storage/v1/object/public/${encodeURIComponent(bucket)}/`;
    if (url.origin === supabaseBase.origin && url.pathname.startsWith(publicPrefix)) {
      const encodedKey = url.pathname.slice(publicPrefix.length);
      const decodedKey = encodedKey.split("/").map(segment => decodeURIComponent(segment)).join("/");
      const deleteUrl = `${supabaseBase.origin}/storage/v1/object/${encodeURIComponent(bucket)}/${decodedKey.split("/").map(encodeURIComponent).join("/")}`;
      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${ENV.supabaseServiceRoleKey}`,
          apikey: ENV.supabaseServiceRoleKey,
        },
      });
      if (!response.ok && response.status !== 404) {
        throw new Error(`Supabase Storage delete failed (${response.status}).`);
      }
      return "deleted";
    }
  }

  if (imageUrl.startsWith("/uploads/")) {
    const key = imageUrl.slice("/uploads/".length).split("/").map(decodeURIComponent).join("/");
    if (key.split(/[\\/]/).some(segment => !segment || segment === "." || segment === "..")) {
      throw new Error("Invalid uploaded image path.");
    }
    const publicDir = resolve(process.cwd(), "client", "public", "uploads");
    const filePath = resolve(publicDir, key);
    if (!filePath.startsWith(`${publicDir}${sep}`)) throw new Error("Invalid uploaded image path.");
    await rm(filePath, { force: true });
    return "deleted";
  }

  if (imageUrl.startsWith("/manus-storage/")) return "unsupported";
  return "external";
}
