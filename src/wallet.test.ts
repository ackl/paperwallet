import { validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { describe, expect, it } from "vitest";
import { CHAINS, newMnemonic, seedFromMnemonic } from "./wallet";

const ABANDON = seedFromMnemonic(
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
);
// Hardhat/Anvil default dev mnemonic; its accounts are widely published.
const HARDHAT = seedFromMnemonic("test test test test test test test test test test test junk");

const derive = (id: string, seed: Uint8Array, index = 0) =>
  CHAINS.find((c) => c.id === id)!.derive(seed, index);

// First address for the all-"abandon" mnemonic. The BTC rows are the test
// vectors from the BIP44/49/84/86 specs; the rest are that mnemonic's
// well-known addresses in each chain's reference wallet.
const VECTORS: Record<string, string> = {
  "btc-segwit": "bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu",
  "btc-taproot": "bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr",
  "btc-nested": "37VucYSaXLCAsxYyAPfbSi9eh4iEcbShgf",
  "btc-legacy": "1LqBGSKuX5yYUonjxT5qGfpUsXKYYWeabA",
  evm: "0x9858EfFD232B4033E47d90003D41EC34EcaEda94",
  sol: "HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk",
  ltc: "ltc1qjmxnz78nmc8nq77wuxh25n2es7rzm5c2rkk4wh",
  doge: "DBus3bamQjgJULBJtYXpEzDWQRwF5iwxgC",
  tron: "TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH",
  cosmos: "cosmos19rl4cm2hmr8afy4kldpxz3fka4jguq0auqdal4",
};

describe("chain presets", () => {
  it("has a vector for every preset", () => {
    expect(Object.keys(VECTORS).sort()).toEqual(CHAINS.map((c) => c.id).sort());
  });

  for (const [id, address] of Object.entries(VECTORS)) {
    it(`${id} derives the known first address`, () => {
      expect(derive(id, ABANDON).address).toBe(address);
    });
  }

  it("index selects later accounts", () => {
    expect(derive("evm", HARDHAT, 0).address).toBe("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    expect(derive("evm", HARDHAT, 1)).toEqual({
      path: "m/44'/60'/0'/0/1",
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    });
    expect(derive("btc-taproot", ABANDON, 1).address).toBe(
      "bc1p4qhjn9zdvkux4e44uhx8tc55attvtyu358kutcqkudyccelu0was9fqzwh",
    );
    expect(derive("sol", ABANDON, 1).path).toBe("m/44'/501'/1'/0'");
  });
});

describe("newMnemonic", () => {
  it("produces valid, distinct 12-word phrases", () => {
    const a = newMnemonic();
    const b = newMnemonic();
    expect(a.split(" ")).toHaveLength(12);
    expect(validateMnemonic(a, wordlist)).toBe(true);
    expect(a).not.toBe(b);
  });
});
