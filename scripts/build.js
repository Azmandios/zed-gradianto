/*
 * Gradianto -> Zed theme converter.
 *
 * Reads the original JetBrains Gradianto theme definitions
 * (src/*.theme.json + src/*.xml) and emits a Zed theme family.
 *
 * Usage: node scripts/build.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const OUT = path.join(ROOT, "themes", "gradianto.json");

/* ------------------------------------------------------------------ */
/* color helpers                                                       */
/* ------------------------------------------------------------------ */

// JetBrains stores colors as bare hex, sometimes short ("6858" = 0x006858),
// sometimes with alpha ("14262694" = RRGGBBAA).
function hx(value, fallback = null) {
  if (!value) return fallback;
  let s = String(value).trim().replace(/^#/, "").toUpperCase();
  if (!/^[0-9A-F]+$/.test(s)) return fallback;
  if (s.length <= 6) s = s.padStart(6, "0");
  else if (s.length === 7) s = "0" + s;
  if (s.length !== 6 && s.length !== 8) return fallback;
  if (s.length === 6) s += "FF";
  return "#" + s;
}

function rgba(color) {
  const s = color.replace("#", "");
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
    parseInt(s.slice(6, 8), 16),
  ];
}

function hex(r, g, b, a = 255) {
  const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b) + c(a);
}

// t = 0 -> a, t = 1 -> b
function mix(a, b, t) {
  const [r1, g1, b1] = rgba(a);
  const [r2, g2, b2] = rgba(b);
  return hex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

function alpha(color, a) {
  const [r, g, b] = rgba(color);
  return hex(r, g, b, a);
}

const lighten = (c, t) => mix(c, "#FFFFFFFF", t);
const darken = (c, t) => mix(c, "#000000FF", t);
// normalize hand-written palette entries to the #RRGGBBAA form used by Zed
const c8 = (c) => (typeof c === "string" && c.length === 7 ? c + "FF" : c);

/* ------------------------------------------------------------------ */
/* JetBrains file parsing                                              */
/* ------------------------------------------------------------------ */

function parseScheme(xml) {
  const colors = {};
  const colorsBlock = xml.match(/<colors>([\s\S]*?)<\/colors>/);
  if (colorsBlock) {
    for (const m of colorsBlock[1].matchAll(/<option\s+name="([^"]+)"\s+value="([^"]*)"/g)) {
      colors[m[1]] = m[2];
    }
  }

  // Small stack based parser for the <attributes> section. The file mixes
  // self-closing tags with nested <value><option .../></value> containers,
  // so a naive regex would swallow neighbouring entries.
  const attrs = {};
  const attrsBlock = xml.match(/<attributes>([\s\S]*?)<\/attributes>/);
  if (attrsBlock) {
    const tagRe = /<option\b([^>]*)>|<\/option>/g;
    const root = { children: [] };
    const stack = [root];
    for (const m of attrsBlock[1].matchAll(tagRe)) {
      if (m[0] === "</option>") {
        if (stack.length > 1) {
          const node = stack.pop();
          stack[stack.length - 1].children.push(node);
        }
        continue;
      }
      const raw = m[1];
      const selfClosing = /\/\s*$/.test(raw);
      const nameMatch = raw.match(/\bname="([^"]*)"/);
      const valueMatch = raw.match(/\bvalue="([^"]*)"/);
      const node = {
        name: nameMatch ? nameMatch[1] : undefined,
        value: valueMatch ? valueMatch[1] : undefined,
        children: [],
      };
      if (selfClosing) stack[stack.length - 1].children.push(node);
      else stack.push(node);
    }
    for (const node of root.children) {
      if (!node.name) continue;
      const values = {};
      for (const child of node.children) {
        if (child.name === "value") {
          for (const inner of child.children) {
            if (inner.name) values[inner.name] = inner.value ?? "";
          }
        } else if (child.name) {
          values[child.name] = child.value ?? "";
        }
      }
      attrs[node.name] = values;
    }
  }
  return { colors, attrs };
}

/* ------------------------------------------------------------------ */
/* theme definitions                                                   */
/* ------------------------------------------------------------------ */

const THEMES = [
  {
    id: "nature-green",
    name: "Gradianto Nature Green",
    appearance: "dark",
    theme: "Gradianto_Nature_Green_new.theme.json",
    scheme: "Gradianto_Nature_Green_new.xml",
    accents: ["#60cf92", "#2ea9aa", "#d07bd2", "#acac58", "#5f93c9", "#bb8f73"],
    selection: "#00695c",
    status: {
      error: "#e91e63",
      warning: "#f49810",
      info: "#5394ec",
      hint: "#56f29c",
      success: "#7edb7f",
      predictive: "#d07bd2",
    },
    ansi: {
      black: "#132623", red: "#c4131e", green: "#60cf92", yellow: "#a6aa43",
      blue: "#518dc6", magenta: "#d07bd2", cyan: "#2ea9aa", white: "#a8afbe",
      brightBlack: "#54806d", brightRed: "#e91e63", brightGreen: "#7edb7f", brightYellow: "#c6c666",
      brightBlue: "#5394ec", brightMagenta: "#c48d9c", brightCyan: "#45bc88", brightWhite: "#cccece",
    },
    syntax: {},
  },
  {
    id: "dark-fuchsia",
    name: "Gradianto Dark Fuchsia",
    appearance: "dark",
    theme: "Gradianto_dark_fuchsia_new.theme.json",
    scheme: "Gradianto_dark_fuchsia_new.xml",
    accents: ["#c07cd6", "#2ea9aa", "#d07bd2", "#a6aa43", "#518dc6", "#bb8f73"],
    selection: "#562c6a",
    status: {
      error: "#e91e63",
      warning: "#be9117",
      info: "#b388ff",
      hint: "#cf98db",
      success: "#7edb7f",
      predictive: "#d07bd2",
    },
    ansi: {
      black: "#1f1624", red: "#e91e63", green: "#7edb7f", yellow: "#a6aa43",
      blue: "#518dc6", magenta: "#d07bd2", cyan: "#2ea9aa", white: "#a8afbe",
      brightBlack: "#54806d", brightRed: "#f06292", brightGreen: "#9be29b", brightYellow: "#c6c666",
      brightBlue: "#5394ec", brightMagenta: "#c48d9c", brightCyan: "#68f296", brightWhite: "#c8ccd0",
    },
    syntax: {},
  },
  {
    id: "deep-ocean",
    name: "Gradianto Deep Ocean",
    appearance: "dark",
    theme: "Gradianto_deep_ocean_new.theme.json",
    scheme: "Gradianto_deep_ocean_new.xml",
    accents: ["#5eb3ff", "#39487e", "#ba77c6", "#75aa5f", "#c6c45e", "#cc844f"],
    selection: "#28509e",
    status: {
      error: "#ef5f7a",
      warning: "#c6a02f",
      info: "#68a2f2",
      hint: "#8ec1ff",
      success: "#83d68d",
      predictive: "#ba77c6",
    },
    ansi: {
      black: "#161c2d", red: "#c74e39", green: "#75aa5f", yellow: "#c6c45e",
      blue: "#8ec1ff", magenta: "#c675b9", cyan: "#6aa59f", white: "#a8afbe",
      brightBlack: "#647f94", brightRed: "#f14c4c", brightGreen: "#83d68d", brightYellow: "#e3d675",
      brightBlue: "#5eb3ff", brightMagenta: "#d670d6", brightCyan: "#29b8db", brightWhite: "#e5e5e5",
    },
    syntax: {
      attribute: "#c6a02f",
    },
  },
  {
    id: "midnight-blue",
    name: "Gradianto Midnight Blue",
    appearance: "dark",
    theme: "Gradianto_midnight_blue_new.theme.json",
    scheme: "Gradianto_midnight_blue_new.xml",
    accents: ["#8769cf", "#5d69bb", "#ebbf8c", "#96bf7d", "#cbbc3a", "#cecb46"],
    selection: "#544092",
    status: {
      error: "#e05c7a",
      warning: "#cbbc3a",
      info: "#a088f2",
      hint: "#cecb46",
      success: "#83d68d",
      predictive: "#8769cf",
    },
    ansi: {
      black: "#1a1a25", red: "#c74e39", green: "#96bf7d", yellow: "#bbb55b",
      blue: "#757db3", magenta: "#ebbf8c", cyan: "#97c9c8", white: "#d8d8d8",
      brightBlack: "#5d69bb", brightRed: "#f14c4c", brightGreen: "#83d68d", brightYellow: "#cbbc3a",
      brightBlue: "#8ea3d0", brightMagenta: "#d78bd0", brightCyan: "#8ec7c4", brightWhite: "#ffffff",
    },
  },
];

/* ------------------------------------------------------------------ */
/* style builder                                                       */
/* ------------------------------------------------------------------ */

function buildTheme(def) {
  const themeJson = JSON.parse(fs.readFileSync(path.join(SRC, def.theme), "utf8"));

  // Some of the "_new" schemes leave attributes undefined and rely on the
  // parent Darcula scheme for them. Merge in the original scheme file so we
  // pick up every color the author actually declared.
  const scheme = parseScheme(fs.readFileSync(path.join(SRC, def.scheme), "utf8"));
  const legacyFile = path.join(SRC, def.scheme.replace(/_new\.xml$/, ".xml"));
  const legacy = fs.existsSync(legacyFile)
    ? parseScheme(fs.readFileSync(legacyFile, "utf8"))
    : { colors: {}, attrs: {} };

  for (const [k, v] of Object.entries(legacy.colors)) {
    if (!(k in scheme.colors)) scheme.colors[k] = v;
  }
  for (const [k, v] of Object.entries(legacy.attrs)) {
    scheme.attrs[k] = { ...v, ...(scheme.attrs[k] || {}) };
  }

  const ui = themeJson.ui || {};
  const base = ui["*"] || {};
  const tabs = ui.EditorTabs || {};
  const tree = ui.Tree || {};
  const popup = ui.Popup || {};
  const scroll = ui.ScrollBar || {};
  const toolWindow = ui.ToolWindow || {};
  const toolbar = ui.MainToolbar || {};
  const progress = ui.ProgressBar || {};
  const notification = ui.Notification || {};
  const match = ui.SearchMatch || {};
  const completion = ui.CompletionPopup || {};
  const link = ui.Link || {};
  const table = ui.Table || {};
  const borders = ui.Borders || {};

  const clr = (name) => hx(scheme.colors[name]);
  const at = (name) => scheme.attrs[name] || {};
  const fg = (name, fallback = null) => hx(at(name).FOREGROUND, fallback);
  const bg = (name, fallback = null) => hx(at(name).BACKGROUND, fallback);
  const fontType = (name) => parseInt(at(name).FONT_TYPE || "0", 10);

  const uiBg = hx(base.background, "#1e1e1e");
  const uiFg = hx(base.foreground, "#cccccc");
  const editorBg = bg("TEXT", clr("CONSOLE_BACKGROUND_KEY") || uiBg);
  const editorFg = fg("TEXT", uiFg);

  const surface = hx(tabs.background, darken(uiBg, 0.15));
  const activeTab = hx(tabs.selectedBackground, hx(base.selectionBackground, lighten(uiBg, 0.2)));
  const selection = hx(base.selectionBackground, lighten(editorBg, 0.25));
  const accent = c8(def.accents[0]);
  const accentAlt = c8(def.accents[1]);

  const border = hx(base.borderColor, darken(uiBg, 0.3));
  const borderVariant = hx(borders.color, hx(base.separatorColor, border));
  const borderFocused = hx(base.focusedBorderColor, accent);
  const borderDisabled = hx(base.disabledBorderColor, darken(border, 0.2));

  const caretRow = clr("CARET_ROW_COLOR") || lighten(editorBg, 0.06);
  const gutterBg = clr("GUTTER_BACKGROUND") || editorBg;
  const lineNumber = clr("LINE_NUMBERS_COLOR") || mix(editorFg, editorBg, 0.45);
  const activeLineNumber = clr("LINE_NUMBER_ON_CARET_ROW_COLOR") || editorFg;
  const indentGuide = clr("INDENT_GUIDE") || mix(editorBg, editorFg, 0.12);
  const indentGuideActive = clr("SELECTED_INDENT_GUIDE") || mix(editorBg, editorFg, 0.25);
  const wrapGuide = clr("RIGHT_MARGIN_COLOR") || mix(editorBg, editorFg, 0.15);

  const muted = mix(editorFg, editorBg, 0.25);
  const placeholder = mix(editorFg, editorBg, 0.45);

  /* --------------------------- UI --------------------------- */

  const style = {
    "background.appearance": "opaque",
    accents: def.accents.map(c8),

    background: uiBg,
    "surface.background": surface,
    "elevated_surface.background": hx(popup.background, lighten(uiBg, 0.04)),

    border,
    "border.variant": borderVariant,
    "border.focused": borderFocused,
    "border.selected": borderFocused,
    "border.transparent": "#00000000",
    "border.disabled": borderDisabled,

    "element.background": gutterBg,
    "element.hover": mix(hx(tabs.hoverMaskColor, lighten(uiBg, 0.08)), uiBg, 0.55),
    "element.active": selection,
    "element.selected": selection,
    "element.disabled": hx(base.disabledBackground, darken(uiBg, 0.1)),
    "drop_target.background": alpha(accent, 0x66),

    "ghost_element.background": "#00000000",
    "ghost_element.hover": mix(hx(tabs.hoverMaskColor, lighten(uiBg, 0.08)), uiBg, 0.55),
    "ghost_element.active": selection,
    "ghost_element.selected": selection,
    "ghost_element.disabled": hx(base.disabledBackground, darken(uiBg, 0.1)),

    text: uiFg,
    "text.muted": muted,
    "text.placeholder": placeholder,
    "text.disabled": hx(base.disabledForeground, placeholder),
    "text.accent": accent,

    icon: uiFg,
    "icon.muted": muted,
    "icon.disabled": hx(base.disabledForeground, placeholder),
    "icon.placeholder": placeholder,
    "icon.accent": accent,

    "status_bar.background": activeTab,
    "title_bar.background": hx((ui.MainToolbar || {}).background, darken(uiBg, 0.08)),
    "title_bar.inactive_background": surface,
    "toolbar.background": hx((ui.MainToolbar || {}).background, surface),

    "tab_bar.background": surface,
    "tab.inactive_background": surface,
    "tab.active_background": activeTab,

    "search.match_background": alpha(hx(match.endBackground, accent), 0x88),
    "search.active_match_background": alpha(hx(match.startBackground, accent), 0xCC),

    "panel.background": hx(tree.background, uiBg),
    "panel.focused_border": borderFocused,
    "panel.indent_guide": indentGuide,
    "panel.indent_guide_active": indentGuideActive,
    "panel.indent_guide_hover": mix(indentGuide, editorFg, 0.2),
    "pane.focused_border": borderFocused,
    "pane_group.border": border,

    "scrollbar.thumb.background": hx(scroll.thumbColor, mix(uiBg, uiFg, 0.25)),
    "scrollbar.thumb.hover_background": hx(scroll.hoverThumbColor, mix(uiBg, uiFg, 0.4)),
    "scrollbar.thumb.border": "#00000000",
    "scrollbar.track.background": "#00000000",
    "scrollbar.track.border": "#00000000",

    "editor.foreground": editorFg,
    "editor.background": editorBg,
    "editor.gutter.background": gutterBg,
    "editor.subheader.background": clr("DOCUMENTATION_COLOR") || surface,
    "editor.active_line.background": alpha(caretRow, 0xCC),
    "editor.highlighted_line.background": alpha(caretRow, 0x99),
    "editor.line_number": lineNumber,
    "editor.active_line_number": activeLineNumber,
    "editor.hover_line_number": mix(lineNumber, editorFg, 0.4),
    "editor.invisible": alpha(indentGuide, 0xCC),
    "editor.wrap_guide": alpha(wrapGuide, 0x33),
    "editor.active_wrap_guide": alpha(wrapGuide, 0x55),
    "editor.indent_guide": indentGuide,
    "editor.indent_guide_active": indentGuideActive,
    "editor.document_highlight.read_background": alpha(accent, 0x22),
    "editor.document_highlight.write_background": alpha(accent, 0x44),
    "editor.document_highlight.bracket_background": alpha(
      fg("MATCHED_BRACE_ATTRIBUTES") || selection,
      0x66
    ),

    "terminal.background": clr("CONSOLE_BACKGROUND_KEY") || editorBg,
    "terminal.foreground": editorFg,
    "terminal.bright_foreground": uiFg,
    "terminal.dim_foreground": muted,

    "link_text.hover": hx(link.hoverForeground, accent),

    ...buildStatusColors(def, uiBg, editorBg),
  };

  // terminal ANSI palette
  const ansi = Object.fromEntries(Object.entries(def.ansi).map(([k, v]) => [k, c8(v)]));
  style["terminal.ansi.black"] = ansi.black;
  style["terminal.ansi.red"] = ansi.red;
  style["terminal.ansi.green"] = ansi.green;
  style["terminal.ansi.yellow"] = ansi.yellow;
  style["terminal.ansi.blue"] = ansi.blue;
  style["terminal.ansi.magenta"] = ansi.magenta;
  style["terminal.ansi.cyan"] = ansi.cyan;
  style["terminal.ansi.white"] = ansi.white;
  style["terminal.ansi.bright_black"] = ansi.brightBlack;
  style["terminal.ansi.bright_red"] = ansi.brightRed;
  style["terminal.ansi.bright_green"] = ansi.brightGreen;
  style["terminal.ansi.bright_yellow"] = ansi.brightYellow;
  style["terminal.ansi.bright_blue"] = ansi.brightBlue;
  style["terminal.ansi.bright_magenta"] = ansi.brightMagenta;
  style["terminal.ansi.bright_cyan"] = ansi.brightCyan;
  style["terminal.ansi.bright_white"] = ansi.brightWhite;
  style["terminal.ansi.dim_black"] = mix(ansi.black, editorBg, 0.35);
  style["terminal.ansi.dim_red"] = mix(ansi.red, editorBg, 0.35);
  style["terminal.ansi.dim_green"] = mix(ansi.green, editorBg, 0.35);
  style["terminal.ansi.dim_yellow"] = mix(ansi.yellow, editorBg, 0.35);
  style["terminal.ansi.dim_blue"] = mix(ansi.blue, editorBg, 0.35);
  style["terminal.ansi.dim_magenta"] = mix(ansi.magenta, editorBg, 0.35);
  style["terminal.ansi.dim_cyan"] = mix(ansi.cyan, editorBg, 0.35);
  style["terminal.ansi.dim_white"] = mix(ansi.white, editorBg, 0.35);
  style["terminal.ansi.background"] = clr("CONSOLE_BACKGROUND_KEY") || editorBg;

  /* ------------------------- syntax ------------------------- */

  const s = (color, opts = {}) => ({ color, ...opts });

  const comment =
    fg("DEFAULT_LINE_COMMENT") || fg("DEFAULT_BLOCK_COMMENT") || mix(editorFg, editorBg, 0.35);
  const docComment = fg("DEFAULT_DOC_COMMENT") || comment;
  const keyword = fg("DEFAULT_KEYWORD") || editorFg;
  const string = fg("DEFAULT_STRING") || editorFg;
  const number = fg("DEFAULT_NUMBER") || fg("DEFAULT_CONSTANT") || editorFg;
  const fn = fg("DEFAULT_FUNCTION_DECLARATION") || fg("DEFAULT_STATIC_METHOD") || editorFg;
  const metadata =
    fg("DEFAULT_METADATA") || fg("DEFAULT_CLASS_NAME") || fg("DEFAULT_KEYWORD") || editorFg;
  const type = fg("DEFAULT_CLASS_NAME") || fg("DEFAULT_INTERFACE_NAME") || metadata;
  const constant =
    fg("DEFAULT_CONSTANT") || fg("DEFAULT_STATIC_FIELD") || fg("DEFAULT_GLOBAL_VARIABLE") || editorFg;
  const variable = fg("DEFAULT_LOCAL_VARIABLE") || fg("DEFAULT_IDENTIFIER") || editorFg;
  const parameter = fg("DEFAULT_PARAMETER") || fg("DEFAULT_IDENTIFIER") || editorFg;
  const property =
    fg("DEFAULT_INSTANCE_FIELD") ||
    fg("INSTANCE_FIELD_ATTRIBUTES") ||
    fg("DEFAULT_GLOBAL_VARIABLE") ||
    fg("DEFAULT_IDENTIFIER") ||
    editorFg;
  const globalVar = fg("DEFAULT_GLOBAL_VARIABLE") || fg("DEFAULT_STATIC_FIELD") || editorFg;
  const tagName = fg("XML_TAG_NAME") || fg("DEFAULT_TAG_NAME") || fg("DEFAULT_TAG") || keyword;
  const namespace = fg("DEFAULT_CLASS_REFERENCE") || fg("DEFAULT_IDENTIFIER") || type;
  const linkText = hx(link.hoverForeground, accent);
  const linkUri = clr("DOC_COMMENT_LINK") || linkText;
  const hint = muted;
  const comma = fg("DEFAULT_COMMA") || fg("DEFAULT_OPERATION_SIGN") || editorFg;
  const semicolon = fg("DEFAULT_SEMICOLON") || editorFg;
  const operator = fg("DEFAULT_OPERATION_SIGN") || comma;
  const escape = fg("DEFAULT_VALID_STRING_ESCAPE") || string;
  const regexp = fg("REGEXP.CHARACTER") || escape;

  const syntax = {
    attribute: s(metadata),
    boolean: s(constant, { font_style: "italic", font_weight: 700 }),
    comment: s(comment, { font_style: "italic" }),
    "comment.doc": s(docComment, { font_style: "italic" }),
    constant: s(constant),
    constructor: s(type),
    embedded: s(editorFg),
    emphasis: s(editorFg, { font_style: "italic" }),
    "emphasis.strong": s(editorFg, { font_weight: 700 }),
    enum: s(type),
    function: s(fn),
    hint: s(hint, { font_style: "italic" }),
    keyword: s(keyword),
    label: s(metadata),
    link_text: s(linkText, { font_style: "italic" }),
    link_uri: s(linkUri),
    namespace: s(namespace),
    number: s(number),
    operator: s(operator),
    predictive: s(muted, { font_style: "italic" }),
    preproc: s(metadata),
    primary: s(editorFg),
    property: s(property),
    punctuation: s(semicolon),
    "punctuation.bracket": s(editorFg),
    "punctuation.delimiter": s(semicolon),
    "punctuation.list_marker": s(accent),
    "punctuation.markup": s(accent),
    "punctuation.special": s(comma),
    selector: s(type),
    "selector.pseudo": s(metadata),
    string: s(string),
    "string.escape": s(escape, { font_weight: 700 }),
    "string.regex": s(regexp),
    "string.special": s(string),
    "string.special.symbol": s(constant),
    tag: s(tagName),
    "text.literal": s(string),
    title: s(type, { font_weight: 700 }),
    type: s(type, { font_weight: 700 }),
    variable: s(variable),
    "variable.parameter": s(parameter),
    "variable.special": s(globalVar),
    variant: s(fg("DEFAULT_STATIC_FIELD") || constant),
    "diff.plus": s(c8(def.status.success)),
    "diff.minus": s(c8(def.status.error)),
  };

  // per-theme corrections for values inherited from the parent scheme
  for (const [key, value] of Object.entries(def.syntax || {})) {
    const prev = syntax[key] || s(editorFg);
    if (value === "text") {
      syntax[key] = s(editorFg, prev.font_weight ? { font_weight: prev.font_weight } : {});
    } else {
      syntax[key] = { ...prev, color: c8(value) };
    }
  }

  style.syntax = syntax;

  // collaboration cursors: reuse palette colors so they look native to the theme
  const playerColors = [accent, c8(def.accents[1]), keyword, fn, string, number, tagName, constant];
  style.players = [];
  const seenPlayers = new Set();
  for (const raw of playerColors) {
    const color = raw.length === 7 ? raw + "FF" : raw;
    if (seenPlayers.has(color.toLowerCase())) continue;
    seenPlayers.add(color.toLowerCase());
    style.players.push({ cursor: color, background: color, selection: alpha(color, 0x3d) });
  }

  return { name: def.name, appearance: def.appearance, style };
}

function buildStatusColors(def, uiBg, editorBg) {
  const error = c8(def.status.error);
  const warning = c8(def.status.warning);
  const info = c8(def.status.info);
  const hint = c8(def.status.hint);
  const success = c8(def.status.success);
  const predictive = c8(def.status.predictive);
  const bgOf = (c) => alpha(c, 0x26);
  const borderOf = (c) => alpha(c, 0x66);
  const dim = mix(error, editorBg, 0.3);

  return {
    error,
    "error.background": bgOf(error),
    "error.border": borderOf(error),
    warning,
    "warning.background": bgOf(warning),
    "warning.border": borderOf(warning),
    info,
    "info.background": bgOf(info),
    "info.border": borderOf(info),
    hint,
    "hint.background": bgOf(hint),
    "hint.border": borderOf(hint),
    success,
    "success.background": bgOf(success),
    "success.border": borderOf(success),
    predictive,
    "predictive.background": bgOf(predictive),
    "predictive.border": borderOf(predictive),
    created: success,
    "created.background": bgOf(success),
    "created.border": borderOf(success),
    deleted: dim,
    "deleted.background": bgOf(dim),
    "deleted.border": borderOf(dim),
    modified: warning,
    "modified.background": bgOf(warning),
    "modified.border": borderOf(warning),
    renamed: info,
    "renamed.background": bgOf(info),
    "renamed.border": borderOf(info),
    conflict: warning,
    "conflict.background": bgOf(warning),
    "conflict.border": borderOf(warning),
    hidden: mix(uiBg, "#ffffff", 0.1),
    "hidden.background": uiBg,
    "hidden.border": borderOf(mix(uiBg, "#ffffff", 0.1)),
    ignored: mix(uiBg, "#ffffff", 0.1),
    "ignored.background": uiBg,
    "ignored.border": borderOf(mix(uiBg, "#ffffff", 0.1)),
    unreachable: mix(uiBg, "#ffffff", 0.1),
    "unreachable.background": uiBg,
    "unreachable.border": borderOf(mix(uiBg, "#ffffff", 0.1)),
    "version_control.added": success,
    "version_control.modified": warning,
    "version_control.deleted": dim,
    "version_control.word_added": alpha(success, 0x66),
    "version_control.word_deleted": alpha(dim, 0x66),
    "version_control.conflict_marker.ours": info,
    "version_control.conflict_marker.theirs": predictive,
  };
}

/* ------------------------------------------------------------------ */
/* main                                                                */
/* ------------------------------------------------------------------ */

const family = {
  $schema: "https://zed.dev/schema/themes/v0.2.0.json",
  name: "Gradianto",
  author: "Port of Gradianto by thvardhan (https://github.com/thvardhan/Gradianto)",
  themes: THEMES.map(buildTheme),
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(family, null, 2) + "\n", "utf8");
console.log("wrote " + path.relative(ROOT, OUT));
for (const t of family.themes) {
  console.log("  " + t.name + " (" + t.appearance + ")");
}
