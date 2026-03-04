import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, Box, Container } from "lucide-react";
import heroImage from "@/assets/luvdisc-hero.jpg";

const Home = () => {
  return (
    <div className="min-h-screen gradient-pink flex flex-col items-center justify-center px-4 pt-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center text-center max-w-lg"
      >
        <motion.img
          src={heroImage}
          alt="Luvdisc - A Pokémon-inspired mascot"
          className="w-64 h-64 object-contain rounded-3xl mb-2"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <h1 className="font-mono text-4xl font-bold tracking-[0.3em] text-foreground mb-3">
          LUVDISC
        </h1>
        <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
          A project connecting LLVM and Solana.
          <br />
          <span className="text-sm">
            Anchor deterministic LLVM IR builds on-chain.
          </span>
        </p>

        <div className="flex gap-4">
          <Button asChild size="lg" className="rounded-2xl px-8 text-base">
            <Link to="/upload">Upload LLVM IR</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-2xl px-8 text-base"
          >
            <Link to="/verify">Verify Program</Link>
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full mb-12"
      >
        {[
          {
            title: "Upload",
            desc: "Upload your .ll LLVM IR file and parse its metadata.",
          },
          {
            title: "Hash & Build",
            desc: "Deterministically hash the IR with fixed compiler metadata.",
          },
          {
            title: "Anchor",
            desc: "Store the build hash on Solana Devnet for verification.",
          },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1 + i * 0.15 }}
            className="glass-card p-6 text-center"
          >
            <p className="font-mono text-sm font-bold text-foreground mb-2">
              0{i + 1}
            </p>
            <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Architecture section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="max-w-3xl w-full mb-12"
      >
        <div className="glass-card p-8">
          <h2 className="font-mono text-lg font-bold text-foreground mb-2 text-center">
            Architecture
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Three layers ensuring every deployed program is provably linked to its source.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Box,
                title: "Solana Registry",
                desc: "Immutable on-chain program storing build records as PDAs — no upgrades, no overwrites.",
              },
              {
                icon: Container,
                title: "Deterministic Builder",
                desc: "Docker-based LLVM environment with pinned versions, fixed locale, and dual-compilation verification.",
              },
              {
                icon: Shield,
                title: "Formal Spec",
                desc: "RFC 2119-style specification defining input, compiler, environment, and output determinism.",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.5 + i * 0.1 }}
                  className="bg-muted/50 rounded-xl p-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
          <div className="text-center mt-6">
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link to="/spec">View Full Specification →</Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
