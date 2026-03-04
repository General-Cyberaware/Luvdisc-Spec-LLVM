import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { type AnchorResult } from "@/lib/solana-anchor";

interface Props {
  result: AnchorResult;
}

const BuildResult = ({ result }: Props) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-6 mt-6 border-success/30"
  >
    <div className="flex items-center gap-2 mb-4">
      <Check className="w-5 h-5 text-success" />
      <h2 className="font-semibold text-foreground">Successfully Anchored</h2>
    </div>
    <div className="space-y-3">
      <ResultField
        label="Transaction Signature"
        value={result.signature}
        href={`https://explorer.solana.com/tx/${result.signature}?cluster=devnet`}
      />
      <ResultField
        label="Data Account"
        value={result.programAddress}
        href={`https://explorer.solana.com/address/${result.programAddress}?cluster=devnet`}
      />
      <ResultField
        label="PDA Address (Deterministic)"
        value={result.pdaAddress}
      />

      <div className="pt-3 border-t border-border grid grid-cols-2 gap-3">
        <div>
          <span className="text-xs text-muted-foreground">Compiler</span>
          <p className="font-mono text-sm text-foreground">{result.metadata.compilerVersion}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Optimization</span>
          <p className="font-mono text-sm text-foreground">{result.metadata.optimizationLevel}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Uploader</span>
          <p className="text-hash">{result.metadata.uploader}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Timestamp</span>
          <p className="font-mono text-sm text-foreground">
            {new Date(result.metadata.timestamp * 1000).toISOString()}
          </p>
        </div>
      </div>
    </div>
  </motion.div>
);

const ResultField = ({ label, value, href }: { label: string; value: string; href?: string }) => (
  <div>
    <span className="text-xs text-muted-foreground">{label}</span>
    {href ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-hash text-primary hover:underline block">
        {value}
      </a>
    ) : (
      <p className="text-hash">{value}</p>
    )}
  </div>
);

export default BuildResult;
