import { ed25519 } from "@noble/curves/ed25519.js";
import { schnorr, secp256k1 } from "@noble/curves/secp256k1.js";
import { bytesToNumberBE } from "@noble/curves/utils.js";
import { hmac } from "@noble/hashes/hmac.js";
import { ripemd160 } from "@noble/hashes/legacy.js";
import { sha256, sha512 } from "@noble/hashes/sha2.js";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex, concatBytes, utf8ToBytes } from "@noble/hashes/utils.js";
import { base58, bech32, bech32m, createBase58check } from "@scure/base";
import { HDKey } from "@scure/bip32";
import { generateMnemonic, mnemonicToSeedSync } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";

// One seed phrase, many chains. A chain is a derivation path *plus* that
// chain's own rule for encoding a public key as an address; the two are only
// meaningful together, which is why these are fixed presets rather than a
// free-form path. Each preset uses the path its mainstream wallets default to,
// so the phrase restores to the same addresses there. Every preset is pinned
// to a known-good address in wallet.test.ts.

export interface Derived {
  path: string;
  address: string;
}

export interface Chain {
  id: string;
  name: string;
  /** Wallets whose default derivation this matches. */
  wallets: string;
  /** `index` 0 is the first address/account a wallet shows, 1 the second... */
  derive(seed: Uint8Array, index: number): Derived;
}

/** 12 words = 128 bits of entropy from crypto.getRandomValues. */
export function newMnemonic(): string {
  return generateMnemonic(wordlist, 128);
}

/** BIP39 seed (no passphrase). ~2048 rounds of PBKDF2, so compute once per phrase. */
export function seedFromMnemonic(mnemonic: string): Uint8Array {
  return mnemonicToSeedSync(mnemonic);
}

// --- address encodings ------------------------------------------------------

const base58check = createBase58check(sha256);
const hash160 = (bytes: Uint8Array) => ripemd160(sha256(bytes));

/** Base58Check(version byte || payload): legacy BTC-family and Tron addresses. */
const versioned = (version: number, payload: Uint8Array) =>
  base58check.encode(concatBytes(Uint8Array.of(version), payload));

/** Witness v0 key hash (BIP173): bc1q... / ltc1q... */
const p2wpkh = (hrp: string) => (pubkey: Uint8Array) =>
  bech32.encode(hrp, [0, ...bech32.toWords(hash160(pubkey))]);

/** P2WPKH wrapped in P2SH (BIP49): 3... */
const p2shP2wpkh = (pubkey: Uint8Array) =>
  versioned(0x05, hash160(concatBytes(Uint8Array.of(0x00, 0x14), hash160(pubkey))));

/** Key-path-only taproot (BIP86): output key Q = P + H_TapTweak(P)·G, bech32m. */
function p2tr(pubkey: Uint8Array): string {
  const xOnly = pubkey.slice(1);
  const internal = schnorr.utils.lift_x(bytesToNumberBE(xOnly));
  const tweak = bytesToNumberBE(schnorr.utils.taggedHash("TapTweak", xOnly));
  // multiply() rejects 0 and values >= the curve order, as BIP341 requires.
  const output = internal.add(secp256k1.Point.BASE.multiply(tweak));
  return bech32m.encode("bc", [1, ...bech32m.toWords(output.toBytes(true).slice(1))]);
}

/** Last 20 bytes of keccak256(uncompressed pubkey sans 0x04 prefix). */
function keccakAccount(pubkey: Uint8Array): Uint8Array {
  const uncompressed = secp256k1.Point.fromBytes(pubkey).toBytes(false);
  return keccak_256(uncompressed.slice(1)).slice(-20);
}

function evmAddress(pubkey: Uint8Array): string {
  const hex = bytesToHex(keccakAccount(pubkey));
  // EIP-55: uppercase each hex letter whose nibble in keccak256(ascii hex) is >= 8.
  const checksum = bytesToHex(keccak_256(utf8ToBytes(hex)));
  let out = "0x";
  for (let i = 0; i < hex.length; i++) {
    out += parseInt(checksum[i], 16) >= 8 ? hex[i].toUpperCase() : hex[i];
  }
  return out;
}

// --- derivation -------------------------------------------------------------

/** secp256k1 chain on a BIP32 path; `encode` gets the 33-byte compressed pubkey. */
function bip32Chain(
  path: (index: number) => string,
  encode: (pubkey: Uint8Array) => string,
): Chain["derive"] {
  return (seed, index) => {
    const p = path(index);
    const { publicKey } = HDKey.fromMasterSeed(seed).derive(p);
    if (!publicKey) throw new Error(`no public key at ${p}`);
    return { path: p, address: encode(publicKey) };
  };
}

/**
 * SLIP-0010 ed25519 private key at an all-hardened path. BIP32 itself is
 * secp256k1-only, and ed25519 has no non-hardened derivation.
 */
function slip10Ed25519(seed: Uint8Array, hardenedIndexes: number[]): Uint8Array {
  let node = hmac(sha512, utf8ToBytes("ed25519 seed"), seed);
  for (const index of hardenedIndexes) {
    const data = new Uint8Array(37);
    data.set(node.subarray(0, 32), 1); // 0x00 || key || ser32(index')
    new DataView(data.buffer).setUint32(33, (index | 0x80000000) >>> 0);
    node = hmac(sha512, node.subarray(32), data);
  }
  return node.slice(0, 32);
}

export const CHAINS: Chain[] = [
  {
    id: "btc-segwit",
    name: "Bitcoin",
    wallets: "native segwit: Sparrow, Electrum, Ledger",
    derive: bip32Chain((i) => `m/84'/0'/0'/0/${i}`, p2wpkh("bc")),
  },
  {
    id: "evm",
    name: "Ethereum / EVM",
    wallets: "MetaMask, Rabby; same address on Base, Arbitrum, Polygon...",
    derive: bip32Chain((i) => `m/44'/60'/0'/0/${i}`, evmAddress),
  },
  {
    id: "sol",
    name: "Solana",
    wallets: "Phantom, Solflare",
    derive: (seed, i) => ({
      path: `m/44'/501'/${i}'/0'`,
      address: base58.encode(ed25519.getPublicKey(slip10Ed25519(seed, [44, 501, i, 0]))),
    }),
  },
  {
    id: "btc-taproot",
    name: "Bitcoin taproot",
    wallets: "Sparrow, Ledger, Xverse",
    derive: bip32Chain((i) => `m/86'/0'/0'/0/${i}`, p2tr),
  },
  {
    id: "btc-nested",
    name: "Bitcoin nested segwit",
    wallets: "older segwit wallets, 3... addresses",
    derive: bip32Chain((i) => `m/49'/0'/0'/0/${i}`, p2shP2wpkh),
  },
  {
    id: "btc-legacy",
    name: "Bitcoin legacy",
    wallets: "pre-segwit wallets, 1... addresses",
    derive: bip32Chain((i) => `m/44'/0'/0'/0/${i}`, (pk) => versioned(0x00, hash160(pk))),
  },
  {
    id: "ltc",
    name: "Litecoin",
    wallets: "native segwit: Ledger, Trust Wallet",
    derive: bip32Chain((i) => `m/84'/2'/0'/0/${i}`, p2wpkh("ltc")),
  },
  {
    id: "doge",
    name: "Dogecoin",
    wallets: "Ledger, Trust Wallet",
    derive: bip32Chain((i) => `m/44'/3'/0'/0/${i}`, (pk) => versioned(0x1e, hash160(pk))),
  },
  {
    id: "tron",
    name: "Tron",
    wallets: "TronLink, Ledger",
    derive: bip32Chain((i) => `m/44'/195'/0'/0/${i}`, (pk) => versioned(0x41, keccakAccount(pk))),
  },
  {
    id: "cosmos",
    name: "Cosmos Hub",
    wallets: "Keplr, Ledger",
    derive: bip32Chain(
      (i) => `m/44'/118'/0'/0/${i}`,
      (pk) => bech32.encode("cosmos", bech32.toWords(hash160(pk))),
    ),
  },
];

export const DEFAULT_CHAIN_IDS = ["btc-segwit", "evm"];
