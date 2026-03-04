import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyOnChain, type BuildMetadata } from "@/lib/solana-anchor";
import { hashContent, computeBuildHash } from "@/lib/llvm-parser";
import { normalizeIR } from "@/lib/determinism-checks";
import { Search, Check, X, Loader2, UploadIcon, ShieldCheck, ShieldAlert } from "lucide-react";

const Verify = () => {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [onChainData, setOnChainData] = useState<BuildMetadata | null>(null);
  const [localIrHash, setLocalIrHash] = useState("");
  const [localBuildHash, setLocalBuildHash] = useState("");
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!address.trim()) return;
    setLoading(true);
    setError("");
    setOnChainData(null);
    setSearched(true);

    try {
      const data = await verifyOnChain(address.trim());
      if (data) {
        setOnChainData(data);
      } else {
        setError("No build data found for this address/signature.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to query Solana.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const content = await f.text();
    const normalized = normalizeIR(content);
    const ih = await hashContent(normalized);
    const bh = await computeBuildHash(
      normalized,
      onChainData?.compilerVersion || "llc-18.1.0",
      "sbfv2",
      onChainData?.optimizationLevel || "O2"
    );
    setLocalIrHash(ih);
    setLocalBuildHash(bh);
  };

  const irMatch = onChainData && localIrHash ? onChainData.irHash === localIrHash : null;
  const buildMatch = onChainData && localBuildHash ? onChainData.buildHash === localBuildHash : null;
  const fullyVerified = irMatch === true && buildMatch === true;

  return (
    <div className="min-h-screen gradient-pink pt-24 px-4 pb-12">
      <div className="max-w-2xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-2xl font-bold text-foreground mb-8 text-center"
        >
          Verify Program
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <label className="text-sm text-muted-foreground mb-2 block">
            Solana Program Address or Transaction Hash
          </label>
          <div className="flex gap-3">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter address or signature..."
              className="font-mono text-sm rounded-xl"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading || !address.trim()} className="rounded-xl px-6">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
        </motion.div>

        {/* On-chain metadata */}
        <AnimatePresence>
          {onChainData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 mt-6 space-y-3"
            >
              <h2 className="font-semibold text-foreground mb-3">On-Chain Build Record</h2>
              <div className="grid grid-cols-2 gap-3">
                <MetaField label="Compiler" value={onChainData.compilerVersion} />
                <MetaField label="Optimization" value={onChainData.optimizationLevel} />
                <MetaField label="Uploader" value={onChainData.uploader} mono />
                <MetaField
                  label="Timestamp"
                  value={onChainData.timestamp ? new Date(onChainData.timestamp * 1000).toISOString() : "N/A"}
                />
              </div>
              <div className="pt-3 border-t border-border space-y-2">
                <div>
                  <span className="text-xs text-muted-foreground">IR Hash</span>
                  <p className="text-hash">{onChainData.irHash}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Build Hash</span>
                  <p className="text-hash">{onChainData.buildHash}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && searched && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 mt-6 text-center text-destructive text-sm">
            {error}
          </motion.div>
        )}

        {/* File upload for comparison */}
        {onChainData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mt-6">
            <h2 className="font-semibold text-foreground mb-3">Cryptographic Verification</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Upload the original .ll file to re-compute hashes and verify against the on-chain record.
            </p>
            <label className="flex items-center gap-3 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
              <UploadIcon className="w-5 h-5" />
              <span>Upload .ll file to verify</span>
              <input type="file" accept=".ll" className="hidden" onChange={handleFileUpload} />
            </label>

            {localIrHash && (
              <div className="mt-4 space-y-3">
                <MatchRow label="IR Hash" match={irMatch} local={localIrHash} onChain={onChainData.irHash} />
                <MatchRow label="Build Hash" match={buildMatch} local={localBuildHash} onChain={onChainData.buildHash} />

                {/* Verification verdict */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`mt-4 p-4 rounded-2xl text-center ${
                    fullyVerified ? "bg-success/10" : "bg-destructive/10"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {fullyVerified ? (
                      <ShieldCheck className="w-6 h-6 text-success" />
                    ) : (
                      <ShieldAlert className="w-6 h-6 text-destructive" />
                    )}
                    <span className={`font-semibold ${fullyVerified ? "text-success" : "text-destructive"}`}>
                      {fullyVerified ? "Verified" : "Mismatch Detected"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {fullyVerified
                      ? "The uploaded IR file matches the on-chain build record exactly."
                      : "The uploaded IR file does not match the on-chain record. The build may have been tampered with."}
                  </p>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

const MetaField = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div>
    <span className="text-xs text-muted-foreground">{label}</span>
    <p className={`text-sm text-foreground ${mono ? "font-mono truncate" : ""}`}>{value}</p>
  </div>
);

const MatchRow = ({
  label,
  match,
  local,
  onChain,
}: {
  label: string;
  match: boolean | null;
  local: string;
  onChain: string;
}) => (
  <div className="flex items-start gap-3">
    {match === null ? null : match ? (
      <Check className="w-5 h-5 text-success mt-0.5 shrink-0" />
    ) : (
      <X className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
    )}
    <div className="min-w-0 flex-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="space-y-1">
        <div>
          <span className="text-xs text-muted-foreground">Local: </span>
          <span className="text-hash">{local}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">On-chain: </span>
          <span className="text-hash">{onChain}</span>
        </div>
      </div>
      <p className={`text-xs font-medium mt-1 ${match ? "text-success" : "text-destructive"}`}>
        {match ? "Match ✓" : "Mismatch ✗"}
      </p>
    </div>
  </div>
);

export default Verify;
