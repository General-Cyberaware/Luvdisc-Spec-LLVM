# LUVDISC Deterministic Build Environment

## Quick Start

```bash
# Build the Docker image
docker build -t luvdisc-builder docker/

# Compile an LLVM IR file
docker run --rm \
  -v $(pwd)/my-program.ll:/build/input.ll:ro \
  -v $(pwd)/output:/build/output \
  luvdisc-builder /build/input.ll O2
```

## What Each Step Enforces

| Step | Determinism Guarantee |
|------|----------------------|
| Image pinned by digest | No silent base image updates |
| `ENV LANG=C LC_ALL=C` | No locale-dependent string behavior |
| `ENV TZ=UTC` | No timezone-dependent timestamps |
| `SOURCE_DATE_EPOCH` | Reproducible-builds.org standard |
| LLVM pinned to exact version | No compiler variance |
| Input normalization | Comments/whitespace don't affect hash |
| Dual compilation + hash compare | Proves compiler is deterministic |
| Environment variable sanitization | No `$HOME`, `$TMPDIR` leaking into paths |

## Output

After a successful build, the `output/` directory contains:

- `artifact.o` — Compiled object file
- `manifest.json` — Build metadata (hashes, compiler info, determinism status)
- `normalized.ll` — The normalized IR that was actually compiled
- `compile_pass1.log` — Compiler output from first pass
