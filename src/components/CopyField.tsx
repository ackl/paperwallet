import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";

const COPIED_MS = 1600;

async function copyText(text: string, source: HTMLTextAreaElement): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error("clipboard API failed, falling back", err);
    }
  }
  // Insecure contexts (plain http, some file:// setups) have no clipboard API.
  source.select();
  const ok = document.execCommand("copy");
  getSelection()?.removeAllRanges();
  return ok;
}

/** Read-only textarea that grows to fit its value and copies it on click/Enter. */
export function CopyField({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.height = "auto"; // reset first so it can shrink
      // border-box sizing: scrollHeight excludes the borders, so add them back.
      el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
    };
    fit();
    // Text rewraps when the width changes (rotation, window resize, webfont
    // swap-in), so refit then too. Width-only, or our own height write loops.
    let width = el.clientWidth;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth === width) return;
      width = el.clientWidth;
      fit();
    });
    observer.observe(el);
    document.fonts?.ready.then(fit);
    return () => observer.disconnect();
  }, [value]);

  // Timed, not hover-bound: touch screens have no mouse-out to clear it.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  // A new value under a stale "copied" badge would be a lie.
  useEffect(() => setCopied(false), [value]);

  const copy = async (el: HTMLTextAreaElement) => setCopied(await copyText(value, el));

  return (
    <div class={copied ? "copy-field copied" : "copy-field"}>
      <textarea
        ref={ref}
        value={value}
        rows={1}
        readOnly
        spellcheck={false}
        aria-label={`${label} (press to copy)`}
        onClick={(ev) => copy(ev.currentTarget)}
        onKeyDown={(ev) => {
          if (ev.key !== "Enter") return;
          ev.preventDefault();
          copy(ev.currentTarget);
        }}
      />
      <p class="popup-info" role="status">
        {copied && "Text copied to clipboard"}
      </p>
    </div>
  );
}
