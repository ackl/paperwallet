import Head from "next/head";
import * as bitcoin from "bitcoinjs-lib";
import * as bip39 from "bip39";
import * as crypto from "crypto-browserify";
import MatrixRain from './matrixrain';
import { useState, useEffect } from "react";

const NETWORK = bitcoin.networks.bitcoin;

export default function Address() {
  // what you describe as 'seed'
  const [randomBytes, setRandomBytes] = useState(crypto.randomBytes(16)); // 128 bits is enough

  const [mnemonic, setMnemonic] = useState(bip39.entropyToMnemonic(randomBytes.toString("hex")));
  const [address, setAddress] = useState("");

  // your 12 word phrase
  useEffect(() => {
    setMnemonic(bip39.entropyToMnemonic(randomBytes.toString("hex")))
  }, [randomBytes])
  
  useEffect(() => {
    async function getAddress() {
      let seed = await bip39.mnemonicToSeed(mnemonic);
      let keyPair = bitcoin.bip32.fromSeed(seed, NETWORK);
      let derivation = keyPair.derivePath("m/84'/0'/0'/0/0");
      let { address } = bitcoin.payments.p2wpkh({ pubkey: derivation.publicKey });
      setAddress(address);
    }

    getAddress();

  }, [mnemonic])

  // what is accurately described as the wallet seed
  function generate() {
    setRandomBytes(crypto.randomBytes(16)); // 128 bits is enough
  }

  function copy(ev) {
    const copyText = ev.target;
    // Copy the text inside the text field
    navigator.clipboard.writeText(copyText.value)
      .then(() => {
        copyText.parentElement.classList.add('copied')
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  }

  function mouseLeaveHandler(ev) {
    ev.target.parentElement.classList.remove('copied');
  }

  return (
    <>
      <section>
        <h1> Generate a paper wallet (segwit) </h1>
        <button onClick={generate}>generate again </button>
        <p>click the boxes to copy</p>

        <div className="result">
          <h4>seed words:</h4>
          <div className="container">
            <textarea
              name="text"
              rows="2"
              cols="10"
              wrap="soft"
              onClick={copy}
              value={mnemonic}
              readOnly
              onMouseOut={mouseLeaveHandler}
            ></textarea>
            <p className="popup-info">Text copied to clipboard</p>
          </div>
        </div>


        <div className="result">
          <h4>address:</h4>
          <div className="container" onMouseOut={mouseLeaveHandler}>
            <textarea name="text" rows="2" cols="10" wrap="soft" onClick={copy} value={address} readOnly></textarea>
            <div className="popup-info">Text copied to clipboard</div>
          </div>
        </div>
      </section>
      <MatrixRain />
      <button className="print" onClick={print}>🖶</button>
    </>
  );
}
