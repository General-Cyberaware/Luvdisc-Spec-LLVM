use solana_program::program_error::ProgramError;
use thiserror::Error;

#[derive(Error, Debug, Copy, Clone)]
pub enum LuvdiscError {
    #[error("Build record already exists for this IR hash and build hash pair")]
    RecordAlreadyExists,

    #[error("Invalid instruction data")]
    InvalidInstructionData,

    #[error("Account not initialized")]
    AccountNotInitialized,

    #[error("Derived PDA does not match the provided account")]
    InvalidPDA,

    #[error("Insufficient account size for BuildRecord")]
    InsufficientAccountSize,
}

impl From<LuvdiscError> for ProgramError {
    fn from(e: LuvdiscError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
