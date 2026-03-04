use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

/// On-chain record of a deterministic LLVM IR build.
///
/// All fields are fixed-size to ensure predictable account layout.
/// Total size: 32 + 32 + 32 + 16 + 32 + 8 + 1 = 153 bytes
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq)]
pub struct BuildRecord {
    /// SHA-256 hash of the normalized LLVM IR content
    pub ir_hash: [u8; 32],

    /// SHA-256 hash of the compiled output combined with compiler flags
    pub build_hash: [u8; 32],

    /// Compiler version identifier, zero-padded (e.g., b"llc-18.1.0\0...")
    pub compiler_version: [u8; 32],

    /// Optimization level, zero-padded (e.g., b"O2\0...")
    pub optimization_level: [u8; 16],

    /// Public key of the wallet that submitted this record
    pub uploader: Pubkey,

    /// Unix timestamp at the time of registration (from Clock sysvar)
    pub timestamp: i64,

    /// Discriminator flag indicating the account is initialized
    pub is_initialized: bool,
}

impl BuildRecord {
    /// The exact size in bytes of a serialized BuildRecord.
    /// This value MUST be used when creating the PDA account.
    pub const SIZE: usize = 32 + 32 + 32 + 16 + 32 + 8 + 1; // 153 bytes

    /// Seeds used for PDA derivation: ["luvdisc", ir_hash, build_hash]
    pub fn derive_pda(
        ir_hash: &[u8; 32],
        build_hash: &[u8; 32],
        program_id: &Pubkey,
    ) -> (Pubkey, u8) {
        Pubkey::find_program_address(
            &[b"luvdisc", ir_hash.as_ref(), build_hash.as_ref()],
            program_id,
        )
    }
}
