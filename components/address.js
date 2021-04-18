import Head from "next/head";
import * as bitcoin from "bitcoinjs-lib";
import * as bip39 from "bip39";
import * as crypto from "crypto-browserify";
import { useState } from "react";

const NETWORK = bitcoin.networks.bitcoin;

export default function Address() {
  // what you describe as 'seed'
  const [randomBytes, setRandomBytes] = useState(crypto.randomBytes(16)); // 128 bits is enough

  // your 12 word phrase
  let mnemonic = bip39.entropyToMnemonic(randomBytes.toString("hex"));

  // what is accurately described as the wallet seed
  let seed = bip39.mnemonicToSeedSync(mnemonic);

  let keyPair = bitcoin.bip32.fromSeed(seed, NETWORK);

  let derivation = keyPair.derivePath("m/84'/0'/0'/0/0");

  let { address } = bitcoin.payments.p2wpkh({ pubkey: derivation.publicKey });

  function generate() {
    setRandomBytes(crypto.randomBytes(16)); // 128 bits is enough
  }

  return (
    <section>
      <h1> Generate a paper wallet (segwit) </h1>
      <button onClick={generate}>Generate</button>
      <h4>seed words:</h4>
      <p>{mnemonic}</p>
      <h4>address:</h4>
      <p>{address}</p>
    </section>
  );
}
