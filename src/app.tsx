import { useMemo, useState } from "preact/hooks";
import { CopyField } from "./components/CopyField";
import { MatrixRain } from "./components/MatrixRain";
import { Qr } from "./components/Qr";
import { CHAINS, DEFAULT_CHAIN_IDS, newMnemonic, seedFromMnemonic } from "./wallet";

const MAX_INDEX = 99;

function Result({ label, hint, value }: { label: string; hint?: string; value: string }) {
  // Hover enlarges on desktop (CSS); this covers touch and keyboard.
  const [zoomed, setZoomed] = useState(false);
  return (
    <div class="result">
      <h4>
        {label}: {hint && <small>{hint}</small>}
      </h4>
      <div class="container">
        <CopyField value={value} label={label} />
        <button
          type="button"
          class="qrcode-wrapper"
          aria-pressed={zoomed}
          aria-label={`enlarge ${label} QR code`}
          onClick={() => setZoomed((z) => !z)}
          onBlur={() => setZoomed(false)}
        >
          <Qr value={value} />
        </button>
      </div>
    </div>
  );
}

function PrinterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
      <path d="M7 8V3h10v5" />
      <path d="M7 17H4V8h16v9h-3" />
      <path d="M7 13h10v8H7z" />
      <path d="M16.5 10.75h.01" stroke-linecap="round" />
    </svg>
  );
}

export function App() {
  const [mnemonic, setMnemonic] = useState(newMnemonic);
  const [chainIds, setChainIds] = useState(DEFAULT_CHAIN_IDS);
  const [index, setIndex] = useState(0);

  const seed = useMemo(() => seedFromMnemonic(mnemonic), [mnemonic]);
  // CHAINS order, not click order, so the printed sheet is stable.
  const results = useMemo(
    () =>
      CHAINS.filter((c) => chainIds.includes(c.id)).map((chain) => ({
        chain,
        ...chain.derive(seed, index),
      })),
    [seed, chainIds, index],
  );

  const toggle = (id: string) =>
    setChainIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));

  return (
    <main>
      <section>
        {/* setup = what you choose (and the secret); addresses = what it yields */}
        <div class="setup">
        <header>
        <h1>Generate a paper wallet</h1>
        <div class="actions">
          <button type="button" class="btn btn-primary" onClick={() => setMnemonic(newMnemonic())}>
            generate again
          </button>
          <button type="button" class="btn print" aria-label="print" onClick={() => window.print()}>
            <PrinterIcon />
          </button>
        </div>
        <div class="hints">
          <p class="label-copy">
            <span></span> the boxes to copy
          </p>
          <p class="label-qr">
            <span></span> the qr code to enlarge
          </p>
        </div>
        </header>

        <Result label="seed words" value={mnemonic} />

        <fieldset class="options">
          <legend>addresses to derive from these words</legend>
          <div class="chains">
            {CHAINS.map((chain) => (
              <label key={chain.id} title={chain.wallets}>
                <input
                  type="checkbox"
                  checked={chainIds.includes(chain.id)}
                  onChange={() => toggle(chain.id)}
                />
                {chain.name}
              </label>
            ))}
          </div>
          <label class="index" title="0 is the first address a wallet shows, 1 the second...">
            address #
            <input
              type="number"
              min={0}
              max={MAX_INDEX}
              value={index}
              onInput={(ev) => {
                const n = ev.currentTarget.valueAsNumber;
                if (Number.isInteger(n) && n >= 0 && n <= MAX_INDEX) setIndex(n);
              }}
              // Out-of-range or empty input is ignored above; snap the box
              // back so it never shows a number the addresses aren't using.
              onBlur={(ev) => {
                ev.currentTarget.value = String(index);
              }}
            />
          </label>
        </fieldset>
        </div>

        <div class="addresses">
        {results.map(({ chain, path, address }) => (
          <Result key={chain.id} label={chain.name} hint={path} value={address} />
        ))}
        {results.length === 0 && (
          <p class="empty">no chains ticked. tick one to derive an address.</p>
        )}
        </div>
      </section>
      <MatrixRain />
    </main>
  );
}
