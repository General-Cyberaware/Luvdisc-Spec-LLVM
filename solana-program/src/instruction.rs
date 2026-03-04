use borsh::{BorshDeserialize, BorshSerialize};

/// Instruction variants for the LUVDISC registry program.
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub enum LuvdiscInstruction {
    /// Register a new deterministic build on-chain.
    ///
    /// Accounts expected:
    ///   0. `[signer, writable]` Uploader (payer)
    ///   1. `[writable]`         PDA account (derived from ir_hash + build_hash)
    ///   2. `[]`                 System Program
    ///   3. `[]`                 Clock Sysvar
    RegisterBuild {
        ir_hash: [u8; 32],
        build_hash: [u8; 32],
        compiler_version: [u8; 32],
        optimization_level: [u8; 16],
    },

    /// Read a build record from a PDA. This is a no-op instruction;
    /// clients should use `getAccountInfo` RPC to read data directly.
    /// Included for completeness and future extensibility.
    ///
    /// Accounts expected:
    ///   0. `[]` PDA account
    GetBuild,
}
