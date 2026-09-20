export type ClipboardWriter = (text: string) => Promise<void>;

const CLIPBOARD_TIMEOUT_MS = 500;

async function defaultClipboardWriter(text: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard API unavailable");
  }

  // Promise.resolve().then() also captures synchronous SecurityError throws.
  await Promise.resolve().then(() => navigator.clipboard.writeText(text));
}

async function withTimeout(operation: Promise<void>): Promise<void> {
  let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = globalThis.setTimeout(
      () => reject(new Error("Clipboard write timed out")),
      CLIPBOARD_TIMEOUT_MS,
    );
  });

  try {
    await Promise.race([operation, timeout]);
  } finally {
    if (timeoutId !== undefined) globalThis.clearTimeout(timeoutId);
  }
}

export async function copyTextWithFallback(
  text: string,
  writer: ClipboardWriter = defaultClipboardWriter,
): Promise<boolean> {
  try {
    await withTimeout(Promise.resolve().then(() => writer(text)));
    return true;
  } catch {
    return false;
  }
}
