import type { Metadata } from "vinext/shims/metadata";
import { OperationsConsole } from "./components/OperationsConsole";

export const metadata: Metadata = {
  title: "Live-Lage",
  description:
    "Zugfolge – die realistische Eisenbahn-Unternehmenssimulation.",
};

export default function Home() {
  return <OperationsConsole />;
}
