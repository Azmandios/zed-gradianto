/* Lightweight validation for the generated Zed theme. */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const family = JSON.parse(fs.readFileSync(path.join(root, "themes", "gradianto.json"), "utf8"));
const keys = JSON.parse(fs.readFileSync(path.join(root, "schema", "theme-keys.json"), "utf8"));

const allowed = new Set(keys.style);
const allowedSyntax = new Set(keys.syntax);

const colorRe = /^#[0-9a-fA-F]{8}$/;
let errors = 0;

for (const theme of family.themes) {
  const where = theme.name;
  for (const [key, value] of Object.entries(theme.style)) {
    if (key === "syntax" || key === "players" || key === "accents" || key === "background.appearance") continue;
    if (!allowed.has(key)) {
      console.warn(`[${where}] unknown style key: ${key}`);
      errors++;
    }
    if (typeof value === "string" && !colorRe.test(value)) {
      console.warn(`[${where}] bad color for ${key}: ${value}`);
      errors++;
    }
  }
  for (const [key, value] of Object.entries(theme.style.syntax)) {
    if (!allowedSyntax.has(key)) {
      console.warn(`[${where}] unknown syntax key: ${key}`);
      errors++;
    }
    if (!colorRe.test(value.color)) {
      console.warn(`[${where}] bad syntax color for ${key}: ${value.color}`);
      errors++;
    }
    for (const k of Object.keys(value)) {
      if (!["color", "font_style", "font_weight", "background_color", "underline"].includes(k)) {
        console.warn(`[${where}] unknown syntax property ${key}.${k}`);
        errors++;
      }
    }
  }
  if (!["dark", "light"].includes(theme.appearance)) {
    console.warn(`[${where}] bad appearance`);
    errors++;
  }
}

const names = family.themes.map((t) => t.name);
if (new Set(names).size !== names.length) {
  console.warn("duplicate theme names");
  errors++;
}

if (errors) {
  console.error(`\n${errors} problem(s) found`);
  process.exit(1);
}
console.log(`OK: ${family.themes.length} themes, ${Object.keys(family.themes[0].style).length} style keys`);
