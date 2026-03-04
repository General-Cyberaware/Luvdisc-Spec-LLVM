# =============================================================================
# LUVDISC Deterministic LLVM Build Environment
# =============================================================================
#
# This Dockerfile creates a fully deterministic compilation environment for
# LLVM IR targeting Solana's SBFv2 architecture.
#
# DETERMINISM GUARANTEES:
# 1. Base image pinned by digest — no tag drift
# 2. LLVM installed at exact version — no minor version variance
# 3. Locale fixed to C/POSIX — no locale-dependent string sorting
# 4. Timezone fixed to UTC — no timestamp variance
# 5. No debug symbols with timestamps
# 6. SOURCE_DATE_EPOCH set — reproducible-builds standard
# 7. Dual-compilation verification — compile twice, compare hashes
#
# =============================================================================

# Pin base image by digest to prevent silent updates.
# This is Ubuntu 22.04 LTS as of 2024-01-15.
FROM ubuntu@sha256:bbf3d1baa208b7649d1d0264ef7d522e1dc0deeeaaf6085bf8e4618867f03494

# --- Environment Determinism ---
# Fix locale to C to prevent locale-dependent behavior in string
# operations, collation, and compiler diagnostics.
ENV LANG=C
ENV LC_ALL=C
ENV LANGUAGE=C

# Fix timezone to UTC to prevent any time-dependent codegen paths.
ENV TZ=UTC

# SOURCE_DATE_EPOCH: reproducible-builds.org standard.
# Set to a fixed epoch so any tool that embeds timestamps uses this value.
# Value: 2024-01-01T00:00:00Z
ENV SOURCE_DATE_EPOCH=1704067200

# Prevent interactive prompts during apt-get.
ENV DEBIAN_FRONTEND=noninteractive

# --- System Setup ---
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Core build tools
    wget \
    ca-certificates \
    gnupg \
    # Required for LLVM apt repository
    software-properties-common \
    # Hash verification
    coreutils \
    && rm -rf /var/lib/apt/lists/*

# --- LLVM 18.1.0 Installation ---
# Install from official LLVM apt repository for exact version control.
RUN wget -qO- https://apt.llvm.org/llvm-snapshot.gpg.key | gpg --dearmor -o /usr/share/keyrings/llvm-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/llvm-archive-keyring.gpg] http://apt.llvm.org/jammy/ llvm-toolchain-jammy-18 main" \
    > /etc/apt/sources.list.d/llvm.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    llvm-18=1:18.1.0~++20240220095841+390e8324898a-1~exp1~20240220215906.72 \
    clang-18=1:18.1.0~++20240220095841+390e8324898a-1~exp1~20240220215906.72 \
    lld-18=1:18.1.0~++20240220095841+390e8324898a-1~exp1~20240220215906.72 \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/bin/llc-18 /usr/bin/llc \
    && ln -sf /usr/bin/clang-18 /usr/bin/clang \
    && ln -sf /usr/bin/lld-18 /usr/bin/lld \
    && ln -sf /usr/bin/llvm-objcopy-18 /usr/bin/llvm-objcopy

# --- Workspace ---
WORKDIR /build
COPY build.sh /build/build.sh
RUN chmod +x /build/build.sh

# Verify LLVM installation
RUN llc --version | head -3

ENTRYPOINT ["/build/build.sh"]
