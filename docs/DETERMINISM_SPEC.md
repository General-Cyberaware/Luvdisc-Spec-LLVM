# LUVDISC Determinism Specification v1.0

**Status:** Normative  
**Date:** 2026-03-04  
**Authors:** LUVDISC Contributors  

---

## 1. Purpose

Blockchain-deployed programs demand verifiable provenance. A user inspecting a deployed Solana program must be able to independently confirm that the on-chain bytecode was produced from a specific, unmodified LLVM IR source using a specific, unmodified compiler toolchain.

Non-deterministic compilation breaks this guarantee. If the same source can produce different binaries, no hash comparison can prove correspondence between source and artifact.

LUVDISC eliminates this failure mode by defining and enforcing a deterministic compilation pipeline, anchoring its outputs immutably on-chain.

---

## 2. Threat Model

### 2.1 What Non-Determinism Breaks

- **Reproducibility:** Independent parties cannot verify builds.
- **Auditability:** On-chain hashes become meaningless if the same source produces varying outputs.
- **Trust:** Users cannot distinguish a legitimate program from a modified one.

### 2.2 What LUVDISC Defends Against

| Threat | Mitigation |
|--------|-----------|
| Compiler version drift | Exact version pinning (LLVM 18.1.0) |
| Flag variation | Fixed, explicit optimization flags |
| Environment leakage | Containerized execution with sanitized variables |
| Timestamp embedding | `SOURCE_DATE_EPOCH`, no debug timestamps |
| Locale-dependent ordering | `LANG=C`, `LC_ALL=C` |
| Path-dependent output | No absolute paths; normalized input |
| Silent toolchain updates | Docker image pinned by digest |
| Single-compilation faith | Dual compilation with hash comparison |

### 2.3 Out of Scope

- Side-channel attacks on the compilation host
- Compromise of the LLVM project itself
- Attacks on the Solana runtime or validator set

---

## 3. Determinism Domains

### 3.1 Input Determinism

The LLVM IR file MUST be normalized before hashing:

- All comment lines (lines beginning with `;` after optional whitespace) MUST be removed.
- All blank lines MUST be removed.
- All trailing whitespace MUST be stripped.
- The resulting content MUST be hashed with SHA-256.

The IR hash is computed over the **normalized** content, not the raw file.

### 3.2 Compiler Determinism

The compiler toolchain MUST satisfy:

- LLVM version MUST be pinned to an exact release (e.g., `18.1.0`), not a range or "latest."
- The target triple MUST be explicitly specified (e.g., `sbfv2`).
- Optimization level MUST be explicitly specified (e.g., `O2`).
- Debug symbols MUST NOT include timestamps.
- The relocation model MUST be explicitly set (`pic`).

### 3.3 Environment Determinism

The build environment MUST satisfy:

- `LANG` MUST be set to `C`.
- `LC_ALL` MUST be set to `C`.
- `TZ` MUST be set to `UTC`.
- `SOURCE_DATE_EPOCH` MUST be set to a fixed value.
- `HOME`, `USER`, and `TMPDIR` MUST NOT be set.
- The compiler MUST execute inside a container whose base image is pinned by digest.

### 3.4 Output Determinism

- The same normalized IR, compiled with the same flags in the same environment, MUST produce byte-identical output.
- This MUST be verified by compiling twice and comparing SHA-256 hashes.
- If the hashes differ, the build MUST be rejected.

---

## 4. Normative Requirements

The key words "MUST", "MUST NOT", "SHOULD", "SHOULD NOT", and "MAY" in this section are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

### 4.1 Input Processing

1. The system MUST normalize IR content before hashing.
2. The system MUST NOT include comments or blank lines in the hash input.
3. The system MUST compute IR hashes using SHA-256.
4. The system MUST reject files that do not parse as valid LLVM IR.

### 4.2 Compilation

5. The compiler version MUST be recorded as a fixed-length string in the build record.
6. The optimization level MUST be recorded in the build record.
7. The system MUST compile the normalized IR exactly twice per build.
8. The system MUST compare the SHA-256 hashes of both compilation outputs.
9. If the hashes differ, the system MUST abort and MUST NOT register the build on-chain.
10. The system MUST NOT embed filesystem paths, timestamps, or environment-derived values in compilation output.

### 4.3 Environment

11. The build environment MUST be a container with a base image pinned by digest.
12. The container MUST NOT have network access during compilation.
13. The container MUST set `LANG=C`, `LC_ALL=C`, and `TZ=UTC`.
14. The container MUST set `SOURCE_DATE_EPOCH` to a fixed, documented value.

### 4.4 On-Chain Registration

15. Build records MUST be stored in PDA accounts derived from `["luvdisc", ir_hash, build_hash]`.
16. Once created, a build record MUST NOT be modifiable.
17. The system MUST reject registration if the PDA already exists.
18. The `timestamp` field MUST be sourced from the Solana Clock sysvar, not the client.
19. The `uploader` field MUST be the signing wallet's public key.

### 4.5 Verification

20. To verify a build, the system MUST re-normalize the IR and re-compute hashes.
21. The system MUST compare re-computed hashes against on-chain values.
22. A build is "verified" if and only if both `ir_hash` and `build_hash` match exactly.
23. The system MUST NOT report partial matches as verified.

---

## 5. Verification Procedure

### 5.1 Registration Flow

```
1. User uploads .ll file
2. System normalizes IR (strip comments, blank lines, trailing whitespace)
3. System computes IR hash = SHA-256(normalized_ir)
4. System compiles normalized IR with fixed flags
5. System compiles again with identical flags
6. System asserts SHA-256(output_1) == SHA-256(output_2)
7. System computes build_hash = SHA-256(output || compiler_version || target || opt_level)
8. System derives PDA from ["luvdisc", ir_hash, build_hash]
9. System submits RegisterBuild transaction
10. Solana program creates PDA, writes BuildRecord, records Clock timestamp
```

### 5.2 Verification Flow

```
1. User provides PDA address or transaction signature
2. System fetches BuildRecord from PDA
3. User uploads original .ll file
4. System normalizes IR identically to registration
5. System computes IR hash
6. System computes build hash (using compiler_version and opt_level from on-chain record)
7. System compares:
   - local_ir_hash == on_chain.ir_hash
   - local_build_hash == on_chain.build_hash
8. If both match: VERIFIED
9. If either differs: MISMATCH
```

### 5.3 Hash Comparison Rules

- Hashes MUST be compared as 64-character lowercase hexadecimal strings.
- Leading zeros MUST NOT be stripped.
- Comparison MUST be constant-time to prevent timing side channels.

---

## 6. On-Chain Binding

### 6.1 PDA Derivation

The PDA address is derived deterministically:

```
PDA = find_program_address(["luvdisc", ir_hash, build_hash], PROGRAM_ID)
```

This construction ensures:

- The same `(ir_hash, build_hash)` pair always resolves to the same address.
- No two distinct builds can collide (SHA-256 collision resistance).
- The PDA cannot be created by any entity other than the LUVDISC program.

### 6.2 Immutability

- The LUVDISC program MUST be deployed with no upgrade authority.
- The RegisterBuild instruction MUST reject writes to existing PDAs.
- There is no UpdateBuild or DeleteBuild instruction.

Once a build is registered, it is permanent.

---

## 7. Future Compatibility

### 7.1 LLVM Version Upgrades

When a new LLVM version is adopted:

1. A new Docker image MUST be created with the new version pinned by exact release.
2. The `compiler_version` field in BuildRecord distinguishes builds across versions.
3. Existing builds remain verifiable against their recorded compiler version.
4. The LUVDISC frontend SHOULD display the compiler version prominently during verification.

### 7.2 Spec Versioning

- This specification is versioned as `v{major}.{minor}`.
- Breaking changes (new required fields, changed PDA seeds) increment the major version.
- Clarifications and additions increment the minor version.
- Each spec version SHOULD be anchored on-chain as its own build record.

### 7.3 Migration Path

If PDA seeds change in a future version:

- The new program MUST be deployed at a new program ID.
- The old program remains immutable and queryable.
- The frontend MUST support querying both program IDs during a transition period.

---

## Appendix A: Reference Values

| Parameter | Value |
|-----------|-------|
| LLVM version | `18.1.0` |
| Compiler binary | `llc-18` |
| Target triple | `sbfv2` |
| Default optimization | `O2` |
| Relocation model | `pic` |
| Hash algorithm | SHA-256 |
| `SOURCE_DATE_EPOCH` | `1704067200` (2024-01-01T00:00:00Z) |
| PDA seed prefix | `"luvdisc"` |
| BuildRecord size | 153 bytes |

## Appendix B: Checklist Summary

| # | Check | Domain |
|---|-------|--------|
| 1 | Fixed LLVM version | Compiler |
| 2 | Fixed target triple | Compiler |
| 3 | Fixed optimization flags | Compiler |
| 4 | No timestamps in output | Compiler |
| 5 | Stable symbol ordering | Compiler |
| 6 | No environment-dependent paths | Environment |
| 7 | Containerized execution | Environment |
| 8 | Normalized input IR | Input |
| 9 | Hash inputs before compilation | Input |
| 10 | Hash outputs after compilation | Output |
