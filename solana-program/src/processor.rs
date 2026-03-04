use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    clock::Clock,
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
};

use crate::error::LuvdiscError;
use crate::instruction::LuvdiscInstruction;
use crate::state::BuildRecord;

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = LuvdiscInstruction::try_from_slice(instruction_data)
        .map_err(|_| LuvdiscError::InvalidInstructionData)?;

    match instruction {
        LuvdiscInstruction::RegisterBuild {
            ir_hash,
            build_hash,
            compiler_version,
            optimization_level,
        } => process_register_build(
            program_id,
            accounts,
            ir_hash,
            build_hash,
            compiler_version,
            optimization_level,
        ),
        LuvdiscInstruction::GetBuild => {
            msg!("GetBuild: Use getAccountInfo RPC to read PDA data directly.");
            Ok(())
        }
    }
}

fn process_register_build(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    ir_hash: [u8; 32],
    build_hash: [u8; 32],
    compiler_version: [u8; 32],
    optimization_level: [u8; 16],
) -> ProgramResult {
    let account_iter = &mut accounts.iter();

    // 0. Uploader (signer, writable) — pays for account creation
    let uploader = next_account_info(account_iter)?;
    if !uploader.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // 1. PDA account (writable) — will store the BuildRecord
    let pda_account = next_account_info(account_iter)?;

    // 2. System Program
    let system_program = next_account_info(account_iter)?;

    // 3. Clock Sysvar (not strictly needed as account with newer runtime,
    //    but included for maximum compatibility)
    let _clock_sysvar = next_account_info(account_iter)?;

    // Derive and validate PDA
    let (expected_pda, bump_seed) =
        BuildRecord::derive_pda(&ir_hash, &build_hash, program_id);

    if expected_pda != *pda_account.key {
        msg!("Error: Derived PDA does not match provided account");
        return Err(LuvdiscError::InvalidPDA.into());
    }

    // Check if account already exists (non-zero data means initialized)
    if !pda_account.data_is_empty() {
        msg!("Error: Build record already exists for this hash pair");
        return Err(LuvdiscError::RecordAlreadyExists.into());
    }

    // Calculate rent-exempt minimum
    let rent = Rent::get()?;
    let space = BuildRecord::SIZE;
    let lamports = rent.minimum_balance(space);

    // Create the PDA account via CPI with signed seeds
    let seeds: &[&[u8]] = &[
        b"luvdisc",
        ir_hash.as_ref(),
        build_hash.as_ref(),
        &[bump_seed],
    ];

    invoke_signed(
        &system_instruction::create_account(
            uploader.key,
            pda_account.key,
            lamports,
            space as u64,
            program_id,
        ),
        &[
            uploader.clone(),
            pda_account.clone(),
            system_program.clone(),
        ],
        &[seeds],
    )?;

    // Get timestamp from Clock sysvar
    let clock = Clock::get()?;

    // Construct and serialize the record
    let record = BuildRecord {
        ir_hash,
        build_hash,
        compiler_version,
        optimization_level,
        uploader: *uploader.key,
        timestamp: clock.unix_timestamp,
        is_initialized: true,
    };

    record.serialize(&mut *pda_account.data.borrow_mut())?;

    msg!("LUVDISC: Build registered successfully");
    msg!("  PDA: {}", pda_account.key);
    msg!("  Uploader: {}", uploader.key);
    msg!("  Timestamp: {}", clock.unix_timestamp);

    Ok(())
}
