import { useEffect, useRef } from "preact/hooks";

const FONT_SIZE = 16;

function randomChar(): string {
  return Math.random() < 0.5
    ? String.fromCharCode(0x30a0 + Math.random() * 96) // katakana
    : String.fromCharCode(0x0021 + Math.random() * 94); // printable ASCII
}

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let drops: number[] = [];
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Negative starts stagger the columns so they don't all fire at once.
      drops = Array.from({ length: Math.floor(canvas.width / FONT_SIZE) }, () =>
        Math.floor(Math.random() * -100),
      );
    };
    resize();
    window.addEventListener("resize", resize);

    const interval = setInterval(() => {
      context.fillStyle = "rgba(0, 0, 0, 0.05)";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#0F0";
      context.font = `${FONT_SIZE}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        context.fillText(randomChar(), i * FONT_SIZE, drops[i] * FONT_SIZE);
        if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }, 30);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" />;
}
