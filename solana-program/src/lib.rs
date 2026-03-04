pub mod error;
pub mod instruction;
pub mod processor;
pub mod state;

use solana_program::entrypoint;

entrypoint!(processor::process_instruction);
