import { readFileSync } from "node:fs";

export const IDS_JAVA_URL =
  "https://raw.githubusercontent.com/hal/foundation/main/resources/src/main/java/org/jboss/hal/resources/OuiaIds.java";

export const GENERATED_IDS_PATH = "src/selectors/ids.ts";

// ------------------------------------------------------ types

export interface ParsedConstant {
  readonly name: string;
  readonly value: string;
}

export interface ParsedParam {
  readonly type: string;
  readonly name: string;
  readonly varargs: boolean;
}

export interface ParsedMethod {
  readonly name: string;
  readonly params: readonly ParsedParam[];
  readonly buildArgs: readonly string[];
}

export interface ParsedIds {
  readonly constants: readonly ParsedConstant[];
  readonly methods: readonly ParsedMethod[];
}

// ------------------------------------------------------ fetch

export async function fetchIdsJava(): Promise<string> {
  const response = await fetch(IDS_JAVA_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch OuiaIds.java: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

// ------------------------------------------------------ parse

export function parseIdsJava(source: string): ParsedIds {
  const constants: ParsedConstant[] = [];
  const methods: ParsedMethod[] = [];

  const constantRegex = /String\s+([A-Z][A-Z0-9_]*)\s*=\s*"([^"]+)"\s*;/g;
  let match;
  while ((match = constantRegex.exec(source)) !== null) {
    constants.push({ name: match[1], value: match[2] });
  }

  const methodRegex = /static\s+String\s+(\w+)\s*\(([^)]*)\)\s*\{([^}]+)\}/g;
  while ((match = methodRegex.exec(source)) !== null) {
    const methodName = match[1];
    const paramsStr = match[2].trim();
    const body = match[3].trim();

    const params: ParsedParam[] = paramsStr
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .map((p) => {
        const parts = p.split(/\s+/);
        const type = parts[0];
        const name = parts[1];
        const varargs = type.endsWith("...");
        return { type, name, varargs };
      });

    const buildCallRegex = /Id\.build\(([^)]+)\)/;
    const buildMatch = buildCallRegex.exec(body);
    if (buildMatch) {
      const args = buildMatch[1].split(",").map((a) => a.trim());
      methods.push({ name: methodName, params, buildArgs: args });
    }
  }

  return { constants, methods };
}

// ------------------------------------------------------ local state

export function readLocalConstants(filePath: string): readonly string[] {
  try {
    const content = readFileSync(filePath, "utf-8");
    const names: string[] = [];
    const regex = /export const ([A-Z][A-Z0-9_]*)\s*=/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      names.push(match[1]);
    }
    return names;
  } catch {
    return [];
  }
}
