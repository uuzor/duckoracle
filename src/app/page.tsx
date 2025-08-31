import { Metadata } from "next";
import { DuckOracleApp } from "~/components/DuckOracleApp";

import { APP_NAME, APP_DESCRIPTION, APP_OG_IMAGE_URL } from "~/lib/constants";
import { getMiniAppEmbedMetadata } from "~/lib/utils";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "DuckOracle - Decentralized Prediction Markets",
    openGraph: {
      title: "DuckOracle - Decentralized Prediction Markets",
      description: "Create and bet on event outcomes with AI-powered oracles on DuckChain",
      images: [APP_OG_IMAGE_URL],
    },
    other: {
      "fc:frame": JSON.stringify(getMiniAppEmbedMetadata()),
    },
  };
}

export default function Home() {
  return <DuckOracleApp />;
}
