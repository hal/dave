import type { ParsedIdentifiers } from "./parse-identifiers.js";

export function emitTypeScript({ constants, hasBuild, hasFromTemplate }: ParsedIdentifiers): string {
  const lines: string[] = [
    "// Generated from Identifiers.java — do not edit. Run pnpm sync:identifiers to regenerate.",
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
  ];

  if (hasBuild) {
    lines.push("");
    lines.push("export function buildIdentifier(id: string, ...additionalIds: string[]): string {");
    lines.push("  if (!id || id.trim().length === 0) {");
    lines.push('    throw new Error("ID must not be null or empty.");');
    lines.push("  }");
    lines.push("  const ids: string[] = [id];");
    lines.push("  for (const additionalId of additionalIds) {");
    lines.push("    if (additionalId && additionalId.trim().length !== 0) {");
    lines.push("      ids.push(additionalId);");
    lines.push("    }");
    lines.push("  }");
    lines.push("  return ids");
    lines.push("    .map(asId)");
    lines.push("    .filter((s): s is string => s !== null)");
    lines.push('    .join("-");');
    lines.push("}");
  }

  if (hasFromTemplate) {
    lines.push("");
    lines.push("export function fromTemplate(template: string): string {");
    lines.push("  if (!template || template.length === 0) {");
    lines.push('    return "root";');
    lines.push("  }");
    lines.push("  const safeTemplate = template");
    lines.push('    .replaceAll("/", "-s-")');
    lines.push('    .replaceAll("=", "-e-")');
    lines.push('    .replaceAll(":", "-c-")');
    lines.push('    .replaceAll("*", "-w-");');
    lines.push("  return buildIdentifier(safeTemplate);");
    lines.push("}");
  }

  if (constants.length > 0) {
    lines.push("");
    lines.push("// ------------------------------------------------------ static identifiers");
    lines.push("");
    const sorted = [...constants].sort((a, b) => a.name.localeCompare(b.name));
    for (const { name, value } of sorted) {
      lines.push(`export const ${name} = "${value}";`);
    }
  }

  return lines.join("\n") + "\n";
}
