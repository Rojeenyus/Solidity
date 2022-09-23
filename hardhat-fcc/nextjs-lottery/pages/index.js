// react moralis for connect metamask
import Head from "next/head";
import LotteryEntrance from "../components/LotteryEntrance";
import MainHeader from "../components/MainHeader";
import styles from "../styles/Home.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Lottery</title>
        <meta name="description" content="Smart Contract Lottery" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <MainHeader />
      <LotteryEntrance />
    </div>
  );
}
