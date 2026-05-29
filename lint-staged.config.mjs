export default {
  "*.{ts,js,mjs,cjs}": ["eslint", "prettier --check"],
  "*.{json,yml,yaml,css}": "prettier --check",
  "*.md": (filenames) => {
    const filtered = filenames.filter((f) => !f.includes(".claude/"));
    return filtered.length > 0 ? [`markdownlint-cli2 ${filtered.map((f) => `"${f}"`).join(" ")}`] : [];
  },
  ".prettierrc": "prettier --check",
};
