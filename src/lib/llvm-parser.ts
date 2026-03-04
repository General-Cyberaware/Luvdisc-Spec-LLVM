export interface LLVMMetadata {
  moduleName: string;
  targetTriple: string;
  functionCount: number;
  functions: string[];
  sourceFilename: string;
  dataLayout: string;
  rawContent: string;
}

export function parseLLVMIR(content: string): LLVMMetadata {
  const moduleMatch = content.match(/; ModuleID = '([^']+)'/);
  const targetMatch = content.match(/target triple = "([^"]+)"/);
  const sourceMatch = content.match(/source_filename = "([^"]+)"/);
  const dataLayoutMatch = content.match(/target datalayout = "([^"]+)"/);

  const functionMatches = content.matchAll(/define\s+(?:[\w\s*%]+)\s+@([\w$.]+)\s*\(/g);
  const functions = Array.from(functionMatches).map((m) => m[1]);

  return {
    moduleName: moduleMatch?.[1] ?? "unknown",
    targetTriple: targetMatch?.[1] ?? "unknown",
    functionCount: functions.length,
    functions,
    sourceFilename: sourceMatch?.[1] ?? "unknown",
    dataLayout: dataLayoutMatch?.[1] ?? "unknown",
    rawContent: content,
  };
}

export async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function computeBuildHash(
  irContent: string,
  compilerVersion: string = "llc-18.1.0",
  targetArch: string = "sbfv2",
  optimizationLevel: string = "O2"
): Promise<string> {
  const combined = `${irContent}\n---COMPILER---\n${compilerVersion}\n---TARGET---\n${targetArch}\n---OPT---\n${optimizationLevel}`;
  return hashContent(combined);
}
