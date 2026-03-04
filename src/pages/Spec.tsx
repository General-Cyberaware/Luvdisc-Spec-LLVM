import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Box, Container, Shield, ChevronRight, ExternalLink } from "lucide-react";

const sections = [
  {
    id: "program",
    icon: Box,
    title: "Solana Program",
    subtitle: "On-chain registry written in Rust",
    details: [
      { label: "Framework", value: "Native solana_program SDK" },
      { label: "Account Size", value: "153 bytes (fixed)" },
      { label: "PDA Seeds", value: '["luvdisc", ir_hash, build_hash]' },
      { label: "Instructions", value: "RegisterBuild, GetBuild" },
      { label: "Upgrade Authority", value: "None (immutable)" },
      { label: "Network", value: "Solana Devnet" },
    ],
    dataModel: [
      "ir_hash: [u8; 32]",
      "build_hash: [u8; 32]",
      "compiler_version: [u8; 32]",
      "optimization_level: [u8; 16]",
      "uploader: Pubkey",
      "timestamp: i64",
      "is_initialized: bool",
    ],
  },
  {
    id: "docker",
    icon: Container,
    title: "Build Environment",
    subtitle: "Deterministic LLVM compilation via Docker",
    details: [
      { label: "Base Image", value: "Ubuntu 22.04 (pinned by digest)" },
      { label: "LLVM Version", value: "18.1.0 (exact)" },
      { label: "Target", value: "SBFv2 (Solana)" },
      { label: "Locale", value: "LANG=C, LC_ALL=C" },
      { label: "Timezone", value: "UTC (fixed)" },
      { label: "Verification", value: "Dual compilation + hash compare" },
    ],
    steps: [
      "Normalize IR (strip comments, blank lines)",
      "Hash normalized input (SHA-256)",
      "Compile with fixed flags (pass 1)",
      "Compile again identically (pass 2)",
      "Compare output hashes — abort if mismatch",
      "Compute build hash from artifact + metadata",
    ],
  },
  {
    id: "spec",
    icon: Shield,
    title: "Determinism Specification",
    subtitle: "Formal guarantees and verification rules",
    details: [
      { label: "Version", value: "v1.0" },
      { label: "Hash Algorithm", value: "SHA-256" },
      { label: "SOURCE_DATE_EPOCH", value: "1704067200" },
      { label: "PDA Derivation", value: "Deterministic, immutable" },
      { label: "Spec Language", value: "RFC 2119 (MUST/SHOULD)" },
    ],
    domains: [
      { name: "Input", rule: "Normalized IR, comments stripped, SHA-256 hashed" },
      { name: "Compiler", rule: "Exact version pinned, explicit flags, no timestamps" },
      { name: "Environment", rule: "Containerized, fixed locale/timezone, sanitized vars" },
      { name: "Output", rule: "Dual compilation, byte-identical outputs required" },
    ],
  },
];

const Spec = () => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="min-h-screen gradient-pink pt-24 px-4 pb-12">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-mono text-2xl font-bold text-foreground mb-2">
            Architecture & Specification
          </h1>
          <p className="text-sm text-muted-foreground">
            The infrastructure behind deterministic LLVM builds on Solana
          </p>
        </motion.div>

        <div className="space-y-4">
          {sections.map((section, i) => {
            const Icon = section.icon;
            const isOpen = expanded === section.id;

            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : section.id)}
                  className="glass-card p-5 w-full text-left transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-foreground">{section.title}</h2>
                      <p className="text-sm text-muted-foreground">{section.subtitle}</p>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-muted-foreground transition-transform ${
                        isOpen ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="glass-card p-5 mt-1 space-y-4 overflow-hidden"
                  >
                    {/* Key-value details */}
                    <div className="space-y-2">
                      {section.details.map((d) => (
                        <div key={d.label} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{d.label}</span>
                          <span className="font-mono text-foreground text-right max-w-[60%] truncate">
                            {d.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Data model (program section) */}
                    {"dataModel" in section && section.dataModel && (
                      <div className="pt-3 border-t border-border">
                        <h3 className="text-xs text-muted-foreground mb-2 font-mono">BuildRecord</h3>
                        <div className="bg-muted rounded-xl p-3 font-mono text-xs text-foreground space-y-1">
                          {section.dataModel.map((line) => (
                            <div key={line}>{line}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Build steps (docker section) */}
                    {"steps" in section && section.steps && (
                      <div className="pt-3 border-t border-border">
                        <h3 className="text-xs text-muted-foreground mb-2">Build Pipeline</h3>
                        <div className="space-y-2">
                          {section.steps.map((step, j) => (
                            <div key={j} className="flex items-start gap-2 text-sm">
                              <span className="font-mono text-xs text-primary mt-0.5 shrink-0 w-5 text-right">
                                {j + 1}.
                              </span>
                              <span className="text-foreground">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Determinism domains (spec section) */}
                    {"domains" in section && section.domains && (
                      <div className="pt-3 border-t border-border">
                        <h3 className="text-xs text-muted-foreground mb-2">Determinism Domains</h3>
                        <div className="space-y-2">
                          {section.domains.map((d) => (
                            <div key={d.name} className="bg-muted rounded-xl px-3 py-2">
                              <span className="text-xs font-semibold text-foreground">{d.name}</span>
                              <p className="text-xs text-muted-foreground mt-0.5">{d.rule}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Link to full spec */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Full Determinism Specification v1.0</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default Spec;
