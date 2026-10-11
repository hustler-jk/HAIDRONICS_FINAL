import { beforeEach, describe, expect, it, vi } from "vitest";

const { mkdirMock, writeFileMock } = vi.hoisted(() => ({ mkdirMock: vi.fn(), writeFileMock: vi.fn() }));

vi.mock("node:fs/promises", () => ({ mkdir: mkdirMock, writeFile: writeFileMock }));

describe("product image storage", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("BUILT_IN_FORGE_API_URL", "");
    vi.stubEnv("BUILT_IN_FORGE_API_KEY", "");
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  });

  it("saves local uploads under the public uploads directory without Forge credentials", async () => {
    const { storagePut } = await import("./storage");
    const result = await storagePut("haidronics-products/esp32.jpg", Buffer.from("image-data"), "image/jpeg");

    expect(result.url).toMatch(/^\/uploads\/haidronics-products\/esp32_[a-f0-9]{8}\.jpg$/);
    expect(mkdirMock).toHaveBeenCalledOnce();
    expect(writeFileMock).toHaveBeenCalledOnce();
    expect(writeFileMock.mock.calls[0][1]).toEqual(Buffer.from("image-data"));
  });

  it("requires durable storage configuration in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { storagePut } = await import("./storage");

    await expect(storagePut("products/photo.jpg", Buffer.from("image-data"), "image/jpeg"))
      .rejects.toThrow("Storage config missing");
    expect(writeFileMock).not.toHaveBeenCalled();
  });
});
