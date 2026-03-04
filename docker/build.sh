#!/bin/bash
# =============================================================================
# LUVDISC Deterministic Build Script
# =============================================================================
#
# Usage: ./build.sh <input.ll> [optimization_level]
#
# This script enforces deterministic compilation by:
# 1. Normalizing the input IR (strip comments, blank lines)
# 2. Hashing the normalized input
# 3. Compiling twice with identical flags
# 4. Comparing output hashes to verify determinism
# 5. Emitting the final artifact and build hash
#
# Exit codes:
#   0 — Success, deterministic build verified
#   1 — Missing input file
#   2 — Determinism check failed (dual-compile mismatch)
#   3 — Compilation error
#
# =============================================================================

set -euo pipefail

# --- Arguments ---
INPUT_FILE="${1:?Error: No input .ll file specified. Usage: ./build.sh <input.ll> [opt_level]}"
OPT_LEVEL="${2:-O2}"

# --- Constants ---
COMPILER_VERSION="llc-18.1.0"
TARGET_TRIPLE="sbfv2"
OUTPUT_DIR="/build/output"

# --- Determinism: Fixed environment ---
export TZ=UTC
export LANG=C
export LC_ALL=C
export SOURCE_DATE_EPOCH=1704067200

# Unset any variables that could affect compilation
unset TMPDIR
unset HOME
unset USER

mkdir -p "$OUTPUT_DIR"

echo "================================================================"
echo "LUVDISC Deterministic Build"
echo "================================================================"
echo "  Input:        $(basename "$INPUT_FILE")"
echo "  Compiler:     $COMPILER_VERSION"
echo "  Target:       $TARGET_TRIPLE"
echo "  Optimization: $OPT_LEVEL"
echo "  Timestamp:    $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "================================================================"

# --- Step 1: Normalize Input IR ---
# Strip comment lines (starting with ;) and blank lines.
# This ensures whitespace/comment differences don't affect the hash.
echo "[1/6] Normalizing input IR..."
NORMALIZED_FILE="$OUTPUT_DIR/normalized.ll"
grep -v '^\s*;' "$INPUT_FILE" | grep -v '^\s*$' | sed 's/[[:space:]]*$//' > "$NORMALIZED_FILE"
echo "  Normalized: $(wc -l < "$NORMALIZED_FILE") lines (from $(wc -l < "$INPUT_FILE") original)"

# --- Step 2: Hash Normalized Input ---
echo "[2/6] Hashing normalized input..."
IR_HASH=$(sha256sum "$NORMALIZED_FILE" | awk '{print $1}')
echo "  IR Hash: $IR_HASH"

# --- Step 3: First Compilation ---
echo "[3/6] Compiling (pass 1)..."
ARTIFACT_1="$OUTPUT_DIR/output_pass1.o"
if ! llc \
    -march=sbf \
    -mcpu=sbfv2 \
    -filetype=obj \
    "-$OPT_LEVEL" \
    --relocation-model=pic \
    -o "$ARTIFACT_1" \
    "$NORMALIZED_FILE" 2>"$OUTPUT_DIR/compile_pass1.log"; then
    echo "ERROR: Compilation failed (pass 1)"
    cat "$OUTPUT_DIR/compile_pass1.log"
    exit 3
fi
HASH_1=$(sha256sum "$ARTIFACT_1" | awk '{print $1}')
echo "  Pass 1 hash: $HASH_1"

# --- Step 4: Second Compilation (Determinism Verification) ---
echo "[4/6] Compiling (pass 2 — determinism check)..."
ARTIFACT_2="$OUTPUT_DIR/output_pass2.o"
if ! llc \
    -march=sbf \
    -mcpu=sbfv2 \
    -filetype=obj \
    "-$OPT_LEVEL" \
    --relocation-model=pic \
    -o "$ARTIFACT_2" \
    "$NORMALIZED_FILE" 2>"$OUTPUT_DIR/compile_pass2.log"; then
    echo "ERROR: Compilation failed (pass 2)"
    cat "$OUTPUT_DIR/compile_pass2.log"
    exit 3
fi
HASH_2=$(sha256sum "$ARTIFACT_2" | awk '{print $1}')
echo "  Pass 2 hash: $HASH_2"

# --- Step 5: Determinism Verification ---
echo "[5/6] Verifying determinism..."
if [ "$HASH_1" != "$HASH_2" ]; then
    echo "================================================================"
    echo "DETERMINISM CHECK FAILED"
    echo "================================================================"
    echo "  Pass 1: $HASH_1"
    echo "  Pass 2: $HASH_2"
    echo ""
    echo "  The compiler produced different outputs for identical inputs."
    echo "  This build CANNOT be trusted."
    echo "================================================================"
    exit 2
fi
echo "  ✓ Determinism verified (both passes match)"

# --- Step 6: Compute Build Hash ---
# Build hash = SHA-256(artifact || compiler_version || target || opt_level)
echo "[6/6] Computing build hash..."
BUILD_HASH_INPUT="$OUTPUT_DIR/build_hash_input.bin"
cat "$ARTIFACT_1" > "$BUILD_HASH_INPUT"
printf "%s\n%s\n%s" "$COMPILER_VERSION" "$TARGET_TRIPLE" "$OPT_LEVEL" >> "$BUILD_HASH_INPUT"
BUILD_HASH=$(sha256sum "$BUILD_HASH_INPUT" | awk '{print $1}')
echo "  Build Hash: $BUILD_HASH"

# --- Final Output ---
cp "$ARTIFACT_1" "$OUTPUT_DIR/artifact.o"
rm -f "$ARTIFACT_2" "$BUILD_HASH_INPUT"

# Write manifest
cat > "$OUTPUT_DIR/manifest.json" <<EOF
{
  "ir_hash": "$IR_HASH",
  "build_hash": "$BUILD_HASH",
  "compiler_version": "$COMPILER_VERSION",
  "target_triple": "$TARGET_TRIPLE",
  "optimization_level": "$OPT_LEVEL",
  "artifact": "artifact.o",
  "determinism_verified": true,
  "source_date_epoch": $SOURCE_DATE_EPOCH
}
EOF

echo ""
echo "================================================================"
echo "BUILD COMPLETE"
echo "================================================================"
echo "  IR Hash:    $IR_HASH"
echo "  Build Hash: $BUILD_HASH"
echo "  Artifact:   $OUTPUT_DIR/artifact.o"
echo "  Manifest:   $OUTPUT_DIR/manifest.json"
echo "  Determinism: VERIFIED"
echo "================================================================"
