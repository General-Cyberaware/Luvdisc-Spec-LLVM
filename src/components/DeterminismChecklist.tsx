import { motion } from "framer-motion";
import { Check, X, ShieldCheck, ShieldAlert } from "lucide-react";
import { type CheckItem, allChecksPassed } from "@/lib/determinism-checks";

interface Props {
  checks: CheckItem[];
}

const DeterminismChecklist = ({ checks }: Props) => {
  const allPassed = allChecksPassed(checks);
  const passCount = checks.filter((c) => c.passed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 mt-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {allPassed ? (
            <ShieldCheck className="w-5 h-5 text-success" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-destructive" />
          )}
          <h2 className="font-semibold text-foreground">Deterministic Build Checklist</h2>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {passCount}/{checks.length} passed
        </span>
      </div>

      <div className="space-y-2">
        {checks.map((check, i) => (
          <motion.div
            key={check.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`flex items-start gap-3 rounded-xl px-3 py-2 transition-colors ${
              check.passed ? "bg-success/5" : "bg-destructive/5"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {check.passed ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <X className="w-4 h-4 text-destructive" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{check.label}</p>
              <p className="text-xs text-muted-foreground">{check.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {!allPassed && (
        <p className="mt-4 text-xs text-destructive font-medium">
          All checks must pass before submitting to Solana.
        </p>
      )}
    </motion.div>
  );
};

export default DeterminismChecklist;
