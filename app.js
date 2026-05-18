(function () {
  "use strict";
  const WEB_EDITOR_BUILD = "2026-05-18T15:04+08:00";
  console.info("[web-editor] app.js loaded", WEB_EDITOR_BUILD);

  const MAGIC = "F5AQR1";
  const MAX_CHUNK_BYTES = 1500;
  const TRANSFER_TYPE_LAYOUT = "L";
  const LONG_IMAGE_QR_SIZE = 768;
  const LONG_IMAGE_PAGE_PADDING = 24;
  const LONG_IMAGE_TEXT_SIZE = 22;
  const LONG_IMAGE_TEXT_GAP = 12;
  const DEFAULT_SUBMODE = "default";
  const META_KEY = "__meta__";
  const HEIGHT_KEY = "keyboard_height_percent";

  const defaultLayout = {
    default: [
      [
        { type: "AlphabetKey", main: "Q", alt: "1", weight: 0.1 },
        { type: "AlphabetKey", main: "W", alt: "2", weight: 0.1 },
        { type: "AlphabetKey", main: "E", alt: "3", weight: 0.1 },
        { type: "AlphabetKey", main: "R", alt: "4", weight: 0.1 },
        { type: "AlphabetKey", main: "T", alt: "5", weight: 0.1 },
        { type: "AlphabetKey", main: "Y", alt: "6", weight: 0.1 },
        { type: "AlphabetKey", main: "U", alt: "7", weight: 0.1 },
        { type: "AlphabetKey", main: "I", alt: "8", weight: 0.1 },
        { type: "AlphabetKey", main: "O", alt: "9", weight: 0.1 },
        { type: "AlphabetKey", main: "P", alt: "0", weight: 0.1 }
      ],
      [
        { type: "AlphabetKey", main: "A", alt: "@", weight: 0.1 },
        { type: "AlphabetKey", main: "S", alt: "*", weight: 0.1 },
        { type: "AlphabetKey", main: "D", alt: "+", weight: 0.1 },
        { type: "AlphabetKey", main: "F", alt: "-", weight: 0.1 },
        { type: "AlphabetKey", main: "G", alt: "=", weight: 0.1 },
        { type: "AlphabetKey", main: "H", alt: "/", weight: 0.1 },
        { type: "AlphabetKey", main: "J", alt: "#", weight: 0.1 },
        { type: "AlphabetKey", main: "K", alt: "(", weight: 0.1 },
        { type: "AlphabetKey", main: "L", alt: ")", weight: 0.1 }
      ],
      [
        { type: "CapsKey", weight: 0.15 },
        { type: "AlphabetKey", main: "Z", alt: "'", weight: 0.1 },
        { type: "AlphabetKey", main: "X", alt: ":", weight: 0.1 },
        { type: "AlphabetKey", main: "C", alt: "\"", weight: 0.1 },
        { type: "AlphabetKey", main: "V", alt: "?", weight: 0.1 },
        { type: "AlphabetKey", main: "B", alt: "!", weight: 0.1 },
        { type: "AlphabetKey", main: "N", alt: "~", weight: 0.1 },
        { type: "AlphabetKey", main: "M", alt: "\\", weight: 0.1 },
        { type: "BackspaceKey", weight: 0.15 }
      ],
      [
        { type: "LayoutSwitchKey", label: "?123", subLabel: "", weight: 0.15 },
        { type: "CommaKey", weight: 0.1 },
        { type: "LanguageKey", weight: 0.1 },
        { type: "SpaceKey", weight: 0.4 },
        { type: "SymbolKey", label: ".", weight: 0.1 },
        { type: "ReturnKey", weight: 0.15 }
      ]
    ]
  };

  const keyTypes = [
    "AlphabetKey", "CapsKey", "LayoutSwitchKey", "CommaKey", "LanguageKey",
    "SpaceKey", "SymbolKey", "ReturnKey", "BackspaceKey", "MacroKey"
  ];

  const keyColorFields = [
    { customKey: "textColor", monetKey: "textColorMonet", label: "文字颜色" },
    { customKey: "altTextColor", monetKey: "altTextColorMonet", label: "副文字颜色", supportedTypes: new Set(["AlphabetKey", "MacroKey"]) },
    { customKey: "backgroundColor", monetKey: "backgroundColorMonet", label: "背景颜色" },
    { customKey: "shadowColor", monetKey: "shadowColorMonet", label: "阴影颜色" }
  ];
  const themeColorTokens = [
    "backgroundColor", "barColor", "keyboardColor", "keyBackgroundColor", "keyTextColor",
    "candidateTextColor", "candidateLabelColor", "candidateCommentColor", "altKeyBackgroundColor",
    "altKeyTextColor", "accentKeyBackgroundColor", "accentKeyTextColor", "keyPressHighlightColor",
    "keyShadowColor", "popupBackgroundColor", "popupTextColor", "spaceBarColor", "dividerColor",
    "clipboardEntryColor", "genericActiveBackgroundColor", "genericActiveForegroundColor"
  ];
  const monetResourceIds = buildMonetResourceIds();
  const macroStepTypes = ["tap", "shortcut", "edit", "app", "layer", "down", "up", "text"];
  const macroStepTypeLabels = {
    tap: "点击按键",
    shortcut: "快捷键",
    edit: "编辑操作",
    app: "应用动作",
    layer: "切层动作",
    down: "按下按键",
    up: "释放按键",
    text: "输入文本"
  };
  const macroEditActions = ["copy", "cut", "paste", "selectAll", "undo", "redo"];
  const macroEditActionLabels = {
    copy: "复制",
    cut: "剪切",
    paste: "粘贴",
    selectAll: "全选",
    undo: "撤销",
    redo: "重做"
  };
  const macroLayerModeLabels = { to: "切换到层", osl: "单次层" };
  const macroAppActions = [
    "theme", "virtual_keyboard", "more", "browse_user_data_dir", "clipboard",
    "cursor_move", "floating_toggle", "language_switch", "reload_config",
    "one_handed_keyboard", "input_method_options", "undo", "redo",
    "settings_global_options", "settings_input_methods", "settings_candidates_window",
    "settings_clipboard", "settings_symbol", "settings_plugin", "settings_advanced",
    "settings_developer", "settings_about", "settings_license",
    "edit_text_keyboard_layout", "text_keyboard_layout_file_select", "edit_fontset"
  ];
  const macroModifierKeys = new Set([
    "Ctrl_L", "Ctrl_R", "Alt_L", "Alt_R", "Shift_L", "Shift_R",
    "Meta_L", "Meta_R", "Super_L", "Super_R", "Hyper_L", "Hyper_R",
    "Mode_switch", "ISO_Level3_Shift", "ISO_Level5_Shift"
  ]);
  const commonColorPalette = [
    "#000000", "#FFFFFF", "#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4",
    "#009688", "#4CAF50", "#8BC34A", "#CDDC39", "#FFEB3B", "#FFC107", "#FF9800", "#FF5722", "#795548", "#9E9E9E"
  ];
  const macroFcitxKeys = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
    "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "Ctrl_L", "Ctrl_R", "Shift_L", "Shift_R", "Alt_L", "Alt_R",
    "Meta_L", "Meta_R", "Super_L", "Super_R", "Hyper_L", "Hyper_R",
    "Enter", "Tab", "Escape", "Space", "Delete", "BackSpace",
    "Home", "End", "Page_Up", "Page_Down", "Left", "Right", "Up", "Down",
    "Insert", "Menu", "Print", "Scroll_Lock", "Pause", "Caps_Lock", "Num_Lock",
    "grave", "asciitilde", "minus", "underscore", "equal", "plus",
    "bracketleft", "braceleft", "bracketright", "braceright", "backslash", "bar",
    "semicolon", "colon", "apostrophe", "quotedbl", "comma", "less", "period",
    "greater", "slash", "question", "exclam", "at", "numbersign", "dollar",
    "percent", "asciicircum", "ampersand", "asterisk", "parenleft", "parenright",
    "Bracket_L", "Bracket_R", "Multiply", "Add", "Subtract", "Divide", "Separator",
    "KP_0", "KP_1", "KP_2", "KP_3", "KP_4", "KP_5", "KP_6", "KP_7", "KP_8", "KP_9",
    "KP_Enter", "KP_Space", "KP_Tab", "KP_Equal", "KP_Multiply", "KP_Add",
    "KP_Subtract", "KP_Divide", "KP_Decimal", "KP_Separator",
    "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
    "F13", "F14", "F15", "F16", "F17", "F18", "F19", "F20", "F21", "F22", "F23", "F24",
    "F25", "F26", "F27", "F28", "F29", "F30", "F31", "F32", "F33", "F34", "F35",
    "AudioMute", "AudioLowerVolume", "AudioRaiseVolume",
    "AudioPlay", "AudioStop", "AudioPrev", "AudioNext", "AudioRewind",
    "AudioForward", "AudioRepeat", "HomePage", "Mail", "Search", "WWW",
    "Favorites", "Calculator", "Calendar", "Contacts", "Memo", "Todo",
    "Back", "Forward", "Refresh", "Reload", "Stop", "ZoomIn", "ZoomOut",
    "XF86Copy", "XF86Cut", "XF86Paste", "XF86Select", "XF86Undo", "XF86Redo",
    "XF86Find", "Execute", "Help", "Setup", "Options", "Info", "Time",
    "Market", "Go", "Off", "Shop"
  ];

  const state = {
    layout: deepClone(defaultLayout),
    initialLayout: deepClone(defaultLayout),
    selectedBase: "default",
    selectedSubmode: DEFAULT_SUBMODE,
    suppressLayoutJsonInput: false,
    wasmReady: false,
    qr: { chunks: [], index: 0, transferId: "", layoutSignature: "" },
    qrImportRunning: false,
    dragKey: null,
    dragRow: null,
    dragRowNode: null,
    dragRowPointerId: null,
    layoutJsonEditor: null,
    layoutJsonEditorLoading: false,
    layoutKeyJsonEditor: null,
    layoutKeyJsonEditorLoading: false,
    codeMirrorModulesPromise: null,
    lastJsonCardHeight: 0,
    layoutHeightObserver: null,
    composeNestedContext: null,
    macroStepDrag: null,
    macroStepDragPointerId: null,
    macroStepDragNode: null,
    macroStepDragHoldTimer: null,
    macroStepDragActive: false,
    macroStepDragStartX: 0,
    macroStepDragStartY: 0,
    macroEventEditor: { eventName: "tap", steps: [] }
  };

  const keyDialogState = { rowIndex: -1, keyIndex: -1, draft: null };
  const crcTable = buildCrc32Table();

  function el(id) {
    return document.getElementById(id);
  }

  function deepClone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function prettyJson(v) {
    return JSON.stringify(v, null, 2);
  }

  function currentLayoutSignature() {
    try {
      return JSON.stringify(normalizeLayoutObject(deepClone(state.layout)));
    } catch (_) {
      return "";
    }
  }

  function exportJsonOneKeyPerLine(v) {
    const INDENT = "  ";
    const pad = (level) => INDENT.repeat(level);
    const isPlainObject = (x) => x && typeof x === "object" && !Array.isArray(x);
    const isKeyObject = (x) => isPlainObject(x) && typeof x.type === "string";

    function format(level, value) {
      if (Array.isArray(value)) {
        if (!value.length) return [`${pad(level)}[]`];

        const isKeyRow = value.every(isKeyObject);
        if (isKeyRow) {
          const out = [`${pad(level)}[`];
          value.forEach((item, idx) => {
            const comma = idx < value.length - 1 ? "," : "";
            out.push(`${pad(level + 1)}${JSON.stringify(item)}${comma}`);
          });
          out.push(`${pad(level)}]`);
          return out;
        }

        const out = [`${pad(level)}[`];
        value.forEach((item, idx) => {
          const block = format(level + 1, item);
          const comma = idx < value.length - 1 ? "," : "";
          out.push(...block.slice(0, -1));
          out.push(`${block[block.length - 1]}${comma}`);
        });
        out.push(`${pad(level)}]`);
        return out;
      }

      if (isPlainObject(value)) {
        const keys = Object.keys(value);
        if (!keys.length) return [`${pad(level)}{}`];
        const out = [`${pad(level)}{`];
        keys.forEach((key, idx) => {
          const block = format(level + 1, value[key]);
          const comma = idx < keys.length - 1 ? "," : "";
          if (block.length === 1) {
            out.push(`${pad(level + 1)}${JSON.stringify(key)}: ${block[0].trimStart()}${comma}`);
            return;
          }
          out.push(`${pad(level + 1)}${JSON.stringify(key)}: ${block[0].trimStart()}`);
          out.push(...block.slice(1, -1));
          out.push(`${block[block.length - 1]}${comma}`);
        });
        out.push(`${pad(level)}}`);
        return out;
      }

      return [`${pad(level)}${JSON.stringify(value)}`];
    }

    return format(0, v).join("\n");
  }

  function setStatus(id, text, mode) {
    const node = el(id);
    if (!node) return;
    node.classList.remove("ok", "err");
    if (mode === "ok") node.classList.add("ok");
    if (mode === "err") node.classList.add("err");
    node.textContent = text || "";
  }

  function downloadFile(name, content) {
    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
    downloadBlob(name, blob);
  }

  function downloadBlob(name, blob) {
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function tryLoadJson(url) {
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) throw new Error(`${url} -> ${resp.status}`);
    return await resp.json();
  }

  async function initializeBuiltinData() {
    try {
      const layout = normalizeLayoutObject(await tryLoadJson("./data/default-layout.json"));
      state.layout = deepClone(layout);
      state.initialLayout = deepClone(layout);
    } catch (_) {
      state.layout = deepClone(defaultLayout);
      state.initialLayout = deepClone(defaultLayout);
    }
    ensureSelection();
  }

  function baseNames(layout = state.layout) {
    return Object.keys(layout).filter((k) => k !== META_KEY).sort();
  }

  function isRows(v) {
    return Array.isArray(v) && v.every((row) => Array.isArray(row));
  }

  function submodeNames(base, layout = state.layout) {
    const v = layout[base];
    if (isRows(v)) return [DEFAULT_SUBMODE];
    if (!v || typeof v !== "object" || Array.isArray(v)) return [];
    return Object.keys(v).filter((k) => k !== META_KEY).sort((a, b) => {
      if (a === DEFAULT_SUBMODE) return -1;
      if (b === DEFAULT_SUBMODE) return 1;
      return a.localeCompare(b);
    });
  }

  function entryKey(base, submode) {
    return submode && submode !== DEFAULT_SUBMODE ? `${base}:${submode}` : base;
  }

  function allEntryKeys() {
    return baseNames().flatMap((base) => submodeNames(base).map((sub) => entryKey(base, sub)));
  }

  function parseEntryKey(key) {
    const idx = key.indexOf(":");
    if (idx < 0) return { base: key, submode: DEFAULT_SUBMODE };
    return { base: key.slice(0, idx), submode: key.slice(idx + 1) || DEFAULT_SUBMODE };
  }

  function buildMonetResourceIds() {
    const out = [];
    const pushRange = (prefix, values) => values.forEach((v) => out.push(`${prefix}_${v}`));
    pushRange("system_neutral1", [0, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]);
    pushRange("system_neutral2", [0, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]);
    pushRange("system_accent1", [0, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]);
    pushRange("system_accent2", [0, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]);
    pushRange("system_accent3", [0, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]);
    [
      "system_primary", "system_primary_light", "system_primary_dark",
      "system_on_primary", "system_on_primary_light", "system_on_primary_dark",
      "system_secondary_container", "system_secondary_container_light", "system_secondary_container_dark",
      "system_on_surface", "system_on_surface_light", "system_on_surface_dark",
      "system_on_surface_variant", "system_on_surface_variant_light", "system_on_surface_variant_dark",
      "system_surface_container", "system_surface_container_low", "system_surface_container_lowest",
      "system_surface_container_high", "system_surface_container_highest",
      "system_surface_container_light", "system_surface_container_dark",
      "system_surface_container_high_light", "system_surface_container_high_dark",
      "system_surface_container_highest_light", "system_surface_container_highest_dark",
      "system_surface_bright", "system_surface_bright_light", "system_surface_bright_dark",
      "system_surface_dim"
    ].forEach((v) => out.push(v));
    return out;
  }

  function unwrapRows(candidate) {
    if (isRows(candidate)) return candidate;
    if (candidate && typeof candidate === "object") {
      if (isRows(candidate.default)) return candidate.default;
      if (isRows(candidate[""])) return candidate[""];
    }
    return [];
  }

  function getRows(base = state.selectedBase, submode = state.selectedSubmode) {
    const v = state.layout[base];
    if (isRows(v)) return v;
    if (!v || typeof v !== "object") return [];
    return unwrapRows(v[submode] ?? v.default ?? v[""]);
  }

  function getRowsByEntryKey(key) {
    const parsed = parseEntryKey(key);
    return getRows(parsed.base, parsed.submode);
  }

  function setRows(base, submode, rows) {
    if (submode === DEFAULT_SUBMODE) {
      const existing = state.layout[base];
      if (isRows(existing) || !existing || typeof existing !== "object") {
        state.layout[base] = rows;
      } else {
        existing.default = rows;
      }
      return;
    }
    if (!state.layout[base] || isRows(state.layout[base])) {
      state.layout[base] = { default: isRows(state.layout[base]) ? state.layout[base] : [] };
    }
    state.layout[base][submode] = rows;
  }

  function getMetaContainer(base, submode = state.selectedSubmode, create = false) {
    const v = state.layout[base];
    if (submode === DEFAULT_SUBMODE) {
      if (isRows(v)) {
        if (!create) return null;
        state.layout[base] = { default: v, [META_KEY]: {} };
        return state.layout[base][META_KEY];
      }
      if (!v || typeof v !== "object") return null;
      if (!v[META_KEY] && create) v[META_KEY] = {};
      return v[META_KEY] || null;
    }
    if (!v || typeof v !== "object" || isRows(v)) return null;
    const sub = v[submode];
    if (isRows(sub)) {
      if (!create) return null;
      v[submode] = { default: sub, [META_KEY]: {} };
      return v[submode][META_KEY];
    }
    if (!sub || typeof sub !== "object") return null;
    if (!sub[META_KEY] && create) sub[META_KEY] = {};
    return sub[META_KEY] || null;
  }

  function getHeightOverride(base = state.selectedBase, submode = state.selectedSubmode) {
    const meta = getMetaContainer(base, submode, false);
    const n = Number(meta?.[HEIGHT_KEY]);
    return Number.isFinite(n) && n >= 10 && n <= 90 ? Math.round(n) : "";
  }

  function setHeightOverride(base, submode, rawValue) {
    const raw = String(rawValue ?? "").trim();
    if (!raw) {
      const meta = getMetaContainer(base, submode, false);
      if (meta) delete meta[HEIGHT_KEY];
      return;
    }
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 10 || n > 90) throw new Error("键盘高度 override 必须是 10..90 的整数");
    getMetaContainer(base, submode, true)[HEIGHT_KEY] = n;
  }

  function normalizeLayoutObject(obj) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) throw new Error("Layout JSON 必须是对象");
    const names = baseNames(obj);
    if (!names.length) throw new Error("至少需要一个布局");
    names.forEach((base) => {
      const v = obj[base];
      if (isRows(v)) {
        validateRows(v, base);
      } else if (v && typeof v === "object" && !Array.isArray(v)) {
        const subs = Object.keys(v).filter((k) => k !== META_KEY);
        if (!subs.length) throw new Error(`布局 ${base} 至少需要一个子模式`);
        subs.forEach((sub) => {
          const rows = unwrapRows(v[sub]);
          validateRows(rows, entryKey(base, sub));
        });
        validateMeta(v[META_KEY], base);
      } else {
        throw new Error(`布局 ${base} 格式无效`);
      }
    });
    return obj;
  }

  function validateRows(rows, name) {
    if (!isRows(rows)) throw new Error(`布局 ${name} 不是有效行数组`);
    rows.forEach((row, ri) => {
      row.forEach((key, ki) => {
        if (!key || typeof key !== "object" || Array.isArray(key)) {
          throw new Error(`布局 ${name} 第 ${ri + 1} 行第 ${ki + 1} 个按键不是对象`);
        }
        if (key.rowHeightPercent != null) normalizeRowHeightKey(key);
      });
    });
  }

  function validateMeta(meta, name) {
    if (meta == null) return;
    if (typeof meta !== "object" || Array.isArray(meta)) throw new Error(`布局 ${name} 的 __meta__ 必须是对象`);
    const n = meta[HEIGHT_KEY];
    if (n == null) return;
    if (!Number.isInteger(Number(n)) || Number(n) < 10 || Number(n) > 90) {
      throw new Error(`布局 ${name} 的 ${HEIGHT_KEY} 必须是 10..90`);
    }
    meta[HEIGHT_KEY] = Number(n);
  }

  function ensureSelection() {
    const bases = baseNames();
    if (!bases.includes(state.selectedBase)) state.selectedBase = bases[0] || "default";
    const subs = submodeNames(state.selectedBase);
    if (!subs.includes(state.selectedSubmode)) state.selectedSubmode = subs[0] || DEFAULT_SUBMODE;
  }

  function previewTitleFromObj(key) {
    if (!key || typeof key !== "object") return "?";
    if (key.type === "AlphabetKey" || key.type === "MacroKey") {
      if (typeof key.displayText === "string" && key.displayText) return key.displayText;
      if (key.displayText && typeof key.displayText === "object") {
        return key.displayText[state.selectedSubmode] || key.displayText.default || Object.values(key.displayText)[0] || "?";
      }
    }
    switch (key.type) {
      case "CapsKey": return "⇧";
      case "LayoutSwitchKey": return key.label || "?123";
      case "CommaKey": return ",";
      case "LanguageKey": return "🌐";
      case "SpaceKey": return "␣";
      case "SymbolKey": return key.label || ".";
      case "ReturnKey": return "↵";
      case "BackspaceKey": return "⌫";
      case "AlphabetKey": return key.main || "?";
      case "MacroKey": return key.label || "M";
      default:
        return editorKeyLabel(key);
    }
  }

  function editorKeyLabel(key) {
    if (!key || typeof key !== "object") return "?";
    if (typeof key.main === "string" && key.main) return key.main;
    if (typeof key.type === "string") {
      switch (key.type) {
        case "CapsKey": return "Caps";
        case "LayoutSwitchKey": return key.label || "?123";
        case "CommaKey": return ",";
        case "LanguageKey": return "Lang";
        case "SpaceKey": return "Space";
        case "SymbolKey": return key.label || ".";
        case "ReturnKey": return "Enter";
        case "BackspaceKey": return "⌫";
        case "MacroKey": return key.label || "M";
        default: return key.type;
      }
    }
    return "?";
  }

  function keySubText(key) {
    if (!key || typeof key !== "object") return "";
    if (key.type === "AlphabetKey") return key.alt || "";
    if (key.type === "MacroKey") return key.altLabel || key.longPressLabel || "";
    if (key.swipeLabel) return key.swipeLabel;
    return "";
  }

  function renderSelectors() {
    ensureSelection();
    const baseSelect = el("layout-base-select");
    baseSelect.innerHTML = baseNames().map((k) => `<option value="${escapeAttr(k)}">${escapeHtml(k)}</option>`).join("");
    baseSelect.value = state.selectedBase;

    const subSelect = el("layout-submode-select");
    subSelect.innerHTML = submodeNames(state.selectedBase)
      .map((k) => `<option value="${escapeAttr(k)}">${escapeHtml(k)}</option>`)
      .join("");
    subSelect.value = state.selectedSubmode;
    subSelect.disabled = false;

    const entries = allEntryKeys();
    const copySourceNode = el("layout-copy-source");
    if (copySourceNode) {
      copySourceNode.innerHTML = entries.map((k) => `<option value="${escapeAttr(k)}">${escapeHtml(k)}</option>`).join("");
      copySourceNode.value = entryKey(state.selectedBase, state.selectedSubmode);
    }
    el("layout-height-override").value = getHeightOverride();
  }

  function renderLayoutPreview() {
    const rows = getRows();
    const rowPercents = resolveRowHeightPercents(rows);
    const root = el("layout-preview");
    root.innerHTML = rows.map((row, rowIndex) => {
      const rowHeight = effectiveRowHeight(rowPercents[rowIndex] ?? 0);
      const widths = resolveRegularRowWidths(row);
      return `<div class="layout-row" style="--row-height:${rowHeight}px"><div class="keys">${row.map((key, keyIndex) => {
        const w = widths[keyIndex] || 0;
        const widthPercent = `${(w * 100).toFixed(6)}%`;
        const alt = keySubText(key) ? `<span class="layout-key-alt">${escapeHtml(keySubText(key))}</span>` : "";
        return `<div class="layout-key-slot" style="--key-width:${widthPercent}"><div class="layout-key ${previewVariantClass(key)}"><span class="layout-key-main">${escapeHtml(previewTitleFromObj(key))}</span>${alt}</div></div>`;
      }).join("")}</div></div>`;
    }).join("");
    requestAnimationFrame(fitLayoutPreviewText);
    const height = getHeightOverride();
    setStatus("layout-preview-meta", `${entryKey(state.selectedBase, state.selectedSubmode)}${height ? `，键盘高度 ${height}%` : ""}`, "");
    updateFixedChromeMetrics();
  }

  function fitLayoutPreviewText() {
    const canvas = fitLayoutPreviewText.canvas || (fitLayoutPreviewText.canvas = document.createElement("canvas"));
    const ctx = canvas.getContext("2d");
    const fitText = (node, maxSize, minSize, weight, reserve = 8) => {
      const key = node.closest(".layout-key");
      if (!key) return;
      const value = node.textContent || "";
      const width = Math.max(0, key.clientWidth - reserve);
      if (!value || width <= 0) return;
      let size = maxSize;
      ctx.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;
      while (size > minSize && ctx.measureText(value).width > width) {
        size -= 1;
        ctx.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;
      }
      node.style.fontSize = `${size}px`;
    };

    document.querySelectorAll("#layout-preview .layout-key-main").forEach((node) => {
      const key = node.closest(".layout-key");
      const max = key?.classList.contains("alt-key") ? 16 : key?.classList.contains("macro-key") || key?.classList.contains("accent-key") ? 20 : key?.classList.contains("space-key") ? 18 : 23;
      fitText(node, max, 7, 600, 8);
    });
    document.querySelectorAll("#layout-preview .layout-key-alt").forEach((node) => fitText(node, 10, 6, 500, 12));
  }

  function updateFixedChromeMetrics() {
    requestAnimationFrame(() => {
      const topbar = document.querySelector(".topbar");
      const preview = document.querySelector(".keyboard-preview-panel");
      const topbarHeight = topbar?.offsetHeight || 0;
      document.documentElement.style.setProperty("--topbar-height", `${topbarHeight}px`);
      requestAnimationFrame(() => {
        const previewHeight = preview?.offsetHeight || 0;
        document.documentElement.style.setProperty("--preview-panel-height", `${previewHeight}px`);
      });
    });
  }

  function defaultRowHeightPercent(rowCount) {
    if (rowCount <= 0) return 25;
    return Math.max(1, 100 / rowCount);
  }

  function resolveRowHeightPercents(rows) {
    if (!rows.length) return [];

    const parsedPercents = rows.map((row) => {
      const rowMax = row
        .map((key) => Number(key.rowHeightPercent))
        .filter((value) => Number.isFinite(value) && value >= 1 && value <= 100)
        .reduce((max, value) => Math.max(max, value), 0);
      return rowMax > 0 ? rowMax : null;
    });
    const definedSum = parsedPercents.filter((value) => value != null).reduce((sum, value) => sum + value, 0);
    const undefinedCount = parsedPercents.filter((value) => value == null).length;

    const distributed = undefinedCount === 0
      ? parsedPercents.map((value) => value || 0)
      : (() => {
          const remaining = Math.max(0, 100 - definedSum);
          const avg = remaining / undefinedCount;
          return parsedPercents.map((value) => value != null ? value : avg);
        })();

    const sum = distributed.reduce((acc, value) => acc + value, 0);
    if (sum <= 0) {
      const fallback = defaultRowHeightPercent(rows.length);
      return Array.from({ length: rows.length }, () => fallback);
    }

    return distributed.map((value) => value * 100 / sum);
  }

  function effectiveRowHeight(percent) {
    const h = Number(percent) || 0;
    return h > 0 ? Math.max(34, Math.round(48 * h / 25)) : 42;
  }

  function keyWeight(key) {
    if (key && Object.prototype.hasOwnProperty.call(key, "weight")) {
      const n = Number(key.weight);
      if (Number.isFinite(n)) return n;
    }
    return defaultKeyWeight(key);
  }

  function isAutoWidthKey(key) {
    return key?.type === "AlphabetKey" || key?.type === "SymbolKey" || key?.type === "MacroKey";
  }

  function defaultKeyWeight(key) {
    switch (key?.type) {
      case "CapsKey":
      case "LayoutSwitchKey":
      case "ReturnKey":
      case "BackspaceKey":
        return 0.15;
      case "CommaKey":
        return 0.1;
      case "LanguageKey":
        return 0.1;
      case "SpaceKey":
        return 0;
      case "AlphabetKey":
      case "SymbolKey":
      case "MacroKey":
        return 0.1;
      default:
        return 0.1;
    }
  }

  function resolveRegularRowWidths(row) {
    if (!row.length) return [];
    const entries = row.map((key) => {
      const hasWeight = key && Object.prototype.hasOwnProperty.call(key, "weight");
      const defaultWidth = defaultKeyWeight(key);
      const raw = hasWeight ? Number(key.weight) : defaultWidth;
      const width = Number.isFinite(raw) ? raw : defaultWidth;
      return {
        width: Math.max(0, width),
        auto: hasWeight ? width <= 0 : defaultWidth <= 0
      };
    });
    const fixedSum = entries.reduce((sum, item) => sum + (item.auto ? 0 : item.width), 0);
    const flexCount = entries.filter((item) => item.auto).length;
    const remaining = Math.max(0, 1 - fixedSum);
    const flexWidth = flexCount > 0 ? remaining / flexCount : 0;
    return entries.map((item) => item.auto ? flexWidth : item.width);
  }

  function keyVariantClass(key) {
    const classes = [];
    switch (key?.type) {
      case "CapsKey":
      case "LayoutSwitchKey":
      case "CommaKey":
      case "SymbolKey":
      case "LanguageKey":
      case "BackspaceKey":
        classes.push("alt-key");
        break;
      case "SpaceKey":
        classes.push("space-key");
        break;
      case "ReturnKey":
        classes.push("accent-key");
        break;
    }
    if (key?.type === "MacroKey") classes.push("macro-key");
    if (key?.composeOverride && key?.type !== "MacroKey") classes.push("compose-key");
    return classes.join(" ");
  }

  function keyVariantStyle(key) {
    if (key?.type === "MacroKey") {
      return "background:#3f8f6a;border-color:#3f8f6a;color:#fff;border-width:2px;";
    }
    if (key?.composeOverride && key?.type !== "MacroKey") {
      return "color:#3f8f6a;";
    }
    return "";
  }

  function previewVariantClass(key) {
    return keyVariantClass(key)
      .split(/\s+/)
      .filter((cls) => cls && cls !== "macro-key" && cls !== "compose-key")
      .join(" ");
  }

  function renderLayoutEditor() {
    const rows = getRows();
    const root = el("layout-rows");
    root.innerHTML = "";
    rows.forEach((row, rowIndex) => {
      const block = document.createElement("div");
      block.className = "layout-row-editor";
      if (state.dragRow === rowIndex) block.classList.add("dragging");
      block.dataset.rowIndex = String(rowIndex);
      block.innerHTML = `
        <span class="row-drag-handle" title="拖拽行排序">☰</span>
        <div class="chip-list key-list" data-row-index="${rowIndex}" title="按住空白处可上下拖拽调整行顺序"></div>
        <button class="row-add-key" title="新增按键">+</button>
        <button class="row-delete" title="删除行">🗑</button>
      `;
      block.querySelector(".row-add-key").addEventListener("click", () => openLayoutKeyDialog(rowIndex, -1, true));
      block.querySelector(".row-delete").addEventListener("click", () => deleteRow(rowIndex));
      bindRowDrag(block);

      const keysWrap = block.querySelector(".key-list");
      row.forEach((key, keyIndex) => {
        const keyBtn = document.createElement("button");
        keyBtn.className = `layout-chip ${keyVariantClass(key)}`;
        keyBtn.style.cssText = keyVariantStyle(key);
        if (state.dragKey?.row === rowIndex && state.dragKey?.index === keyIndex) {
          keyBtn.classList.add("dragging");
        }
        keyBtn.draggable = true;
        keyBtn.dataset.rowIndex = String(rowIndex);
        keyBtn.dataset.keyIndex = String(keyIndex);
        keyBtn.innerHTML = `
          <span class="chip-main">${escapeHtml(editorKeyLabel(key))}</span>
        `;
        keyBtn.title = `${key.type || "?"}。点击编辑，拖拽排序，右键删除`;
        keyBtn.addEventListener("click", () => openLayoutKeyDialog(rowIndex, keyIndex, false));
        keyBtn.addEventListener("contextmenu", (ev) => {
          ev.preventDefault();
          const keyName = editorKeyLabel(key);
          if (!confirm(`确认删除按键「${keyName}」？`)) return;
          deleteKey(rowIndex, keyIndex);
        });
        bindKeyDrag(keyBtn);
        keysWrap.appendChild(keyBtn);
      });
      root.appendChild(block);
    });
    const addRowWrap = document.createElement("div");
    addRowWrap.className = "add-row-wrap";
    addRowWrap.innerHTML = `<button id="layout-add-row-footer" class="add-row-button">新增行</button>`;
    addRowWrap.querySelector("button").addEventListener("click", () => {
      getRows().push([]);
      syncLayoutUiFromState();
    });
    root.appendChild(addRowWrap);
  }

  function moveRow(from, to, shouldSync = true) {
    const rows = getRows();
    if (from < 0 || to < 0 || from >= rows.length || to >= rows.length || from === to) return null;
    const [row] = rows.splice(from, 1);
    rows.splice(to, 0, row);
    if (shouldSync) syncLayoutUiFromState();
    return to;
  }

  function moveRowToInsertionIndex(from, insertionIndex, shouldSync = true) {
    const rows = getRows();
    if (from < 0 || from >= rows.length) return null;
    const nextIndex = Math.max(0, Math.min(insertionIndex, rows.length - 1));
    if (nextIndex === from) return null;
    const [row] = rows.splice(from, 1);
    rows.splice(nextIndex, 0, row);
    if (shouldSync) syncLayoutUiFromState();
    return nextIndex;
  }

  function deleteRow(rowIndex) {
    if (!confirm(`删除第 ${rowIndex + 1} 行？`)) return;
    getRows().splice(rowIndex, 1);
    syncLayoutUiFromState();
  }

  function deleteKey(rowIndex, keyIndex) {
    const rows = getRows();
    if (!rows[rowIndex] || keyIndex < 0 || keyIndex >= rows[rowIndex].length) return;
    rows[rowIndex].splice(keyIndex, 1);
    syncLayoutUiFromState();
  }

  function bindRowDrag(node) {
    const handle = node.querySelector(".row-drag-handle");
    if (!handle) return;

    const canStartRowDrag = (ev) => {
      if (ev.button !== 0 || state.dragKey) return false;
      const interactive = ev.target.closest?.(".layout-chip, button, input, select, textarea, .cm-editor");
      return !interactive || ev.target.closest?.(".row-drag-handle");
    };

    node.addEventListener("pointerdown", (ev) => {
      if (!canStartRowDrag(ev)) return;
      ev.preventDefault();
      state.dragRowPointerId = ev.pointerId;
      state.dragRow = Number(node.dataset.rowIndex);
      state.dragRowNode = node;
      node.classList.add("dragging");
    });

    node.addEventListener("dragstart", (ev) => {
      if (state.dragKey) {
        ev.preventDefault();
        return;
      }
      ev.preventDefault();
    });
  }

  function rowInsertionIndexFromPointerY(clientY) {
    const rowNodes = Array.from(el("layout-rows").querySelectorAll(":scope > .layout-row-editor"));
    if (!rowNodes.length) return null;
    const sourceIndex = state.dragRow;
    const otherRows = rowNodes
      .map((node, index) => ({ node, index }))
      .filter(({ index }) => index !== sourceIndex);
    for (let slot = 0; slot < otherRows.length; slot++) {
      const rect = otherRows[slot].node.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        return slot;
      }
    }
    return rowNodes.length;
  }

  function bindKeyDrag(node) {
    node.addEventListener("dragstart", (ev) => {
      ev.stopPropagation();
      ev.dataTransfer.setData("text/x-layout-key", `${node.dataset.rowIndex}:${node.dataset.keyIndex}`);
      ev.dataTransfer.effectAllowed = "move";
      state.dragKey = {
        row: Number(node.dataset.rowIndex),
        index: Number(node.dataset.keyIndex)
      };
      node.classList.add("dragging");
    });
    node.addEventListener("dragend", () => {
      state.dragKey = null;
      syncLayoutUiFromState();
    });
    node.addEventListener("dragover", (ev) => {
      if (!ev.dataTransfer.types.includes("text/x-layout-key")) return;
      ev.preventDefault();
      ev.stopPropagation();
      previewMoveKey(Number(node.dataset.rowIndex), insertionIndexFromKeyEvent(node, ev));
    });
    node.addEventListener("drop", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      state.dragKey = null;
      syncLayoutUiFromState();
    });
  }

  function finishRowPointerDrag() {
    if (state.dragRowPointerId == null) return;
    state.dragRowPointerId = null;
    if (state.dragRow == null) return;
    state.dragRow = null;
    state.dragRowNode = null;
    syncLayoutUiFromState();
  }

  document.addEventListener("pointermove", (ev) => {
    if (state.dragRowPointerId !== ev.pointerId || state.dragRow == null) return;
    ev.preventDefault();
    const insertionIndex = rowInsertionIndexFromPointerY(ev.clientY);
    if (insertionIndex == null) return;
    previewMoveRowToInsertionIndex(insertionIndex);
  });

  document.addEventListener("pointerup", (ev) => {
    if (state.dragRowPointerId !== ev.pointerId) return;
    finishRowPointerDrag();
  });

  document.addEventListener("pointercancel", (ev) => {
    if (state.dragRowPointerId !== ev.pointerId) return;
    finishRowPointerDrag();
  });

  document.addEventListener("dragend", () => {
    if (state.dragRow != null) {
      state.dragRowPointerId = null;
      state.dragRow = null;
      state.dragRowNode = null;
      syncLayoutUiFromState();
    }
    if (!state.dragKey) return;
    state.dragKey = null;
    syncLayoutUiFromState();
  });

  function clearMacroStepDragHoldTimer() {
    if (state.macroStepDragHoldTimer != null) {
      clearTimeout(state.macroStepDragHoldTimer);
      state.macroStepDragHoldTimer = null;
    }
  }

  function resetMacroStepDragState() {
    clearMacroStepDragHoldTimer();
    state.macroStepDrag = null;
    state.macroStepDragPointerId = null;
    state.macroStepDragNode = null;
    state.macroStepDragActive = false;
    state.macroStepDragStartX = 0;
    state.macroStepDragStartY = 0;
  }

  function macroStepInsertionIndexFromPointerY(clientY) {
    const root = el("layout-key-macro-event-steps");
    if (!root) return null;
    const stepNodes = Array.from(root.querySelectorAll(":scope > .macro-step-row"));
    if (!stepNodes.length) return null;
    const sourceIndex = state.macroStepDrag;
    const otherRows = stepNodes
      .map((node, index) => ({ node, index }))
      .filter(({ index }) => index !== sourceIndex);
    for (let slot = 0; slot < otherRows.length; slot += 1) {
      const rect = otherRows[slot].node.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return slot;
    }
    return stepNodes.length;
  }

  function moveMacroStepToInsertionIndex(from, insertionIndex) {
    const steps = state.macroEventEditor.steps;
    if (!Array.isArray(steps) || from < 0 || from >= steps.length) return null;
    const nextIndex = Math.max(0, Math.min(insertionIndex, steps.length - 1));
    if (nextIndex === from) return null;
    const [step] = steps.splice(from, 1);
    steps.splice(nextIndex, 0, step);
    return nextIndex;
  }

  function previewMoveMacroStepToInsertionIndex(insertionIndex) {
    if (state.macroStepDrag == null || !Number.isInteger(insertionIndex)) return;
    const movedTo = moveMacroStepToInsertionIndex(state.macroStepDrag, insertionIndex);
    if (movedTo == null) return;
    state.macroStepDrag = movedTo;
    renderMacroEventEditor();
  }

  function canStartMacroStepDrag(ev) {
    if (ev.button !== 0) return false;
    const interactive = ev.target.closest?.("button, input, select, textarea, .cm-editor, .macro-key-row");
    return !interactive;
  }

  function bindMacroStepDrag(node, stepIndex) {
    node.addEventListener("pointerdown", (ev) => {
      if (!canStartMacroStepDrag(ev)) return;
      resetMacroStepDragState();
      state.macroStepDragPointerId = ev.pointerId;
      state.macroStepDragStartX = ev.clientX;
      state.macroStepDragStartY = ev.clientY;
      state.macroStepDragHoldTimer = setTimeout(() => {
        if (state.macroStepDragPointerId !== ev.pointerId) return;
        state.macroStepDrag = stepIndex;
        state.macroStepDragNode = node;
        state.macroStepDragActive = true;
        node.classList.add("dragging");
        renderMacroEventEditor();
      }, 100);
    });
  }

  document.addEventListener("pointermove", (ev) => {
    if (state.macroStepDragPointerId !== ev.pointerId) return;
    if (!state.macroStepDragActive) {
      const dx = Math.abs(ev.clientX - state.macroStepDragStartX);
      const dy = Math.abs(ev.clientY - state.macroStepDragStartY);
      if (dx > 8 || dy > 8) resetMacroStepDragState();
      return;
    }
    ev.preventDefault();
    const insertionIndex = macroStepInsertionIndexFromPointerY(ev.clientY);
    if (insertionIndex == null) return;
    previewMoveMacroStepToInsertionIndex(insertionIndex);
  });

  document.addEventListener("pointerup", (ev) => {
    if (state.macroStepDragPointerId !== ev.pointerId) return;
    const wasActive = state.macroStepDragActive;
    resetMacroStepDragState();
    if (wasActive) renderMacroEventEditor();
  });

  document.addEventListener("pointercancel", (ev) => {
    if (state.macroStepDragPointerId !== ev.pointerId) return;
    const wasActive = state.macroStepDragActive;
    resetMacroStepDragState();
    if (wasActive) renderMacroEventEditor();
  });

  document.addEventListener("dragover", (ev) => {
    const row = ev.target.closest?.(".layout-row-editor");
    if (row && ev.dataTransfer.types.includes("text/x-layout-row")) {
      ev.preventDefault();
      previewMoveRow(Number(row.dataset.rowIndex));
      return;
    }
    const list = ev.target.closest?.(".key-list");
    if (!list || !ev.dataTransfer.types.includes("text/x-layout-key")) return;
    ev.preventDefault();
    if (ev.target.closest?.(".layout-chip")) return;
    {
      const toRow = Number(list.dataset.rowIndex);
      previewMoveKey(toRow, getRows()[toRow]?.length ?? 0);
    }
  });

  function insertionIndexFromKeyEvent(node, ev) {
    const keyIndex = Number(node.dataset.keyIndex);
    const rect = node.getBoundingClientRect();
    const after = ev.clientX > rect.left + rect.width / 2;
    return keyIndex + (after ? 1 : 0);
  }

  document.addEventListener("drop", (ev) => {
    const row = ev.target.closest?.(".layout-row-editor");
    if (row && ev.dataTransfer.types.includes("text/x-layout-row")) {
      ev.preventDefault();
      state.dragRow = null;
      state.dragRowNode = null;
      syncLayoutUiFromState();
      return;
    }
    const list = ev.target.closest?.(".key-list");
    if (!list || !ev.dataTransfer.types.includes("text/x-layout-key")) return;
    ev.preventDefault();
    state.dragKey = null;
    syncLayoutUiFromState();
  });

  function previewMoveKey(toRow, toIndex) {
    if (!state.dragKey) return;
    const moved = moveKey(state.dragKey.row, state.dragKey.index, toRow, toIndex, false);
    if (!moved) return;
    state.dragKey = moved;
    renderLayoutEditor();
    renderLayoutPreview();
  }

  function previewMoveRow(toRow) {
    if (state.dragRow == null) return;
    if (!Number.isInteger(toRow) || toRow === state.dragRow) return;
    const fromRow = state.dragRow;
    const movedTo = moveRow(state.dragRow, toRow, false);
    if (movedTo == null) return;
    moveRowEditorNode(fromRow, movedTo);
    state.dragRow = movedTo;
    syncRowEditorDatasets();
    renderLayoutPreview();
  }

  function previewMoveRowToInsertionIndex(insertionIndex) {
    if (state.dragRow == null) return;
    if (!Number.isInteger(insertionIndex)) return;
    const fromRow = state.dragRow;
    const movedTo = moveRowToInsertionIndex(fromRow, insertionIndex, false);
    if (movedTo == null) return;
    moveRowEditorNode(fromRow, movedTo);
    state.dragRow = movedTo;
    syncRowEditorDatasets();
    renderLayoutPreview();
  }

  function moveRowEditorNode(fromRow, toRow) {
    const root = el("layout-rows");
    const rowNodes = Array.from(root.querySelectorAll(":scope > .layout-row-editor"));
    const source = state.dragRowNode || rowNodes[fromRow];
    const target = rowNodes[toRow];
    if (!source || !target || source === target) return;
    root.insertBefore(source, fromRow < toRow ? target.nextSibling : target);
    state.dragRowNode = source;
  }

  function syncRowEditorDatasets() {
    const rowNodes = Array.from(el("layout-rows").querySelectorAll(":scope > .layout-row-editor"));
    rowNodes.forEach((rowNode, rowIndex) => {
      rowNode.dataset.rowIndex = String(rowIndex);
      rowNode.classList.toggle("dragging", state.dragRow === rowIndex);
      rowNode.querySelector(".key-list")?.setAttribute("data-row-index", String(rowIndex));
      rowNode.querySelectorAll(".layout-chip").forEach((keyNode, keyIndex) => {
        keyNode.dataset.rowIndex = String(rowIndex);
        keyNode.dataset.keyIndex = String(keyIndex);
      });
    });
  }

  function moveKey(fromRow, fromIndex, toRow, toIndex, shouldSync = true) {
    const rows = getRows();
    if (!rows[fromRow] || !rows[toRow]) return null;
    if (fromIndex < 0 || fromIndex >= rows[fromRow].length) return null;
    const [key] = rows[fromRow].splice(fromIndex, 1);
    const adjusted = fromRow === toRow && toIndex > fromIndex ? toIndex - 1 : toIndex;
    const nextIndex = Math.max(0, Math.min(adjusted, rows[toRow].length));
    if (fromRow === toRow && nextIndex === fromIndex) {
      rows[fromRow].splice(fromIndex, 0, key);
      return null;
    }
    rows[toRow].splice(nextIndex, 0, key);
    if (shouldSync) syncLayoutUiFromState();
    return { row: toRow, index: nextIndex };
  }

  function openLayoutKeyDialog(rowIndex, keyIndex, isNew) {
    try {
      const rows = getRows();
      const key = isNew ? { type: "AlphabetKey", main: "x", alt: "", weight: 0.1 } : deepClone(rows[rowIndex][keyIndex]);
      keyDialogState.rowIndex = rowIndex;
      keyDialogState.keyIndex = keyIndex;
      keyDialogState.draft = deepClone(key);
      el("layout-key-dialog-title").textContent = isNew ? "新增按键" : "编辑按键";
      populateMainKeyFieldsFromDraft();
      syncKeyDialogActionButtons();
      el("layout-key-delete").disabled = isNew;
      setStatus("layout-key-dialog-status", "", "");
      el("layout-key-dialog").showModal();
    } catch (e) {
      console.error("openLayoutKeyDialog failed", e);
      alert(`打开按键编辑器失败：${e.message}`);
    }
  }

  function keyTypeCapabilities(type) {
    const displayTextTypes = new Set(["AlphabetKey", "MacroKey"]);
    const swipeTypes = new Set(["LayoutSwitchKey", "SymbolKey", "CapsKey", "ReturnKey", "BackspaceKey"]);
    const labelTypes = new Set(["LayoutSwitchKey", "SymbolKey", "MacroKey"]);
    return {
      hasMainAlt: type === "AlphabetKey",
      hasLabel: labelTypes.has(type),
      hasSubLabel: type === "LayoutSwitchKey",
      hasDisplayText: displayTextTypes.has(type),
      hasSwipeLabel: swipeTypes.has(type),
      hasMacroLabels: type === "MacroKey",
      hasTapAction: type === "MacroKey",
      hasSwipeAction: type === "MacroKey" || swipeTypes.has(type),
      hasLongPressAction: type === "MacroKey"
    };
  }

  function populateMainKeyFieldsFromDraft() {
    const key = keyDialogState.draft || {};
    const type = key.type || "AlphabetKey";
    const typeSelect = el("layout-key-type");
    typeSelect.innerHTML = keyTypes.map((t) => `<option value="${escapeAttr(t)}">${escapeHtml(t)}</option>`).join("");
    if (!keyTypes.includes(type)) {
      typeSelect.insertAdjacentHTML("beforeend", `<option value="${escapeAttr(type)}">${escapeHtml(type)}</option>`);
    }
    typeSelect.value = type;
    el("layout-key-main").value = key.main || "";
    el("layout-key-alt").value = key.alt || "";
    el("layout-key-label").value = key.label || "";
    el("layout-key-sub-label").value = key.subLabel || "";
    el("layout-key-weight").value = key.weight == null ? "" : String(key.weight);
    el("layout-key-row-height").value = key.rowHeightPercent == null ? "" : String(key.rowHeightPercent);
    updateKeyDialogFieldVisibility(type);
    syncComposeInlineUi();
    refreshKeyDialogSummaries();
  }

  function updateKeyDialogFieldVisibility(type) {
    const c = keyTypeCapabilities(type);
    const inComposeEdit = !!state.composeNestedContext;
    document.querySelectorAll(".key-basic-main, .key-basic-alt").forEach((node) => { node.hidden = !c.hasMainAlt; });
    document.querySelectorAll(".key-basic-label").forEach((node) => { node.hidden = !c.hasLabel; });
    document.querySelectorAll(".key-basic-sublabel").forEach((node) => { node.hidden = !c.hasSubLabel; });
    document.querySelectorAll(".key-basic-weight, .key-basic-row-height").forEach((node) => { node.hidden = inComposeEdit; });
    const displayBtn = el("layout-key-open-display-text");
    const labelsBtn = el("layout-key-open-labels");
    const macroBtn = el("layout-key-open-macro");
    const colorsBtn = el("layout-key-open-colors");
    const composeBtn = el("layout-key-open-compose");
    if (displayBtn) displayBtn.disabled = !c.hasDisplayText;
    if (labelsBtn) labelsBtn.disabled = !(c.hasSwipeLabel || c.hasMacroLabels);
    if (macroBtn) macroBtn.disabled = !(c.hasTapAction || c.hasSwipeAction || c.hasLongPressAction);
    if (colorsBtn) colorsBtn.disabled = inComposeEdit && !isComposeIndependentColorEnabled();
    if (composeBtn) composeBtn.disabled = !!state.composeNestedContext;
    if (!c.hasDisplayText && keyDialogState.draft) delete keyDialogState.draft.displayText;
    if (!c.hasSwipeLabel && keyDialogState.draft) delete keyDialogState.draft.swipeLabel;
    if (!c.hasMacroLabels && keyDialogState.draft) {
      delete keyDialogState.draft.altLabel;
      delete keyDialogState.draft.longPressLabel;
    }
    if (!c.hasTapAction && keyDialogState.draft) delete keyDialogState.draft.tap;
    if (!c.hasSwipeAction && keyDialogState.draft) delete keyDialogState.draft.swipe;
    if (!c.hasLongPressAction && keyDialogState.draft) delete keyDialogState.draft.longPress;
    if (inComposeEdit && keyDialogState.draft) {
      delete keyDialogState.draft.weight;
      delete keyDialogState.draft.rowHeightPercent;
    }
    refreshKeyDialogSummaries();
    syncKeyDialogActionButtons();
  }

  function syncKeyDialogActionButtons() {
    const inComposeEdit = !!state.composeNestedContext;
    const deleteBtn = el("layout-key-delete");
    const clearComposeBtn = el("layout-key-compose-clear");
    if (deleteBtn) deleteBtn.hidden = inComposeEdit;
    if (clearComposeBtn) clearComposeBtn.hidden = !inComposeEdit;
  }

  function refreshKeyDialogSummaries() {
    const key = keyDialogState.draft || {};
    const type = key.type || "AlphabetKey";
    const c = keyTypeCapabilities(type);
    const displaySummary = !c.hasDisplayText ? "显示文本：当前类型不适用" :
      (key.displayText == null ? "显示文本：未设置" :
        (typeof key.displayText === "string" ? `显示文本：${key.displayText || "(空)"}` : `显示文本：${Object.keys(key.displayText || {}).length} 条映射`));
    setStatus("layout-key-display-text-summary", displaySummary, "");
    const labelParts = [];
    if (c.hasSwipeLabel) labelParts.push(`swipeLabel${key.swipeLabel ? "✓" : "×"}`);
    if (c.hasMacroLabels) {
      labelParts.push(`altLabel${key.altLabel ? "✓" : "×"}`);
      labelParts.push(`longPressLabel${key.longPressLabel ? "✓" : "×"}`);
    }
    setStatus("layout-key-labels-summary", `标签：${labelParts.length ? labelParts.join(" / ") : "当前类型不适用"}`, "");
    const macroParts = [];
    if (c.hasTapAction) macroParts.push(`tap${key.tap ? "✓" : "×"}`);
    if (c.hasSwipeAction) macroParts.push(`swipe${key.swipe ? "✓" : "×"}`);
    if (c.hasLongPressAction) macroParts.push(`longPress${key.longPress ? "✓" : "×"}`);
    setStatus("layout-key-macro-summary", `事件：${macroParts.length ? macroParts.join(" / ") : "当前类型不适用"}`, "");
    const colorFields = availableColorFieldsForType(type);
    const colorSet = colorFields.filter((f) => key[f.customKey] != null || key[f.monetKey] != null).length;
    setStatus("layout-key-color-summary", `颜色覆盖：${colorSet}/${colorFields.length}`, "");
    setStatus("layout-key-compose-summary", `合成中覆盖：${key.composeOverride ? "已设置" : "未设置"}${key.composeOverride?.independentColor ? "，独立按键颜色" : ""}`, "");
  }

  function updateDraftFromMainFields() {
    if (!keyDialogState.draft) keyDialogState.draft = {};
    applyMainFieldsToDraft(keyDialogState.draft);
    refreshKeyDialogSummaries();
  }

  function applyMainFieldsToDraft(key) {
    const type = el("layout-key-type").value.trim();
    const main = el("layout-key-main").value;
    const alt = el("layout-key-alt").value;
    const label = el("layout-key-label").value;
    const subLabel = el("layout-key-sub-label").value;
    const weightRaw = el("layout-key-weight").value.trim();
    const rowHeightRaw = el("layout-key-row-height").value.trim();
    const inComposeEdit = !!state.composeNestedContext;
    if (type) key.type = type;
    if (main.trim()) key.main = main; else delete key.main;
    if (alt.trim()) key.alt = alt; else delete key.alt;
    if (label.trim()) key.label = label; else delete key.label;
    if (subLabel.trim()) key.subLabel = subLabel; else delete key.subLabel;
    if (inComposeEdit) {
      delete key.weight;
      delete key.rowHeightPercent;
    } else if (weightRaw) {
      const w = Number(weightRaw);
      if (!Number.isFinite(w) || w < 0 || w > 1) throw new Error("weight 必须在 0..1");
      key.weight = w;
    } else {
      delete key.weight;
    }
    if (!inComposeEdit) {
      if (rowHeightRaw) key.rowHeightPercent = rowHeightRaw;
      else delete key.rowHeightPercent;
    }
  }

  function saveLayoutKeyDialog() {
    try {
      if (state.composeNestedContext) {
        updateDraftFromMainFields();
        syncComposeMetaToParentDraft();
        const key = deepClone(keyDialogState.draft || {});
        normalizeRowHeightKey(key);
        if (!key.type) throw new Error("type 不能为空");
        finishComposeNestedEdit(true);
        return;
      }
      const rowIndex = keyDialogState.rowIndex;
      const keyIndex = keyDialogState.keyIndex;
      const rows = getRows();
      if (!rows[rowIndex]) throw new Error("目标行不存在");
      updateDraftFromMainFields();
      const key = deepClone(keyDialogState.draft || {});
      normalizeRowHeightKey(key);
      if (!key.type) throw new Error("type 不能为空");
      if (keyIndex >= 0 && keyIndex < rows[rowIndex].length) rows[rowIndex][keyIndex] = key;
      else rows[rowIndex].push(key);
      el("layout-key-dialog").close();
      syncLayoutUiFromState();
    } catch (e) {
      setStatus("layout-key-dialog-status", `保存失败：${e.message}`, "err");
    }
  }

  function setStructuredField(id, value) {
    const node = el(id);
    if (!node) return;
    if (value == null) {
      node.value = "";
    } else if (typeof value === "string") {
      node.value = value;
    } else {
      node.value = prettyJson(value);
    }
  }

  function applyOptionalStructuredRaw(target, key, rawValue) {
    const raw = String(rawValue ?? "").trim();
    if (!raw) {
      delete target[key];
      return;
    }
    if (raw.startsWith("{") || raw.startsWith("[")) {
      target[key] = JSON.parse(raw);
    } else {
      target[key] = raw;
    }
  }

  function openDisplayTextDialog() {
    updateDraftFromMainFields();
    const key = keyDialogState.draft || {};
    const mode = key.displayText && typeof key.displayText === "object" && !Array.isArray(key.displayText) ? "mapping" : "simple";
    el("layout-key-display-mode").value = mode;
    el("layout-key-display-simple").value = typeof key.displayText === "string" ? key.displayText : "";
    const rows = el("layout-key-display-map-rows");
    rows.innerHTML = "";
    if (mode === "mapping") {
      const entries = Object.entries(key.displayText || {});
      if (entries.length) entries.forEach(([k, v]) => appendDisplayMapRow(k, String(v)));
      else appendDisplayMapRow("", "");
    }
    updateDisplayTextDialogVisibility();
    el("layout-key-display-dialog").showModal();
  }

  function appendDisplayMapRow(mode = "", value = "") {
    const row = document.createElement("div");
    row.className = "display-map-row";
    row.innerHTML = `
      <input type="text" class="display-map-key" placeholder="模式名称" value="${escapeAttr(mode)}">
      <input type="text" class="display-map-value" placeholder="显示值" value="${escapeAttr(value)}">
      <button type="button" class="display-map-delete">删</button>
    `;
    row.querySelector(".display-map-delete").addEventListener("click", () => row.remove());
    el("layout-key-display-map-rows").appendChild(row);
  }

  function updateDisplayTextDialogVisibility() {
    const mapping = el("layout-key-display-mode").value === "mapping";
    el("layout-key-display-simple-wrap").hidden = mapping;
    el("layout-key-display-map-wrap").hidden = !mapping;
  }

  function saveDisplayTextDialog() {
    const key = keyDialogState.draft || {};
    const mapping = el("layout-key-display-mode").value === "mapping";
    if (!mapping) {
      const text = el("layout-key-display-simple").value.trim();
      if (text) key.displayText = text;
      else delete key.displayText;
    } else {
      const rows = Array.from(el("layout-key-display-map-rows").querySelectorAll(".display-map-row"));
      const map = {};
      rows.forEach((row) => {
        const mode = row.querySelector(".display-map-key").value.trim();
        const value = row.querySelector(".display-map-value").value.trim();
        if (mode && value) map[mode] = value;
      });
      if (Object.keys(map).length) key.displayText = map;
      else delete key.displayText;
    }
    keyDialogState.draft = key;
    refreshKeyDialogSummaries();
    el("layout-key-display-dialog").close();
  }

  function openLabelsDialog() {
    updateDraftFromMainFields();
    const key = keyDialogState.draft || {};
    const c = keyTypeCapabilities(key.type || "AlphabetKey");
    el("layout-key-labels-swipe").value = key.swipeLabel || "";
    el("layout-key-labels-alt").value = key.altLabel || "";
    el("layout-key-labels-long-press").value = key.longPressLabel || "";
    const swipeRow = el("layout-key-labels-swipe")?.closest(".form-row");
    const altRow = el("layout-key-labels-alt")?.closest(".form-row");
    const longPressRow = el("layout-key-labels-long-press")?.closest(".form-row");
    if (swipeRow) swipeRow.hidden = !c.hasSwipeLabel;
    if (altRow) altRow.hidden = !c.hasMacroLabels;
    if (longPressRow) longPressRow.hidden = !c.hasMacroLabels;
    el("layout-key-labels-dialog").showModal();
  }

  function saveLabelsDialog() {
    const key = keyDialogState.draft || {};
    const c = keyTypeCapabilities(key.type || "AlphabetKey");
    if (c.hasSwipeLabel) {
      const swipe = el("layout-key-labels-swipe").value.trim();
      if (swipe) key.swipeLabel = swipe; else delete key.swipeLabel;
    } else {
      delete key.swipeLabel;
    }
    if (c.hasMacroLabels) {
      const alt = el("layout-key-labels-alt").value.trim();
      const longPress = el("layout-key-labels-long-press").value.trim();
      if (alt) key.altLabel = alt; else delete key.altLabel;
      if (longPress) key.longPressLabel = longPress; else delete key.longPressLabel;
    } else {
      delete key.altLabel;
      delete key.longPressLabel;
    }
    keyDialogState.draft = key;
    refreshKeyDialogSummaries();
    el("layout-key-labels-dialog").close();
  }

  function openMacroDialog() {
    updateDraftFromMainFields();
    const key = keyDialogState.draft || {};
    const c = keyTypeCapabilities(key.type || "AlphabetKey");
    el("layout-key-macro-edit-tap").disabled = !c.hasTapAction;
    el("layout-key-macro-clear-tap").disabled = !c.hasTapAction;
    el("layout-key-macro-edit-swipe").disabled = !c.hasSwipeAction;
    el("layout-key-macro-clear-swipe").disabled = !c.hasSwipeAction;
    el("layout-key-macro-edit-long-press").disabled = !c.hasLongPressAction;
    el("layout-key-macro-clear-long-press").disabled = !c.hasLongPressAction;
    setStatus("layout-key-macro-tap-summary", formatMacroStepsSummary(readMacroStepsFromAction(key.tap)), "");
    setStatus("layout-key-macro-swipe-summary", formatMacroStepsSummary(readMacroStepsFromAction(key.swipe)), "");
    setStatus("layout-key-macro-long-press-summary", formatMacroStepsSummary(readMacroStepsFromAction(key.longPress)), "");
    el("layout-key-macro-dialog").showModal();
  }

  function saveMacroDialog() {
    const key = keyDialogState.draft || {};
    const c = keyTypeCapabilities(key.type || "AlphabetKey");
    if (!c.hasTapAction) delete key.tap;
    if (!c.hasSwipeAction) delete key.swipe;
    if (!c.hasLongPressAction) delete key.longPress;
    keyDialogState.draft = key;
    refreshKeyDialogSummaries();
    el("layout-key-macro-dialog").close();
  }

  function readMacroStepsFromAction(action) {
    if (!action || typeof action !== "object" || Array.isArray(action)) return [];
    const steps = Array.isArray(action.macro) ? action.macro : [];
    return steps.map(parseMacroStep).filter(Boolean);
  }

  function parseMacroStep(step) {
    if (!step || typeof step !== "object" || Array.isArray(step)) return null;
    const type = typeof step.type === "string" ? step.type : "tap";
    if (type === "layer") {
      return {
        type,
        keys: [{ keyType: "fcitx", code: normalizeLayerMode(step.mode) }],
        text: String(step.target || "")
      };
    }
    if (type === "text") {
      return { type, keys: [], text: String(step.text || "") };
    }
    if (type === "edit") {
      return { type, keys: [{ keyType: "fcitx", code: String(step.action || "copy") }], text: "" };
    }
    if (type === "app") {
      return { type, keys: [{ keyType: "fcitx", code: String(step.id || "theme") }], text: "" };
    }
    if (type === "shortcut") {
      const keys = [];
      const modifiers = Array.isArray(step.modifiers) ? step.modifiers : [];
      modifiers.forEach((k) => {
        const parsed = parseMacroKey(k);
        if (parsed) keys.push(parsed);
      });
      const key = parseMacroKey(step.key);
      if (key) keys.push(key);
      return { type, keys, text: "" };
    }
    const keys = Array.isArray(step.keys) ? step.keys.map(parseMacroKey).filter(Boolean) : [];
    return { type, keys, text: String(step.text || "") };
  }

  function parseMacroKey(v) {
    if (!v || typeof v !== "object" || Array.isArray(v)) return null;
    if (v.android != null) return { keyType: "android", code: String(v.android) };
    if (v.fcitx != null) return { keyType: "fcitx", code: String(v.fcitx) };
    return null;
  }

  function normalizeLayerMode(raw) {
    return String(raw || "").toLowerCase() === "osl" ? "osl" : "to";
  }

  function sanitizeMacroKeys(rawKeys) {
    const seen = new Set();
    const allowed = new Set(macroFcitxKeys);
    const out = [];
    (Array.isArray(rawKeys) ? rawKeys : []).forEach((key) => {
      const code = String(key?.code || "").trim();
      if (!code || !allowed.has(code) || seen.has(code)) return;
      seen.add(code);
      out.push({ keyType: "fcitx", code });
    });
    return out;
  }

  function firstMacroCode(preferNonModifier = false, used = []) {
    const usedSet = new Set((used || []).map((k) => k.code));
    for (const code of macroFcitxKeys) {
      if (usedSet.has(code)) continue;
      if (preferNonModifier && macroModifierKeys.has(code)) continue;
      return code;
    }
    return preferNonModifier ? "A" : (macroFcitxKeys[0] || "A");
  }

  function normalizeStepForType(step, nextType) {
    step.type = nextType;
    const keys = sanitizeMacroKeys(step.keys);
    if (nextType === "edit") {
      const prev = String(keys[0]?.code || "");
      const next = macroEditActions.includes(prev) ? prev : (macroEditActions[0] || "copy");
      step.keys = [{ keyType: "fcitx", code: next }];
      step.text = "";
      return;
    }
    if (nextType === "app") {
      const prev = String(keys[0]?.code || "");
      const next = macroAppActions.includes(prev) ? prev : (macroAppActions[0] || "theme");
      step.keys = [{ keyType: "fcitx", code: next }];
      step.text = "";
      return;
    }
    if (nextType === "layer") {
      const prevMode = String(step.keys?.[0]?.code || "");
      step.keys = [{ keyType: "fcitx", code: normalizeLayerMode(prevMode) }];
      step.text = String(step.text || "");
      return;
    }
    if (nextType === "text") {
      step.keys = [];
      step.text = String(step.text || "");
      return;
    }
    if (nextType === "shortcut") {
      const modifiers = keys.filter((k) => macroModifierKeys.has(k.code));
      const nonModifiers = keys.filter((k) => !macroModifierKeys.has(k.code));
      const safeModifiers = modifiers.length ? modifiers : [{ keyType: "fcitx", code: "Ctrl_L" }];
      const target = nonModifiers[0] || { keyType: "fcitx", code: firstMacroCode(true, safeModifiers) };
      step.keys = [...safeModifiers, target];
      step.text = "";
      return;
    }
    if (nextType === "tap" || nextType === "down" || nextType === "up") {
      step.keys = keys.length ? keys : [{ keyType: "fcitx", code: firstMacroCode(false) }];
      step.text = "";
      return;
    }
    step.keys = keys;
    step.text = String(step.text || "");
  }

  function formatMacroStepsSummary(steps) {
    if (!steps.length) return "未设置";
    const preview = steps.slice(0, 3).map((s) => {
      if (s.type === "text") return `text("${(s.text || "").slice(0, 8)}")`;
      if (s.type === "layer") return `layer(${normalizeLayerMode(s.keys?.[0]?.code)}:${s.text || "?"})`;
      if (s.type === "edit" || s.type === "app") return `${s.type}:${s.keys?.[0]?.code || "?"}`;
      return `${s.type}[${(s.keys || []).map((k) => k.code).join("+")}]`;
    }).join(" -> ");
    return steps.length > 3 ? `${preview} ... (${steps.length} steps)` : preview;
  }

  function openMacroEventEditor(eventName) {
    resetMacroStepDragState();
    const key = keyDialogState.draft || {};
    const actionKey = eventName === "tap" ? "tap" : eventName === "swipe" ? "swipe" : "longPress";
    state.macroEventEditor = {
      eventName,
      steps: readMacroStepsFromAction(key[actionKey])
    };
    renderMacroEventEditor();
    const eventNameMap = { tap: "点击事件", swipe: "划动事件", longPress: "长按事件" };
    el("layout-key-macro-event-title").textContent = `编辑 ${eventNameMap[eventName] || eventName}`;
    el("layout-key-macro-event-dialog").showModal();
  }

  function renderMacroEventEditor() {
    const root = el("layout-key-macro-event-steps");
    root.innerHTML = "";
    state.macroEventEditor.steps.forEach((step, index) => {
      const row = document.createElement("div");
      row.className = "macro-step-row";
      row.dataset.stepIndex = String(index);
      row.title = "长按空白区域可拖拽调整顺序";
      if (state.macroStepDragActive && state.macroStepDrag === index) {
        row.classList.add("dragging");
      }
      row.innerHTML = `
        <div class="macro-step-body"></div>
      `;
      bindMacroStepDrag(row, index);
      const body = row.querySelector(".macro-step-body");
      const typeSel = document.createElement("select");
      typeSel.className = "macro-step-type macro-chip-select";
      typeSel.innerHTML = macroStepTypes.map((t) => `<option value="${escapeAttr(t)}">${escapeHtml(macroStepTypeLabels[t] || t)}</option>`).join("");
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "macro-chip macro-step-delete";
      deleteBtn.textContent = "删除";
      typeSel.value = step.type || "tap";
      const renderBody = () => renderMacroStepBody(body, step, typeSel.value, deleteBtn, typeSel);
      typeSel.addEventListener("change", () => {
        normalizeStepForType(step, typeSel.value);
        renderBody();
      });
      deleteBtn.addEventListener("click", () => {
        state.macroEventEditor.steps.splice(index, 1);
        renderMacroEventEditor();
      });
      renderBody();
      root.appendChild(row);
    });
  }

  function renderMacroStepBody(body, step, stepType, deleteBtn, typeSel) {
    body.innerHTML = "";
    if (typeSel) body.appendChild(typeSel);
    if (stepType === "text") {
      const input = document.createElement("textarea");
      input.className = "json-editor compact macro-chip macro-chip-text";
      input.placeholder = "输入文本";
      input.value = step.text || "";
      input.addEventListener("input", () => { step.text = input.value; });
      body.appendChild(input);
      body.appendChild(deleteBtn);
      return;
    }
    if (stepType === "edit" || stepType === "app") {
      const select = document.createElement("select");
      select.className = "macro-chip-select";
      const options = stepType === "edit" ? macroEditActions : macroAppActions;
      const preferred = String(step.keys?.[0]?.code || "");
      const current = options.includes(preferred) ? preferred : (options[0] || "");
      select.innerHTML = options.map((v) => `<option value="${escapeAttr(v)}">${escapeHtml(stepType === "edit" ? (macroEditActionLabels[v] || v) : v)}</option>`).join("");
      if (current) select.value = current;
      step.keys = [{ keyType: "fcitx", code: select.value }];
      select.addEventListener("change", () => { step.keys = [{ keyType: "fcitx", code: select.value }]; });
      body.appendChild(select);
      body.appendChild(deleteBtn);
      return;
    }
    if (stepType === "layer") {
      const mode = document.createElement("select");
      mode.className = "macro-chip-select";
      mode.innerHTML = `<option value="to">${macroLayerModeLabels.to}</option><option value="osl">${macroLayerModeLabels.osl}</option>`;
      mode.value = normalizeLayerMode(step.keys?.[0]?.code);
      const target = document.createElement("select");
      target.className = "macro-chip-select";
      const targets = Array.from(new Set([step.text, ...allEntryKeys()].filter(Boolean)));
      target.innerHTML = targets.map((v) => `<option value="${escapeAttr(v)}">${escapeHtml(v)}</option>`).join("");
      if (targets.length) target.value = targets.includes(step.text) ? step.text : targets[0];
      step.keys = [{ keyType: "fcitx", code: mode.value }];
      step.text = target.value || "";
      mode.addEventListener("change", () => { step.keys = [{ keyType: "fcitx", code: normalizeLayerMode(mode.value) }]; });
      target.addEventListener("change", () => { step.text = target.value; });
      body.appendChild(mode);
      body.appendChild(target);
      body.appendChild(deleteBtn);
      return;
    }
    const list = document.createElement("div");
    list.className = "macro-key-list";
    const keys = Array.isArray(step.keys) ? step.keys : [];
    const describeKey = (key) => getMacroKeyDisplayName(key.code || "");
    const renderKeys = () => {
      list.innerHTML = "";
      keys.forEach((key, idx) => {
        key.keyType = "fcitx";
        const row = document.createElement("div");
        row.className = "macro-key-row";
        row.innerHTML = `
          <select class="macro-key-code-select macro-chip-select"></select>
          <button type="button" class="macro-key-delete macro-chip">删</button>
        `;
        const codeSel = row.querySelector(".macro-key-code-select");
        const syncOptions = () => {
          const options = macroFcitxKeys;
          const values = options.includes(key.code) || !key.code ? options : [key.code, ...options];
          codeSel.innerHTML = values.map((v) => `<option value="${escapeAttr(v)}">${escapeHtml(getMacroKeyDisplayName(v))}</option>`).join("");
          codeSel.value = key.code || values[0] || "";
          key.code = codeSel.value;
          codeSel.title = describeKey(key);
        };
        syncOptions();
        codeSel.addEventListener("change", () => {
          const previous = key.code;
          key.keyType = "fcitx";
          key.code = codeSel.value;
          const duplicate = keys.some((other) => other !== key && other.code === key.code);
          if (duplicate) {
            alert(`按键 ${key.code} 已存在`);
            key.code = previous;
            codeSel.value = previous;
          }
          codeSel.title = describeKey(key);
        });
        row.querySelector(".macro-key-delete").addEventListener("click", () => {
          keys.splice(idx, 1);
          step.keys = keys;
          renderKeys();
        });
        list.appendChild(row);
      });
      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "macro-chip macro-chip-add";
      addBtn.textContent = "+ 按键";
      addBtn.addEventListener("click", () => {
        const next = firstAvailableMacroKey(keys);
        if (!next) {
          alert("没有可新增的按键");
          return;
        }
        keys.push({ keyType: "fcitx", code: next });
        step.keys = keys;
        renderKeys();
      });
      list.appendChild(addBtn);
    };
    renderKeys();
    body.appendChild(list);
    body.appendChild(deleteBtn);
  }

  function getMacroKeyDisplayName(code) {
    const raw = String(code || "").trim();
    if (!raw) return "未设置";
    if (/^[A-Z0-9]$/.test(raw) || /^F\d+$/.test(raw)) return raw;
    if (raw === "BackSpace") return "Backspace";
    if (raw === "Page_Up") return "Page Up";
    if (raw === "Page_Down") return "Page Down";
    if (raw === "Scroll_Lock") return "Scroll Lock";
    if (raw === "Caps_Lock") return "Caps Lock";
    if (raw === "Num_Lock") return "Num Lock";
    if (raw === "HomePage") return "Home Page";
    if (raw.startsWith("XF86")) return raw.slice(4);
    return raw.replace(/_/g, " ");
  }

  function addMacroEventStep() {
    const error = validateMacroSteps(normalizeMacroStepsForSave(state.macroEventEditor.steps), false);
    if (error) {
      alert(error);
      return;
    }
    state.macroEventEditor.steps.push({ type: "tap", keys: [{ keyType: "fcitx", code: firstAvailableMacroKey([]) || "A" }], text: "" });
    renderMacroEventEditor();
  }

  function saveMacroEventEditor() {
    resetMacroStepDragState();
    const normalized = normalizeMacroStepsForSave(state.macroEventEditor.steps);
    const error = validateMacroSteps(normalized, true);
    if (error) {
      alert(error);
      return;
    }
    const action = buildMacroActionFromSteps(normalized);
    const key = keyDialogState.draft || {};
    const actionKey = state.macroEventEditor.eventName === "tap"
      ? "tap"
      : state.macroEventEditor.eventName === "swipe"
        ? "swipe"
        : "longPress";
    if (action) key[actionKey] = action;
    else delete key[actionKey];
    keyDialogState.draft = key;
    el("layout-key-macro-event-dialog").close();
    openMacroDialog();
    refreshKeyDialogSummaries();
  }

  function normalizeMacroStepsForSave(steps) {
    return steps.map((step) => {
      const type = step.type || "tap";
      const keys = Array.isArray(step.keys) ? step.keys.map((k) => ({ keyType: "fcitx", code: String(k.code || "").trim() })).filter((k) => k.code) : [];
      const text = String(step.text || "");
      return { type, keys, text };
    });
  }

  function validateMacroSteps(steps, includeKeyBalance) {
    for (let i = 0; i < steps.length; i += 1) {
      const step = steps[i];
      const n = i + 1;
      const keys = step.keys || [];
      if (step.type === "text" && !step.text.trim()) return "文本不能为空";
      if ((step.type === "tap" || step.type === "down" || step.type === "up") && !keys.length) return `步骤 ${n} 至少需要一个按键`;
      if (step.type === "tap" || step.type === "down" || step.type === "up" || step.type === "shortcut") {
        const duplicate = firstDuplicateMacroKey(keys);
        if (duplicate) return `步骤 ${n} 中按键 ${duplicate} 已存在`;
      }
      if (step.type === "shortcut") {
        const modifiers = keys.filter((k) => macroModifierKeys.has(k.code));
        const nonModifiers = keys.filter((k) => !macroModifierKeys.has(k.code));
        if (!modifiers.length) return `步骤 ${n} 需要至少一个修饰键（Ctrl/Alt/Shift/Meta）`;
        if (nonModifiers.length !== 1) return `步骤 ${n} 只能有一个目标按键`;
      }
      if (step.type === "edit" && !keys.length) return `步骤 ${n} 需要一个编辑动作`;
      if (step.type === "app" && !keys.length) return `步骤 ${n} 需要一个应用动作`;
      if (step.type === "layer") {
        if (!step.text.trim()) return `步骤 ${n} 需要填写目标布局`;
        const targets = allEntryKeys();
        if (targets.length && !targets.includes(step.text)) return `步骤 ${n} 的目标布局无效`;
      }
    }

    if (!includeKeyBalance) return "";

    const counts = new Map();
    const bump = (key, down, up) => {
      const id = `${key.keyType || "fcitx"}:${key.code}`;
      const prev = counts.get(id) || { down: 0, up: 0 };
      prev.down += down;
      prev.up += up;
      counts.set(id, prev);
    };
    steps.forEach((step) => {
      if (step.type === "tap") {
        step.keys.forEach((key) => bump(key, 1, 1));
      } else if (step.type === "down") {
        step.keys.forEach((key) => bump(key, 1, 0));
      } else if (step.type === "up") {
        step.keys.forEach((key) => bump(key, 0, 1));
      } else if (step.type === "shortcut") {
        const modifiers = step.keys.filter((k) => macroModifierKeys.has(k.code));
        const nonModifier = step.keys.find((k) => !macroModifierKeys.has(k.code));
        modifiers.forEach((key) => bump(key, 1, 1));
        if (nonModifier) bump(nonModifier, 1, 1);
      }
    });
    const unmatched = Array.from(counts.entries()).filter(([, c]) => c.down !== c.up).map(([id]) => id);
    return unmatched.length ? `按键 down/up 数量不匹配：${unmatched.join(", ")}` : "";
  }

  function firstDuplicateMacroKey(keys) {
    const seen = new Set();
    for (const key of keys || []) {
      const code = String(key.code || "").trim();
      if (!code) continue;
      const id = `fcitx:${code}`;
      if (seen.has(id)) return code;
      seen.add(id);
    }
    return "";
  }

  function firstAvailableMacroKey(keys) {
    const used = new Set((keys || []).map((k) => String(k.code || "").trim()).filter(Boolean));
    return macroFcitxKeys.find((k) => !used.has(k)) || "";
  }

  function buildMacroActionFromSteps(steps) {
    const mapped = steps.map((step) => {
      const type = step.type;
      if (type === "text") return { type: "text", text: step.text || "" };
      if (type === "edit") return { type: "edit", action: step.keys?.[0]?.code || "copy" };
      if (type === "app") return { type: "app", id: step.keys?.[0]?.code || "theme" };
      if (type === "layer") return { type: "layer", mode: normalizeLayerMode(step.keys?.[0]?.code), target: step.text || "" };
      if (type === "shortcut") {
        const keys = step.keys || [];
        const modifiers = keys.filter((k) => macroModifierKeys.has(k.code)).map((k) => ({ fcitx: k.code }));
        const nonModifier = keys.find((k) => !macroModifierKeys.has(k.code));
        if (!modifiers.length || !nonModifier) return null;
        return { type: "shortcut", modifiers, key: { fcitx: nonModifier.code } };
      }
      const keys = (step.keys || []).map((k) => ({ fcitx: k.code }));
      return keys.length ? { type, keys } : null;
    }).filter(Boolean);
    return mapped.length ? { macro: mapped } : null;
  }

  function availableColorFieldsForType(type) {
    return keyColorFields.filter((f) => !f.supportedTypes || f.supportedTypes.has(type));
  }

  function colorModeFromKeyField(key, field) {
    const monet = key[field.monetKey];
    if (typeof monet === "string" && monet.trim()) return monet.startsWith("theme:") ? "theme" : "monet";
    return key[field.customKey] == null ? "inherit" : "custom";
  }

  function formatColorCode(value) {
    const n = parseColorValue(String(value ?? "").trim());
    if (n == null) return "";
    const unsigned = n >>> 0;
    return `#${unsigned.toString(16).toUpperCase().padStart(8, "0")}`;
  }

  function parseAlphaByte(raw) {
    const n = Number(String(raw ?? "").trim());
    if (!Number.isFinite(n)) return 255;
    return Math.max(0, Math.min(255, Math.round(n)));
  }

  function toSignedInt32(unsigned) {
    const u = unsigned >>> 0;
    return u > 0x7fffffff ? u - 0x100000000 : u;
  }

  function openColorsDialog() {
    updateDraftFromMainFields();
    if (state.composeNestedContext && !isComposeIndependentColorEnabled()) return;
    const key = keyDialogState.draft || {};
    const fields = availableColorFieldsForType(key.type || "AlphabetKey");
    const root = el("layout-key-colors-rows");
    root.innerHTML = "";
    fields.forEach((field) => {
      const row = document.createElement("div");
      row.className = "color-edit-row";
      const mode = colorModeFromKeyField(key, field);
      const monetRef = typeof key[field.monetKey] === "string" ? key[field.monetKey] : "";
      const themeToken = monetRef.startsWith("theme:") ? monetRef.slice("theme:".length) : "";
      const monetToken = monetRef && !monetRef.startsWith("theme:") ? monetRef : "";
      const customColorInt = key[field.customKey] == null ? null : parseColorValue(String(key[field.customKey]));
      const customColor = customColorInt == null ? "" : formatColorCode(customColorInt);
      row.innerHTML = `
        <label>${escapeHtml(field.label)}</label>
        <select class="color-mode">
          <option value="inherit">跟随主题</option>
          <option value="theme">引用主题颜色</option>
          <option value="monet">Monet 动态颜色</option>
          <option value="custom">自定义颜色</option>
        </select>
        <select class="color-theme-select">${themeColorTokens.map((t) => `<option value="${escapeAttr(t)}">${escapeHtml(t)}</option>`).join("")}</select>
        <select class="color-monet-select">${monetResourceIds.map((t) => `<option value="${escapeAttr(t)}">${escapeHtml(t)}</option>`).join("")}</select>
        <input class="color-custom-input" type="text" data-jscolor="{}" placeholder="#AARRGGBB" value="${escapeAttr(customColor)}">
      `;
      row.dataset.customKey = field.customKey;
      row.dataset.monetKey = field.monetKey;
      const modeSel = row.querySelector(".color-mode");
      const themeSel = row.querySelector(".color-theme-select");
      const monetSel = row.querySelector(".color-monet-select");
      const customInput = row.querySelector(".color-custom-input");
      if (themeToken && themeColorTokens.includes(themeToken)) themeSel.value = themeToken;
      if (monetToken && monetResourceIds.includes(monetToken)) monetSel.value = monetToken;
      modeSel.value = mode;
      const syncState = () => {
        const m = modeSel.value;
        themeSel.hidden = m !== "theme";
        monetSel.hidden = m !== "monet";
        customInput.hidden = m !== "custom";
      };
      modeSel.addEventListener("change", syncState);
      customInput.addEventListener("pointerdown", () => {
        syncInlinePickerFromArgbInput(customInput, false);
      });
      customInput.addEventListener("click", () => {
        positionInlineColorPicker(customInput);
      });
      customInput.addEventListener("input", () => {
        syncInlinePickerFromArgbInput(customInput, false);
      });
      customInput.addEventListener("change", () => {
        syncInlinePickerFromArgbInput(customInput);
      });
      syncState();
      root.appendChild(row);
      installInlineColorPicker(customInput, row);
    });
    el("layout-key-colors-dialog").showModal();
  }

  function installInlineColorPicker(input, row) {
    if (!window.jscolor || input.jscolor) return;
    try {
      const picker = new window.jscolor(input, {
        hash: true,
        closeButton: true,
        showOnClick: true,
        format: "hexa",
        alphaChannel: true,
        container: el("layout-key-colors-dialog"),
        valueElement: null,
        onInput: () => {
          syncArgbInputFromInlinePicker(input);
          positionInlineColorPicker(input);
        }
      });
      const originalShow = picker.show.bind(picker);
      picker.show = () => {
        const result = originalShow();
        positionInlineColorPicker(input, true);
        return result;
      };
      syncInlinePickerFromArgbInput(input);
    } catch (_) {}
  }

  function positionInlineColorPicker(input, immediate = false) {
    const placePicker = () => {
      const dialog = el("layout-key-colors-dialog");
      const wrap = dialog?.querySelector(".jscolor-wrap");
      if (!wrap || !input.classList.contains("jscolor-active")) return;
      const rect = input.getBoundingClientRect();
      wrap.style.position = "fixed";
      wrap.style.left = `${Math.round(rect.left)}px`;
      wrap.style.top = `${Math.round(rect.bottom + 4)}px`;
      wrap.style.zIndex = "100000";
    };

    if (immediate) placePicker();
    requestAnimationFrame(placePicker);
  }

  function syncArgbInputFromInlinePicker(input) {
    const picker = input.jscolor;
    if (!picker) return;
    const rgba = picker.toHEXAString?.() || picker.toHEXString?.();
    const argb = rgbaHexToArgbHex(rgba);
    if (argb) input.value = argb;
  }

  function syncInlinePickerFromArgbInput(input, normalizeInput = true) {
    const picker = input.jscolor;
    if (!picker) return;
    const rgba = argbHexToRgbaHex(input.value);
    if (!rgba) return;
    try {
      picker.fromString(rgba);
      if (normalizeInput) syncArgbInputFromInlinePicker(input);
    } catch (_) {}
  }

  function argbHexToRgbaHex(raw) {
    const color = parseColorValue(String(raw || "").trim());
    if (color == null) return "";
    const unsigned = color >>> 0;
    const a = (unsigned >>> 24) & 0xff;
    const r = (unsigned >>> 16) & 0xff;
    const g = (unsigned >>> 8) & 0xff;
    const b = unsigned & 0xff;
    return `#${hexByte(a)}${hexByte(b)}${hexByte(g)}${hexByte(r)}`;
  }

  function rgbaHexToArgbHex(raw) {
    const hex = String(raw || "").trim().replace(/^#/, "");
    if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(hex)) return "";
    const normalized = hex.toUpperCase();
    if (normalized.length === 6) {
      const b = normalized.slice(0, 2);
      const g = normalized.slice(2, 4);
      const r = normalized.slice(4, 6);
      return `#FF${r}${g}${b}`;
    }
    const a = normalized.slice(0, 2);
    const b = normalized.slice(2, 4);
    const g = normalized.slice(4, 6);
    const r = normalized.slice(6, 8);
    return `#${a}${r}${g}${b}`;
  }

  function hexByte(value) {
    return value.toString(16).toUpperCase().padStart(2, "0");
  }

  function saveColorsDialog() {
    const key = keyDialogState.draft || {};
    const available = new Set(availableColorFieldsForType(key.type || "AlphabetKey").map((f) => f.customKey));
    keyColorFields.forEach((f) => {
      if (!available.has(f.customKey)) {
        delete key[f.customKey];
        delete key[f.monetKey];
      }
    });
    Array.from(el("layout-key-colors-rows").querySelectorAll(".color-edit-row")).forEach((row) => {
      const customKey = row.dataset.customKey;
      const monetKey = row.dataset.monetKey;
      const mode = row.querySelector(".color-mode").value;
      if (mode === "inherit") {
        delete key[customKey];
        delete key[monetKey];
      } else if (mode === "theme") {
        key[monetKey] = `theme:${row.querySelector(".color-theme-select").value.trim()}`;
        delete key[customKey];
      } else if (mode === "monet") {
        key[monetKey] = row.querySelector(".color-monet-select").value.trim();
        delete key[customKey];
      } else {
        const parsed = parseColorValue(row.querySelector(".color-custom-input").value.trim());
        const color = parsed == null ? null : toSignedInt32(parsed >>> 0);
        if (color == null) {
          delete key[customKey];
          delete key[monetKey];
        } else {
          key[customKey] = color;
          delete key[monetKey];
        }
      }
    });
    keyDialogState.draft = key;
    refreshKeyDialogSummaries();
    el("layout-key-colors-dialog").close();
  }

  function openComposeDialog() {
    startComposeNestedEdit();
  }

  function syncComposeMetaToParentDraft() {
    if (!state.composeNestedContext) return;
    const composeDraft = keyDialogState.draft || {};
    if (el("layout-key-compose-independent").checked) composeDraft.independentColor = true;
    else delete composeDraft.independentColor;
    keyDialogState.draft = composeDraft;
  }

  function startComposeNestedEdit() {
    updateDraftFromMainFields();
    const parentDraft = keyDialogState.draft || {};
    const composeDraft = deepClone(parentDraft.composeOverride || { type: parentDraft.type || "AlphabetKey" });
    if (parentDraft.independentColor && composeDraft.independentColor == null) {
      composeDraft.independentColor = true;
    }
    delete parentDraft.independentColor;
    state.composeNestedContext = {
      rowIndex: keyDialogState.rowIndex,
      keyIndex: keyDialogState.keyIndex,
      draft: deepClone(parentDraft)
    };
    keyDialogState.rowIndex = -1;
    keyDialogState.keyIndex = -1;
    keyDialogState.draft = composeDraft;
    el("layout-key-dialog-title").textContent = "编辑合成中按键";
    el("layout-key-delete").disabled = true;
    populateMainKeyFieldsFromDraft();
    syncComposeInlineUi();
    syncKeyDialogActionButtons();
  }

  function clearComposeNested() {
    if (state.composeNestedContext) {
      const parent = state.composeNestedContext;
      delete parent.draft.composeOverride;
      syncComposeMetaToParentDraft();
      finishComposeNestedEdit(false);
      return;
    }
    updateDraftFromMainFields();
    const key = keyDialogState.draft || {};
    delete key.composeOverride;
    delete key.independentColor;
    keyDialogState.draft = key;
    setStatus("layout-key-compose-nested-summary", "未配置", "");
    refreshKeyDialogSummaries();
  }

  function syncComposeInlineUi() {
    const container = el("layout-key-compose-inline");
    if (!container) return;
    const inComposeEdit = !!state.composeNestedContext;
    container.hidden = !inComposeEdit;
    if (!inComposeEdit) return;
    const parentDraft = state.composeNestedContext?.draft || {};
    el("layout-key-compose-independent").checked = !!keyDialogState.draft?.independentColor;
    const currentType = (keyDialogState.draft && keyDialogState.draft.type) || parentDraft.composeOverride?.type || "未知";
    setStatus("layout-key-compose-nested-summary", `正在编辑 (${currentType})`, "");
    updateKeyDialogFieldVisibility((keyDialogState.draft && keyDialogState.draft.type) || "AlphabetKey");
  }

  function isComposeIndependentColorEnabled() {
    if (!state.composeNestedContext) return true;
    return !!keyDialogState.draft?.independentColor;
  }

  function clearComposeColorOverridesWhenInherited() {
    if (!state.composeNestedContext || isComposeIndependentColorEnabled()) return;
    const key = keyDialogState.draft || {};
    keyColorFields.forEach((field) => {
      delete key[field.customKey];
      delete key[field.monetKey];
    });
    keyDialogState.draft = key;
  }

  function finishComposeNestedEdit(save) {
    if (!state.composeNestedContext) return false;
    const parent = state.composeNestedContext;
    syncComposeMetaToParentDraft();
    clearComposeColorOverridesWhenInherited();
    const editedCompose = save ? deepClone(keyDialogState.draft || {}) : null;
    keyDialogState.rowIndex = parent.rowIndex;
    keyDialogState.keyIndex = parent.keyIndex;
    keyDialogState.draft = deepClone(parent.draft);
    if (save && editedCompose && editedCompose.type) {
      keyDialogState.draft.composeOverride = editedCompose;
    }
    state.composeNestedContext = null;
    el("layout-key-dialog-title").textContent = keyDialogState.keyIndex >= 0 ? "编辑按键" : "新增按键";
    el("layout-key-delete").disabled = keyDialogState.keyIndex < 0;
    populateMainKeyFieldsFromDraft();
    syncComposeInlineUi();
    syncKeyDialogActionButtons();
    refreshKeyDialogSummaries();
    return true;
  }

  function openKeyJsonDialog() {
    updateDraftFromMainFields();
    setLayoutKeyJsonText(prettyJson(keyDialogState.draft || {}));
    el("layout-key-json-dialog").showModal();
    void initLayoutKeyJsonEditor();
  }

  function saveKeyJsonDialog() {
    const parsed = JSON.parse(getLayoutKeyJsonText() || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("按键 JSON 必须是对象");
    keyDialogState.draft = deepClone(parsed);
    populateMainKeyFieldsFromDraft();
    el("layout-key-json-dialog").close();
  }

  function handleKeyDialogCancel() {
    if (state.composeNestedContext) {
      finishComposeNestedEdit(false);
      return;
    }
    el("layout-key-dialog").close();
  }

  function parseColorValue(raw) {
    if (!raw) return null;
    if (/^[0-9a-fA-F]{6}$|^[0-9a-fA-F]{8}$/.test(raw)) {
      const full = raw.length === 6 ? `FF${raw}` : raw;
      const unsigned = parseInt(full, 16) >>> 0;
      return unsigned > 0x7fffffff ? unsigned - 0x100000000 : unsigned;
    }
    if (raw.startsWith("#")) {
      const hex = raw.slice(1);
      if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$|^[0-9a-fA-F]{8}$/.test(hex)) throw new Error(`颜色格式无效：${raw}`);
      const full = hex.length === 6 ? `FF${hex}` : hex;
      const unsigned = parseInt(full, 16) >>> 0;
      return unsigned > 0x7fffffff ? unsigned - 0x100000000 : unsigned;
    }
    if (/^0x[0-9a-fA-F]+$/.test(raw)) {
      const unsigned = parseInt(raw.slice(2), 16) >>> 0;
      return unsigned > 0x7fffffff ? unsigned - 0x100000000 : unsigned;
    }
    const n = Number(raw);
    if (!Number.isInteger(n)) throw new Error(`颜色必须是整数或 #AARRGGBB：${raw}`);
    return n;
  }

  function normalizeRowHeightKey(key) {
    if (key.rowHeightPercent == null || key.rowHeightPercent === "") {
      delete key.rowHeightPercent;
      return;
    }
    const h = Number(key.rowHeightPercent);
    if (!Number.isFinite(h) || h < 1 || h > 100) throw new Error("rowHeightPercent 必须在 1..100");
    key.rowHeightPercent = h;
  }

  function addLayout(nameInput, sourceInput) {
    const name = String(nameInput ?? "").trim();
    if (!name) return false;
    if (name.includes(":")) {
      alert("全局布局名不能包含冒号");
      return false;
    }
    if (state.layout[name]) {
      alert("布局已存在");
      return false;
    }
    const copyNodeForAdd = el("layout-copy-source");
    const source = String(sourceInput || "").trim() || (copyNodeForAdd && copyNodeForAdd.value) || entryKey(state.selectedBase, state.selectedSubmode);
    state.layout[name] = deepClone(getRowsByEntryKey(source));
    state.selectedBase = name;
    state.selectedSubmode = DEFAULT_SUBMODE;
    syncLayoutUiFromState();
    return true;
  }

  function renameLayout() {
    const oldName = state.selectedBase;
    const name = (prompt("新布局名", oldName) || "").trim();
    if (!name || name === oldName) return;
    if (name.includes(":")) return alert("全局布局名不能包含冒号");
    if (state.layout[name]) return alert("布局已存在");
    state.layout[name] = state.layout[oldName];
    delete state.layout[oldName];
    state.selectedBase = name;
    syncLayoutUiFromState();
  }

  function deleteLayout() {
    const bases = baseNames();
    if (bases.length <= 1) return alert("至少保留一个布局");

    const base = state.selectedBase;
    const sub = state.selectedSubmode;
    const subs = submodeNames(base);

    // If current selected submode has a dedicated layout, delete that submode only.
    if (sub !== DEFAULT_SUBMODE && subs.includes(sub)) {
      if (!confirm(`删除子模式 ${sub}？`)) return;
      const v = state.layout[base];
      if (v && typeof v === "object" && !isRows(v)) delete v[sub];
      state.selectedSubmode = submodeNames(base)[0] || DEFAULT_SUBMODE;
      syncLayoutUiFromState();
      return;
    }

    // Otherwise remove the default layout for this IME (base).
    // If this IME only has one submode, delete the whole base instead.
    if (subs.length <= 1) {
      if (!confirm(`删除布局 ${base} 及其全部子模式？`)) return;
      delete state.layout[base];
      state.selectedBase = baseNames()[0];
      state.selectedSubmode = DEFAULT_SUBMODE;
      syncLayoutUiFromState();
      return;
    }

    // Has multiple submodes but no dedicated entry for current sub — delete the default submode layout.
    if (!confirm(`删除 ${base}:${DEFAULT_SUBMODE}（默认子模式）布局？`)) return;
    const v2 = state.layout[base];
    if (v2 && typeof v2 === "object" && !isRows(v2) && v2[DEFAULT_SUBMODE]) {
      delete v2[DEFAULT_SUBMODE];
    }
    state.selectedSubmode = submodeNames(base)[0] || DEFAULT_SUBMODE;
    syncLayoutUiFromState();
  }

  function addSubmode() {
    const base = state.selectedBase;
    const submode = (prompt("新增子模式布局") || "").trim();
    if (!submode) return;
    if (submode === META_KEY || submode === DEFAULT_SUBMODE) return alert("子模式名无效");
    if (submodeNames(base).includes(submode)) return alert(`子模式"${submode}"已有专用布局`);
    const copyNodeForSub = el("layout-copy-source");
    const source = (copyNodeForSub && copyNodeForSub.value) || entryKey(state.selectedBase, state.selectedSubmode);
    if (!state.layout[base]) state.layout[base] = deepClone(getRowsByEntryKey(source));
    setRows(base, submode, deepClone(getRowsByEntryKey(source)));
    state.selectedBase = base;
    state.selectedSubmode = submode;
    syncLayoutUiFromState();
  }

  function addSubmodeWithName(submodeInput, sourceInput) {
    const base = state.selectedBase;
    const submode = String(submodeInput || "").trim();
    if (!submode) return false;
    if (submode === META_KEY || submode === DEFAULT_SUBMODE || submode.includes(":")) {
      alert("子模式名无效");
      return false;
    }
    if (submodeNames(base).includes(submode)) {
      alert(`子模式"${submode}"已有专用布局`);
      return false;
    }
    const copyNodeForSubWithName = el("layout-copy-source");
    const source = String(sourceInput || "").trim() || (copyNodeForSubWithName && copyNodeForSubWithName.value) || entryKey(state.selectedBase, state.selectedSubmode);
    if (!state.layout[base]) state.layout[base] = deepClone(getRowsByEntryKey(source));
    setRows(base, submode, deepClone(getRowsByEntryKey(source)));
    state.selectedBase = base;
    state.selectedSubmode = submode;
    syncLayoutUiFromState();
    return true;
  }

  function deleteSubmode() {
    const subs = submodeNames(state.selectedBase);
    if (subs.length <= 1) return alert("当前布局只有一个子模式");
    if (!confirm(`删除子模式 ${state.selectedSubmode}？`)) return;
    const v = state.layout[state.selectedBase];
    if (v && typeof v === "object" && !isRows(v)) delete v[state.selectedSubmode];
    state.selectedSubmode = submodeNames(state.selectedBase)[0] || DEFAULT_SUBMODE;
    syncLayoutUiFromState();
  }

  function syncLayoutJsonFromState() {
    state.suppressLayoutJsonInput = true;
    setLayoutJsonText(`${prettyJson(state.layout)}\n`);
    state.suppressLayoutJsonInput = false;
    setStatus("layout-json-status", "JSON 已同步", "ok");
  }

  function getLayoutJsonText() {
    return state.layoutJsonEditor?.state.doc.toString() ?? el("layout-json").value;
  }

  function setLayoutJsonText(text) {
    const editor = state.layoutJsonEditor;
    if (editor) {
      editor.dispatch({
        changes: { from: 0, to: editor.state.doc.length, insert: text }
      });
      return;
    }
    el("layout-json").value = text;
  }

  function getLayoutKeyJsonText() {
    return state.layoutKeyJsonEditor?.state.doc.toString() ?? el("layout-key-json").value;
  }

  function setLayoutKeyJsonText(text) {
    const editor = state.layoutKeyJsonEditor;
    if (editor) {
      editor.dispatch({
        changes: { from: 0, to: editor.state.doc.length, insert: text }
      });
      return;
    }
    el("layout-key-json").value = text;
  }

  async function loadCodeMirrorModules() {
    if (!state.codeMirrorModulesPromise) {
      state.codeMirrorModulesPromise = Promise.all([
        import("https://esm.sh/codemirror@6.0.2"),
        import("https://esm.sh/@codemirror/lang-json@6.0.2"),
        import("https://esm.sh/@codemirror/theme-one-dark@6.1.3")
      ]).then(([
        { EditorView, basicSetup },
        { json },
        { oneDark }
      ]) => ({ EditorView, basicSetup, json, oneDark }));
    }
    return state.codeMirrorModulesPromise;
  }

  function syncJsonEditorHeight() {
    const jsonCard = el("layout-json-card");
    if (!jsonCard) return;
    if (!jsonCard.open) {
      state.lastJsonCardHeight = 0;
      const editor = state.layoutJsonEditor;
      if (editor) {
        editor.dom.style.height = "";
        editor.dom.style.minHeight = "";
        editor.dom.style.maxHeight = "";
        editor.dom.style.width = "";
        const scroller = editor.dom.querySelector(".cm-scroller");
        if (scroller) {
          scroller.style.height = "";
          scroller.style.maxHeight = "";
          scroller.style.overflow = "";
        }
      } else {
        const textarea = el("layout-json");
        textarea.style.height = "";
        textarea.style.minHeight = "";
        textarea.style.maxHeight = "";
        textarea.style.width = "";
        textarea.style.overflow = "";
      }
      return;
    }
    const mainCard = document.getElementById("layout-main-column-card") || document.querySelector(".layout-main-column-card");
    let referenceCardHeight = Math.round(jsonCard.getBoundingClientRect().height || 0);
    if (mainCard) {
      const mainCardStyle = getComputedStyle(mainCard);
      const mainCardChrome =
        (Number.parseFloat(mainCardStyle.paddingTop || "0") || 0) +
        (Number.parseFloat(mainCardStyle.paddingBottom || "0") || 0) +
        (Number.parseFloat(mainCardStyle.borderTopWidth || "0") || 0) +
        (Number.parseFloat(mainCardStyle.borderBottomWidth || "0") || 0);
      const mainContent = mainCard.querySelector(".layout-main-column");
      const mainContentHeight = mainContent ? mainContent.scrollHeight : Math.max(0, mainCard.scrollHeight - mainCardChrome);
      referenceCardHeight = Math.max(0, Math.round(mainContentHeight + mainCardChrome));
      state.lastJsonCardHeight = referenceCardHeight;
    } else {
      state.lastJsonCardHeight = 0;
    }
    const summary = jsonCard.querySelector("summary");
    const status = jsonCard.querySelector(".status");
    const cardStyle = getComputedStyle(jsonCard);
    const cardVerticalPadding =
      (Number.parseFloat(cardStyle.paddingTop || "0") || 0) +
      (Number.parseFloat(cardStyle.paddingBottom || "0") || 0);
    const statusStyle = status ? getComputedStyle(status) : null;
    const statusVerticalMargin = statusStyle
      ? (Number.parseFloat(statusStyle.marginTop || "0") || 0) +
        (Number.parseFloat(statusStyle.marginBottom || "0") || 0)
      : 0;
    const editorHeight = Math.max(
      160,
      Math.floor(
        referenceCardHeight -
          cardVerticalPadding -
          (summary?.offsetHeight ?? 0) -
          (status?.offsetHeight ?? 0) -
          statusVerticalMargin -
          8
      )
    );
    const editor = state.layoutJsonEditor;
    if (editor) {
      editor.dom.style.height = `${editorHeight}px`;
      editor.dom.style.maxHeight = `${editorHeight}px`;
      editor.dom.style.minHeight = "0";
      editor.dom.style.width = "100%";
      const scroller = editor.dom.querySelector(".cm-scroller");
      if (scroller) {
        scroller.style.height = `${editorHeight}px`;
        scroller.style.maxHeight = `${editorHeight}px`;
        scroller.style.minHeight = "0";
        scroller.style.overflow = "auto";
      }
      editor.requestMeasure();
      return;
    }
    const textarea = el("layout-json");
    textarea.style.height = `${editorHeight}px`;
    textarea.style.maxHeight = `${editorHeight}px`;
    textarea.style.minHeight = "0";
    textarea.style.width = "100%";
    textarea.style.overflow = "auto";
  }

  function applyLayoutJsonEditorInput() {
    if (state.suppressLayoutJsonInput) return;
    try {
      state.layout = normalizeLayoutObject(JSON.parse(getLayoutJsonText()));
      ensureSelection();
      renderSelectors();
      renderLayoutEditor();
      renderLayoutPreview();
      setStatus("layout-json-status", "JSON 合法，预览已更新", "ok");
    } catch (e) {
      setStatus("layout-json-status", `JSON 错误：${e.message}`, "err");
    }
  }

  async function initLayoutJsonEditor() {
    if (state.layoutJsonEditor || state.layoutJsonEditorLoading) return;
    state.layoutJsonEditorLoading = true;
    const textarea = el("layout-json");
    textarea.addEventListener("input", applyLayoutJsonEditorInput);
    try {
      const { EditorView, basicSetup, json, oneDark } = await loadCodeMirrorModules();
      const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged) applyLayoutJsonEditorInput();
      });
      const editor = new EditorView({
        doc: textarea.value,
        extensions: [
          basicSetup,
          json(),
          oneDark,
          updateListener,
          EditorView.lineWrapping
        ]
      });
      textarea.classList.add("json-editor-fallback");
      textarea.after(editor.dom);
      state.layoutJsonEditor = editor;
      syncJsonEditorHeight();
    } catch (e) {
      console.warn("CodeMirror failed to load, using textarea fallback", e);
      syncJsonEditorHeight();
    } finally {
      state.layoutJsonEditorLoading = false;
    }
  }

  async function initLayoutKeyJsonEditor() {
    if (state.layoutKeyJsonEditor || state.layoutKeyJsonEditorLoading) return;
    state.layoutKeyJsonEditorLoading = true;
    const textarea = el("layout-key-json");
    try {
      const { EditorView, basicSetup, json, oneDark } = await loadCodeMirrorModules();
      const editor = new EditorView({
        doc: textarea.value,
        extensions: [
          basicSetup,
          json(),
          oneDark,
          EditorView.lineWrapping
        ]
      });
      textarea.classList.add("json-editor-fallback");
      textarea.after(editor.dom);
      state.layoutKeyJsonEditor = editor;
    } catch (e) {
      console.warn("CodeMirror failed to load, using textarea fallback", e);
    } finally {
      state.layoutKeyJsonEditorLoading = false;
    }
  }

  function syncLayoutUiFromState() {
    try {
      state.layout = normalizeLayoutObject(state.layout);
      ensureSelection();
      renderSelectors();
      renderLayoutEditor();
      renderLayoutPreview();
      syncLayoutJsonFromState();
      updateQrUi();
    } catch (e) {
      setStatus("layout-json-status", `布局错误：${e.message}`, "err");
    }
  }

  function initLayoutTab() {
    el("layout-base-select").addEventListener("change", (e) => {
      state.selectedBase = e.target.value;
      state.selectedSubmode = submodeNames(state.selectedBase)[0] || DEFAULT_SUBMODE;
      syncLayoutUiFromState();
    });
    el("layout-submode-select").addEventListener("change", (e) => {
      state.selectedSubmode = e.target.value;
      syncLayoutUiFromState();
    });
    el("layout-height-override").addEventListener("change", (e) => {
      try {
        setHeightOverride(state.selectedBase, state.selectedSubmode, e.target.value);
        syncLayoutUiFromState();
      } catch (err) {
        alert(err.message);
        renderSelectors();
      }
    });
    el("layout-add-layout").addEventListener("click", handlePrimaryAddLayout);
    el("layout-add-kind").addEventListener("change", syncAddDialogByKind);
    el("layout-add-dialog-save").addEventListener("click", () => {
      const kind = el("layout-add-kind").value;
      const name = el("layout-add-name").value;
      const source = el("layout-add-source").value;
      const ok = kind === "submode"
        ? addSubmodeWithName(name, source)
        : addLayout(name, source);
      if (ok) el("layout-add-dialog").close();
    });
    el("layout-add-dialog-cancel").addEventListener("click", () => el("layout-add-dialog").close());
    el("layout-rename-layout").addEventListener("click", renameLayout);
    el("layout-delete-layout").addEventListener("click", handlePrimaryDeleteLayout);
    // layout-add-submode and layout-delete-submode controls removed from DOM; listeners omitted
    el("layout-reset").addEventListener("click", () => {
      state.layout = deepClone(state.initialLayout);
      state.selectedBase = baseNames()[0] || "default";
      state.selectedSubmode = DEFAULT_SUBMODE;
      syncLayoutUiFromState();
    });
    el("layout-download-json").addEventListener("click", () => {
      downloadFile("TextKeyboardLayout.json", `${exportJsonOneKeyPerLine(normalizeLayoutObject(deepClone(state.layout)))}\n`);
    });
    el("layout-import-file").addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const parsed = normalizeLayoutObject(JSON.parse(await file.text()));
        state.layout = parsed;
        state.selectedBase = baseNames()[0] || "default";
        state.selectedSubmode = DEFAULT_SUBMODE;
        syncLayoutUiFromState();
      } catch (err) {
        setStatus("layout-json-status", `导入失败：${err.message}`, "err");
      } finally {
        e.target.value = "";
      }
    });
    ["layout-key-type", "layout-key-main", "layout-key-alt", "layout-key-label", "layout-key-sub-label", "layout-key-weight", "layout-key-row-height"].forEach((id) => {
      el(id).addEventListener("input", () => {
        try {
          updateDraftFromMainFields();
          if (id === "layout-key-type") updateKeyDialogFieldVisibility(el("layout-key-type").value);
          setStatus("layout-key-dialog-status", "", "");
        } catch (err) {
          setStatus("layout-key-dialog-status", `输入无效：${err.message}`, "err");
        }
      });
      if (id === "layout-key-type") {
        el(id).addEventListener("change", () => {
          try {
            updateDraftFromMainFields();
            updateKeyDialogFieldVisibility(el("layout-key-type").value);
            setStatus("layout-key-dialog-status", "", "");
          } catch (err) {
            setStatus("layout-key-dialog-status", `输入无效：${err.message}`, "err");
          }
        });
      }
    });
    el("layout-key-save").addEventListener("click", saveLayoutKeyDialog);
    el("layout-key-delete").addEventListener("click", () => {
      deleteKey(keyDialogState.rowIndex, keyDialogState.keyIndex);
      el("layout-key-dialog").close();
    });
    el("layout-key-cancel").addEventListener("click", handleKeyDialogCancel);
    el("layout-key-open-display-text").addEventListener("click", openDisplayTextDialog);
    el("layout-key-open-labels").addEventListener("click", openLabelsDialog);
    el("layout-key-open-macro").addEventListener("click", openMacroDialog);
    el("layout-key-open-colors").addEventListener("click", openColorsDialog);
    el("layout-key-open-compose").addEventListener("click", openComposeDialog);
    el("layout-key-compose-independent").addEventListener("change", () => {
      syncComposeMetaToParentDraft();
      clearComposeColorOverridesWhenInherited();
      updateKeyDialogFieldVisibility(el("layout-key-type").value);
      refreshKeyDialogSummaries();
    });
    el("layout-key-compose-clear").addEventListener("click", clearComposeNested);
    el("layout-key-open-json").addEventListener("click", openKeyJsonDialog);
    el("layout-key-display-mode").addEventListener("change", updateDisplayTextDialogVisibility);
    el("layout-key-display-map-add").addEventListener("click", () => appendDisplayMapRow("", ""));
    el("layout-key-display-save").addEventListener("click", saveDisplayTextDialog);
    el("layout-key-display-cancel").addEventListener("click", () => el("layout-key-display-dialog").close());
    el("layout-key-labels-save").addEventListener("click", saveLabelsDialog);
    el("layout-key-labels-cancel").addEventListener("click", () => el("layout-key-labels-dialog").close());
    el("layout-key-macro-save").addEventListener("click", () => {
      try {
        saveMacroDialog();
      } catch (err) {
        setStatus("layout-key-dialog-status", `事件保存失败：${err.message}`, "err");
      }
    });
    el("layout-key-macro-cancel").addEventListener("click", () => el("layout-key-macro-dialog").close());
    el("layout-key-macro-edit-tap").addEventListener("click", () => openMacroEventEditor("tap"));
    el("layout-key-macro-edit-swipe").addEventListener("click", () => openMacroEventEditor("swipe"));
    el("layout-key-macro-edit-long-press").addEventListener("click", () => openMacroEventEditor("longPress"));
    el("layout-key-macro-clear-tap").addEventListener("click", () => {
      if (keyDialogState.draft) delete keyDialogState.draft.tap;
      openMacroDialog();
      refreshKeyDialogSummaries();
    });
    el("layout-key-macro-clear-swipe").addEventListener("click", () => {
      if (keyDialogState.draft) delete keyDialogState.draft.swipe;
      openMacroDialog();
      refreshKeyDialogSummaries();
    });
    el("layout-key-macro-clear-long-press").addEventListener("click", () => {
      if (keyDialogState.draft) delete keyDialogState.draft.longPress;
      openMacroDialog();
      refreshKeyDialogSummaries();
    });
    el("layout-key-macro-event-add-step").addEventListener("click", addMacroEventStep);
    el("layout-key-macro-event-cancel").addEventListener("click", () => {
      resetMacroStepDragState();
      el("layout-key-macro-event-dialog").close();
    });
    el("layout-key-macro-event-save").addEventListener("click", saveMacroEventEditor);
    el("layout-key-macro-event-dialog").addEventListener("close", resetMacroStepDragState);
    el("layout-key-colors-save").addEventListener("click", () => {
      try {
        saveColorsDialog();
      } catch (err) {
        setStatus("layout-key-dialog-status", `颜色保存失败：${err.message}`, "err");
      }
    });
    el("layout-key-colors-cancel").addEventListener("click", () => el("layout-key-colors-dialog").close());
    el("layout-key-json-save").addEventListener("click", () => {
      try {
        saveKeyJsonDialog();
      } catch (err) {
        setStatus("layout-key-dialog-status", `JSON 保存失败：${err.message}`, "err");
      }
    });
    el("layout-key-json-cancel").addEventListener("click", () => el("layout-key-json-dialog").close());
    const jsonCard = el("layout-json-card");
    if (jsonCard) {
      // 默认展开 layout-json-card
      jsonCard.open = true;
      if (!state.layoutJsonEditor) {
        initLayoutJsonEditor().then(() => requestAnimationFrame(syncJsonEditorHeight));
      } else {
        requestAnimationFrame(syncJsonEditorHeight);
      }
      jsonCard.addEventListener("toggle", () => {
        if (!jsonCard.open) {
          syncJsonEditorHeight();
          return;
        }
        if (!state.layoutJsonEditor) {
          initLayoutJsonEditor().then(() => requestAnimationFrame(syncJsonEditorHeight));
        } else {
          requestAnimationFrame(syncJsonEditorHeight);
        }
      });
    }
    syncLayoutUiFromState();
  }

  function handlePrimaryAddLayout() {
    const sourceSelect = el("layout-add-source");
    const entries = allEntryKeys();
    sourceSelect.innerHTML = entries.map((k) => `<option value="${escapeAttr(k)}">${escapeHtml(k)}</option>`).join("");
    const csNode = el("layout-copy-source");
    sourceSelect.value = (csNode && csNode.value) || entryKey(state.selectedBase, state.selectedSubmode);
    el("layout-add-kind").value = "layout";
    el("layout-add-name").value = "";
    syncAddDialogByKind();
    el("layout-add-dialog").showModal();
  }

  function syncAddDialogByKind() {
    const kind = el("layout-add-kind").value;
    const isSubmode = kind === "submode";
    const nameLabel = el("layout-add-name-label");
    const nameInput = el("layout-add-name");
    const sourceRow = el("layout-add-source-row");
    const prefixPreview = el("layout-add-prefix-preview");
    if (nameLabel) nameLabel.textContent = isSubmode ? "子模式名称" : "布局名称";
    if (nameInput) {
      nameInput.placeholder = isSubmode ? "例如：仓颉五代" : "例如：rime";
    }
    if (sourceRow) sourceRow.hidden = isSubmode;
    if (prefixPreview) {
      if (isSubmode) {
        prefixPreview.hidden = false;
        prefixPreview.textContent = `将创建为 ${state.selectedBase}:子模式名`;
      } else {
        prefixPreview.hidden = true;
        prefixPreview.textContent = "";
      }
    }
  }

  function handlePrimaryDeleteLayout() {
    if (state.selectedSubmode !== DEFAULT_SUBMODE) {
      deleteSubmode();
      return;
    }
    deleteLayout();
  }

  function buildCrc32Table() {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c >>> 0;
    }
    return table;
  }

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function bytesToBase64Url(bytes) {
    let binary = "";
    const step = 0x8000;
    for (let i = 0; i < bytes.length; i += step) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function base64UrlToBytes(text) {
    const b64 = text.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(text.length / 4) * 4, "=");
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function textToBase64Url(str) {
    return bytesToBase64Url(new TextEncoder().encode(str));
  }

  function randomHex(len) {
    const bytes = new Uint8Array(Math.ceil(len / 2));
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, len);
  }

  function buildTransferId(type, profile) {
    const base = `${type.toUpperCase()}${randomHex(11)}`;
    const p = (profile || "").trim();
    return p ? `${base}~${textToBase64Url(p)}` : base;
  }

  async function ensureWasm() {
    if (state.wasmReady) return;
    await window.lzma_wasm.initWasm();
    state.wasmReady = true;
  }

  async function encodeJsonToChunks(rawJson, profile) {
    await ensureWasm();
    const raw = new TextEncoder().encode(rawJson);
    const compressed = window.lzma_wasm.compress(raw, { format: "xz", level: 6 });
    const crc = crc32(compressed);
    const transferId = buildTransferId(TRANSFER_TYPE_LAYOUT, profile);
    const total = Math.ceil(compressed.length / MAX_CHUNK_BYTES) || 1;
    const chunks = [];
    for (let i = 0; i < total; i++) {
      const start = i * MAX_CHUNK_BYTES;
      const end = Math.min(start + MAX_CHUNK_BYTES, compressed.length);
      chunks.push(`${MAGIC}|${transferId}|${i + 1}/${total}|${crc}|${bytesToBase64Url(compressed.slice(start, end))}`);
    }
    return { transferId, total, chunks };
  }

  function currentLayoutQrPayload() {
    const profile = (el("layout-profile").value || "").trim() || null;
    return {
      profile,
      json: `${prettyJson(normalizeLayoutObject(deepClone(state.layout)))}\n`
    };
  }

  async function generateLayoutQrBundle() {
    const payload = currentLayoutQrPayload();
    const bundle = await encodeJsonToChunks(payload.json, payload.profile);
    return { ...bundle, profile: payload.profile };
  }

  function displayProfile(profile) {
    return (profile || "").trim() || "default";
  }

  function extractProfileFromTransferId(transferId) {
    const idx = String(transferId || "").indexOf("~");
    if (idx < 0 || idx >= transferId.length - 1) return "";
    const encoded = transferId.slice(idx + 1);
    try {
      return new TextDecoder().decode(base64UrlToBytes(encoded)).trim();
    } catch (_) {
      return "";
    }
  }

  function buildChunkLabels(bundle, profile) {
    return bundle.chunks.map((_, i) => `Layout · ${displayProfile(profile)} · Chunk ${i + 1}/${bundle.total} · ${bundle.transferId}`);
  }

  function makeQrCanvas(content, size) {
    const sourceSize = Math.max(size * 2, 1200);
    const raw = document.createElement("canvas");
    new QRious({
      element: raw,
      value: content,
      size: sourceSize,
      level: "M",
      padding: 0
    });
    const canvas = document.createElement("canvas");
    canvas.width = sourceSize;
    canvas.height = sourceSize;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, sourceSize, sourceSize);
    ctx.drawImage(raw, 0, 0);
    return cropQrCanvasToFill(canvas, size);
  }

  function cropQrCanvasToFill(source, targetSize) {
    const srcCtx = source.getContext("2d", { willReadFrequently: true });
    const image = srcCtx.getImageData(0, 0, source.width, source.height);
    const data = image.data;
    let minX = source.width;
    let minY = source.height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < source.height; y++) {
      for (let x = 0; x < source.width; x++) {
        const offset = (y * source.width + x) * 4;
        if (data[offset + 3] > 0 && (data[offset] < 250 || data[offset + 1] < 250 || data[offset + 2] < 250)) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    const out = document.createElement("canvas");
    out.width = targetSize;
    out.height = targetSize;
    const outCtx = out.getContext("2d");
    outCtx.imageSmoothingEnabled = false;
    outCtx.fillStyle = "#ffffff";
    outCtx.fillRect(0, 0, targetSize, targetSize);

    if (maxX < minX || maxY < minY) return out;
    const quietZone = Math.max(8, Math.round(targetSize * 0.025));
    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;
    const cropSize = Math.max(cropWidth, cropHeight);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const cropX = Math.max(0, Math.min(source.width - cropSize, Math.round(centerX - cropSize / 2)));
    const cropY = Math.max(0, Math.min(source.height - cropSize, Math.round(centerY - cropSize / 2)));
    const drawSize = targetSize - quietZone * 2;
    outCtx.drawImage(source, cropX, cropY, cropSize, cropSize, quietZone, quietZone, drawSize, drawSize);
    return out;
  }

  function drawRoundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function drawCenteredText(ctx, text, x, y, width, height, fontSize, color, weight = 600, minSize = 7) {
    const value = String(text || "");
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let size = Math.min(fontSize, Math.max(minSize, Math.floor(width * 0.42)));
    ctx.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;
    while (size > minSize && ctx.measureText(value).width > width - 8) {
      size -= 1;
      ctx.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;
    }
    ctx.fillText(value, x + width / 2, y + height / 2);
  }

  function drawRightTopText(ctx, text, x, y, width, fontSize, color, weight = 500, minSize = 6) {
    const value = String(text || "");
    if (!value) return;
    ctx.fillStyle = color;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    let size = Math.min(fontSize, Math.max(minSize, Math.floor(width * 0.18)));
    ctx.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;
    while (size > minSize && ctx.measureText(value).width > width - 8) {
      size -= 1;
      ctx.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;
    }
    ctx.fillText(value, x + width - 6, y + 4);
  }

  function renderPreviewCanvas(targetWidth) {
    const rows = getRows();
    const previewPadding = 24;
    const rowGap = 0;
    const keyboardWidth = Math.max(1, targetWidth - previewPadding * 2);
    const rowPercents = resolveRowHeightPercents(rows);
    const rowHeights = rowPercents.map(effectiveRowHeight);
    const contentHeight = rowHeights.reduce((sum, h) => sum + h, 0) + Math.max(0, rows.length - 1) * rowGap;
    const height = Math.max(1, contentHeight + previewPadding * 2);
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#10131b";
    ctx.fillRect(0, 0, targetWidth, height);
    ctx.strokeStyle = "#2a3142";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, targetWidth - 1, height - 1);

    let y = previewPadding;
    rows.forEach((row, rowIndex) => {
      const rowHeight = rowHeights[rowIndex];
      const widths = resolveRegularRowWidths(row);
      const rowWidth = widths.reduce((sum, width) => sum + width, 0);
      let x = (targetWidth - keyboardWidth * rowWidth) / 2;
      row.forEach((key, keyIndex) => {
        const slotWidth = keyboardWidth * (widths[keyIndex] || 0);
        const keyX = x + 3;
        const keyW = Math.max(1, slotWidth - 6);
        const variant = keyVariantClass(key);
        const isMacro = variant.includes("macro-key");
        const bg = isMacro ? "#4cc38a" : variant.includes("accent-key") ? "#4f8cff" : variant.includes("space-key") ? "#2a3140" : variant.includes("alt-key") ? "#303645" : "#242a38";
        const fg = isMacro || variant.includes("accent-key") ? "#ffffff" : variant.includes("compose-key") ? "#4cc38a" : variant.includes("alt-key") || variant.includes("space-key") ? "#9aa4ba" : "#e8ebf2";
        ctx.fillStyle = bg;
        drawRoundRect(ctx, keyX, y, keyW, rowHeight, 4);
        ctx.fill();
        ctx.lineWidth = isMacro ? 2 : 1;
        ctx.strokeStyle = isMacro ? "#4cc38a" : variant.includes("accent-key") ? "#4f8cff" : "#2a3142";
        ctx.stroke();
        drawCenteredText(ctx, previewTitleFromObj(key), keyX, y, keyW, rowHeight, variant.includes("alt-key") ? 16 : variant.includes("macro-key") || variant.includes("accent-key") ? 20 : 23, fg);
        const alt = keySubText(key);
        if (alt) {
          drawRightTopText(ctx, alt, keyX, y, keyW, 10, "#9aa4ba");
        }
        x += slotWidth;
      });
      y += rowHeight + rowGap;
    });
    return canvas;
  }

  function composeQrLongImage(bundle, profile) {
    const labels = buildChunkLabels(bundle, profile);
    const pageHeight = LONG_IMAGE_PAGE_PADDING + LONG_IMAGE_QR_SIZE + LONG_IMAGE_TEXT_GAP + LONG_IMAGE_TEXT_SIZE + LONG_IMAGE_PAGE_PADDING;
    const width = LONG_IMAGE_QR_SIZE + LONG_IMAGE_PAGE_PADDING * 2;
    const previewCanvas = renderPreviewCanvas(width);
    const previewSectionHeight = previewCanvas.height + LONG_IMAGE_PAGE_PADDING;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = previewSectionHeight + pageHeight * bundle.chunks.length;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(previewCanvas, 0, 0, width, previewCanvas.height);

    ctx.fillStyle = "#000000";
    ctx.font = `700 ${LONG_IMAGE_TEXT_SIZE}px Arial, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    bundle.chunks.forEach((content, index) => {
      const top = previewSectionHeight + index * pageHeight;
      const qr = makeQrCanvas(content, LONG_IMAGE_QR_SIZE);
      ctx.drawImage(qr, LONG_IMAGE_PAGE_PADDING, top + LONG_IMAGE_PAGE_PADDING);
      ctx.fillText(labels[index], LONG_IMAGE_PAGE_PADDING, top + LONG_IMAGE_PAGE_PADDING + LONG_IMAGE_QR_SIZE + LONG_IMAGE_TEXT_GAP + LONG_IMAGE_TEXT_SIZE);
    });
    return canvas;
  }

  function canvasToPngBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("无法生成 PNG"));
      }, "image/png");
    });
  }

  async function downloadQrLongImage(bundle, profile) {
    const canvas = composeQrLongImage(bundle, profile);
    const blob = await canvasToPngBlob(canvas);
    const fileName = `text-keyboard-layout-qr-${Date.now()}.png`;
    downloadBlob(fileName, blob);
  }

  function parseQrChunkText(raw) {
    const text = String(raw || "").trim();
    const parts = text.split("|");
    if (parts.length < 5 || parts[0] !== MAGIC) return null;
    const transferId = parts[1] || "";
    const seq = parts[2] || "";
    const crcText = parts[3] || "";
    const payload = parts.slice(4).join("|");
    const slash = seq.indexOf("/");
    if (slash <= 0) return null;
    const index = Number(seq.slice(0, slash));
    const total = Number(seq.slice(slash + 1));
    const crc = Number(crcText);
    if (!/^L[0-9a-f]{11}(?:~[A-Za-z0-9_-]+)?$/.test(transferId)) return null;
    if (!Number.isInteger(index) || !Number.isInteger(total) || index < 1 || total < 1 || index > total) return null;
    if (!Number.isInteger(crc) || crc < 0) return null;
    if (total > 512) return null;
    if (!payload) return null;
    if (!/^[A-Za-z0-9_-]+$/.test(payload)) return null;
    let payloadBytesLength = -1;
    try {
      payloadBytesLength = base64UrlToBytes(payload).length;
    } catch (_) {
      return null;
    }
    if (payloadBytesLength <= 0 || payloadBytesLength > MAX_CHUNK_BYTES) return null;
    return { transferId, index, total, crc, payload, text };
  }

  function normalizeQrChunkText(raw) {
    const text = String(raw || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim();
    const idx = text.indexOf(`${MAGIC}|`);
    if (idx < 0) return "";
    const tail = text.slice(idx);
    // Keep the first token-like segment that starts with MAGIC.
    const token = tail.split(/\s+/)[0] || "";
    // Drop trailing non-base64url noise after payload.
    const parts = token.split("|");
    if (parts.length < 5) return token;
    const payload = parts.slice(4).join("|").replace(/[^A-Za-z0-9_-].*$/, "");
    return [parts[0], parts[1], parts[2], parts[3], payload].join("|");
  }

  function chunkGroupKey(chunk) {
    return `${chunk.transferId}|${chunk.crc}|${chunk.total}`;
  }

  function readFileAsImage(file) {
    if (!window.WebEditorQrImport) throw new Error("二维码导入模块未加载");
    return window.WebEditorQrImport.readFileAsImage(file);
  }

  async function decodeQrTextFromImage(image, onProgress) {
    if (!window.WebEditorQrImport) throw new Error("二维码导入模块未加载");
    return window.WebEditorQrImport.decodeQrTextFromImage(image, {
      magic: MAGIC,
      parseChunkText: parseQrChunkText,
      normalizeChunkText: normalizeQrChunkText,
      chunkGroupKey,
      onProgress
    });
  }

  async function decodeLayoutFromQrChunks(chunkTexts) {
    const parsed = chunkTexts.map(parseQrChunkText).filter(Boolean);
    if (!parsed.length) throw new Error("未识别到有效二维码分片");

    const byTransfer = new Map();
    parsed.forEach((chunk) => {
      const key = chunkGroupKey(chunk);
      if (!byTransfer.has(key)) byTransfer.set(key, []);
      byTransfer.get(key).push(chunk);
    });

    // Prefer complete candidate sets; for ties, prefer better coverage ratio, then more unique chunks.
    let selected = null;
    byTransfer.forEach((list) => {
      const sample = list[0];
      const uniqueIndex = new Set(list.map((x) => x.index)).size;
      const complete = sample && uniqueIndex >= sample.total;
      const total = sample ? sample.total : 0;
      const coverage = total > 0 ? uniqueIndex / total : 0;
      if (!selected) {
        selected = { list, complete, uniqueIndex, total, coverage };
        return;
      }
      if (complete && !selected.complete) {
        selected = { list, complete, uniqueIndex, total, coverage };
        return;
      }
      if (complete === selected.complete) {
        if (coverage > selected.coverage) {
          selected = { list, complete, uniqueIndex, total, coverage };
          return;
        }
        if (coverage === selected.coverage && uniqueIndex > selected.uniqueIndex) {
          selected = { list, complete, uniqueIndex, total, coverage };
        }
      }
    });

    if (!selected) throw new Error("二维码分片为空");
    const chunks = selected.list;
    const transferId = chunks[0].transferId;
    const total = chunks[0].total;
    const expectedCrc = chunks[0].crc;
    const parts = new Array(total);

    chunks.forEach((chunk) => {
      if (chunk.transferId !== transferId || chunk.total !== total || chunk.crc !== expectedCrc) return;
      if (!parts[chunk.index - 1]) parts[chunk.index - 1] = chunk;
    });

    const missing = [];
    for (let i = 0; i < parts.length; i++) {
      if (!parts[i]) missing.push(i + 1);
    }
    if (missing.length) {
      throw new Error(`分片不完整，缺少 ${missing.join(", ")}（已识别 ${selected.uniqueIndex}/${total}）`);
    }

    const bytesList = parts.map((chunk) => base64UrlToBytes(chunk.payload));
    const totalLength = bytesList.reduce((sum, b) => sum + b.length, 0);
    const compressed = new Uint8Array(totalLength);
    let offset = 0;
    bytesList.forEach((b) => {
      compressed.set(b, offset);
      offset += b.length;
    });

    if (crc32(compressed) !== expectedCrc) throw new Error("分片校验失败（CRC 不匹配）");

    await ensureWasm();
    let raw;
    try {
      raw = window.lzma_wasm.decompress(compressed, { format: "xz" });
    } catch (_) {
      raw = window.lzma_wasm.decompress(compressed);
    }
    const text = new TextDecoder().decode(raw);
    const layout = normalizeLayoutObject(JSON.parse(text));
    return { layout, transferId, total };
  }

  async function importLayoutFromQrLongImage(file) {
    if (!file) return;
    state.qr = { chunks: [], index: 0, transferId: "", layoutSignature: "" };
    updateQrUi();
    setStatus("layout-qr-meta", "正在读取长图…", "");
    const image = await readFileAsImage(file);
    const chunkTexts = await decodeQrTextFromImage(image, (msg) => setStatus("layout-qr-meta", msg, ""));
    if (!chunkTexts.length) throw new Error("未识别到二维码分片，请确认长图完整清晰");
    setStatus("layout-qr-meta", "正在校验并解码分片…", "");
    const decoded = await decodeLayoutFromQrChunks(chunkTexts);

    const ok = confirm(`确认导入二维码布局？\ntransferId=${decoded.transferId}\n分片数=${decoded.total}\n当前布局将被覆盖。`);
    if (!ok) return;

    state.layout = decoded.layout;
    state.qr = { chunks: [], index: 0, transferId: "", layoutSignature: "" };
    el("layout-profile").value = extractProfileFromTransferId(decoded.transferId);
    ensureSelection();
    syncLayoutUiFromState();
    setStatus("layout-json-status", "已从二维码长图导入 JSON", "ok");
    setStatus("layout-qr-meta", `导入成功：${decoded.total} 个分片，transferId=${decoded.transferId}`, "ok");
  }

  function updateQrUi() {
    const isStale = state.qr.layoutSignature && state.qr.layoutSignature !== currentLayoutSignature();
    if (isStale) state.qr = { chunks: [], index: 0, transferId: "", layoutSignature: "" };
    const has = state.qr.chunks.length > 0;
    const wrap = el("layout-qr-wrap");
    if (wrap) {
      wrap.hidden = !has;
      wrap.style.display = has ? "" : "none";
    }
    el("layout-qr-index").textContent = `${has ? state.qr.index + 1 : 0} / ${state.qr.chunks.length}`;
    const canvas = el("layout-qr-canvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!has) return;
    const filled = makeQrCanvas(state.qr.chunks[state.qr.index], canvas.width);
    ctx.drawImage(filled, 0, 0);
  }

  function setupQrActions() {
    el("layout-generate-qr").addEventListener("click", async () => {
      try {
        const bundle = await generateLayoutQrBundle();
        state.qr = { chunks: bundle.chunks, index: 0, transferId: bundle.transferId, layoutSignature: currentLayoutSignature() };
        setStatus("layout-qr-meta", `布局二维码：${bundle.total} 个分片，transferId=${bundle.transferId}`, "ok");
        updateQrUi();
      } catch (e) {
        setStatus("layout-qr-meta", `生成失败：${e.message}`, "err");
      }
    });
    el("layout-share-qr-image").addEventListener("click", async () => {
      try {
        const bundle = await generateLayoutQrBundle();
        state.qr = { chunks: bundle.chunks, index: 0, transferId: bundle.transferId, layoutSignature: currentLayoutSignature() };
        updateQrUi();
        await downloadQrLongImage(bundle, bundle.profile);
        setStatus("layout-qr-meta", `已下载 PNG 长图：${bundle.total} 个分片，transferId=${bundle.transferId}`, "ok");
      } catch (e) {
        setStatus("layout-qr-meta", `长图导出失败：${e.message}`, "err");
      }
    });
    el("layout-import-qr-image").addEventListener("click", () => {
      const input = el("layout-import-qr-image-file");
      if (!input) return;
      input.value = "";
      input.click();
    });
    el("layout-import-qr-image-file").addEventListener("change", async (ev) => {
      const file = ev.target && ev.target.files ? ev.target.files[0] : null;
      if (!file) return;
      if (state.qrImportRunning) {
        setStatus("layout-qr-meta", "已有导入任务在进行，请稍后重试", "err");
        return;
      }
      state.qrImportRunning = true;
      try {
        await importLayoutFromQrLongImage(file);
      } catch (e) {
        setStatus("layout-qr-meta", `长图导入失败：${e.message}`, "err");
      } finally {
        state.qrImportRunning = false;
        const input = el("layout-import-qr-image-file");
        if (input) input.value = "";
      }
    });
    el("layout-prev-qr").addEventListener("click", () => {
      if (!state.qr.chunks.length) return;
      state.qr.index = (state.qr.index - 1 + state.qr.chunks.length) % state.qr.chunks.length;
      updateQrUi();
    });
    el("layout-next-qr").addEventListener("click", () => {
      if (!state.qr.chunks.length) return;
      state.qr.index = (state.qr.index + 1) % state.qr.chunks.length;
      updateQrUi();
    });
    /*
    el("layout-copy-chunk").addEventListener("click", async () => {
      if (!state.qr.chunks.length) return;
      try {
        await navigator.clipboard.writeText(state.qr.chunks[state.qr.index]);
        setStatus("layout-qr-meta", "当前二维码文本已复制", "ok");
      } catch (_) {
        setStatus("layout-qr-meta", "复制失败，请手动复制下方文本", "err");
      }
    });
    */
  }

  function escapeHtml(s) {
    return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replaceAll("\"", "&quot;");
  }

  async function main() {
    await initializeBuiltinData();
    initLayoutTab();
    setupQrActions();
    const previewPanel = document.querySelector(".keyboard-preview-panel");
    if (previewPanel) {
      previewPanel.addEventListener("toggle", () => {
        updateFixedChromeMetrics();
        syncJsonEditorHeight();
      });
    }
    state.layoutHeightObserver = new ResizeObserver(() => syncJsonEditorHeight());
    const mainCardEl = document.getElementById("layout-main-column-card") || document.querySelector(".layout-main-column-card");
    if (mainCardEl) state.layoutHeightObserver.observe(mainCardEl);
    window.addEventListener("resize", syncJsonEditorHeight);
    window.addEventListener("resize", updateFixedChromeMetrics);
    window.addEventListener("resize", () => requestAnimationFrame(fitLayoutPreviewText));
    updateFixedChromeMetrics();
    setStatus("layout-qr-meta", "点击“生成二维码”后会自动按 App 协议分片编码", "");
  }

  main();
})();
