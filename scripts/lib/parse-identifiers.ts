import { readFileSync } from "node:fs";

export const IDENTIFIERS_JAVA_URL =
  "https://raw.githubusercontent.com/hal/foundation/main/resources/src/main/java/org/jboss/hal/resources/Identifiers.java";

export const GENERATED_IDENTIFIERS_PATH = "src/selectors/identifiers.ts";

// ------------------------------------------------------ types

export interface ParsedConstant {
  readonly name: string;
  readonly value: string;
}

export interface ParsedIdentifiers {
  readonly constants: readonly ParsedConstant[];
  readonly hasBuild: boolean;
  readonly hasFromTemplate: boolean;
}

// ------------------------------------------------------ fetch

export async function fetchIdentifiersJava(): Promise<string> {
  const response = await fetch(IDENTIFIERS_JAVA_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch Identifiers.java: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

// ------------------------------------------------------ parse

export function parseIdentifiersJava(source: string): ParsedIdentifiers {
  const constants: ParsedConstant[] = [];

  const constantRegex = /String\s+([A-Z][A-Z0-9_]*)\s*=\s*"([^"]+)"\s*;/g;
  let match;
  while ((match = constantRegex.exec(source)) !== null) {
    constants.push({ name: match[1], value: match[2] });
  }

  const hasBuild = /static\s+String\s+build\s*\(/.test(source);
  const hasFromTemplate = /static\s+String\s+fromTemplate\s*\(/.test(source);

  return { constants, hasBuild, hasFromTemplate };
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
