import type { ParsedIds, ParsedMethod, ParsedParam } from "./parse-ids.js";

function emitMethod(lines: string[], { name, params, buildArgs }: ParsedMethod): void {
  const paramNames = new Set(params.map((p: ParsedParam) => p.name));
  const varargsParam = params.find((p: ParsedParam) => p.varargs);
  const tsParams = params
    .map((p: ParsedParam) => (p.varargs ? `...${p.name}: string[]` : `${p.name}: string`))
    .join(", ");
  const tsArgs = buildArgs
    .map((arg) => {
      const trimmed = arg.replace(/^"|"$/g, "");
      if (arg.startsWith('"')) return arg;
      if (paramNames.has(arg)) {
        return params.find((p: ParsedParam) => p.name === arg)?.varargs ? `...${arg}` : arg;
      }
      if (varargsParam) {
        const nonVarargsParams = params.filter((p: ParsedParam) => !p.varargs).map((p: ParsedParam) => p.name);
        return [...nonVarargsParams, `...${varargsParam.name}`].join(", ");
      }
      return trimmed;
    })
    .join(", ");
  lines.push(`export function ${name}(${tsParams}): string {`);
  lines.push(`  return buildId(${tsArgs});`);
  lines.push("}");
  lines.push("");
}

export function emitTypeScript({ constants, methods }: ParsedIds): string {
  const lines: string[] = [
    "// Generated from OuiaIds.java — do not edit. Run pnpm sync:ouia to regenerate.",
    "",
    "// ------------------------------------------------------ ID builder",
    "",
    "function asId(text: string): string | null {",
    "  const parts = text.split(/[-\\s]/);",
    "  const sanitized: string[] = [];",
    "  for (const part of parts) {",
    "    if (part) {",
    '      let s = part.replaceAll(/\\s+/g, "");',
    '      s = s.replaceAll(/[^a-zA-Z0-9\\-_]/g, "");',
    '      s = s.replaceAll("_", "-");',
    "      if (s.length > 0) {",
    "        sanitized.push(s);",
    "      }",
    "    }",
    "  }",
    "  if (sanitized.length === 0) {",
    "    return null;",
    "  }",
    "  return sanitized",
    "    .filter((s) => s && s.trim().length > 0)",
    "    .map((s) => s.toLowerCase())",
    '    .join("-");',
    "}",
    "",
    "export function buildId(id: string, ...additionalIds: string[]): string {",
    "  if (!id || id.trim().length === 0) {",
    '    throw new Error("ID must not be null or empty.");',
    "  }",
    "  const ids: string[] = [id];",
    "  for (const additionalId of additionalIds) {",
    "    if (additionalId && additionalId.trim().length !== 0) {",
    "      ids.push(additionalId);",
    "    }",
    "  }",
    "  return ids",
    "    .map(asId)",
    "    .filter((s): s is string => s !== null)",
    '    .join("-");',
    "}",
  ];

  if (constants.length > 0) {
    lines.push("");
    lines.push("// ------------------------------------------------------ static IDs");
    lines.push("");
    const sorted = [...constants].sort((a, b) => a.name.localeCompare(b.name));
    for (const { name, value } of sorted) {
      lines.push(`export const ${name} = "${value}";`);
    }
  }

  if (methods.length > 0) {
    lines.push("");
    lines.push("// ------------------------------------------------------ dynamic IDs");
    lines.push("");
    for (const method of methods) {
      emitMethod(lines, method);
    }
  }

  return lines.join("\n") + "\n";
}
