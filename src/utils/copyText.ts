const CLIPBOARD_TIMEOUT_MS = 500;

async function tryModernClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) return false;

  const write = navigator.clipboard.writeText(text).then(
    () => true,
    () => false,
  );
  const timeout = new Promise<boolean>((resolve) => {
    window.setTimeout(() => resolve(false), CLIPBOARD_TIMEOUT_MS);
  });

  return Promise.race([write, timeout]);
}

export async function copyTextWithFallback(text: string): Promise<boolean> {
  if (await tryModernClipboard(text)) return true;

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.inset = "0 auto auto -9999px";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}
