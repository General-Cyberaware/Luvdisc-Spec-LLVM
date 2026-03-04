# LUVDISC Solana Registry Program

A minimal, immutable Solana program that acts as an on-chain registry for deterministic LLVM IR builds.

## Architecture

- **No Anchor framework** — uses native `solana_program` SDK for clarity
- **Fixed-size accounts** — `BuildRecord` is exactly 153 bytes
- **PDA-based storage** — each unique `(ir_hash, build_hash)` pair maps to exactly one on-chain account
- **Immutable** — once deployed, the program has no upgrade authority

## Data Model

```
BuildRecord (153 bytes)
├── ir_hash:            [u8; 32]   — SHA-256 of normalized LLVM IR
├── build_hash:         [u8; 32]   — SHA-256 of compiled output + flags
├── compiler_version:   [u8; 32]   — zero-padded version string
├── optimization_level: [u8; 16]   — zero-padded opt level
├── uploader:           Pubkey     — 32 bytes
├── timestamp:          i64        — 8 bytes, from Clock sysvar
└── is_initialized:     bool       — 1 byte
```

## PDA Derivation

```
seeds = ["luvdisc", ir_hash, build_hash]
```

This ensures:
- Each unique build gets exactly one address
- The same build always resolves to the same PDA
- No account can be overwritten (RegisterBuild fails if PDA exists)

## Instructions

### RegisterBuild

Creates a new PDA and writes the `BuildRecord`.

**Accounts:**
| # | Account | Signer | Writable |
|---|---------|--------|----------|
| 0 | Uploader (payer) | ✓ | ✓ |
| 1 | PDA account | ✗ | ✓ |
| 2 | System Program | ✗ | ✗ |
| 3 | Clock Sysvar | ✗ | ✗ |

### GetBuild

No-op on-chain. Clients read PDA data directly via `getAccountInfo` RPC.

## Build

```bash
cargo build-bpf
```

## Deploy to Devnet

```bash
solana program deploy \
  --program-id <KEYPAIR> \
  --url devnet \
  target/deploy/luvdisc_registry.so
```

To make immutable (no upgrade authority):

```bash
solana program set-upgrade-authority <PROGRAM_ID> --final
```

## Client Integration

```typescript
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import * as borsh from "borsh";

// Derive PDA
const [pda] = PublicKey.findProgramAddressSync(
  [Buffer.from("luvdisc"), irHashBytes, buildHashBytes],
  PROGRAM_ID
);

// Build instruction data (Borsh-serialized RegisterBuild variant)
const data = Buffer.concat([
  Buffer.from([0]), // variant index 0 = RegisterBuild
  irHashBytes,      // 32 bytes
  buildHashBytes,   // 32 bytes
  compilerBytes,    // 32 bytes, zero-padded
  optLevelBytes,    // 16 bytes, zero-padded
]);

const ix = new TransactionInstruction({
  keys: [
    { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
    { pubkey: pda, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
  ],
  programId: PROGRAM_ID,
  data,
});
```
