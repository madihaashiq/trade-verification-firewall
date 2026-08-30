import { LoaderCircle, ShieldCheck } from "lucide-react";

export default function ContractLoading() {
  return (
    <main className="contract-route-loader" role="status" aria-live="polite">
      <span className="contract-route-loader__icon"><ShieldCheck size={20} /></span>
      <div>
        <strong><LoaderCircle className="spinner" size={17} /> Loading contract history</strong>
        <p>Retrieving verification decisions and linked execution records.</p>
      </div>
    </main>
  );
}
