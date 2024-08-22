import Head from "next/head";
import dynamic from "next/dynamic";

const Address = dynamic(() => import("../components/address"), {
  ssr: false,
});

export default function Home() {
  return (
    <>
      <Head>
        <title>Cold Wallet Generator</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0, minimum-scale=1.0" />

      </Head>

      <main>
        <Address />
      </main>
    </>
  );
}
