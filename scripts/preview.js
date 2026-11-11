/* Renders themes/gradianto.json into a static HTML mock so the palette can be
 * eyeballed without launching the editor.
 *
 * Usage: node scripts/preview.js  ->  preview.html
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const family = JSON.parse(fs.readFileSync(path.join(root, "themes", "gradianto.json"), "utf8"));

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function code(style) {
  const s = style.syntax;
  const c = (k) => (s[k] ? s[k].color : style["editor.foreground"]);
  const f = (k) => {
    const v = s[k] || {};
    return `${v.font_style === "italic" ? "font-style:italic;" : ""}${
      v.font_weight ? `font-weight:${v.font_weight};` : ""
    }`;
  };
  const span = (k, text) => `<span style="color:${c(k)};${f(k)}">${esc(text)}</span>`;

  return `<pre style="margin:0;color:${style["editor.foreground"]};font:14px/1.6 'Cascadia Code',Consolas,monospace">
${span("comment", "// Gradianto theme for Zed")}
${span("comment.doc", "/** Nature, ocean, midnight and fuchsia gradients. */")}

${span("keyword", "import")} { ${span("variable", "createServer")} } ${span("keyword", "from")} ${span("string", "'node:http'")};

${span("keyword", "interface")} ${span("type", "Theme")} {
  ${span("property", "name")}${span("punctuation", ":")} ${span("type", "string")};
  ${span("property", "colors")}${span("punctuation", ":")} ${span("type", "string")}${span("punctuation.bracket", "[]")};
}

${span("keyword", "const")} ${span("variable", "accent")} ${span("operator", "=")} ${span("string", "'#60cf92'")};
${span("keyword", "const")} ${span("variable", "count")} ${span("operator", "=")} ${span("number", "42")};
${span("keyword", "const")} ${span("variable", "enabled")} ${span("operator", "=")} ${span("boolean", "true")};
${span("keyword", "const")} ${span("variable", "pattern")} ${span("operator", "=")} ${span("string.regex", "/^grad(ient|ianto)$/i")};

${span("keyword", "export")} ${span("keyword", "async")} ${span("keyword", "function")} ${span("function", "loadTheme")}${span("punctuation.bracket", "(")}${span("variable.parameter", "id")}${span("punctuation", ":")} ${span("type", "string")}${span("punctuation.bracket", ")")} {
  ${span("keyword", "const")} ${span("variable", "theme")} ${span("operator", "=")} ${span("keyword", "await")} ${span("function", "fetch")}${span("punctuation.bracket", "(")}${span("string", "`/api/themes/${id}`")}${span("punctuation.bracket", ")")};
  ${span("keyword", "return")} ${span("variable", "theme")}${span("punctuation", ";")}
}

${span("comment", "# install and run")}
${span("variable", "npm")} ${span("variable", "install")} ${span("operator", "&&")} ${span("variable", "zed")} ${span("string", ".")}
</pre>`;
}

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box} body{margin:0;background:#111;font-family:'Segoe UI',sans-serif}
  .wrap{display:flex;flex-direction:column;gap:24px;padding:24px}
  .card{border-radius:10px;overflow:hidden;box-shadow:0 8px 30px #0008}
  .titlebar{display:flex;align-items:center;gap:10px;padding:8px 14px;font-size:12px}
  .tabs{display:flex;gap:2px;padding:0 10px;font-size:12px}
  .tab{padding:7px 16px;border-radius:6px 6px 0 0}
  .body{display:flex;min-height:430px}
  .side{width:210px;padding:12px;font-size:12px;line-height:1.9}
  .side div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .editor{flex:1;display:flex}
  .gutter{width:52px;text-align:right;padding:14px 10px 14px 0;font:14px/1.6 Consolas,monospace}
  .code{flex:1;padding:14px 18px 14px 0;overflow:hidden}
  .status{display:flex;justify-content:space-between;padding:6px 14px;font-size:12px}
  .label{font:600 13px 'Segoe UI';padding:0 0 6px 24px;color:#ddd}
</style></head><body><div class="wrap">
${family.themes
  .map((t) => {
    const s = t.style;
    return `<div class="card">
  <div class="titlebar" style="background:${s["title_bar.background"]};color:${s.text}">
    <span>● ${esc(t.name)}</span>
    <span style="margin-left:auto;color:${s["text.muted"]}">Gradianto</span>
  </div>
  <div class="tabs" style="background:${s["tab_bar.background"]}">
    <div class="tab" style="background:${s["tab.active_background"]};color:${s.text}">theme.ts</div>
    <div class="tab" style="color:${s["text.muted"]}">server.ts</div>
    <div class="tab" style="color:${s["text.muted"]}">README.md</div>
  </div>
  <div class="body">
    <div class="side" style="background:${s["panel.background"]};color:${s.text}">
      <div style="color:${s["text.muted"]};font-size:11px;letter-spacing:.08em">PROJECT</div>
      <div>▾ src</div>
      <div style="padding-left:12px;color:${s["text.accent"]}">theme.ts</div>
      <div style="padding-left:12px">server.ts</div>
      <div style="padding-left:12px;color:${s["text.muted"]}">types.d.ts</div>
      <div>▾ tests</div>
      <div style="padding-left:12px">theme.test.ts</div>
      <div style="margin-top:14px;color:${s["text.muted"]};font-size:11px;letter-spacing:.08em">GIT</div>
      <div style="color:${s["status.success"]}">M theme.ts</div>
      <div style="color:${s.modified}">M server.ts</div>
    </div>
    <div class="editor" style="background:${s["editor.background"]}">
      <div class="gutter" style="background:${s["editor.gutter.background"]};color:${s["editor.line_number"]}">1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9<br>10<br>11<br>12<br>13<br>14<br>15<br>16<br>17<br>18<br>19<br>20</div>
      <div class="code" style="background:${s["editor.background"]}">${code(s)}</div>
    </div>
  </div>
  <div class="status" style="background:${s["status_bar.background"]};color:${s.text}">
    <span>⎇ main</span><span>TypeScript · UTF-8 · Gradianto</span>
  </div>
</div>`;
  })
  .join("\n")}
</div></body></html>`;

fs.writeFileSync(path.join(root, "preview.html"), html, "utf8");
console.log("wrote preview.html");
