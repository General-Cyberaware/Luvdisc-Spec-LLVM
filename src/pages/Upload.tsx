import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { parseLLVMIR, hashContent, computeBuildHash, type LLVMMetadata } from "@/lib/llvm-parser";
import { normalizeIR } from "@/lib/determinism-checks";
import { anchorBuildOnChain, type AnchorResult } from "@/lib/solana-anchor";
import { runDeterminismChecks, allChecksPassed, type CheckItem } from "@/lib/determinism-checks";
import DeterminismChecklist from "@/components/DeterminismChecklist";
import UploadDropZone from "@/components/UploadDropZone";
import BuildResult from "@/components/BuildResult";
import { Loader2, ChevronDown, Download } from "lucide-react";

const Upload = () => {
  const { publicKey, sendTransaction, connected } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<LLVMMetadata | null>(null);
  const [irHash, setIrHash] = useState("");
  const [buildHash, setBuildHash] = useState("");
  const [result, setResult] = useState<AnchorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [compilerVersion] = useState("llc-18.1.0");
  const [targetArch] = useState("sbfv2");
  const [optimizationLevel] = useState("O2");
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const addLog = (msg: string) =>
    setLogs((prev) => [...prev, `[${new Date().toISOString().slice(11, 19)}] ${msg}`]);

  const loadSampleFile = async () => {
    const res = await fetch("/samples/hello_solana.ll");
    const text = await res.text();
    const f = new File([text], "hello_solana.ll", { type: "text/plain" });
    handleFile(f);
  };

  const handleFile = useCallback(
    async (f: File) => {
      setFile(f);
      setResult(null);
      setLogs([]);
      addLog(`Reading file: ${f.name} (${(f.size / 1024).toFixed(1)} KB)`);

      const content = await f.text();
      const parsed = parseLLVMIR(content);
      setMetadata(parsed);
      addLog(`Parsed module: ${parsed.moduleName}`);
      addLog(`Target triple: ${parsed.targetTriple}`);
      addLog(`Found ${parsed.functionCount} function(s)`);

      // Normalize IR for deterministic hashing
      const normalized = normalizeIR(content);
      addLog("Normalized IR (stripped comments + whitespace)");

      const ih = await hashContent(normalized);
      setIrHash(ih);
      addLog(`IR SHA-256: ${ih.slice(0, 16)}...`);

      const bh = await computeBuildHash(normalized, compilerVersion, targetArch, optimizationLevel);
      setBuildHash(bh);
      addLog(`Build hash: ${bh.slice(0, 16)}...`);

      // Run determinism checks
      const checkResults = runDeterminismChecks(content, compilerVersion, targetArch, optimizationLevel);
      setChecks(checkResults);
      const passed = checkResults.filter((c) => c.passed).length;
      addLog(`Determinism checks: ${passed}/${checkResults.length} passed`);
    },
    [compilerVersion, targetArch, optimizationLevel]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f && f.name.endsWith(".ll")) handleFile(f);
    },
    [handleFile]
  );

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!publicKey || !sendTransaction || !irHash || !buildHash) return;
    if (!allChecksPassed(checks)) return;

    setLoading(true);
    addLog("Submitting to Solana Devnet...");

    try {
      const res = await anchorBuildOnChain(
        irHash,
        buildHash,
        compilerVersion,
        optimizationLevel,
        sendTransaction,
        publicKey
      );
      setResult(res);
      addLog(`✓ Transaction confirmed: ${res.signature.slice(0, 16)}...`);
      addLog(`✓ Data account: ${res.programAddress}`);
      addLog(`✓ PDA address: ${res.pdaAddress}`);
    } catch (err: any) {
      addLog(`✗ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = metadata && !result && connected && allChecksPassed(checks);

  return (
    <div className="min-h-screen gradient-pink pt-24 px-4 pb-12">
      <div className="max-w-2xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-2xl font-bold text-foreground mb-8 text-center"
        >
          Upload LLVM IR
        </motion.h1>

        <UploadDropZone
          file={file}
          dragOver={dragOver}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onFileInput={onFileInput}
        />

        {!file && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-3 text-center"
          >
            <button
              onClick={loadSampleFile}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Or try with a <span className="font-mono">sample .ll</span> file</span>
            </button>
          </motion.div>
        )}

        {/* Compiler settings */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${showSettings ? "rotate-180" : ""}`} />
          Compiler Settings
        </button>
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-4 mt-2 grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Compiler</label>
                  <div className="font-mono text-sm text-foreground bg-muted rounded-lg px-3 py-2">{compilerVersion}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Target</label>
                  <div className="font-mono text-sm text-foreground bg-muted rounded-lg px-3 py-2">{targetArch}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Opt Level</label>
                  <div className="font-mono text-sm text-foreground bg-muted rounded-lg px-3 py-2">{optimizationLevel}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Determinism checklist */}
        <AnimatePresence>
          {checks.length > 0 && <DeterminismChecklist checks={checks} />}
        </AnimatePresence>

        {/* Metadata */}
        <AnimatePresence>
          {metadata && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 mt-6 space-y-3"
            >
              <h2 className="font-semibold text-foreground mb-3">IR Metadata</h2>
              {[
                ["Module", metadata.moduleName],
                ["Source", metadata.sourceFilename],
                ["Target", metadata.targetTriple],
                ["Functions", `${metadata.functionCount} (${metadata.functions.join(", ")})`],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-mono text-foreground text-right max-w-[60%] truncate">{val}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-border space-y-2">
                <div>
                  <span className="text-xs text-muted-foreground">IR Hash (SHA-256)</span>
                  <p className="text-hash">{irHash}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Build Hash</span>
                  <p className="text-hash">{buildHash}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        {metadata && !result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center">
            {!connected ? (
              <p className="text-sm text-muted-foreground">Connect your wallet to submit</p>
            ) : (
              <Button
                size="lg"
                className="rounded-2xl px-10"
                onClick={handleSubmit}
                disabled={loading || !canSubmit}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                  </>
                ) : !allChecksPassed(checks) ? (
                  "Fix checklist issues first"
                ) : (
                  "Anchor on Solana Devnet"
                )}
              </Button>
            )}
          </motion.div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && <BuildResult result={result} />}
        </AnimatePresence>

        {/* Logs */}
        {logs.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 glass-card p-4">
            <h3 className="text-xs text-muted-foreground mb-2 font-mono">Build Logs</h3>
            <div className="font-mono text-xs text-foreground/80 space-y-1 max-h-48 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Upload;
