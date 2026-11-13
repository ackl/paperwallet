import encodeQR from "qr";
import { useMemo } from "preact/hooks";

/** QR code as a single SVG path; scales to its container. */
export function Qr({ value }: { value: string }) {
  const { size, d } = useMemo(() => {
    // "raw" includes the quiet-zone border, so the code scans on the dark page.
    const rows = encodeQR(value, "raw");
    let d = "";
    rows.forEach((row, y) =>
      row.forEach((on, x) => {
        if (on) d += `M${x} ${y}h1v1h-1z`;
      }),
    );
    return { size: rows.length, d };
  }, [value]);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="QR code" shape-rendering="crispEdges">
      <rect width={size} height={size} fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  );
}
