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
      </Head>

      <main>
        <Address />
      </main>
    </>
  );
}
