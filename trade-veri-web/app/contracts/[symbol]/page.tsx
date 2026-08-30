import type { Metadata } from "next";
import ContractDetail from "./contract-detail";

type ContractPageProps = {
  params: Promise<{ symbol: string }>;
};

export async function generateMetadata({ params }: ContractPageProps): Promise<Metadata> {
  const { symbol } = await params;
  const title = `${symbol} verification history — Arcline`;
  const description = `Review every automated verification action, confidence score, and AI rationale for ${symbol}.`;

  return {
    title,
    description,
    openGraph: { title, description, images: [] },
    twitter: { title, description, images: [] },
  };
}

export default async function ContractPage({ params }: ContractPageProps) {
  const { symbol } = await params;
  return <ContractDetail symbol={symbol} />;
}
