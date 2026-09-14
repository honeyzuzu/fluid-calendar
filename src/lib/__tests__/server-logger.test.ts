import { prisma } from "@/lib/prisma";

import { ServerLogger } from "@/lib/logger/server";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    systemSettings: { findFirst: jest.fn() },
    log: { createMany: jest.fn() },
  },
}));

describe("server batch logging", () => {
  it("does not write batches while logging is disabled", async () => {
    process.env.DATABASE_URL = "postgresql://example.invalid/test";
    (prisma.systemSettings.findFirst as jest.Mock).mockResolvedValue({
      logLevel: "none",
      logDestination: "db",
      logRetention: null,
    });

    const result = await new ServerLogger().writeBatch([
      {
        level: "error",
        message: "should not be stored",
        timestamp: new Date(),
      },
    ]);

    expect(result).toEqual({ success: true, count: 0 });
    expect(prisma.log.createMany).not.toHaveBeenCalled();
  });
});
