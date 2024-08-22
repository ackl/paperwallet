import * as bitcoin from "bitcoinjs-lib";
import * as bip39 from "bip39";
import * as crypto from "crypto-browserify";
import MatrixRain from './matrixrain';
import AutoResizeTextArea from './autoresizetextarea';
import QRCode from 'react-qr-code';
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

  return (
    <>
      <section>
        <h1> Generate a BTC paper wallet (segwit) </h1>
        <button className="generate-button" onClick={generate}>generate again </button>
        <p className="label-copy"><span></span>  the boxes to copy</p>
        <p className="label-qr"> <span></span> the qr code to enlarge</p>

        <div className="result">
          <h4>seed words:</h4>
          <div className="container">
            <AutoResizeTextArea value={mnemonic}
            />
            <p className="popup-info">Text copied to clipboard</p>
            <div className="qrcode-wrapper">
              <QRCode
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                value={mnemonic}
                viewBox={`0 0 256 256`}
              />
            </div>
          </div>
        </div>


        <div className="result">
          <h4>address:</h4>
          <div className="container">
            <AutoResizeTextArea value={address} />
            <div className="popup-info">Text copied to clipboard</div>
            <div className="qrcode-wrapper">
              <QRCode
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                value={address}
                viewBox={`0 0 256 256`}
              />
            </div>
          </div>
        </div>
      </section>
      <MatrixRain />
      <button className="print" onClick={print}>🖨️</button>
    </>
  );
}
