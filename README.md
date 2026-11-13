# paperwallet

Generates a paper wallet in the browser: one 12-word BIP39 phrase, plus the
addresses it controls on whichever chains you tick.

| chain                 | path (`n` = address #) | restores in                |
| --------------------- | ---------------------- | -------------------------- |
| Bitcoin (segwit)      | `m/84'/0'/0'/0/n`      | Sparrow, Electrum, Ledger  |
| Bitcoin taproot       | `m/86'/0'/0'/0/n`      | Sparrow, Ledger, Xverse    |
| Bitcoin nested segwit | `m/49'/0'/0'/0/n`      | older segwit wallets       |
| Bitcoin legacy        | `m/44'/0'/0'/0/n`      | pre-segwit wallets         |
| Ethereum / EVM        | `m/44'/60'/0'/0/n`     | MetaMask, Rabby            |
| Solana                | `m/44'/501'/n'/0'`     | Phantom, Solflare          |
| Litecoin (segwit)     | `m/84'/2'/0'/0/n`      | Ledger, Trust Wallet       |
| Dogecoin              | `m/44'/3'/0'/0/n`      | Ledger, Trust Wallet       |
| Tron                  | `m/44'/195'/0'/0/n`    | TronLink, Ledger           |
| Cosmos Hub            | `m/44'/118'/0'/0/n`    | Keplr, Ledger              |

The EVM address is the same on every EVM chain (Ethereum, Base, Arbitrum...).

Chains are presets, not a free-form path, because a path only means something
together with that chain's address encoding. To add one, add an entry to
`CHAINS` in `src/wallet.ts` and a known address to `src/wallet.test.ts`.

Everything runs client-side; the page makes no network requests after load.
Entropy comes from `crypto.getRandomValues`.

```sh
pnpm install
pnpm dev      # local dev server
pnpm test     # derivation checked against published test vectors
pnpm build    # static site in dist/
```
