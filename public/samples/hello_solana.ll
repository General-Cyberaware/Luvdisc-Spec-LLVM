; ModuleID = 'hello_solana.c'
source_filename = "hello_solana.c"
target datalayout = "e-m:e-p:64:64-i64:64-n32:64-S128"
target triple = "sbf-solana-solana"

@.str = private unnamed_addr constant [14 x i8] c"Hello, Solana!\00", align 1

define dso_local i64 @entrypoint(i8* %input) #0 {
entry:
  %input.addr = alloca i8*, align 8
  store i8* %input, i8** %input.addr, align 8
  %0 = call i64 @sol_log_(i8* getelementptr inbounds ([14 x i8], [14 x i8]* @.str, i64 0, i64 0), i64 13)
  ret i64 0
}

declare i64 @sol_log_(i8*, i64)

define dso_local i64 @process_instruction(i8* %program_id, i8** %accounts, i64 %num_accounts, i8* %data, i64 %data_len) #0 {
entry:
  %result = call i64 @entrypoint(i8* %data)
  ret i64 %result
}

attributes #0 = { noinline nounwind optnone "frame-pointer"="all" }

!llvm.module.flags = !{!0}
!0 = !{i32 1, !"wchar_size", i32 4}
