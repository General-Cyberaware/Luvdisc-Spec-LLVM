import { motion } from "framer-motion";
import { Shield, Cpu, Link2, Eye, Globe, Rocket } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen gradient-pink pt-24 px-4 pb-16">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-mono text-3xl font-bold tracking-[0.3em] text-foreground mb-3">
            LUVDISC
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Deterministic LLVM Compilation Anchored on Solana
          </p>
        </motion.div>

        {/* Overview */}
        <Section title="Overview" delay={0.1}>
          <p>
            LUVDISC is a Solana-native compiler infrastructure project that connects LLVM with
            blockchain by making deterministic compilation a first-class, on-chain primitive.
          </p>
          <p>
            LUVDISC enables developers to upload LLVM Intermediate Representation (IR),
            deterministically compile it into Solana-compatible programs, and cryptographically
            anchor the full build provenance on-chain. This allows anyone to verify that a deployed
            Solana program corresponds exactly to a specific LLVM IR input, compiler version, and
            optimization configuration.
          </p>
          <p className="font-semibold text-foreground">
            In short: LUVDISC turns programs into verifiable artifacts.
          </p>
        </Section>

        {/* Problem */}
        <Section title="Problem" delay={0.15}>
          <p>Modern blockchains rely on compiled programs, yet:</p>
          <ul>
            <li>Deployed binaries are opaque</li>
            <li>Build processes are often non-deterministic</li>
            <li>Auditors cannot reliably verify source-to-binary equivalence</li>
            <li>Compiler behavior is trusted implicitly, not proven</li>
          </ul>
          <p>
            This creates a trust gap between source-level intent and on-chain execution, especially
            for high-value programs.
          </p>
        </Section>

        {/* Solution */}
        <Section title="Solution" delay={0.2}>
          <p>
            LUVDISC introduces a deterministic, auditable compilation pipeline backed by Solana.
          </p>
          <p className="font-medium text-foreground">Core capabilities:</p>
          <ul>
            <li>LLVM IR ingestion (.ll files)</li>
            <li>Deterministic compilation using a pinned LLVM toolchain</li>
            <li>Cryptographic hashing of inputs and outputs</li>
            <li>Immutable on-chain registry of build metadata</li>
            <li>Public verification of deployed programs against LLVM IR</li>
          </ul>
          <p className="font-medium text-foreground">Each build is anchored on-chain with:</p>
          <div className="grid grid-cols-2 gap-2">
            {["IR hash", "Build hash", "Compiler version", "Optimization level", "Uploader identity", "Timestamp"].map(
              (item) => (
                <div key={item} className="bg-muted/60 rounded-lg px-3 py-1.5 font-mono text-xs text-foreground">
                  {item}
                </div>
              )
            )}
          </div>
          <p>
            This creates a verifiable, tamper-resistant link between LLVM IR and Solana execution.
          </p>
        </Section>

        {/* Why LLVM */}
        <Section title="Why LLVM" delay={0.25}>
          <p>
            LLVM is the dominant compiler infrastructure for modern languages (C/C++, Rust, Swift,
            Zig, etc.).
          </p>
          <p>LLVM IR is:</p>
          <ul>
            <li>Language-agnostic</li>
            <li>Optimizable</li>
            <li>Well-suited for static analysis</li>
            <li>Ideal as a canonical "source of truth" above machine code</li>
          </ul>
          <p>
            LUVDISC treats LLVM IR as the primary artifact, not an intermediate afterthought.
          </p>
        </Section>

        {/* Architecture */}
        <Section title="Architecture" delay={0.3}>
          <div className="space-y-2">
            {[
              { icon: Cpu, text: "Developer uploads LLVM IR" },
              { icon: Shield, text: "LUVDISC normalizes and hashes the IR" },
              { icon: Globe, text: "IR is compiled deterministically inside a containerized LLVM environment" },
              { icon: Eye, text: "Output is hashed and verified for determinism" },
              { icon: Link2, text: "Hashes and metadata are written to Solana via an immutable on-chain program" },
              { icon: Shield, text: "Anyone can later verify a deployed program against the original IR" },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <p className="text-sm text-foreground">{step.text}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground italic">
            The Solana program acts as a minimal, immutable registry — not a computation engine.
          </p>
        </Section>

        {/* Key Properties */}
        <Section title="Key Properties" delay={0.35}>
          <div className="space-y-2">
            {[
              ["Deterministic", "Identical inputs always produce identical outputs"],
              ["Auditable", "Full build provenance is public and verifiable"],
              ["Language-agnostic", "Any LLVM-backed language can participate"],
              ["Minimal trust", "No reliance on private build systems"],
              ["Solana-native", "Fast, low-cost anchoring and verification"],
            ].map(([title, desc]) => (
              <div key={title} className="flex gap-2 text-sm">
                <span className="font-semibold text-foreground whitespace-nowrap">{title}</span>
                <span className="text-muted-foreground">— {desc}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Use Cases */}
        <Section title="Use Cases" delay={0.4}>
          <ul>
            <li>Verifiable smart contract builds</li>
            <li>Safer DAO and treasury programs</li>
            <li>Compiler-aware audits</li>
            <li>Multi-language Solana development</li>
            <li>Foundation for future ZK and coprocessor systems</li>
          </ul>
        </Section>

        {/* Roadmap */}
        <Section title="Roadmap" delay={0.45}>
          <div className="space-y-2">
            {[
              { label: "MVP", desc: "Deterministic LLVM → Solana registry", active: true },
              { label: "Next", desc: "Optimization-aware compiler passes" },
              { label: "Future", desc: "Verified compiler pass registry" },
              { label: "Research", desc: "Zero-knowledge build proofs" },
              { label: "Governance", desc: "DAO governance over compiler configurations" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    item.active ? "bg-primary" : "bg-border"
                  }`}
                />
                <span className="font-mono text-xs text-foreground w-20 shrink-0">{item.label}</span>
                <span className="text-sm text-muted-foreground">{item.desc}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Vision */}
        <Section title="Vision" delay={0.5}>
          <p>
            LUVDISC positions Solana not just as an execution layer, but as a{" "}
            <span className="font-semibold text-foreground">trust anchor for programs themselves</span>.
          </p>
          <p>By bringing compiler determinism on-chain, LUVDISC lays the groundwork for a future where:</p>
          <p className="text-center font-semibold text-foreground text-lg mt-4">
            Programs are not trusted — they are proven.
          </p>
        </Section>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="font-mono text-xl font-bold tracking-[0.3em] text-foreground mb-1">LUVDISC</p>
          <p className="text-sm text-muted-foreground">
            Deterministic compilation as blockchain infrastructure.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

const Section = ({
  title,
  delay,
  children,
}: {
  title: string;
  delay: number;
  children: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass-card p-6 mb-4 prose-sm [&_p]:text-sm [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:text-sm [&_li]:text-muted-foreground [&_li]:mb-1"
  >
    <h2 className="font-mono text-base font-bold text-foreground mb-3">{title}</h2>
    {children}
  </motion.div>
);

export default About;
