<p align="center">
  <img src="public/images/luvdisc-banner.jpg" alt="LUVDISC — A project connecting LLVM and Blockchain" width="100%" />
</p>

<h1 align="center">LUVDISC</h1>

<p align="center">
  <strong>Deterministic LLVM Compilation Anchored on Solana</strong>
</p>

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#problem">Problem</a> •
  <a href="#solution">Solution</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#on-chain-program">On-Chain Program</a> •
  <a href="#determinism-specification">Determinism Spec</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#roadmap">Roadmap</a>
</p>

---

## Overview

LUVDISC is a Solana-native compiler infrastructure project that connects **LLVM** with **blockchain** by making deterministic compilation a first-class, on-chain primitive.

LUVDISC enables developers to:

1. **Upload** LLVM Intermediate Representation (IR) files
2. **Compile** them deterministically inside a containerized LLVM environment
3. **Anchor** the full build provenance — hashes, compiler version, optimization flags — immutably on Solana

This allows anyone to **verify** that a deployed Solana program corresponds exactly to a specific LLVM IR input, compiler version, and optimization configuration.

> **In short: LUVDISC turns programs into verifiable artifacts.**

---

## Problem

Modern blockchains rely on compiled programs, yet:

| Issue | Description |
|-------|-------------|
| **Opaque binaries** | Deployed bytecode cannot be inspected or traced back to source |
| **Non-deterministic builds** | Different machines, timestamps, or environments produce different outputs |
| **Unverifiable equivalence** | Auditors cannot reliably prove source-to-binary correspondence |
| **Implicit compiler trust** | Compiler behavior is trusted, never proven |

This creates a **trust gap** between source-level intent and on-chain execution — especially critical for high-value DeFi programs, DAOs, and treasury contracts.

---

## Solution

LUVDISC introduces a **deterministic, auditable compilation pipeline** backed by Solana.

### Core Capabilities

- ✅ LLVM IR ingestion (`.ll` files)
- ✅ Deterministic compilation using a **pinned LLVM toolchain** (`llc-18.1.0`)
- ✅ Cryptographic hashing of inputs (SHA-256) and outputs
- ✅ Immutable on-chain registry of build metadata
- ✅ Public verification of deployed programs against LLVM IR

### On-Chain Build Record

Each build is anchored on Solana with the following metadata:

```
BuildRecord (153 bytes)
├── ir_hash:            [u8; 32]   — SHA-256 of normalized LLVM IR
├── build_hash:         [u8; 32]   — SHA-256 of compiled output + flags
├── compiler_version:   [u8; 32]   — zero-padded version string (e.g. "llc-18.1.0")
├── optimization_level: [u8; 16]   — zero-padded opt level (e.g. "O2")
├── uploader:           Pubkey     — 32 bytes
├── timestamp:          i64        — 8 bytes, from Clock sysvar
└── is_initialized:     bool       — 1 byte
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        LUVDISC Pipeline                         │
├─────────────┬─────────────────────┬─────────────────────────────┤
│  Frontend   │  Deterministic      │  Solana Registry            │
│             │  Builder            │                             │
│  Upload .ll │  Docker + LLVM      │  Immutable PDA Storage      │
│  Parse IR   │  Pinned versions    │  No upgrades, no overwrites │
│  Hash input │  Fixed locale/env   │  Public verification        │
│  Run checks │  Dual-compilation   │  Devnet / Mainnet           │
└─────────────┴─────────────────────┴─────────────────────────────┘
```

### Flow

```
Developer uploads .ll file
        │
        ▼
   ┌─────────────┐
   │  Normalize   │  Strip comments, normalize whitespace
   │  & Hash IR   │  SHA-256 → ir_hash
   └──────┬──────┘
          │
          ▼
   ┌─────────────────────────────────┐
   │  Containerized LLVM Compilation │
   │  llc-18.1.0 · target: sbfv2    │
   │  Fixed locale · No timestamps  │
   │  Dual-pass verification        │
   └──────────────┬──────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────┐
   │  Hash Output                    │
   │  SHA-256(output + compiler      │
   │         + target + opt_level)   │
   │  → build_hash                   │
   └──────────────┬──────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────┐
   │  Anchor On-Chain (Solana)       │
   │  PDA = ["luvdisc", ir_hash,    │
   │          build_hash]            │
   │  Write BuildRecord to PDA      │
   └──────────────┬──────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────┐
   │  Public Verification            │
   │  Anyone can re-derive PDA and   │
   │  compare hashes on-chain        │
   └─────────────────────────────────┘
```

---

## On-Chain Program

The Solana program is a **minimal, immutable registry** built with native `solana_program` SDK (no Anchor framework).

### PDA Derivation

```
seeds = ["luvdisc", ir_hash, build_hash]
```

This ensures:
- Each unique build gets **exactly one address**
- The same build always resolves to the **same PDA**
- No account can be **overwritten** (`RegisterBuild` fails if PDA exists)

### Instructions

| Instruction | Description |
|-------------|-------------|
| `RegisterBuild` | Creates a new PDA and writes the `BuildRecord` |
| `GetBuild` | No-op on-chain; clients read PDA data via `getAccountInfo` RPC |

### Accounts (RegisterBuild)

| # | Account | Signer | Writable |
|---|---------|--------|----------|
| 0 | Uploader (payer) | ✓ | ✓ |
| 1 | PDA account | ✗ | ✓ |
| 2 | System Program | ✗ | ✗ |
| 3 | Clock Sysvar | ✗ | ✗ |

---

## Determinism Specification

LUVDISC enforces determinism through a **10-point checklist** (RFC 2119-style):

| # | Check | Description |
|---|-------|-------------|
| 1 | Fixed LLVM version | Compiler pinned to `llc-18.1.0` |
| 2 | Fixed target triple | Target set to `sbfv2` |
| 3 | Fixed optimization flags | Valid levels: `O0`, `O1`, `O2`, `O3`, `Os`, `Oz` |
| 4 | No timestamps | No `__TIMESTAMP__`, `__DATE__`, `__TIME__` in output |
| 5 | Stable symbol ordering | No randomized symbol prefixes |
| 6 | No environment paths | No absolute `/home/`, `/Users/`, `C:\` paths |
| 7 | Containerized execution | Docker-based isolated build environment |
| 8 | Normalized input | Comments and whitespace stripped before hashing |
| 9 | Hash inputs | IR content hashed with SHA-256 before compilation |
| 10 | Hash outputs | Build output hashed with compiler metadata |

> See [`docs/DETERMINISM_SPEC.md`](docs/DETERMINISM_SPEC.md) for the full formal specification.

---

## Why LLVM?

LLVM is the dominant compiler infrastructure for modern languages (C/C++, Rust, Swift, Zig, etc.).

LLVM IR is:

- **Language-agnostic** — any LLVM-backed language can participate
- **Optimizable** — standard optimization passes are well-defined
- **Analyzable** — well-suited for static analysis and formal verification
- **Canonical** — ideal as a "source of truth" above machine code

LUVDISC treats LLVM IR as the **primary artifact**, not an intermediate afterthought.

---

## Tech Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tooling |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | Component library |
| **Framer Motion** | Animations |
| **@solana/web3.js** | Solana RPC & transactions |
| **@solana/wallet-adapter** | Wallet connection (Phantom, Solflare, etc.) |

### Backend / On-Chain

| Technology | Purpose |
|-----------|---------|
| **Rust** | Solana program language |
| **solana_program** | Native SDK (no Anchor) |
| **borsh** | Serialization |
| **Docker** | Containerized deterministic builds |
| **LLVM 18.1.0** | Pinned compiler toolchain |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18 (or [Bun](https://bun.sh/))
- A Solana wallet (e.g., [Phantom](https://phantom.app/))

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd luvdisc

# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage

1. **Navigate** to the Upload page
2. **Upload** a `.ll` LLVM IR file (or click "Try with a sample")
3. **Review** the parsed metadata and determinism checklist
4. **Connect** your Solana wallet
5. **Anchor** the build on-chain
6. **Verify** any build via transaction signature or PDA address on the Verify page

### Building the Solana Program

```bash
cd solana-program
cargo build-bpf
```

### Deploying to Devnet

```bash
solana program deploy \
  --program-id <KEYPAIR> \
  --url devnet \
  target/deploy/luvdisc_registry.so

# Make immutable (no upgrade authority)
solana program set-upgrade-authority <PROGRAM_ID> --final
```

### Docker (Deterministic Builder)

```bash
cd docker
./build.sh
```

---

## Key Properties

| Property | Description |
|----------|-------------|
| **Deterministic** | Identical inputs always produce identical outputs |
| **Auditable** | Full build provenance is public and verifiable |
| **Language-agnostic** | Any LLVM-backed language can participate |
| **Minimal trust** | No reliance on private build systems |
| **Solana-native** | Fast, low-cost anchoring and verification |
| **Immutable** | On-chain records cannot be modified or deleted |

---

## Use Cases

- 🔒 **Verifiable smart contract builds** — prove binary-source equivalence
- 🏛️ **Safer DAO and treasury programs** — auditable deployment pipelines
- 🔍 **Compiler-aware audits** — trace vulnerabilities to specific compiler passes
- 🌐 **Multi-language Solana development** — C, Rust, Zig → LLVM IR → Solana
- 🧪 **Foundation for ZK and coprocessor systems** — deterministic inputs for proof generation

---

## Roadmap

| Phase | Milestone | Status |
|-------|-----------|--------|
| 1 | Deterministic LLVM → Solana registry | ✅ Current |
| 2 | Optimization-aware compiler passes | 🔜 Planned |
| 3 | Verified compiler pass registry | 🔜 Planned |
| 4 | Zero-knowledge build proofs | 📋 Research |
| 5 | DAO governance over compiler configurations | 📋 Research |

---

## Project Structure

```
luvdisc/
├── public/
│   └── samples/          # Sample .ll files for testing
├── src/
│   ├── assets/           # Images and static assets
│   ├── components/       # React components
│   │   └── ui/           # shadcn/ui primitives
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Core logic
│   │   ├── llvm-parser.ts        # LLVM IR parsing & hashing
│   │   ├── solana-anchor.ts      # On-chain anchoring & verification
│   │   └── determinism-checks.ts # 10-point determinism checklist
│   ├── pages/            # Route pages
│   │   ├── Home.tsx      # Landing page
│   │   ├── About.tsx     # Project overview
│   │   ├── Upload.tsx    # IR upload & build flow
│   │   ├── Verify.tsx    # On-chain verification
│   │   └── Spec.tsx      # Formal specification
│   └── test/             # Test suite
├── solana-program/       # Native Solana program (Rust)
│   └── src/
│       ├── lib.rs        # Entrypoint
│       ├── processor.rs  # Instruction processing
│       ├── instruction.rs# Instruction definitions
│       ├── state.rs      # BuildRecord state
│       └── error.rs      # Custom errors
├── docker/               # Deterministic build environment
│   ├── Dockerfile        # Pinned LLVM toolchain
│   └── build.sh          # Build script
└── docs/
    └── DETERMINISM_SPEC.md  # Formal determinism specification
```

---

## Vision

LUVDISC positions Solana not just as an execution layer, but as a **trust anchor for programs themselves**.

By bringing compiler determinism on-chain, LUVDISC lays the groundwork for a future where:

> **Programs are not trusted — they are proven.**

---

<p align="center">
  <strong>LUVDISC</strong><br />
  <em>Deterministic compilation as blockchain infrastructure.</em>
</p>
