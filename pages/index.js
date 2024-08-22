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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0, minimum-scale=1.0" />

      </Head>

      <main>
        <Address />
      </main>
    </>
  );
}
