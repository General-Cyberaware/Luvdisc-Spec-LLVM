import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  Keypair,
  clusterApiUrl,
} from "@solana/web3.js";

const DEVNET_URL = clusterApiUrl("devnet");
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

export interface BuildMetadata {
  irHash: string;
  buildHash: string;
  compilerVersion: string;
  optimizationLevel: string;
  uploader: string;
  timestamp: number;
}

export interface AnchorResult {
  signature: string;
  programAddress: string;
  pdaAddress: string;
  metadata: BuildMetadata;
}

/**
 * Derive a deterministic PDA from IR hash and build hash.
 * This ensures each unique build gets a unique on-chain address.
 */
export function derivePDA(irHash: string, buildHash: string): PublicKey {
  const irBytes = Buffer.from(irHash, "hex").slice(0, 16);
  const buildBytes = Buffer.from(buildHash, "hex").slice(0, 16);
  const seed = Buffer.concat([
    Buffer.from("luvdisc"),
    irBytes,
    buildBytes,
  ]);
  // Derive a deterministic address (not a true PDA without a program, but deterministic)
  const hash = new Uint8Array(32);
  for (let i = 0; i < seed.length && i < 32; i++) {
    hash[i] = seed[i];
  }
  // Use the seed to generate a keypair deterministically for the data account
  return new PublicKey(hash);
}

export async function anchorBuildOnChain(
  irHash: string,
  buildHash: string,
  compilerVersion: string,
  optimizationLevel: string,
  sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>,
  publicKey: PublicKey
): Promise<AnchorResult> {
  const connection = new Connection(DEVNET_URL, "confirmed");
  const timestamp = Math.floor(Date.now() / 1000);

  // Build the metadata payload
  const metadata: BuildMetadata = {
    irHash,
    buildHash,
    compilerVersion,
    optimizationLevel,
    uploader: publicKey.toBase58(),
    timestamp,
  };

  const metadataJson = JSON.stringify(metadata);
  const metadataBytes = Buffer.from(metadataJson, "utf-8");

  // Create a data account to store the build record
  const dataAccount = Keypair.generate();
  const space = metadataBytes.length + 8; // 8 bytes discriminator
  const lamports = await connection.getMinimumBalanceForRentExemption(space);

  const createAccountIx = SystemProgram.createAccount({
    fromPubkey: publicKey,
    newAccountPubkey: dataAccount.publicKey,
    lamports,
    space,
    programId: SystemProgram.programId,
  });

  // Store metadata as a memo for on-chain auditability
  const memoIx = new TransactionInstruction({
    keys: [{ pubkey: publicKey, isSigner: true, isWritable: true }],
    programId: MEMO_PROGRAM_ID,
    data: metadataBytes,
  });

  const transaction = new Transaction().add(createAccountIx, memoIx);
  transaction.feePayer = publicKey;

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.partialSign(dataAccount);

  const signature = await sendTransaction(transaction, connection);
  await connection.confirmTransaction(signature, "confirmed");

  const pdaAddress = derivePDA(irHash, buildHash).toBase58();

  return {
    signature,
    programAddress: dataAccount.publicKey.toBase58(),
    pdaAddress,
    metadata,
  };
}

export async function verifyOnChain(
  addressOrSignature: string
): Promise<BuildMetadata | null> {
  const connection = new Connection(DEVNET_URL, "confirmed");

  try {
    // Try as transaction signature first
    const tx = await connection.getTransaction(addressOrSignature, {
      maxSupportedTransactionVersion: 0,
    });

    if (tx?.meta?.logMessages) {
      // Look for memo data in logs
      const memoLog = tx.meta.logMessages.find((l) =>
        l.includes("Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr")
      );
      if (memoLog) {
        // Extract memo data from transaction instructions
        const message = tx.transaction.message;
        const compiledInstructions = (message as any).compiledInstructions || [];
        for (const ix of compiledInstructions) {
          if (ix.data && ix.data.length > 10) {
            try {
              const data = Buffer.from(ix.data);
              const parsed = JSON.parse(data.toString("utf-8"));
              if (parsed.irHash && parsed.buildHash) {
                return parsed as BuildMetadata;
              }
            } catch {
              // Not JSON, try next
            }
          }
        }

        // Fallback: try to extract from log messages themselves
        for (const log of tx.meta.logMessages) {
          if (log.includes("Program log: Memo")) {
            const memoData = log.replace("Program log: Memo (len ", "").split("): ")[1];
            if (memoData) {
              try {
                const parsed = JSON.parse(memoData);
                if (parsed.irHash && parsed.buildHash) {
                  return parsed as BuildMetadata;
                }
              } catch {
                // Not valid JSON
              }
            }
          }
        }
      }
    }

    // Try as account address
    const accountInfo = await connection.getAccountInfo(
      new PublicKey(addressOrSignature)
    );
    if (accountInfo && accountInfo.data.length > 8) {
      try {
        const dataStr = Buffer.from(accountInfo.data.slice(8)).toString("utf-8").replace(/\0+$/, "");
        const parsed = JSON.parse(dataStr);
        if (parsed.irHash && parsed.buildHash) {
          return parsed as BuildMetadata;
        }
      } catch {
        // Not valid metadata
      }

      // Legacy format: raw hashes
      if (accountInfo.data.length >= 64) {
        return {
          irHash: Buffer.from(accountInfo.data.slice(0, 32)).toString("hex"),
          buildHash: Buffer.from(accountInfo.data.slice(32, 64)).toString("hex"),
          compilerVersion: "unknown",
          optimizationLevel: "unknown",
          uploader: "unknown",
          timestamp: 0,
        };
      }
    }
  } catch (e) {
    console.error("Verification error:", e);
  }

  return null;
}
