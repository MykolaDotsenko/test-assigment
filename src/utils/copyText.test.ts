import { describe, expect, it, vi } from "vitest";
import { copyTextWithFallback } from "./copyText";

describe("copyTextWithFallback", () => {
  it("reports success only after the writer resolves", async () => {
    const writer = vi.fn(async () => undefined);

    await expect(copyTextWithFallback("parcel", writer)).resolves.toBe(true);
    expect(writer).toHaveBeenCalledWith("parcel");
  });

  it("reports failure for synchronous and asynchronous clipboard errors", async () => {
    const syncFailure = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
    const asyncFailure = async () => {
      throw new Error("denied");
    };

    await expect(copyTextWithFallback("parcel", syncFailure)).resolves.toBe(false);
    await expect(copyTextWithFallback("parcel", asyncFailure)).resolves.toBe(false);
  });

  it("does not hang forever when a clipboard implementation never settles", async () => {
    vi.useFakeTimers();
    const never = () => new Promise<void>(() => undefined);

    const result = copyTextWithFallback("parcel", never);
    await vi.advanceTimersByTimeAsync(501);

    await expect(result).resolves.toBe(false);
    vi.useRealTimers();
  });
});
