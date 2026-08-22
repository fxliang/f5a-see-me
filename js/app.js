(function () {
  "use strict";
  const WEB_EDITOR_BUILD = "2026-08-11T15:43+08:00";
  console.info("[web-editor] app.js loaded", WEB_EDITOR_BUILD);

  const MAGIC = "F5AQR1";
  const MAX_CHUNK_BYTES = 1024;
  const MAX_CHUNK_BYTES_OF_APP = 1500;
  const TRANSFER_TYPE_LAYOUT = "L";
  const TRANSFER_TYPE_THEME = "T";
  const TRANSFER_TYPE_POPUP = "P";
  const IME_API_BASE = resolveImeApiBase();
  const LONG_IMAGE_QR_SIZE = 768;
  const LONG_IMAGE_PAGE_PADDING = 24;
  const LONG_IMAGE_TEXT_SIZE = 22;
  const LONG_IMAGE_TEXT_GAP = 12;
  const LONG_IMAGE_PREVIEW_PADDING = 10;
  const LONG_IMAGE_PREVIEW_ROW_GAP = 8;
  const LONG_IMAGE_PREVIEW_KEYBOARD_MAX_WIDTH = 720;
  const DEFAULT_SUBMODE = "default";
  const META_KEY = "__meta__";
  const HEIGHT_KEY = "keyboard_height_percent";
  const PREVIEW_KEY_BORDER_ENABLED = false;

  function resolveImeApiBase() {
    const globalBase = typeof window.__F5A_IME_API_BASE__ === "string" ? window.__F5A_IME_API_BASE__.trim() : "";
    if (globalBase) return globalBase.replace(/\/+$/, "");
    const queryBase = new URLSearchParams(window.location.search || "").get("imeApi");
    if (queryBase && /^https?:\/\//i.test(queryBase)) return queryBase.replace(/\/+$/, "");
    if (window.location.protocol === "http:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return window.location.origin.replace(/\/+$/, "");
    }
    return "";
  }

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
    "SpaceKey", "SymbolKey", "ReturnKey", "BackspaceKey", "MacroKey",
    "NumPadKey", "MiniSpaceKey"
  ];

  // NumPadKey 符号选项（label 为按键显示，sym 为保存到 JSON 的规范 Fcitx 键名），
  // 与 fcitx5-android 编辑器（KeyboardEditorUiBuilder.NUMPAD_OPTIONS）一致。
  const numpadSymOptions = [
    { label: "0", sym: "KP_0" }, { label: "1", sym: "KP_1" }, { label: "2", sym: "KP_2" },
    { label: "3", sym: "KP_3" }, { label: "4", sym: "KP_4" }, { label: "5", sym: "KP_5" },
    { label: "6", sym: "KP_6" }, { label: "7", sym: "KP_7" }, { label: "8", sym: "KP_8" },
    { label: "9", sym: "KP_9" },
    { label: "+", sym: "KP_Add" }, { label: "-", sym: "KP_Subtract" },
    { label: "*", sym: "KP_Multiply" }, { label: "/", sym: "KP_Divide" },
    { label: ",", sym: "KP_Separator" }, { label: ".", sym: "KP_Decimal" },
    { label: "=", sym: "KP_Equal" }
  ];

  // LayoutSwitchKey 切换目标（存于 subLabel），与 app 内 SWITCH_TARGET_OPTIONS 一致。
  const switchTargetOptions = [
    { value: "", label: "默认（?123 符号面板）" },
    { value: "Text", label: "Text（文本键盘）" },
    { value: "Number", label: "Number（数字键盘）" },
    { value: "Symbol", label: "Symbol（符号面板）" }
  ];

  // 数字键盘 keysym 与规范键名双向表（与 app 的 SYM_CODE_TO_NAME / SYM_NAME_TO_CODE 一致）
  const numpadSymNameByCode = {};
  for (let i = 0; i <= 9; i++) numpadSymNameByCode[0xffb0 + i] = `KP_${i}`;
  numpadSymNameByCode[0xffab] = "KP_Add";
  numpadSymNameByCode[0xffad] = "KP_Subtract";
  numpadSymNameByCode[0xffaa] = "KP_Multiply";
  numpadSymNameByCode[0xffaf] = "KP_Divide";
  numpadSymNameByCode[0xffae] = "KP_Decimal";
  numpadSymNameByCode[0xffac] = "KP_Separator";
  numpadSymNameByCode[0xffbd] = "KP_Equal";
  numpadSymNameByCode[0xff8d] = "KP_Enter";
  const numpadSymCanonicalByName = Object.fromEntries(
    Object.entries(numpadSymNameByCode).map(([code, name]) => [name.toLowerCase(), name])
  );
  const numpadSymLabelByName = Object.fromEntries(
    numpadSymOptions.map((o) => [o.sym, o.label])
  );
  const numpadSymNameByLabel = Object.fromEntries(
    numpadSymOptions.map((o) => [o.label, o.sym])
  );

  /**
   * 将 sym 字段解析为规范键名（如 "KP_2"）。兼容：规范名、大小写不敏感名、
   * 十进制/十六进制 keysym、符号标签（"2"、"+"、","）。解析失败返回 null。
   */
  function resolveNumpadSymName(input) {
    if (input == null) return null;
    const s = String(input).trim();
    if (!s) return null;
    const canonical = numpadSymCanonicalByName[s.toLowerCase()];
    if (canonical) return canonical;
    if (numpadSymNameByLabel[s] != null) return numpadSymNameByLabel[s];
    if (/^\d+$/.test(s)) {
      const name = numpadSymNameByCode[Number.parseInt(s, 10)];
      if (name) return name;
    }
    if (/^0x[0-9a-f]+$/i.test(s)) {
      const name = numpadSymNameByCode[Number.parseInt(s.slice(2), 16)];
      if (name) return name;
    }
    if (/^#[0-9a-f]+$/i.test(s)) {
      const name = numpadSymNameByCode[Number.parseInt(s.slice(1), 16)];
      if (name) return name;
    }
    return null;
  }

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
  const themeColorLabels = {
    backgroundColor: "页面底色",
    barColor: "工具栏颜色",
    keyboardColor: "键盘底色",
    keyBackgroundColor: "普通按键背景",
    keyTextColor: "普通按键文字",
    candidateTextColor: "候选文字",
    candidateLabelColor: "候选标签",
    candidateCommentColor: "候选注释",
    altKeyBackgroundColor: "功能键背景",
    altKeyTextColor: "功能键文字",
    accentKeyBackgroundColor: "强调键背景",
    accentKeyTextColor: "强调键文字",
    keyPressHighlightColor: "按压高亮",
    keyShadowColor: "按键边框/阴影",
    popupBackgroundColor: "弹出背景",
    popupTextColor: "弹出文字",
    spaceBarColor: "空格键背景",
    dividerColor: "分割线",
    clipboardEntryColor: "剪贴板项背景",
    genericActiveBackgroundColor: "激活态背景",
    genericActiveForegroundColor: "激活态文字"
  };
  const builtinThemePresets = [
    {
      name: "MaterialLight",
      colors: {
        backgroundColor: "#FFECEFF1", barColor: "#FFE4E7E9", keyboardColor: "#FFECEFF1", keyBackgroundColor: "#FFFBFBFC", keyTextColor: "#FF37474F",
        candidateTextColor: "#FF37474F", candidateLabelColor: "#FF37474F", candidateCommentColor: "#FF7A858A", altKeyBackgroundColor: "#FFDFE2E4", altKeyTextColor: "#FF7A858A",
        accentKeyBackgroundColor: "#FF5CB5AB", accentKeyTextColor: "#FFFFFFFF", keyPressHighlightColor: "#1F000000", keyShadowColor: "#FFC0C3C4", popupBackgroundColor: "#FFD9DBDD",
        popupTextColor: "#FF37474F", spaceBarColor: "#FFC9CED1", dividerColor: "#1F000000", clipboardEntryColor: "#FFFBFBFC", genericActiveBackgroundColor: "#FF80CBC4", genericActiveForegroundColor: "#FF37474F"
      }
    },
    {
      name: "MaterialDark",
      colors: {
        backgroundColor: "#FF263238", barColor: "#FF21272B", keyboardColor: "#FF263238", keyBackgroundColor: "#FF404A50", keyTextColor: "#FFD9DBDC",
        candidateTextColor: "#FFD9DBDC", candidateLabelColor: "#FFD9DBDC", candidateCommentColor: "#FFADB1B3", altKeyBackgroundColor: "#FF313C42", altKeyTextColor: "#FFADB1B3",
        accentKeyBackgroundColor: "#FF6EACA8", accentKeyTextColor: "#FFFFFFFF", keyPressHighlightColor: "#33FFFFFF", keyShadowColor: "#FF1F292E", popupBackgroundColor: "#FF3C474C",
        popupTextColor: "#FFFFFFFF", spaceBarColor: "#FF3B464C", dividerColor: "#1FFFFFFF", clipboardEntryColor: "#FF404A50", genericActiveBackgroundColor: "#FF4DB6AC", genericActiveForegroundColor: "#FFFFFFFF"
      }
    },
    {
      name: "PixelLight",
      colors: {
        backgroundColor: "#FFEEEEEE", barColor: "#FFEEEEEE", keyboardColor: "#FFFAFAFA", keyBackgroundColor: "#FFFFFFFF", keyTextColor: "#FF212121",
        candidateTextColor: "#FF212121", candidateLabelColor: "#FF212121", candidateCommentColor: "#FF6E6E6E", altKeyBackgroundColor: "#FFE1E1E1", altKeyTextColor: "#FF6E6E6E",
        accentKeyBackgroundColor: "#FF4285F4", accentKeyTextColor: "#FFFFFFFF", keyPressHighlightColor: "#1F000000", keyShadowColor: "#FFC2C2C2", popupBackgroundColor: "#FFEEEEEE",
        popupTextColor: "#FF212121", spaceBarColor: "#FFDBDBDB", dividerColor: "#1F000000", clipboardEntryColor: "#FFFFFFFF", genericActiveBackgroundColor: "#FF5E97F6", genericActiveForegroundColor: "#FFFFFFFF"
      }
    },
    {
      name: "PixelDark",
      colors: {
        backgroundColor: "#FF2D2D2D", barColor: "#FF373737", keyboardColor: "#FF2D2D2D", keyBackgroundColor: "#FF464646", keyTextColor: "#FFFAFAFA",
        candidateTextColor: "#FFFAFAFA", candidateLabelColor: "#FFFAFAFA", candidateCommentColor: "#FFACACAC", altKeyBackgroundColor: "#FF373737", altKeyTextColor: "#FFACACAC",
        accentKeyBackgroundColor: "#FF5E97F6", accentKeyTextColor: "#FFFFFFFF", keyPressHighlightColor: "#33FFFFFF", keyShadowColor: "#FF252525", popupBackgroundColor: "#FF373737",
        popupTextColor: "#FFFAFAFA", spaceBarColor: "#FF4A4A4A", dividerColor: "#1FFFFFFF", clipboardEntryColor: "#FF464646", genericActiveBackgroundColor: "#FF5E97F6", genericActiveForegroundColor: "#FFFAFAFA"
      }
    },
    {
      name: "NordLight",
      colors: {
        backgroundColor: "#FFD8DEE9", barColor: "#FFE5E9F0", keyboardColor: "#FFECEFF4", keyBackgroundColor: "#FFECEFF4", keyTextColor: "#FF2E3440",
        candidateTextColor: "#FF2E3440", candidateLabelColor: "#FF2E3440", candidateCommentColor: "#FF4C566A", altKeyBackgroundColor: "#FFE5E9F0", altKeyTextColor: "#FF434C5E",
        accentKeyBackgroundColor: "#FF5E81AC", accentKeyTextColor: "#FFECEFF4", keyPressHighlightColor: "#1F000000", keyShadowColor: "#1F000000", popupBackgroundColor: "#FFE5E9F0",
        popupTextColor: "#FF2E3440", spaceBarColor: "#FFD8DEE9", dividerColor: "#1F000000", clipboardEntryColor: "#FFECEFF4", genericActiveBackgroundColor: "#FF5E81AC", genericActiveForegroundColor: "#FFECEFF4"
      }
    },
    {
      name: "NordDark",
      colors: {
        backgroundColor: "#FF2E3440", barColor: "#FF434C5E", keyboardColor: "#FF2E3440", keyBackgroundColor: "#FF4C566A", keyTextColor: "#FFECEFF4",
        candidateTextColor: "#FFECEFF4", candidateLabelColor: "#FFECEFF4", candidateCommentColor: "#FFD8DEE9", altKeyBackgroundColor: "#FF3B4252", altKeyTextColor: "#FFD8DEE9",
        accentKeyBackgroundColor: "#FF88C0D0", accentKeyTextColor: "#FF2E3440", keyPressHighlightColor: "#33FFFFFF", keyShadowColor: "#FF434C5E", popupBackgroundColor: "#FF434C5E",
        popupTextColor: "#FFECEFF4", spaceBarColor: "#FF4C566A", dividerColor: "#1FFFFFFF", clipboardEntryColor: "#FF4C566A", genericActiveBackgroundColor: "#FF88C0D0", genericActiveForegroundColor: "#FF2E3440"
      }
    },
    {
      name: "DeepBlue",
      colors: {
        backgroundColor: "#FF1565C0", barColor: "#FF0D47A1", keyboardColor: "#FF1565C0", keyBackgroundColor: "#FF3F80CB", keyTextColor: "#FFFFFFFF",
        candidateTextColor: "#FFFFFFFF", candidateLabelColor: "#FFFFFFFF", candidateCommentColor: "#FFA9C6E7", altKeyBackgroundColor: "#FF2771C4", altKeyTextColor: "#FFA9C6E7",
        accentKeyBackgroundColor: "#FF2196F3", accentKeyTextColor: "#FFFFFFFF", keyPressHighlightColor: "#33FFFFFF", keyShadowColor: "#FF1255A1", popupBackgroundColor: "#FF0D47A1",
        popupTextColor: "#FFFFFFFF", spaceBarColor: "#FF7EAADC", dividerColor: "#1FFFFFFF", clipboardEntryColor: "#FF3F80CB", genericActiveBackgroundColor: "#FF094CEA", genericActiveForegroundColor: "#FFFFFFFF"
      }
    },
    {
      name: "Monokai",
      colors: {
        backgroundColor: "#FF272822", barColor: "#FF1F201B", keyboardColor: "#FF272822", keyBackgroundColor: "#FF33342C", keyTextColor: "#FFD6D6D6",
        candidateTextColor: "#FFD6D6D6", candidateLabelColor: "#FFD6D6D6", candidateCommentColor: "#FF797979", altKeyBackgroundColor: "#FF2D2E27", altKeyTextColor: "#FF797979",
        accentKeyBackgroundColor: "#FFB05279", accentKeyTextColor: "#FFD6D6D6", keyPressHighlightColor: "#33FFFFFF", keyShadowColor: "#FF171813", popupBackgroundColor: "#FF1F201B",
        popupTextColor: "#FFD6D6D6", spaceBarColor: "#FF373830", dividerColor: "#1FFFFFFF", clipboardEntryColor: "#FF33342C", genericActiveBackgroundColor: "#FFB05279", genericActiveForegroundColor: "#FFD6D6D6"
      }
    },
    {
      name: "AMOLEDBlack",
      colors: {
        backgroundColor: "#FF000000", barColor: "#FF373737", keyboardColor: "#FF000000", keyBackgroundColor: "#FF2E2E2E", keyTextColor: "#FFFFFFFF",
        candidateTextColor: "#FFFFFFFF", candidateLabelColor: "#FFFFFFFF", candidateCommentColor: "#FFA1A1A1", altKeyBackgroundColor: "#FF141414", altKeyTextColor: "#FFA1A1A1",
        accentKeyBackgroundColor: "#FF80CBC4", accentKeyTextColor: "#FFFFFFFF", keyPressHighlightColor: "#33FFFFFF", keyShadowColor: "#FF000000", popupBackgroundColor: "#FF373737",
        popupTextColor: "#FFFFFFFF", spaceBarColor: "#FF727272", dividerColor: "#1FFFFFFF", clipboardEntryColor: "#FF2E2E2E", genericActiveBackgroundColor: "#FF26A69A", genericActiveForegroundColor: "#FFFFFFFF"
      }
    }
  ];
  const defaultThemePresetName = "PixelDark";
  const defaultThemeColors = deepClone(
    builtinThemePresets.find((preset) => preset.name === defaultThemePresetName)?.colors || builtinThemePresets[0].colors
  );
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
  const macroAppActionLabels = {
    theme: "主题",
    virtual_keyboard: "虚拟键盘",
    more: "高级菜单",
    browse_user_data_dir: "浏览用户数据目录",
    clipboard: "剪贴板",
    cursor_move: "文本编辑",
    floating_toggle: "浮动键盘",
    language_switch: "语言切换",
    reload_config: "重载配置",
    one_handed_keyboard: "单手键盘",
    input_method_options: "输入法设置",
    undo: "撤销",
    redo: "重做",
    settings_global_options: "全局选项",
    settings_input_methods: "输入法",
    settings_candidates_window: "候选窗口",
    settings_clipboard: "剪贴板",
    settings_symbol: "表情和符号",
    settings_plugin: "插件",
    settings_advanced: "高级",
    settings_developer: "开发者",
    settings_about: "关于",
    settings_license: "许可",
    edit_text_keyboard_layout: "编辑文本键盘布局",
    text_keyboard_layout_file_select: "文本键盘布局文件",
    edit_fontset: "编辑字体集"
  };
  const macroModifierKeys = new Set([
    "Ctrl_L", "Ctrl_R", "Alt_L", "Alt_R", "Shift_L", "Shift_R",
    "Meta_L", "Meta_R", "Super_L", "Super_R", "Hyper_L", "Hyper_R",
    "Mode_switch", "ISO_Level3_Shift", "ISO_Level5_Shift"
  ]);
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

  // Fcitx key name -> output symbol hints, mirroring the fcitx5-android app's
  // MacroEditorActivity SYMBOL_KEY_MAP (lookup is case-insensitive).
  const fcitxKeySymbolMap = {
    exclam: "!", at: "@", numbersign: "#", dollar: "$", percent: "%",
    asciicircum: "^", ampersand: "&", asterisk: "*", parenleft: "(", parenright: ")",
    minus: "-", underscore: "_", equal: "=", plus: "+",
    bracketleft: "[", braceleft: "{", bracketright: "]", braceright: "}",
    backslash: "\\", bar: "|", semicolon: ";", colon: ":", apostrophe: "'",
    quotedbl: "\"", grave: "`", asciitilde: "~", comma: ",", less: "<",
    period: ".", greater: ">", slash: "/", question: "?",
    multiply: "*", add: "+", subtract: "-", divide: "÷", separator: ",",
    kp_multiply: "*", kp_add: "+", kp_subtract: "-", kp_divide: "÷",
    kp_decimal: ".", kp_equal: "=", kp_separator: ","
  };
  const fcitxKeyDisplayAlias = {
    bracket_l: "bracketleft",
    bracket_r: "bracketright",
    multiply: "asterisk",
    add: "plus",
    subtract: "minus",
    tilde: "asciitilde"
  };

  function fcitxKeySymbol(code) {
    const raw = String(code || "").trim();
    if (!raw) return null;
    const lower = raw.toLowerCase();
    const normalized = fcitxKeyDisplayAlias[lower] || lower;
    return fcitxKeySymbolMap[normalized] ?? fcitxKeySymbolMap[lower] ?? null;
  }

  // ── Icon Theme ──
  const iconThemeKeySlots = [
    "keys.capslock.none", "keys.capslock.once", "keys.capslock.lock",
    "keys.backspace",
    "keys.return.default", "keys.return.go", "keys.return.search",
    "keys.return.send", "keys.return.next", "keys.return.previous", "keys.return.done",
    "keys.language", "keys.quickphrase", "keys.space",
    "keys.numpad", "keys.emoji", "keys.symbols", "keys.unicode",
    "keys.pageup", "keys.pagedown"
  ];

  const iconThemeToolbarSlots = [
    "toolbar.undo", "toolbar.redo", "toolbar.cursor_move",
    "toolbar.floating_toggle", "toolbar.clipboard", "toolbar.more",
    "toolbar.language_switch", "toolbar.theme", "toolbar.icon_theme",
    "toolbar.input_method_options", "toolbar.reload_config",
    "toolbar.virtual_keyboard", "toolbar.one_handed_keyboard",
    "toolbar.browse_user_data", "toolbar.settings_global",
    "toolbar.settings_ime", "toolbar.edit_layout", "toolbar.edit_fontset"
  ];

  const iconThemeSystemSlots = [
    "system.toolbar_toggle", "system.hide_keyboard", "system.voice_input"
  ];

  const iconThemeSlotsAll = [...iconThemeKeySlots, ...iconThemeToolbarSlots, ...iconThemeSystemSlots];

  function iconThemeSlotToDisplayName(slot) {
    return slot
      .replace(/^(keys|toolbar|system)\./, "")
      .replace(/\./g, " / ")
      .replace(/_/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  function iconThemeSlotSupportsText(slot) {
    return slot.startsWith("toolbar.") || slot.startsWith("system.");
  }

  function createDefaultIconTheme(name = "Default") {
    return {
      id: "builtin-default",
      name: name,
      author: "",
      version: 1,
      builtin: true,
      thumbnailSvg: null,
      icons: {}
    };
  }

  const state = {
    layout: deepClone(defaultLayout),
    initialLayout: deepClone(defaultLayout),
    popupEntries: {},
    initialPopupEntries: {},
    initialThemeCatalogSignature: "",
    initialThemeAppSyncSignature: "",
    themeCatalog: createBuiltinThemeCatalog(),
    selectedThemeId: `builtin-${defaultThemePresetName}`,
    activeTab: "tab-layout",
    selectedBase: "default",
    selectedSubmode: DEFAULT_SUBMODE,
    suppressLayoutJsonInput: false,
    wasmReady: false,
    wasmInitPromise: null,
    qr: { chunks: [], index: 0, transferId: "", layoutSignature: "" },
    themeQr: { chunks: [], index: 0, transferId: "", themeSignature: "" },
    qrImportRunning: false,
    themeImportRunning: false,
    popupImportRunning: false,
    themeAssetUrlByPath: new Map(),
    themeImageMetaByUrl: new Map(),
    dragKey: null,
    dragRow: null,
    dragRowNode: null,
    dragRowPointerId: null,
    layoutJsonEditor: null,
    layoutJsonEditorLoading: false,
    themeJsonEditor: null,
    themeJsonEditorLoading: false,
    popupJsonEditor: null,
    popupJsonEditorLoading: false,
    suppressThemeJsonInput: false,
    suppressPopupJsonInput: false,
    layoutKeyJsonEditor: null,
    layoutKeyJsonEditorLoading: false,
    codeMirrorModulesPromise: null,
    lastJsonCardHeight: 0,
    lastThemeJsonCardHeight: 0,
    lastPopupJsonCardHeight: 0,
    layoutHeightObserver: null,
    themeHeightObserver: null,
    popupHeightObserver: null,
    composeNestedContext: null,
    macroStepDrag: null,
    macroStepDragPointerId: null,
    macroStepDragNode: null,
    macroStepDragHoldTimer: null,
    macroStepDragActive: false,
    macroStepDragStartX: 0,
    macroStepDragStartY: 0,
    macroEventEditor: { eventName: "tap", steps: [] },
    popupQr: { chunks: [], index: 0, transferId: "", popupSignature: "" },
    popupCandidateDrag: null,
    popupCandidateDragMoved: false,
    popupPointerDragNode: null,
    popupPointerDragSource: null,
    layoutChipClickSuppressedUntil: 0,
    layoutChipNativeClickSuppressedUntil: 0,
    layoutKeyDialogTouchOpenUntil: 0,
    layoutKeyDialogConsumeNextClick: false,
    keyPointerDragPointerId: null,
    keyPointerDragHoldTimer: null,
    keyPointerDragActive: false,
    keyPointerDragStartX: 0,
    keyPointerDragStartY: 0,
    keyPointerDragNode: null,
    keyPointerDragSource: null,
    popupChipClickSuppressedUntil: 0,
    popupChipNativeClickSuppressedUntil: 0,
    popupPointerDragPointerId: null,
    popupPointerDragHoldTimer: null,
    popupPointerDragActive: false,
    popupPointerDragStartX: 0,
    popupPointerDragStartY: 0,
    popupConsumeNextNativeClick: false,
    themeAppSync: {
      borderEnabled: true,
      borderOutline: false,
      gboardStyle: false,
      keyHGap: 3,
      keyVGap: 3,
      keyRadius: 4,
      punctPos: 'bottom',
      previewMetrics: null
    },
    themeCrop: {
      imageWidth: 0,
      imageHeight: 0,
      scaleX: 1,
      scaleY: 1,
      rectPx: null,
      dragMode: "",
      pointerId: null,
      startX: 0,
      startY: 0,
      startRect: null
    },
    iconThemeCatalog: [createDefaultIconTheme()],
    selectedIconThemeId: "builtin-default",
    initialIconThemeCatalogSignature: "",
  };

  const keyDialogState = { rowIndex: -1, keyIndex: -1, draft: null };
  const gradientDialogState = { anchors: [] };
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

  function currentThemeSignature() {
    try {
      return JSON.stringify(serializeCurrentTheme());
    } catch (_) {
      return "";
    }
  }

  function currentPopupSignature() {
    try {
      return JSON.stringify(serializePopupEntries());
    } catch (_) {
      return "";
    }
  }

  function layoutHasChanges() {
    try {
      return currentLayoutSignature() !== JSON.stringify(normalizeLayoutObject(deepClone(state.initialLayout)));
    } catch (_) {
      return true;
    }
  }

  function themeCatalogSignature(themeCatalog = state.themeCatalog, selectedThemeId = state.selectedThemeId) {
    try {
      const normalized = (Array.isArray(themeCatalog) ? themeCatalog : []).map((theme) => ({
        id: String(theme?.id || ""),
        name: String(theme?.name || ""),
        builtin: !!theme?.builtin,
        isDark: !!theme?.isDark,
        colors: normalizeThemeColors(theme?.colors || {}),
        backgroundImage: String(theme?.backgroundImage || "")
      }));
      return JSON.stringify({ selectedThemeId: String(selectedThemeId || ""), themes: normalized });
    } catch (_) {
      return "";
    }
  }

  function themeHasChanges() {
    return themeCatalogSignature() !== state.initialThemeCatalogSignature;
  }

  function themeAppSyncHasChanges() {
    try {
      return JSON.stringify(state.themeAppSync) !== state.initialThemeAppSyncSignature;
    } catch (_) {
      return true;
    }
  }

  function hasUnsavedChanges() {
    return layoutHasChanges() || popupHasChanges() || themeHasChanges() || themeAppSyncHasChanges() || iconThemeHasChanges();
  }

  function setupBeforeUnloadGuard() {
    window.addEventListener("beforeunload", (event) => {
      if (!hasUnsavedChanges()) return;
      event.preventDefault();
      event.returnValue = "";
    });
  }

  function normalizeThemeColors(raw) {
    const out = {};
    themeColorTokens.forEach((token) => {
      const source = raw && Object.prototype.hasOwnProperty.call(raw, token) ? raw[token] : defaultThemeColors[token];
      const normalized = normalizeColorValue(source);
      out[token] = normalized == null ? normalizeColorValue(defaultThemeColors[token]) : normalized;
    });
    return out;
  }

  function normalizeColorValue(value) {
    if (value == null) return null;
    try {
      if (typeof value === "number") return toSignedInt32(value >>> 0);
      const parsed = parseColorValue(String(value).trim());
      return parsed == null ? null : toSignedInt32(parsed >>> 0);
    } catch (_) {
      return null;
    }
  }

  function toArgbHex(color) {
    const u = (Number(color) || 0) >>> 0;
    return `#${u.toString(16).toUpperCase().padStart(8, "0")}`;
  }

  function argbToCss(color) {
    const u = (Number(color) || 0) >>> 0;
    const a = ((u >>> 24) & 0xff) / 255;
    const r = (u >>> 16) & 0xff;
    const g = (u >>> 8) & 0xff;
    const b = u & 0xff;
    return `rgba(${r}, ${g}, ${b}, ${Math.round(a * 1000) / 1000})`;
  }

  function isLightThemeColor(color) {
    const u = (Number(color) || 0) >>> 0;
    const r = (u >>> 16) & 0xff;
    const g = (u >>> 8) & 0xff;
    const b = u & 0xff;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    return luma >= 160;
  }

  function contrastTextForBackground(color) {
    return isLightThemeColor(color) ? "rgba(0, 0, 0, 0.92)" : "rgba(255, 255, 255, 0.94)";
  }

  function contrastBackgroundForForeground(color) {
    return isLightThemeColor(color) ? "rgba(0, 0, 0, 0.88)" : "rgba(255, 255, 255, 0.92)";
  }

  function resolveThemeTokenColor(token) {
    if (!themeColorTokens.includes(token)) return normalizeColorValue(defaultThemeColors.backgroundColor) || 0;
    const theme = currentThemeEntry();
    return normalizeColorValue(theme?.colors?.[token]) ?? normalizeColorValue(defaultThemeColors[token]) ?? 0;
  }

  function resolveKeyColorValue(key, customKey, monetKey, fallbackColor) {
    const custom = normalizeColorValue(key?.[customKey]);
    if (custom != null) return custom;
    const monetRef = typeof key?.[monetKey] === "string" ? key[monetKey].trim() : "";
    if (monetRef.startsWith("theme:")) {
      const token = monetRef.slice("theme:".length);
      if (themeColorTokens.includes(token)) return resolveThemeTokenColor(token);
    }
    return fallbackColor;
  }

  function resolvePreviewColorsForKey(key) {
    const borderEnabled = state.themeAppSync?.borderEnabled ?? PREVIEW_KEY_BORDER_ENABLED;
    const gboardStyle = !!state.themeAppSync?.gboardStyle;
    const variant = keyVariantClass(key);
    const isAlt = variant.includes("alt-key");
    const isAccent = variant.includes("accent-key");
    const isSpace = variant.includes("space-key");
    const isCompose = variant.includes("compose-key");
    const isLayoutSwitch = key?.type === "LayoutSwitchKey" || key?.type === "LayerSwitchKey";
    const isReturn = key?.type === "ReturnKey";
    if (!borderEnabled) {
      const backgroundColor = isSpace
        ? resolveThemeTokenColor("spaceBarColor")
        : isReturn
          ? resolveThemeTokenColor("accentKeyBackgroundColor")
        : isLayoutSwitch
          ? resolveThemeTokenColor(gboardStyle ? "altKeyBackgroundColor" : "keyboardColor")
        : isAccent
          ? resolveKeyColorValue(key, "backgroundColor", "backgroundColorMonet", resolveThemeTokenColor("accentKeyBackgroundColor"))
        : resolveThemeTokenColor("keyboardColor");
      const fallbackText = isAccent
        ? resolveThemeTokenColor("accentKeyTextColor")
        : isLayoutSwitch
          ? resolveThemeTokenColor("altKeyTextColor")
        : isAlt
          ? resolveThemeTokenColor("altKeyTextColor")
          : resolveThemeTokenColor("keyTextColor");
      const fallbackAltText = resolveThemeTokenColor("altKeyTextColor");
      const textColor = resolveKeyColorValue(key, "textColor", "textColorMonet", fallbackText);
      const altTextColor = resolveKeyColorValue(key, "altTextColor", "altTextColorMonet", fallbackAltText);
      const composeHintColor = resolveThemeTokenColor("genericActiveBackgroundColor");
      return {
        backgroundCss: argbToCss(backgroundColor),
        textCss: argbToCss(isCompose ? composeHintColor : (isReturn ? resolveThemeTokenColor("accentKeyTextColor") : textColor)),
        altTextCss: argbToCss(altTextColor),
        borderCss: argbToCss(backgroundColor)
      };
    }
    const fallbackBackground = isAccent
      ? resolveThemeTokenColor("accentKeyBackgroundColor")
      : isSpace
        ? resolveThemeTokenColor(borderEnabled ? "keyBackgroundColor" : "spaceBarColor")
        : isAlt
          ? resolveThemeTokenColor("altKeyBackgroundColor")
          : resolveThemeTokenColor("keyBackgroundColor");
    const fallbackText = isAccent
      ? resolveThemeTokenColor("accentKeyTextColor")
      : isAlt
        ? resolveThemeTokenColor("altKeyTextColor")
        : resolveThemeTokenColor("keyTextColor");
    const fallbackAltText = resolveThemeTokenColor("altKeyTextColor");
    const backgroundColor = resolveKeyColorValue(key, "backgroundColor", "backgroundColorMonet", fallbackBackground);
    const textColor = resolveKeyColorValue(key, "textColor", "textColorMonet", fallbackText);
    const altTextColor = resolveKeyColorValue(key, "altTextColor", "altTextColorMonet", fallbackAltText);
    const borderColor = borderEnabled
      ? resolveKeyColorValue(key, "shadowColor", "shadowColorMonet", resolveThemeTokenColor("keyShadowColor"))
      : backgroundColor;
    const composeHintColor = resolveThemeTokenColor("genericActiveBackgroundColor");
    return {
      backgroundCss: argbToCss(backgroundColor),
      textCss: argbToCss(isCompose ? composeHintColor : textColor),
      altTextCss: argbToCss(altTextColor),
      borderCss: argbToCss(borderColor)
    };
  }

  function resolvePreviewSurfaceColor() {
    const borderEnabled = state.themeAppSync?.borderEnabled ?? PREVIEW_KEY_BORDER_ENABLED;
    const token = borderEnabled ? "backgroundColor" : "keyboardColor";
    return argbToCss(resolveThemeTokenColor(token));
  }

  function syncSurfaceColorIndicator() {
    const rows = el("theme-color-rows");
    if (!rows || rows.hidden) return;
    const borderEnabled = state.themeAppSync?.borderEnabled ?? PREVIEW_KEY_BORDER_ENABLED;
    const activeToken = borderEnabled ? "backgroundColor" : "keyboardColor";
    rows.querySelectorAll(".theme-color-row").forEach((row) => {
      const token = row.dataset.token;
      if (token !== "backgroundColor" && token !== "keyboardColor") return;
      let mark = row.querySelector(".surface-active-mark");
      if (token === activeToken) {
        if (!mark) {
          mark = document.createElement("span");
          mark.className = "surface-active-mark";
          mark.title = "当前作为预览区背景生效中";
          mark.textContent = " ●";
          row.querySelector("label")?.appendChild(mark);
        }
      } else {
        mark?.remove();
      }
    });
  }

  function applyPreviewThemeSurface() {
    const root = el("layout-preview");
    if (!root) return;
    const theme = currentThemeEntry();
    const sourceUrl = theme?.backgroundImage || resolveThemeAssetUrl(theme?.backgroundImageObject);
    if (sourceUrl && !state.themeImageMetaByUrl.has(sourceUrl)) {
      loadImageForCanvas(sourceUrl).then(() => {
        if (currentThemeEntry()?.id === theme?.id) {
          applyPreviewThemeSurface();
          syncPreviewBlurMaskGeometry();
        }
      }).catch(() => {});
    }
    root.style.backgroundColor = resolvePreviewSurfaceColor();
    if (sourceUrl) {
      root.style.backgroundImage = `url("${sourceUrl}")`;
      root.style.backgroundSize = "cover";
      root.style.backgroundPosition = "center";
      root.style.backgroundBlendMode = "";
    } else {
      root.style.backgroundImage = "none";
      root.style.backgroundSize = "";
      root.style.backgroundPosition = "";
      root.style.backgroundBlendMode = "";
    }
    root.style.backgroundRepeat = "no-repeat";
    root.style.borderColor = argbToCss(resolveThemeTokenColor("dividerColor"));
  }

  function createBuiltinThemeCatalog() {
    return builtinThemePresets.map((preset) => ({
      id: `builtin-${preset.name}`,
      name: preset.name,
      builtin: true,
      isDark: /Dark|AMOLED|Monokai|DeepBlue/.test(preset.name),
      colors: normalizeThemeColors(deepClone(preset.colors)),
      backgroundImage: ""
    }));
  }

  function currentThemeEntry() {
    return state.themeCatalog.find((item) => item.id === state.selectedThemeId) || state.themeCatalog[0];
  }

  function isCurrentThemeEditable() {
    return !!currentThemeEntry() && !currentThemeEntry().builtin;
  }

  function updateThemeManageButtonsVisibility(editable) {
    ["theme-rename-custom", "theme-delete-custom", "theme-import-background", "theme-clear-background"].forEach((id) => {
      const btn = el(id);
      if (btn) btn.hidden = !editable;
    });
  }

  function nextCustomThemeName(baseName, excludeId = "") {
    const existed = new Set(state.themeCatalog.filter((item) => item.id !== excludeId).map((item) => item.name));
    if (!existed.has(baseName)) return baseName;
    let i = 2;
    while (existed.has(`${baseName} ${i}`)) i += 1;
    return `${baseName} ${i}`;
  }

  function generateUuidString() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    const seed = `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
    return `${seed.slice(0, 8)}-${seed.slice(8, 12)}-${seed.slice(12, 16)}-${seed.slice(16, 20)}-${seed.slice(20, 32)}`;
  }

  function nextUuidThemeName() {
    let candidate = generateUuidString();
    const existed = new Set(state.themeCatalog.map((item) => item.name));
    while (existed.has(candidate)) candidate = generateUuidString();
    return candidate;
  }

  function inferThemeImageExtByPath(path, fallback = "png") {
    const normalized = String(path || "").split(/[?#]/)[0].replace(/\\/g, "/");
    const ext = normalized.includes(".") ? normalized.split(".").pop().toLowerCase() : "";
    return ext || fallback;
  }

  function syncThemeBackgroundPathsWithName(theme) {
    if (!theme || !theme.backgroundImageObject) return false;
    const safe = theme.name.replace(/[\\/:*?"<>|]/g, "_") || "theme";
    const croppedExt = inferThemeImageExtByPath(theme.backgroundImageObject.croppedFilePath, "png");
    const srcExt = inferThemeImageExtByPath(theme.backgroundImageObject.srcFilePath, croppedExt);
    const nextSpec = normalizeThemeBackgroundImageObject({
      ...theme.backgroundImageObject,
      croppedFilePath: `${safe}/${safe}.cropped.${croppedExt}`,
      srcFilePath: `${safe}/${safe}.src.${srcExt}`
    });
    if (!nextSpec) return false;
    theme.backgroundImageObject = nextSpec;
    if (typeof theme.backgroundImage === "string" && theme.backgroundImage.startsWith("blob:")) {
      registerThemeAssetForBackground(nextSpec, theme.backgroundImage);
    }
    return true;
  }

  function renameThemeAndSyncAssets(theme, requestedName) {
    const rawName = String(requestedName || "").trim();
    if (!rawName) throw new Error("主题名不能为空");
    const nextName = nextCustomThemeName(rawName, theme.id);
    if (nextName === theme.name) return { changed: false, name: nextName };
    theme.name = nextName;
    syncThemeBackgroundPathsWithName(theme);
    return { changed: true, name: nextName };
  }

  function renderThemeList() {
    const root = el("theme-list");
    if (!root) return;
    root.innerHTML = state.themeCatalog.map((theme) => {
      const barColor = argbToCss(normalizeColorValue(theme.colors.barColor));
      const keyboardColor = argbToCss(normalizeColorValue(theme.colors.keyboardColor));
      const dividerColor = argbToCss(normalizeColorValue(theme.colors.dividerColor));
      const keyTextColor = argbToCss(normalizeColorValue(theme.colors.keyTextColor));
      const spaceBarColor = argbToCss(normalizeColorValue(theme.colors.spaceBarColor));
      const accentBg = argbToCss(normalizeColorValue(theme.colors.accentKeyBackgroundColor));
      const backgroundLayerStyle = buildThemeBackgroundImageLayerCss(theme);
      const bgHasImage = backgroundLayerStyle.backgroundImage !== "none";
      const bgImageCss = escapeAttr(backgroundLayerStyle.backgroundImage);
      // Card is a thumbnail — use simple cover/center regardless of crop rect.
      // The crop placement is for full-size layout preview, not scaled-down cards.
      const previewStyle = `background-color:${escapeAttr(keyboardColor)};background-image:${bgImageCss};background-size:cover;background-position:center;`;
      // Overlay only renders when there is an image; filter + transform on top
      const bgOverlayStyle = bgHasImage
        ? `background-image:${bgImageCss};background-size:cover;background-position:center;filter:${escapeAttr(backgroundLayerStyle.filter)};transform:${escapeAttr(backgroundLayerStyle.transform)};`
        : "display:none;";
      return `
        <button type="button" class="theme-card ${theme.id === state.selectedThemeId ? "active" : ""}" data-theme-id="${escapeAttr(theme.id)}">
          <div class="theme-card-preview" style="${previewStyle}" data-theme-id="${escapeAttr(theme.id)}">
            <span class="theme-card-preview-bg" style="${bgOverlayStyle}"></span>
            <span class="theme-card-preview-bar" style="background:${escapeAttr(barColor)}"></span>
            <span class="theme-card-preview-name" style="color:${escapeAttr(keyTextColor)}">${escapeHtml(theme.name)}</span>
            <span class="theme-card-preview-key theme-card-preview-space" style="--theme-card-key-bg:${escapeAttr(spaceBarColor)}"><span class="theme-card-preview-key-mask"></span><span class="theme-card-preview-key-tint"></span></span>
            <span class="theme-card-preview-key theme-card-preview-return" style="--theme-card-key-bg:${escapeAttr(accentBg)}"><span class="theme-card-preview-key-mask"></span><span class="theme-card-preview-key-tint"></span></span>
          </div>
        </button>
      `;
    }).join("");
    requestAnimationFrame(syncThemeCardBlurMaskGeometry);
    root.querySelectorAll(".theme-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.themeId;
        if (!id) return;
        state.selectedThemeId = id;
        renderThemeList();
        renderThemeEditor();
        syncThemeJsonFromState();
        syncLayoutUiFromState();
      });
    });
  }

  function syncThemeCardBlurMaskGeometry() {
    const root = el("theme-list");
    if (!root) return;
    root.querySelectorAll(".theme-card-preview").forEach((preview) => {
      const theme = state.themeCatalog.find((item) => item.id === preview.dataset.themeId);
      if (!theme) return;
      const sourceUrl = theme.backgroundImage || resolveThemeAssetUrl(theme.backgroundImageObject);
      const blurRadius = themeBackgroundBlurRadius(theme.backgroundImageObject);
      const brightness = themeBackgroundBrightness(theme.backgroundImageObject);
      const enabled = !!sourceUrl && blurRadius > 0;
      const previewRect = preview.getBoundingClientRect();
      preview.style.setProperty("--theme-card-bg-url", enabled ? `url("${sourceUrl}")` : "none");
      preview.style.setProperty("--theme-card-bg-width", `${Math.max(1, previewRect.width)}px`);
      preview.style.setProperty("--theme-card-bg-height", `${Math.max(1, previewRect.height)}px`);
      preview.style.setProperty("--theme-card-bg-blur", `${blurRadius}px`);
      preview.style.setProperty("--theme-card-bg-bleed", `${Math.max(12, blurRadius * 2)}px`);
      preview.style.setProperty("--theme-card-bg-brightness", `${brightness}%`);
      preview.style.setProperty("--theme-card-bg-mask-opacity", enabled ? "1" : "0");
      preview.style.setProperty("--theme-card-key-tint-opacity", enabled ? "0.58" : "1");
      preview.querySelectorAll(".theme-card-preview-key").forEach((key) => {
        const keyRect = key.getBoundingClientRect();
        key.style.setProperty("--theme-card-bg-x", `${keyRect.left - previewRect.left}px`);
        key.style.setProperty("--theme-card-bg-y", `${keyRect.top - previewRect.top}px`);
      });
    });
  }

  function serializeCurrentTheme() {
    const theme = currentThemeEntry();
    return {
      name: theme.name,
      builtin: !!theme.builtin,
      isDark: !!theme.isDark,
      backgroundImage: theme.backgroundImageObject ? deepClone(theme.backgroundImageObject) : (theme.backgroundImage || ""),
      colors: deepClone(theme.colors)
    };
  }

  function syncThemeJsonFromState() {
    const text = `${prettyJson(serializeCurrentTheme())}\n`;
    state.suppressThemeJsonInput = true;
    setThemeJsonText(text);
    state.suppressThemeJsonInput = false;
    setStatus("theme-json-status", "JSON 已同步", "ok");
  }

  function normalizeThemeBackgroundImageObject(raw) {
    if (!raw || typeof raw !== "object") return null;
    const croppedFilePath = typeof raw.croppedFilePath === "string" ? raw.croppedFilePath : "";
    const srcFilePath = typeof raw.srcFilePath === "string" ? raw.srcFilePath : "";
    if (!croppedFilePath && !srcFilePath) return null;
    const brightness = clampNumber(raw.brightness, 0, 100, 70);
    const cropRotation = normalizeThemeBackgroundRotation(raw.cropRotation);
    const blurRadius = clampNumber(raw.blurRadius, 0, 25, 0);
    return {
      croppedFilePath,
      srcFilePath,
      brightness,
      cropRect: raw.cropRect ?? null,
      cropRotation,
      blurRadius,
      imageWidthHint: Number.isFinite(Number(raw.imageWidthHint)) ? Number(raw.imageWidthHint) : undefined,
      imageHeightHint: Number.isFinite(Number(raw.imageHeightHint)) ? Number(raw.imageHeightHint) : undefined
    };
  }

  function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

  function normalizeThemeBackgroundRotation(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    const normalized = ((Math.round(number / 90) * 90) % 360 + 360) % 360;
    return normalized;
  }

  function themeBackgroundBrightness(spec) {
    return clampNumber(spec?.brightness, 0, 100, 70);
  }

  function themeBackgroundBlurRadius(spec) {
    return clampNumber(spec?.blurRadius, 0, 25, 0);
  }

  function themeBackgroundRotation(spec) {
    return normalizeThemeBackgroundRotation(spec?.cropRotation);
  }

  function buildThemeBackgroundPlacement(spec, cropRect, sourceUrl = "") {
    const rect = rectFromThemeCropRect(cropRect);
    if (!rect) {
      return {
        backgroundSize: "cover",
        backgroundPosition: "center"
      };
    }
    const meta = sourceUrl ? state.themeImageMetaByUrl.get(sourceUrl) : null;
    const imageWidth = Math.max(1, Number(meta?.width) || Number(spec?.imageWidthHint) || rect.right);
    const imageHeight = Math.max(1, Number(meta?.height) || Number(spec?.imageHeightHint) || rect.bottom);
    const cropWidth = Math.max(1, rect.right - rect.left);
    const cropHeight = Math.max(1, rect.bottom - rect.top);
    const maxLeft = Math.max(1, imageWidth - cropWidth);
    const maxTop = Math.max(1, imageHeight - cropHeight);
    return {
      backgroundSize: `${(imageWidth / cropWidth) * 100}% ${(imageHeight / cropHeight) * 100}%`,
      backgroundPosition: `${(rect.left / maxLeft) * 100}% ${(rect.top / maxTop) * 100}%`
    };
  }

  function buildThemeBackgroundCss(theme) {
    const sourceUrl = theme?.backgroundImage || resolveThemeAssetUrl(theme?.backgroundImageObject);
    if (!sourceUrl) {
      return {
        backgroundImage: "none",
        backgroundSize: "",
        backgroundPosition: "",
        backgroundBlendMode: ""
      };
    }
    const spec = theme?.backgroundImageObject || {};
    const brightness = themeBackgroundBrightness(spec);
    const blur = themeBackgroundBlurRadius(spec);
    const dimAlpha = Math.max(0, Math.min(1, (100 - brightness) / 100));
    const placement = buildThemeBackgroundPlacement(spec, spec.cropRect, sourceUrl);
    const imageLayer = `url("${sourceUrl}")`;
    const dimLayer = `linear-gradient(rgba(0,0,0,${dimAlpha}), rgba(0,0,0,${dimAlpha}))`;
    const blurLayer = blur > 0 ? `linear-gradient(rgba(255,255,255,${Math.min(0.18, blur / 160)}), rgba(255,255,255,${Math.min(0.18, blur / 160)}))` : "";
    const layers = [blurLayer, dimLayer, imageLayer].filter(Boolean);
    return {
      backgroundImage: layers.join(", "),
      backgroundSize: layers.map(() => placement.backgroundSize).join(", "),
      backgroundPosition: layers.map(() => placement.backgroundPosition).join(", "),
      backgroundBlendMode: layers.length > 1 ? layers.slice(0, -1).map(() => "normal").join(", ") : ""
    };
  }

  function buildThemeBackgroundImageLayerCss(theme) {
    const sourceUrl = theme?.backgroundImage || resolveThemeAssetUrl(theme?.backgroundImageObject);
    const spec = theme?.backgroundImageObject || {};
    if (!sourceUrl) {
      return {
        backgroundImage: "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: "none",
        transform: "none"
      };
    }
    const placement = buildThemeBackgroundPlacement(spec, spec.cropRect, sourceUrl);
    return {
      backgroundImage: `url("${sourceUrl}")`,
      backgroundSize: placement.backgroundSize,
      backgroundPosition: placement.backgroundPosition,
      filter: `blur(${themeBackgroundBlurRadius(spec)}px) brightness(${themeBackgroundBrightness(spec)}%)`,
      transform: `rotate(${themeBackgroundRotation(spec)}deg) scale(${themeBackgroundBlurRadius(spec) > 0 ? 1.12 : 1})`
    };
  }

  function rectFromThemeCropRect(cropRect) {
    if (!cropRect || typeof cropRect !== "object") return null;
    const left = Number(cropRect.left);
    const top = Number(cropRect.top);
    const right = Number(cropRect.right);
    const bottom = Number(cropRect.bottom);
    if (![left, top, right, bottom].every(Number.isFinite)) return null;
    if (right <= left || bottom <= top) return null;
    return { left, top, right, bottom };
  }

  function clampCropRect(rect, width, height) {
    if (!rect) return null;
    const left = Math.max(0, Math.min(width - 1, rect.left));
    const top = Math.max(0, Math.min(height - 1, rect.top));
    const right = Math.max(left + 1, Math.min(width, rect.right));
    const bottom = Math.max(top + 1, Math.min(height, rect.bottom));
    return { left, top, right, bottom };
  }

  function syncThemeCropSelectionUi() {
    const selection = el("theme-crop-selection");
    const image = el("theme-crop-image");
    const stage = el("theme-crop-stage");
    if (!selection) return;
    const rect = state.themeCrop.rectPx;
    if (!rect) {
      selection.hidden = true;
      return;
    }
    const imageRect = image.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    selection.hidden = false;
    selection.style.left = `${rect.left + imageRect.left - stageRect.left}px`;
    selection.style.top = `${rect.top + imageRect.top - stageRect.top}px`;
    selection.style.width = `${rect.right - rect.left}px`;
    selection.style.height = `${rect.bottom - rect.top}px`;
  }

  async function openThemeCropDialog() {
    const theme = currentThemeEntry();
    if (!theme?.backgroundImageObject) throw new Error("当前主题没有可裁剪的背景图片");
    const sourceUrl = theme.backgroundImage || resolveThemeAssetUrl(theme.backgroundImageObject);
    if (!sourceUrl) throw new Error("当前背景图片不可用");
    const dialog = el("theme-crop-dialog");
    const image = el("theme-crop-image");
    const selection = el("theme-crop-selection");
    const loaded = await loadImageForCanvas(sourceUrl);
    const applyLoadedState = () => {
      const imageRect = image.getBoundingClientRect();
      state.themeCrop.imageWidth = loaded.naturalWidth || loaded.width || 1;
      state.themeCrop.imageHeight = loaded.naturalHeight || loaded.height || 1;
      state.themeCrop.scaleX = state.themeCrop.imageWidth / Math.max(1, imageRect.width);
      state.themeCrop.scaleY = state.themeCrop.imageHeight / Math.max(1, imageRect.height);
      const existingRect = rectFromThemeCropRect(theme.backgroundImageObject.cropRect);
      state.themeCrop.rectPx = existingRect
        ? {
            left: existingRect.left / state.themeCrop.scaleX,
            top: existingRect.top / state.themeCrop.scaleY,
            right: existingRect.right / state.themeCrop.scaleX,
            bottom: existingRect.bottom / state.themeCrop.scaleY
          }
        : {
            left: imageRect.width * 0.15,
            top: imageRect.height * 0.12,
            right: imageRect.width * 0.85,
            bottom: imageRect.height * 0.88
          };
      state.themeCrop.rectPx = clampCropRect(state.themeCrop.rectPx, imageRect.width, imageRect.height);
      syncThemeCropSelectionUi();
      setStatus("theme-crop-status", "拖动选区或四角控制点以调整裁剪范围", "");
    };
    image.src = sourceUrl;
    selection.hidden = true;
    if (!dialog.open) dialog.showModal();
    requestAnimationFrame(applyLoadedState);
  }

  function applyThemeCropRectFromDialog() {
    const theme = currentThemeEntry();
    const rect = state.themeCrop.rectPx;
    if (!theme?.backgroundImageObject || !rect) return;
    const cropRect = {
      left: Math.round(rect.left * state.themeCrop.scaleX),
      top: Math.round(rect.top * state.themeCrop.scaleY),
      right: Math.round(rect.right * state.themeCrop.scaleX),
      bottom: Math.round(rect.bottom * state.themeCrop.scaleY)
    };
    updateCurrentThemeBackgroundSpec({
      cropRect,
      imageWidthHint: state.themeCrop.imageWidth,
      imageHeightHint: state.themeCrop.imageHeight
    }, "背景裁剪已更新");
    el("theme-crop-dialog").close();
  }

  function installThemeCropInteractions() {
    const stage = el("theme-crop-stage");
    const selection = el("theme-crop-selection");
    const image = el("theme-crop-image");
    if (!stage || !selection || !image || stage.dataset.cropBound === "1") return;
    stage.dataset.cropBound = "1";

    const pickMode = (target) => {
      if (target.classList.contains("handle-nw")) return "nw";
      if (target.classList.contains("handle-ne")) return "ne";
      if (target.classList.contains("handle-sw")) return "sw";
      if (target.classList.contains("handle-se")) return "se";
      if (target === selection) return "move";
      return "new";
    };

    stage.addEventListener("pointerdown", (ev) => {
      if (!image.src) return;
      const imageRect = image.getBoundingClientRect();
      const x = ev.clientX - imageRect.left;
      const y = ev.clientY - imageRect.top;
      if (x < 0 || y < 0 || x > imageRect.width || y > imageRect.height) return;
      state.themeCrop.pointerId = ev.pointerId;
      state.themeCrop.dragMode = pickMode(ev.target);
      state.themeCrop.startX = x;
      state.themeCrop.startY = y;
      state.themeCrop.startRect = state.themeCrop.rectPx ? { ...state.themeCrop.rectPx } : null;
      if (state.themeCrop.dragMode === "new" || !state.themeCrop.startRect) {
        state.themeCrop.dragMode = "new";
        state.themeCrop.startRect = { left: x, top: y, right: x, bottom: y };
        state.themeCrop.rectPx = { ...state.themeCrop.startRect };
        syncThemeCropSelectionUi();
      }
      stage.setPointerCapture(ev.pointerId);
      ev.preventDefault();
    });

    stage.addEventListener("pointermove", (ev) => {
      if (state.themeCrop.pointerId !== ev.pointerId || !state.themeCrop.startRect) return;
      const imageRect = image.getBoundingClientRect();
      const x = Math.max(0, Math.min(imageRect.width, ev.clientX - imageRect.left));
      const y = Math.max(0, Math.min(imageRect.height, ev.clientY - imageRect.top));
      const dx = x - state.themeCrop.startX;
      const dy = y - state.themeCrop.startY;
      const start = state.themeCrop.startRect;
      let next = { ...start };
      switch (state.themeCrop.dragMode) {
        case "move":
          next = {
            left: start.left + dx,
            top: start.top + dy,
            right: start.right + dx,
            bottom: start.bottom + dy
          };
          break;
        case "nw":
          next.left += dx;
          next.top += dy;
          break;
        case "ne":
          next.right += dx;
          next.top += dy;
          break;
        case "sw":
          next.left += dx;
          next.bottom += dy;
          break;
        case "se":
          next.right += dx;
          next.bottom += dy;
          break;
        case "new":
        default:
          next = {
            left: Math.min(state.themeCrop.startX, x),
            top: Math.min(state.themeCrop.startY, y),
            right: Math.max(state.themeCrop.startX, x),
            bottom: Math.max(state.themeCrop.startY, y)
          };
          break;
      }
      if (state.themeCrop.dragMode === "move") {
        const width = next.right - next.left;
        const height = next.bottom - next.top;
        next.left = Math.max(0, Math.min(imageRect.width - width, next.left));
        next.top = Math.max(0, Math.min(imageRect.height - height, next.top));
        next.right = next.left + width;
        next.bottom = next.top + height;
      } else {
        if (next.right - next.left < 12) {
          if (state.themeCrop.dragMode === "nw" || state.themeCrop.dragMode === "sw") {
            next.left = next.right - 12;
          } else {
            next.right = next.left + 12;
          }
        }
        if (next.bottom - next.top < 12) {
          if (state.themeCrop.dragMode === "nw" || state.themeCrop.dragMode === "ne") {
            next.top = next.bottom - 12;
          } else {
            next.bottom = next.top + 12;
          }
        }
      }
      state.themeCrop.rectPx = clampCropRect(next, imageRect.width, imageRect.height);
      syncThemeCropSelectionUi();
      ev.preventDefault();
    });

    const finish = () => {
      state.themeCrop.pointerId = null;
      state.themeCrop.dragMode = "";
      state.themeCrop.startRect = null;
    };
    stage.addEventListener("pointerup", finish);
    stage.addEventListener("pointercancel", finish);
    stage.addEventListener("lostpointercapture", finish);
  }

  function renderThemeBackgroundEditor() {
    const theme = currentThemeEntry();
    const card = el("theme-background-card");
    if (!card) return;
    const editable = !!theme && !theme.builtin;
    card.hidden = !editable;
    if (!editable) return;
    const spec = theme.backgroundImageObject;
    const sourceUrl = theme.backgroundImage || resolveThemeAssetUrl(spec);
    const preview = el("theme-background-preview");
    const meta = el("theme-background-meta");
    const brightnessInput = el("theme-background-brightness");
    const brightnessValue = el("theme-background-brightness-value");
    const blurInput = el("theme-background-blur");
    const blurValue = el("theme-background-blur-value");
    const rotationInput = el("theme-background-rotation");
    const cropInput = el("theme-background-crop-rect");
    const hasBackground = !!sourceUrl && !!spec;
    if (preview) {
      preview.innerHTML = "";
      preview.classList.toggle("empty", !hasBackground);
      if (hasBackground) {
        const image = document.createElement("div");
        image.className = "theme-background-preview-image";
        image.style.backgroundImage = `url("${sourceUrl}")`;
        const placement = buildThemeBackgroundPlacement(spec, spec?.cropRect);
        image.style.backgroundSize = placement.backgroundSize;
        image.style.backgroundPosition = placement.backgroundPosition;
        image.style.backgroundRepeat = "no-repeat";
        image.style.filter = `brightness(${themeBackgroundBrightness(spec)}%) blur(${themeBackgroundBlurRadius(spec)}px)`;
        image.style.transform = `rotate(${themeBackgroundRotation(spec)}deg) scale(1.08)`;
        preview.appendChild(image);
      } else {
        preview.textContent = "未设置背景图片";
      }
    }
    if (meta) {
      meta.textContent = hasBackground
        ? `${spec.croppedFilePath || spec.srcFilePath || "背景图片"}`
        : "导入图片后可编辑亮度、模糊和旋转参数";
      meta.className = "status";
    }
    if (brightnessInput) {
      brightnessInput.disabled = !hasBackground;
      brightnessInput.value = String(themeBackgroundBrightness(spec));
    }
    if (brightnessValue) brightnessValue.textContent = `${themeBackgroundBrightness(spec)}%`;
    if (blurInput) {
      blurInput.disabled = !hasBackground;
      blurInput.value = String(themeBackgroundBlurRadius(spec));
    }
    if (blurValue) blurValue.textContent = themeBackgroundBlurRadius(spec) === 0 ? "无" : String(themeBackgroundBlurRadius(spec));
    if (rotationInput) {
      rotationInput.disabled = !hasBackground;
      rotationInput.value = String(themeBackgroundRotation(spec));
    }
    if (cropInput) {
      cropInput.disabled = !hasBackground;
      const cropRect = rectFromThemeCropRect(spec?.cropRect);
      cropInput.value = cropRect ? `${cropRect.left},${cropRect.top} - ${cropRect.right},${cropRect.bottom}` : "";
    }
  }

  function updateCurrentThemeBackgroundSpec(patch, message = "图片主题参数已更新") {
    const theme = currentThemeEntry();
    if (!theme || theme.builtin || !theme.backgroundImageObject) return;
    const nextSpec = normalizeThemeBackgroundImageObject({
      ...theme.backgroundImageObject,
      ...patch
    });
    if (!nextSpec) return;
    theme.backgroundImageObject = nextSpec;
    renderThemeBackgroundEditor();
    renderThemeList();
    syncThemeJsonFromState();
    syncLayoutUiFromState();
    setStatus("theme-editor-status", message, "ok");
  }

  function registerThemeAssetPath(path, url) {
    if (!path || !url) return;
    const normalized = String(path).replace(/\\/g, "/");
    state.themeAssetUrlByPath.set(normalized, url);
    const base = normalized.split("/").pop();
    if (base) state.themeAssetUrlByPath.set(base, url);
  }

  function registerThemeAssetForBackground(spec, url) {
    if (!spec || !url) return;
    registerThemeAssetPath(spec.croppedFilePath, url);
    registerThemeAssetPath(spec.srcFilePath, url);
  }

  function resolveThemeAssetUrl(spec) {
    if (!spec) return "";
    const candidates = [spec.croppedFilePath, spec.srcFilePath]
      .filter((v) => typeof v === "string" && v.trim())
      .flatMap((v) => {
        const normalized = v.replace(/\\/g, "/");
        return [normalized, normalized.split("/").pop()];
      })
      .filter(Boolean);
    for (const key of candidates) {
      const url = state.themeAssetUrlByPath.get(key);
      if (url) return url;
    }
    return "";
  }

  function normalizeImportedThemePayload(rawPayload) {
    const payload = rawPayload && typeof rawPayload === "object" ? rawPayload : {};
    let themeRaw = payload;
    if (payload && Object.prototype.hasOwnProperty.call(payload, "theme")) {
      if (typeof payload.theme === "string") {
        themeRaw = JSON.parse(payload.theme);
      } else if (payload.theme && typeof payload.theme === "object") {
        themeRaw = payload.theme;
      }
    }
    const themeObj = themeRaw && typeof themeRaw === "object" ? themeRaw : {};
    const colorsSource = themeObj.colors && typeof themeObj.colors === "object" ? themeObj.colors : themeObj;
   const themeName = typeof themeObj.name === "string" && themeObj.name.trim() ? themeObj.name.trim() : "Imported Theme";
   // IME may return background image paths without the theme-name directory prefix.
   // Ensure paths include the directory so they match the ZIP package structure.
   const safeDir = themeName.replace(/[\\/:*?"<>|]/g, "_");
   const rawBg = themeObj.backgroundImage;
   const fixedBg = rawBg && typeof rawBg === "object"
     ? { ...rawBg,
         croppedFilePath: typeof rawBg.croppedFilePath === "string" && !rawBg.croppedFilePath.startsWith(safeDir + "/")
           ? safeDir + "/" + rawBg.croppedFilePath : rawBg.croppedFilePath,
         srcFilePath: typeof rawBg.srcFilePath === "string" && !rawBg.srcFilePath.startsWith(safeDir + "/")
           ? safeDir + "/" + rawBg.srcFilePath : rawBg.srcFilePath }
     : rawBg;
   const backgroundImageObject = normalizeThemeBackgroundImageObject(fixedBg);
   return {
     name: themeName,
     isDark: !!themeObj.isDark,
     colors: normalizeThemeColors(colorsSource),
     backgroundImage: typeof themeObj.backgroundImage === "string" ? themeObj.backgroundImage : "",
     backgroundImageObject
   };
  }

  function addImportedThemeEntry(themeData, sourceLabel = "已导入主题") {
    const imported = {
      id: `custom-${Math.random().toString(36).slice(2, 10)}`,
      name: nextCustomThemeName(themeData.name || "Imported Theme"),
      builtin: false,
      isDark: !!themeData.isDark,
      colors: normalizeThemeColors(themeData.colors),
      backgroundImage: typeof themeData.backgroundImage === "string" ? themeData.backgroundImage : "",
      backgroundImageObject: themeData.backgroundImageObject ? deepClone(themeData.backgroundImageObject) : null
    };
    if (imported.backgroundImageObject && imported.backgroundImage.startsWith("blob:")) {
      registerThemeAssetForBackground(imported.backgroundImageObject, imported.backgroundImage);
    }
    state.themeCatalog.unshift(imported);
    state.selectedThemeId = imported.id;
    renderThemeList();
    renderThemeEditor();
    syncThemeJsonFromState();
    syncLayoutUiFromState();
    setStatus("theme-editor-status", `${sourceLabel}：${imported.name}`, "ok");
    return imported;
  }

  function renderThemeSupplementPreview() {
    const leftRoot = el("theme-preview-extra-left");
    const rightRoot = el("theme-preview-extra-right");
    const mobileRoot = el("theme-preview-extra-mobile");
    if (!leftRoot && !rightRoot && !mobileRoot) return;
    const buildBackgroundItem = (label, value, tokenColor) => {
      const bg = argbToCss(tokenColor);
      const text = contrastTextForBackground(tokenColor);
      return `<div class="theme-preview-extra-item" style="background:${escapeAttr(bg)};color:${escapeAttr(text)}"><span class="label">${escapeHtml(label)}</span><span class="value">${escapeHtml(value)}</span></div>`;
    };
    const buildForegroundItem = (label, value, tokenColor) => {
      const fg = argbToCss(tokenColor);
      const bg = contrastBackgroundForForeground(tokenColor);
      return `<div class="theme-preview-extra-item is-foreground-tone" style="background:${escapeAttr(bg)};color:${escapeAttr(fg)}"><span class="label">${escapeHtml(label)}</span><span class="value">${escapeHtml(value)}</span></div>`;
    };
    const items = [
      buildBackgroundItem("页面底色", "Background", resolveThemeTokenColor("backgroundColor")),
      buildBackgroundItem("工具栏", "Toolbar", resolveThemeTokenColor("barColor")),
      buildForegroundItem("候选文字", "Candidate", resolveThemeTokenColor("candidateTextColor")),
      buildForegroundItem("候选标签", "Label", resolveThemeTokenColor("candidateLabelColor")),
      buildForegroundItem("候选注释", "Comment", resolveThemeTokenColor("candidateCommentColor")),
      buildForegroundItem("弹出文字", "Popup", resolveThemeTokenColor("popupTextColor")),
      buildBackgroundItem("剪贴板项", "Clipboard", resolveThemeTokenColor("clipboardEntryColor")),
      buildBackgroundItem("激活态", "Active", resolveThemeTokenColor("genericActiveBackgroundColor"))
    ];
    if (leftRoot) leftRoot.innerHTML = items.slice(0, 4).join("");
    if (rightRoot) rightRoot.innerHTML = items.slice(4, 8).join("");
    if (mobileRoot) mobileRoot.innerHTML = items.join("");
    requestAnimationFrame(() => {
      balanceThemeSideHeights();
      syncPreviewBlurMaskGeometry();
    });
  }

  function normalizePopupEntries(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const out = {};
    Object.entries(raw).forEach(([rawKey, rawValues]) => {
      const key = String(rawKey ?? "").trim();
      if (!key) return;
      if (!Array.isArray(rawValues)) throw new Error(`映射 ${key} 的值必须是数组`);
      const values = rawValues
        .map((item) => String(item ?? "").trim())
        .filter((item) => item.length > 0);
      if (!values.length) return;
      out[key] = values;
    });
    return Object.fromEntries(
      Object.entries(out).sort(([a], [b]) => a.localeCompare(b))
    );
  }

  function serializePopupEntries() {
    return deepClone(normalizePopupEntries(state.popupEntries));
  }

  function stringifyPopupEntriesForEditor(entries) {
    const normalized = normalizePopupEntries(entries);
    const list = Object.entries(normalized);
    if (!list.length) return "{}";
    const lines = ["{"];
    list.forEach(([key, values], index) => {
      const comma = index < list.length - 1 ? "," : "";
      const serializedValues = values.map((value) => JSON.stringify(value)).join(", ");
      lines.push(`  ${JSON.stringify(key)}: [${serializedValues}]${comma}`);
    });
    lines.push("}");
    return lines.join("\n");
  }

  function popupHasChanges() {
    return JSON.stringify(serializePopupEntries()) !== JSON.stringify(normalizePopupEntries(state.initialPopupEntries));
  }

  function getPopupJsonText() {
    return state.popupJsonEditor?.state.doc.toString() ?? (el("popup-json")?.value ?? "");
  }

  function setPopupJsonText(text) {
    const editor = state.popupJsonEditor;
    if (editor) {
      editor.dispatch({
        changes: { from: 0, to: editor.state.doc.length, insert: text }
      });
      return;
    }
    const textarea = el("popup-json");
    if (textarea) textarea.value = text;
  }

  function syncPopupJsonFromState() {
    state.suppressPopupJsonInput = true;
    setPopupJsonText(`${stringifyPopupEntriesForEditor(serializePopupEntries())}\n`);
    state.suppressPopupJsonInput = false;
    setStatus("popup-json-status", "JSON 已同步", "ok");
    updatePopupQrUi();
  }

  function applyPopupJsonEditorInput() {
    if (state.suppressPopupJsonInput) return;
    try {
      const parsed = normalizePopupEntries(JSON.parse(getPopupJsonText() || "{}"));
      state.popupEntries = parsed;
      renderPopupEditor();
      updatePopupQrUi();
      setStatus("popup-json-status", `JSON 合法，已实时应用（${Object.keys(parsed).length} 条映射）`, "ok");
    } catch (e) {
      setStatus("popup-json-status", `JSON 无效：${e.message}`, "err");
    }
  }

  function movePopupCandidate(key, fromIndex, toIndex) {
    const values = state.popupEntries[key];
    if (!Array.isArray(values)) return false;
    if (fromIndex === toIndex) return false;
    if (fromIndex < 0 || fromIndex >= values.length) return false;
    let insertIndex = toIndex;
    if (insertIndex < 0) insertIndex = 0;
    if (insertIndex > values.length) insertIndex = values.length;
    const [moved] = values.splice(fromIndex, 1);
    if (fromIndex < insertIndex) insertIndex -= 1;
    if (insertIndex < 0) insertIndex = 0;
    if (insertIndex > values.length) insertIndex = values.length;
    values.splice(insertIndex, 0, moved);
    state.popupEntries = normalizePopupEntries(state.popupEntries);
    return true;
  }

  function previewMovePopupCandidate(key, toIndex) {
    const drag = state.popupCandidateDrag;
    if (!drag || drag.key !== key) return false;
    const moved = movePopupCandidate(key, drag.index, toIndex);
    if (!moved) return false;
    let nextIndex = Math.max(0, Math.min(toIndex, state.popupEntries[key]?.length ?? 0));
    if (drag.index < nextIndex) nextIndex -= 1;
    state.popupCandidateDrag = { key, index: Math.max(0, nextIndex) };
    state.popupCandidateDragMoved = true;
    renderPopupEditor();
    return true;
  }

  function popupCandidateInsertionIndexFromPointer(key, clientX, clientY) {
    const wraps = Array.from(document.querySelectorAll(".popup-entry-values"));
    const wrap = wraps.find((node) => node.dataset.popupKey === key);
    if (!wrap) return null;
    const chips = Array.from(wrap.querySelectorAll(".popup-chip"));
    if (!chips.length) return 0;
    let bestIndex = chips.length;
    let bestDistance = Number.POSITIVE_INFINITY;
    chips.forEach((chip, index) => {
      const rect = chip.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = centerX - clientX;
      const dy = centerY - clientY;
      const distance = dx * dx + dy * dy;
      if (distance >= bestDistance) return;
      bestDistance = distance;
      bestIndex = clientX > centerX ? index + 1 : index;
    });
    return bestIndex;
  }

  function clearPopupPointerDragHoldTimer() {
    if (state.popupPointerDragHoldTimer != null) {
      clearTimeout(state.popupPointerDragHoldTimer);
      state.popupPointerDragHoldTimer = null;
    }
  }

  function resetPopupPointerDragState() {
    clearPopupPointerDragHoldTimer();
    state.popupPointerDragPointerId = null;
    state.popupPointerDragActive = false;
    state.popupPointerDragStartX = 0;
    state.popupPointerDragStartY = 0;
    state.popupPointerDragNode = null;
    state.popupPointerDragSource = null;
  }

  function abortPopupPointerDrag(pointerId = null) {
    const dragNode = state.popupPointerDragNode;
    resetPopupPointerDragState();
    if (dragNode && pointerId != null) {
      try {
        dragNode.releasePointerCapture(pointerId);
      } catch (_) {}
    }
  }

  function renderPopupEditor() {
    const root = el("popup-entry-list");
    if (!root) return;
    const entries = Object.entries(serializePopupEntries());
    if (!entries.length) {
      root.innerHTML = `<div class="status">暂无弹出字符映射，点击“新增映射”开始编辑</div>`;
      return;
    }
    root.innerHTML = "";
    entries.forEach(([key, values]) => {
      const row = document.createElement("div");
      row.className = "popup-entry-row";
      row.innerHTML = `
        <button type="button" class="popup-entry-key" data-action="rename">${escapeHtml(key)}</button>
        <div class="popup-entry-values"></div>
        <button type="button" class="popup-chip popup-chip-add popup-entry-add" data-action="add-candidate">+</button>
        <button type="button" class="popup-entry-delete" data-action="delete">🗑</button>
      `;
      const valuesWrap = row.querySelector(".popup-entry-values");
      valuesWrap.dataset.popupKey = key;
      values.forEach((value, index) => {
        const chip = document.createElement("button");
        let popupTapPointerId = null;
        let popupTapStartX = 0;
        let popupTapStartY = 0;
        chip.type = "button";
        chip.className = "popup-chip";
        chip.dataset.popupIndex = String(index);
        if (state.popupCandidateDrag?.key === key && state.popupCandidateDrag?.index === index) {
          chip.classList.add("dragging");
        }
        chip.textContent = value;
        chip.title = "点击编辑，右键删除";
        chip.draggable = true;
        const openPopupCandidateEditor = () => {
          const next = prompt(`编辑「${key}」的候选字符`, value);
          if (next == null) return;
          const normalized = next.trim();
          if (!normalized) return;
          state.popupEntries[key][index] = normalized;
          state.popupEntries = normalizePopupEntries(state.popupEntries);
          renderPopupEditor();
          syncPopupJsonFromState();
          setStatus("popup-editor-status", `已更新 ${key} 的候选字符`, "ok");
        };
        chip.addEventListener("click", (ev) => {
          if (state.popupConsumeNextNativeClick) {
            state.popupConsumeNextNativeClick = false;
            return;
          }
          if (Date.now() < state.popupChipNativeClickSuppressedUntil) return;
          if (!isStrictElementClick(ev, chip)) return;
          if (Date.now() < state.popupChipClickSuppressedUntil) return;
          openPopupCandidateEditor();
        });
        chip.addEventListener("contextmenu", (ev) => {
          ev.preventDefault();
          if (!confirm(`删除候选字符「${value}」？`)) return;
          state.popupEntries[key].splice(index, 1);
          if (!state.popupEntries[key].length) delete state.popupEntries[key];
          state.popupEntries = normalizePopupEntries(state.popupEntries);
          renderPopupEditor();
          syncPopupJsonFromState();
          setStatus("popup-editor-status", `已删除 ${key} 的候选字符`, "ok");
        });
        chip.addEventListener("dragstart", (ev) => {
          state.popupCandidateDrag = { key, index };
          state.popupCandidateDragMoved = false;
          if (ev.dataTransfer) {
            ev.dataTransfer.effectAllowed = "move";
            ev.dataTransfer.setData("text/plain", `${key}:${index}`);
          }
        });
        chip.addEventListener("dragend", () => {
          state.popupCandidateDrag = null;
          if (state.popupCandidateDragMoved) {
            state.popupChipClickSuppressedUntil = Date.now() + 250;
            syncPopupJsonFromState();
            setStatus("popup-editor-status", `已调整 ${key} 的候选顺序`, "ok");
          }
          state.popupCandidateDragMoved = false;
          renderPopupEditor();
        });
        chip.addEventListener("dragover", (ev) => {
          const drag = state.popupCandidateDrag;
          if (!drag || drag.key !== key) return;
          ev.preventDefault();
          const rect = chip.getBoundingClientRect();
          const placeAfter = ev.clientX > rect.left + rect.width / 2;
          const targetIndex = index + (placeAfter ? 1 : 0);
          previewMovePopupCandidate(key, targetIndex);
        });
        chip.addEventListener("drop", (ev) => {
          const drag = state.popupCandidateDrag;
          if (!drag || drag.key !== key) return;
          ev.preventDefault();
        });
        chip.addEventListener("pointerdown", (ev) => {
          if (ev.button !== 0 || ev.pointerType === "mouse") return;
          state.popupChipNativeClickSuppressedUntil = Date.now() + 700;
          popupTapPointerId = ev.pointerId;
          popupTapStartX = ev.clientX;
          popupTapStartY = ev.clientY;
          resetPopupPointerDragState();
          state.popupPointerDragPointerId = ev.pointerId;
          state.popupPointerDragStartX = ev.clientX;
          state.popupPointerDragStartY = ev.clientY;
          state.popupPointerDragNode = chip;
          state.popupPointerDragSource = { key, index };
          try {
            chip.setPointerCapture(ev.pointerId);
          } catch (_) {}
          state.popupPointerDragHoldTimer = setTimeout(() => {
            if (state.popupPointerDragPointerId !== ev.pointerId || !state.popupPointerDragSource) return;
            state.popupCandidateDrag = {
              key: state.popupPointerDragSource.key,
              index: state.popupPointerDragSource.index
            };
            state.popupCandidateDragMoved = false;
            state.popupPointerDragActive = true;
            renderPopupEditor();
          }, 120);
        });
        chip.addEventListener("pointerup", (ev) => {
          if (ev.pointerType === "mouse") return;
          if (popupTapPointerId !== ev.pointerId) return;
          popupTapPointerId = null;
          if (state.popupPointerDragActive) return;
          const dx = Math.abs(ev.clientX - popupTapStartX);
          const dy = Math.abs(ev.clientY - popupTapStartY);
          if (dx > 8 || dy > 8) return;
          if (!isPointInsideElement(ev.clientX, ev.clientY, chip)) return;
          if (Date.now() < state.popupChipClickSuppressedUntil) return;
          state.popupConsumeNextNativeClick = true;
          openPopupCandidateEditor();
        });
        chip.addEventListener("pointercancel", (ev) => {
          if (popupTapPointerId !== ev.pointerId) return;
          popupTapPointerId = null;
        });
        valuesWrap.appendChild(chip);
      });
      const addChip = row.querySelector('[data-action="add-candidate"]');
      addChip.addEventListener("click", () => {
        const next = prompt(`添加「${key}」的候选字符`);
        if (next == null) return;
        const normalized = next.trim();
        if (!normalized) return;
        state.popupEntries[key].push(normalized);
        state.popupEntries = normalizePopupEntries(state.popupEntries);
        renderPopupEditor();
        syncPopupJsonFromState();
        setStatus("popup-editor-status", `已添加 ${key} 的候选字符`, "ok");
      });
      addChip.addEventListener("dragover", (ev) => {
        const drag = state.popupCandidateDrag;
        if (!drag || drag.key !== key) return;
        ev.preventDefault();
        previewMovePopupCandidate(key, state.popupEntries[key]?.length ?? 0);
      });
      addChip.addEventListener("drop", (ev) => {
        const drag = state.popupCandidateDrag;
        if (!drag || drag.key !== key) return;
        ev.preventDefault();
      });
      row.querySelector('[data-action="rename"]').addEventListener("click", () => {
        const next = prompt("编辑映射键名", key);
        if (next == null) return;
        const normalized = next.trim();
        if (!normalized || normalized === key) return;
        if (Object.prototype.hasOwnProperty.call(state.popupEntries, normalized)) {
          setStatus("popup-editor-status", `键名已存在：${normalized}`, "err");
          return;
        }
        const copy = state.popupEntries[key].slice();
        delete state.popupEntries[key];
        state.popupEntries[normalized] = copy;
        state.popupEntries = normalizePopupEntries(state.popupEntries);
        renderPopupEditor();
        syncPopupJsonFromState();
        setStatus("popup-editor-status", `已重命名映射：${key} → ${normalized}`, "ok");
      });
      row.querySelector('[data-action="delete"]').addEventListener("click", () => {
        if (!confirm(`删除映射「${key}」？`)) return;
        delete state.popupEntries[key];
        state.popupEntries = normalizePopupEntries(state.popupEntries);
        renderPopupEditor();
        syncPopupJsonFromState();
        setStatus("popup-editor-status", `已删除映射：${key}`, "ok");
      });
      root.appendChild(row);
    });
    syncPopupJsonHeight();
  }

  function initPopupTab() {
    el("popup-add-mapping").addEventListener("click", () => {
      const key = prompt("输入映射键名（例如 a）");
      if (key == null) return;
      const normalizedKey = key.trim();
      if (!normalizedKey) {
        setStatus("popup-editor-status", "映射键名不能为空", "err");
        return;
      }
      if (Object.prototype.hasOwnProperty.call(state.popupEntries, normalizedKey)) {
        setStatus("popup-editor-status", `键名已存在：${normalizedKey}`, "err");
        return;
      }
      const firstValue = prompt(`输入「${normalizedKey}」的首个候选字符`);
      if (firstValue == null) return;
      const normalizedValue = firstValue.trim();
      if (!normalizedValue) {
        setStatus("popup-editor-status", "候选字符不能为空", "err");
        return;
      }
      state.popupEntries[normalizedKey] = [normalizedValue];
      state.popupEntries = normalizePopupEntries(state.popupEntries);
      renderPopupEditor();
      syncPopupJsonFromState();
      setStatus("popup-editor-status", `已新增映射：${normalizedKey}`, "ok");
    });
    el("popup-export-json").addEventListener("click", () => {
      downloadFile("PopupPreset.json", `${prettyJson(serializePopupEntries())}\n`);
      setStatus("popup-editor-status", "已导出弹出字符 JSON", "ok");
    });
    el("popup-import-json").addEventListener("click", () => {
      const input = el("popup-import-file");
      if (!input) return;
      input.value = "";
      input.click();
    });
    el("popup-import-file").addEventListener("change", async (ev) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      try {
        const parsed = normalizePopupEntries(JSON.parse(await file.text()));
        state.popupEntries = parsed;
        renderPopupEditor();
        syncPopupJsonFromState();
        setStatus("popup-editor-status", `已导入 ${Object.keys(parsed).length} 条映射`, "ok");
      } catch (e) {
        setStatus("popup-editor-status", `导入失败：${e.message}`, "err");
      } finally {
        ev.target.value = "";
      }
    });
    const popupJsonCard = el("popup-json-card");
    if (popupJsonCard) {
      popupJsonCard.open = true;
      if (!state.popupJsonEditor) {
        initPopupJsonEditor().then(() => syncPopupJsonHeight());
      } else {
        syncPopupJsonHeight();
      }
      popupJsonCard.addEventListener("toggle", () => {
        if (!popupJsonCard.open) {
          syncPopupJsonHeight();
          return;
        }
        if (!state.popupJsonEditor) {
          initPopupJsonEditor().then(() => syncPopupJsonHeight());
        } else {
          syncPopupJsonHeight();
        }
      });
      // 当左侧 popup 主卡折叠/展开时，立即同步右侧 JSON 区高度
      const popupMainCard = document.querySelector(".popup-main-card");
      if (popupMainCard) {
        popupMainCard.addEventListener("toggle", () => {
          // 彻底关闭动画：折叠时直接隐藏，展开时显示并同步高度
          const jsonCard = el("popup-json-card");
          if (!popupMainCard.open) {
            // 只让右侧 json 区高度为 0，不隐藏 details 元素本身
            if (jsonCard) {
              const editor = state.popupJsonEditor;
              if (editor) {
                editor.dom.style.height = "0px";
                editor.dom.style.maxHeight = "0px";
                editor.dom.style.minHeight = "0";
                editor.dom.style.width = "100%";
                const scroller = editor.dom.querySelector(".cm-scroller");
                if (scroller) {
                  scroller.style.height = "0px";
                  scroller.style.maxHeight = "0px";
                  scroller.style.minHeight = "0";
                  scroller.style.overflow = "hidden";
                }
              } else {
                const textarea = el("popup-json");
                if (textarea) {
                  textarea.style.height = "0px";
                  textarea.style.maxHeight = "0px";
                  textarea.style.minHeight = "0";
                  textarea.style.width = "100%";
                  textarea.style.overflow = "hidden";
                }
              }
            }
          } else {
            if (jsonCard) {
              // 恢复显示并同步高度
              if (state.popupJsonEditor) {
                jsonCard.style.display = "";
              }
              syncPopupJsonHeight();
            }
          }
        });
      }
    }
    renderPopupEditor();
    syncPopupJsonFromState();
    syncPopupJsonHeight();
    setStatus("popup-editor-status", popupHasChanges() ? "弹出字符映射已修改" : "", "");
  }

  function setActiveTab(targetId) {
    const buttons = Array.from(document.querySelectorAll(".tabs .tab"));
    state.activeTab = targetId;
    buttons.forEach((btn) => {
      const active = btn.dataset.tabTarget === targetId;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll("main .panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === targetId);
    });
    updateFixedChromeMetrics();
    syncJsonEditorHeight();
    syncThemeJsonHeight();
    syncPopupJsonHeight();
    if (targetId === "tab-popup") {
      renderPopupEditor();
      syncPopupJsonFromState();
      updatePopupQrUi();
    }
    if (targetId === "tab-icon-theme") {
      renderIconThemeEditor();
      syncIconThemeJsonFromState();
    }
  }

  function initTabs() {
    const buttons = Array.from(document.querySelectorAll(".tabs .tab"));
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => setActiveTab(btn.dataset.tabTarget || "tab-layout"));
    });
    setActiveTab(state.activeTab || "tab-layout");
  }

  function renderThemeEditor() {
    const theme = currentThemeEntry();
    const editable = !!theme && !theme.builtin;
    setThemeJsonEditable(editable);
    renderThemeBackgroundEditor();
    const rows = el("theme-color-rows");
    if (!rows) return;
    rows.hidden = !editable;
    updateThemeManageButtonsVisibility(editable);
    if (!editable) {
      rows.innerHTML = "";
      setStatus("theme-editor-status", "", "");
      syncThemeJsonHeight();
      return;
    }
    const borderEnabled = state.themeAppSync?.borderEnabled ?? PREVIEW_KEY_BORDER_ENABLED;
    const activeSurfaceToken = borderEnabled ? "backgroundColor" : "keyboardColor";
    rows.innerHTML = themeColorTokens.map((token) => {
      const value = resolveThemeTokenColor(token);
      const argb = toArgbHex(value);
      const isSurfaceToken = token === "backgroundColor" || token === "keyboardColor";
      const isActive = token === activeSurfaceToken;
      const surfaceTooltip = isSurfaceToken
        ? `title="预览区背景色取决于「启用按键边框」开关：开启时使用页面底色，关闭时使用键盘底色"`
        : "";
      const activeMark = isActive ? ' <span class="surface-active-mark" title="当前作为预览区背景生效中">●</span>' : "";
      return `
        <div class="theme-color-row" data-token="${escapeAttr(token)}">
          <label ${surfaceTooltip}>${escapeHtml(themeColorLabels[token] || token)}${activeMark}</label>
          <div class="theme-color-inputs">
            <input type="text" class="theme-color-input" value="${escapeAttr(argb)}" placeholder="#AARRGGBB" aria-label="${escapeAttr(`${themeColorLabels[token] || token} ARGB`)}" ${editable ? "" : "readonly"}>
          </div>
        </div>
      `;
    }).join("");

    rows.querySelectorAll(".theme-color-row").forEach((row) => {
      const token = row.dataset.token;
      const input = row.querySelector(".theme-color-input");
      const syncThemeAfterColorChange = () => {
        renderThemeList();
        syncThemeJsonFromState();
        renderThemeSupplementPreview();
        syncLayoutUiFromState();
      };
      let pendingFullSync = null;
      const scheduleFullSyncDebounced = () => {
        clearTimeout(pendingFullSync);
        pendingFullSync = setTimeout(syncThemeAfterColorChange, 160);
      };
      const flushFullSync = () => {
        if (pendingFullSync) {
          clearTimeout(pendingFullSync);
          pendingFullSync = null;
        }
        syncThemeAfterColorChange();
      };
      const applyColorLive = (nextColor) => {
        const normalized = normalizeColorValue(nextColor);
        if (normalized == null) return false;
        theme.colors[token] = normalized;
        applyPreviewThemeSurface();
        return true;
      };
      const syncInputToState = ({ strict = false, live = false } = {}) => {
        if (!applyColorLive(input.value.trim())) {
          if (!strict) return;
          input.value = toArgbHex(resolveThemeTokenColor(token));
          setStatus("theme-editor-status", `${themeColorLabels[token] || token} 颜色格式无效`, "err");
          return;
        }
        syncThemePickerFromArgbInput(input);
        if (live) {
          scheduleFullSyncDebounced();
        } else {
          flushFullSync();
          setStatus("theme-editor-status", "主题颜色已更新并同步到预览", "ok");
          input.jscolor?.hide();
        }
      };
      installThemeColorPicker(input, token, syncInputToState);
      input.addEventListener("change", () => {
        if (pendingFullSync) {
          clearTimeout(pendingFullSync);
          pendingFullSync = null;
        }
        syncInputToState({ strict: true });
      });
      input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        syncInputToState({ strict: true });
        input.blur();
      });
    });
    syncThemeJsonHeight();
  }

  function installThemeColorPicker(input, token, onChange) {
    if (!window.jscolor || input.jscolor) return;
    try {
      const picker = new window.jscolor(input, {
        hash: true,
        closeButton: true,
        showOnClick: true,
        format: "hexa",
        alphaChannel: true,
        valueElement: null,
        onInput: () => {
          syncArgbInputFromInlinePicker(input);
          if (typeof onChange === "function") onChange({ live: true });
        }
      });
      const originalShow = picker.show.bind(picker);
      picker.show = () => {
        const result = originalShow();
        return result;
      };
      syncThemePickerFromArgbInput(input);
    } catch (_) {}
  }

  function syncThemePickerFromArgbInput(input) {
    syncInlinePickerFromArgbInput(input, false);
    syncArgbInputFromInlinePicker(input);
  }

  function initThemeTab() {
    const list = el("theme-list");
    if (!list) return;
    el("theme-create-from-current").addEventListener("click", () => {
      const source = currentThemeEntry();
      const custom = {
        id: `custom-${Math.random().toString(36).slice(2, 10)}`,
        name: nextUuidThemeName(),
        builtin: false,
        isDark: !!source.isDark,
        colors: normalizeThemeColors(deepClone(source.colors)),
        backgroundImage: source.backgroundImage || "",
        backgroundImageObject: source.backgroundImageObject ? deepClone(source.backgroundImageObject) : null
      };
      syncThemeBackgroundPathsWithName(custom);
      state.themeCatalog.unshift(custom);
      state.selectedThemeId = custom.id;
      renderThemeList();
      renderThemeEditor();
      syncThemeJsonFromState();
      syncLayoutUiFromState();
      setStatus("theme-editor-status", `已创建主题：${custom.name}`, "ok");
    });
    el("theme-rename-custom").addEventListener("click", () => {
      const theme = currentThemeEntry();
      if (!theme || theme.builtin) return;
      const nextName = prompt("输入新的主题名称", theme.name);
      if (nextName == null) return;
      try {
        const result = renameThemeAndSyncAssets(theme, nextName);
        if (!result.changed) {
          setStatus("theme-editor-status", "主题名称未变化", "");
          return;
        }
        renderThemeList();
        renderThemeEditor();
        syncThemeJsonFromState();
        syncLayoutUiFromState();
        setStatus("theme-editor-status", `已重命名主题：${result.name}`, "ok");
      } catch (e) {
        setStatus("theme-editor-status", `重命名失败：${e.message}`, "err");
      }
    });
    el("theme-delete-custom").addEventListener("click", () => {
      const theme = currentThemeEntry();
      if (!theme || theme.builtin) return;
      if (!confirm(`确认删除主题「${theme.name}」？`)) return;
      state.themeCatalog = state.themeCatalog.filter((item) => item.id !== theme.id);
      state.selectedThemeId = state.themeCatalog[0]?.id || "";
      renderThemeList();
      renderThemeEditor();
      syncThemeJsonFromState();
      syncLayoutUiFromState();
      setStatus("theme-editor-status", `已删除主题：${theme.name}`, "ok");
    });
    el("theme-import-background").addEventListener("click", () => {
      if (!isCurrentThemeEditable()) return;
      const input = el("theme-import-background-file");
      input.value = "";
      input.click();
    });
    el("theme-import-background-file").addEventListener("change", (ev) => {
      const file = ev.target.files?.[0];
      const theme = currentThemeEntry();
      if (!file || !theme || theme.builtin) return;
      const previewUrl = URL.createObjectURL(file);
      const nextSpec = buildThemeBackgroundSpecForLocalImage(theme, file);
      theme.backgroundImageObject = normalizeThemeBackgroundImageObject(nextSpec);
      theme.backgroundImage = previewUrl;
      if (theme.backgroundImageObject) {
        registerThemeAssetForBackground(theme.backgroundImageObject, previewUrl);
      }
      renderThemeList();
      renderThemeBackgroundEditor();
      syncThemeJsonFromState();
      syncLayoutUiFromState();
      setStatus("theme-editor-status", "背景图片已更新", "ok");
    });
    el("theme-clear-background").addEventListener("click", () => {
      const theme = currentThemeEntry();
      if (!theme || theme.builtin) return;
      theme.backgroundImage = "";
      theme.backgroundImageObject = null;
      renderThemeList();
      renderThemeEditor();
      syncThemeJsonFromState();
      syncLayoutUiFromState();
      setStatus("theme-editor-status", "已清除背景图片", "ok");
    });
    el("theme-background-brightness")?.addEventListener("input", (ev) => {
      updateCurrentThemeBackgroundSpec({ brightness: Number(ev.target.value) }, "背景亮度已更新");
    });
    el("theme-background-blur")?.addEventListener("input", (ev) => {
      updateCurrentThemeBackgroundSpec({ blurRadius: Number(ev.target.value) }, "背景模糊已更新");
    });
    el("theme-background-rotation")?.addEventListener("change", (ev) => {
      updateCurrentThemeBackgroundSpec({ cropRotation: Number(ev.target.value) }, "背景旋转已更新");
    });
    el("theme-background-open-crop")?.addEventListener("click", async () => {
      try {
        await openThemeCropDialog();
      } catch (e) {
        setStatus("theme-editor-status", `打开裁剪失败：${e.message}`, "err");
      }
    });
    el("theme-crop-cancel")?.addEventListener("click", () => el("theme-crop-dialog").close());
    el("theme-crop-apply")?.addEventListener("click", () => applyThemeCropRectFromDialog());
    el("theme-crop-reset")?.addEventListener("click", () => {
      const image = el("theme-crop-image");
      const rect = image.getBoundingClientRect();
      state.themeCrop.rectPx = {
        left: rect.width * 0.15,
        top: rect.height * 0.12,
        right: rect.width * 0.85,
        bottom: rect.height * 0.88
      };
      syncThemeCropSelectionUi();
    });
    el("theme-crop-clear")?.addEventListener("click", () => {
      updateCurrentThemeBackgroundSpec({ cropRect: null }, "背景裁剪已清除");
      el("theme-crop-dialog").close();
    });
    el("theme-export-json").addEventListener("click", () => {
      const theme = currentThemeEntry();
      downloadFile(`${theme.name}.theme.json`, `${prettyJson(serializeCurrentTheme())}\n`);
      setStatus("theme-editor-status", `已导出主题 JSON：${theme.name}`, "ok");
    });
    el("theme-import-shared").addEventListener("click", () => {
      const input = el("theme-import-file");
      if (!input) return;
      input.value = "";
      input.click();
    });
    el("theme-import-file").addEventListener("change", async (ev) => {
      const file = ev.target?.files?.[0];
      if (!file) return;
      if (state.themeImportRunning) {
        setStatus("theme-qr-meta", "已有主题导入任务在进行，请稍后重试", "err");
        return;
      }
      state.themeImportRunning = true;
      try {
        const fileName = String(file.name || "").toLowerCase();
        const isZip = file.type === "application/zip" || fileName.endsWith(".zip");
        if (isZip) {
          const themeData = await decodeThemeFromZipFile(file);
          const imported = addImportedThemeEntry(themeData, "已导入主题 ZIP");
          setStatus("theme-qr-meta", `ZIP 导入成功：${imported.name}`, "ok");
        } else {
          await importThemeFromQrLongImage(file);
        }
      } catch (e) {
        setStatus("theme-qr-meta", `主题导入失败：${e.message}`, "err");
      } finally {
        state.themeImportRunning = false;
        const input = el("theme-import-file");
        if (input) input.value = "";
      }
    });
    if (!state.themeCatalog.find((item) => item.id === state.selectedThemeId)) {
      state.selectedThemeId = state.themeCatalog[0]?.id || "";
    }
    const themeJsonCard = el("theme-json-card");
    if (themeJsonCard) {
      themeJsonCard.open = true;
      if (!state.themeJsonEditor) {
        initThemeJsonEditor().then(() => syncThemeJsonHeight());
      } else {
        syncThemeJsonHeight();
      }
      themeJsonCard.addEventListener("toggle", () => {
        if (!themeJsonCard.open) {
          syncThemeJsonHeight();
          return;
        }
        if (!state.themeJsonEditor) {
          initThemeJsonEditor().then(() => syncThemeJsonHeight());
        } else {
          syncThemeJsonHeight();
        }
      });
      // 当左侧 theme 主卡折叠/展开时，立即同步右侧 JSON 区高度
      const themeMainCard = document.querySelector(".theme-main-card");
      if (themeMainCard) {
        themeMainCard.addEventListener("toggle", () => {
          const jsonCard = el("theme-json-card");
          if (!themeMainCard.open) {
            // 只让右侧 json 区高度为 0，不隐藏 details 元素本身
            if (jsonCard) {
              const editor = state.themeJsonEditor;
              if (editor) {
                editor.dom.style.height = "0px";
                editor.dom.style.maxHeight = "0px";
                editor.dom.style.minHeight = "0";
                editor.dom.style.width = "100%";
                const scroller = editor.dom.querySelector(".cm-scroller");
                if (scroller) {
                  scroller.style.height = "0px";
                  scroller.style.maxHeight = "0px";
                  scroller.style.minHeight = "0";
                  scroller.style.overflow = "hidden";
                }
              } else {
                const textarea = el("theme-json");
                if (textarea) {
                  textarea.style.height = "0px";
                  textarea.style.maxHeight = "0px";
                  textarea.style.minHeight = "0";
                  textarea.style.width = "100%";
                  textarea.style.overflow = "hidden";
                }
              }
            }
          } else {
            if (jsonCard) {
              // 恢复显示并同步高度
              if (state.themeJsonEditor) {
                jsonCard.style.display = "";
              }
              syncThemeJsonHeight();
            }
          }
        });
      }
    }
    renderThemeList();
    renderThemeEditor();
    syncThemeJsonFromState();
    renderThemeSupplementPreview();
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

  function isStrictElementClick(ev, element) {
    if (!ev || !element) return false;
    if (ev.detail === 0) return true;
    const x = Number(ev.clientX);
    const y = Number(ev.clientY);
    return isPointInsideElement(x, y, element);
  }

  function isPointInsideElement(x, y, element) {
    if (!element) return false;
    if (!Number.isFinite(Number(x)) || !Number.isFinite(Number(y))) return false;
    const rect = element.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
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
    try {
      const popupPreset = normalizePopupEntries(await tryLoadJson("./data/default-popup-preset.json"));
      state.popupEntries = popupPreset;
      state.initialPopupEntries = deepClone(state.popupEntries);
    } catch (_) {
      state.popupEntries = {};
      state.initialPopupEntries = {};
    }
    ensureSelection();
    state.initialThemeCatalogSignature = themeCatalogSignature();
    state.initialThemeAppSyncSignature = JSON.stringify(state.themeAppSync);
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
        normalizeKeyFieldsForType(key);
        if (key.rowHeightPercent != null) normalizeRowHeightKey(key);
      });
    });
  }

  function normalizeKeyFieldsForType(key) {
    const type = String(key?.type || "").trim();
    const c = keyTypeCapabilities(type);
    // NumPadKey accepts legacy/manual JSON with only a label (for example "2").
    // Preserve that source before the generic non-label cleanup below.
    const numpadSource = c.hasNumpadSym ? (key.sym ?? key.label) : null;
    if (!c.hasMainAlt) {
      delete key.main;
      delete key.alt;
    }
    if (!c.hasLabel) delete key.label;
    if (!c.hasSubLabel) delete key.subLabel;
    if (!c.hasDisplayText) delete key.displayText;
    if (!c.hasSwipeLabel) delete key.swipeLabel;
    if (!c.hasMacroLabels) {
      delete key.altLabel;
      delete key.longPressLabel;
    }
    if (!c.hasTapAction) delete key.tap;
    if (!c.hasSwipeAction) delete key.swipe;
    if (!c.hasLongPressAction) delete key.longPress;
    if (!c.hasNumpadSym) delete key.sym;
    if (c.hasNumpadSym) {
      // 与 app 一致：sym 规范化为键名（如 KP_2）；label 缺省时由 sym 反推显示字符
      const resolved = resolveNumpadSymName(numpadSource) || "KP_0";
      key.sym = resolved;
      if (!key.label || typeof key.label !== "string" || !key.label.trim()) {
        key.label = numpadSymLabelByName[resolved] || "0";
      }
    }

    const availableColorKeys = new Set();
    availableColorFieldsForType(type).forEach((field) => {
      availableColorKeys.add(field.customKey);
      availableColorKeys.add(field.monetKey);
    });
    keyColorFields.forEach((field) => {
      if (!availableColorKeys.has(field.customKey)) delete key[field.customKey];
      if (!availableColorKeys.has(field.monetKey)) delete key[field.monetKey];
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
      case "LayerSwitchKey": return key.label || "?123";
      case "CommaKey": return ",";
      case "LanguageKey": return "🌐";
      case "SpaceKey": {
        // 优先显示 ime:submode 或 ime
        const base = state.selectedBase || "ime";
        const submode = state.selectedSubmode || "";
        if (submode && submode !== DEFAULT_SUBMODE && state.layout[base] && state.layout[base][submode]) return `${base}(${submode})`;
        return base;
      }
      case "SymbolKey": return key.label || ".";
      case "ReturnKey": return "↵";
      case "BackspaceKey": return "⌫";
      case "NumPadKey": return key.label || "0";
      case "MiniSpaceKey": return "␣";
      case "AlphabetKey": return key.main || "?";
      case "MacroKey": return key.label || "M";
      default:
        return editorKeyLabel(key);
    }
  }

  function editorKeyLabel(key) {
    if (!key || typeof key !== "object") return "?";
    if (typeof key.type === "string") {
      switch (key.type) {
        case "CapsKey": return "Caps";
        case "LayoutSwitchKey": return key.label || "?123";
        case "LayerSwitchKey": return key.label || "?123";
        case "CommaKey": return ",";
        case "LanguageKey": return "Lang";
        case "SpaceKey": return "Space";
        case "SymbolKey": return key.label || ".";
        case "ReturnKey": return "Enter";
        case "BackspaceKey": return "⌫";
        case "NumPadKey": return key.label || "0";
        case "MiniSpaceKey": return "Space";
        case "AlphabetKey": return key.main || "?";
        case "MacroKey": return key.label || "M";
        default: return key.type;
      }
    }
    if (typeof key.main === "string" && key.main) return key.main;
    return "?";
  }

  function keySubText(key) {
    if (!key || typeof key !== "object") return "";
    if (key.type === "AlphabetKey") return key.alt || "";
    if (key.type === "MacroKey") return key.altLabel || key.longPressLabel || "";
    if (key.swipeLabel) return key.swipeLabel;
    return "";
  }

  function previewMainFontMaxForKey(key) {
    if (key?.type === "LanguageKey") return 15;
    const variant = keyVariantClass(key);
    if (variant.includes("alt-key")) return 16;
    if (variant.includes("macro-key") || variant.includes("accent-key")) return 20;
    if (variant.includes("space-key")) return 18;
    return 23;
  }

  function resolvePreviewPunctPlacement(key, preferred, keyHeight) {
    if (preferred === 'none' || !keySubText(key)) return 'none';
    if (preferred === 'top-center') {
      const stackedMinHeight = previewMainFontMaxForKey(key) + 10 + 1;
      return keyHeight >= stackedMinHeight ? 'top-center' : 'top-right';
    }
    if (preferred === 'bottom') {
      // Match App behavior: fallback to top-right when stacked main+alt doesn't fit.
      const stackedMinHeight = previewMainFontMaxForKey(key) + 10 + 1;
      return keyHeight >= stackedMinHeight ? 'bottom' : 'top-right';
    }
    return preferred;
  }

  function renderSelectors() {
    ensureSelection();
    const baseSelect = el("layout-base-select");
    baseSelect.innerHTML = baseNames()
      .map((k) => `<option value="${escapeAttr(k)}">${escapeHtml(k)}</option>`)
      .join("");
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
    const cfg = state.themeAppSync;
    const keyVGap = Math.max(0, Number(cfg.keyVGap) || 0);
    const punctPos = cfg.punctPos || 'bottom';
    const previewMetrics = resolvePreviewMetrics();
    const previewContentHeight = resolvePreviewContentHeight(rows);
    applyPreviewThemeSurface();
    root.style.setProperty('--preview-row-gap', '8px');
    root.style.setProperty('--preview-key-hgap', `${cfg.keyHGap || 0}px`);
    root.style.setProperty('--preview-key-vgap', `${keyVGap}px`);
    root.style.setProperty('--preview-key-radius', `${cfg.keyRadius || 0}px`);
    root.style.setProperty('--preview-keyboard-max-width', `${previewMetrics?.maxWidth || 720}px`);
    root.style.setProperty('--preview-side-padding', `${previewMetrics?.sidePadding || 0}px`);
    root.style.setProperty('--preview-bottom-padding', `${previewMetrics?.bottomPadding || 0}px`);
    root.style.setProperty('--preview-top-bar-height', `${previewMetrics?.topBarHeight || 0}px`);
    root.innerHTML = rows.map((row, rowIndex) => {
      const rowHeight = previewContentHeight
        ? Math.max(28, Math.round(previewContentHeight * (rowPercents[rowIndex] || 0) / 100))
        : effectiveRowHeight(rowPercents[rowIndex] ?? 0);
      const keyHeight = effectivePreviewKeyHeight(rowHeight, keyVGap);
      const widths = resolveRegularRowWidths(row);
      return `<div class="layout-row" style="--row-height:${rowHeight}px;--key-height:${keyHeight}px"><div class="keys">${row.map((key, keyIndex) => {
        const w = widths[keyIndex] || 0;
        const widthPercent = `${(w * 100).toFixed(6)}%`;
        const previewColors = resolvePreviewColorsForKey(key);
        const isActionKey = key.type === 'ReturnKey' || key.type === 'LayoutSwitchKey' || key.type === 'LayerSwitchKey';
        const punctPlacement = resolvePreviewPunctPlacement(key, punctPos, keyHeight);
        const keyExtraClasses = [
          cfg.borderEnabled ? '' : 'no-border',
          cfg.borderEnabled && !cfg.borderOutline ? 'border-shadow' : '',
          cfg.borderEnabled && cfg.borderOutline ? 'border-outline' : '',
          (cfg.borderEnabled
            ? (cfg.gboardStyle && isActionKey)
            : (key.type === 'ReturnKey' || (cfg.gboardStyle && (key.type === 'LayoutSwitchKey' || key.type === 'LayerSwitchKey'))))
            ? 'gboard-pill'
            : '',
          punctPlacement === 'bottom' ? 'punct-bottom' : punctPlacement === 'top-center' ? 'punct-top-center' : ''
        ].filter(Boolean).join(' ');
        const borderWidth = cfg.borderEnabled ? (cfg.borderOutline ? 1 : 0) : 0;
        const keyStyle = `--preview-key-bg:${previewColors.backgroundCss};color:${previewColors.textCss};border-color:${previewColors.borderCss};--preview-key-shadow:${previewColors.borderCss};border-width:${borderWidth}px;border-style:${borderWidth > 0 ? 'solid' : 'none'};`;
        const alt = keySubText(key) && punctPlacement !== 'none'
          ? `<span class="layout-key-alt ${punctPlacement === 'bottom' ? 'bottom' : punctPlacement === 'top-center' ? 'top-center' : ''}" style="color:${escapeAttr(previewColors.altTextCss)}">${escapeHtml(keySubText(key))}</span>`
          : "";
        return `<div class="layout-key-slot" style="--key-width:${widthPercent}"><div class="layout-key ${previewVariantClass(key)} ${keyExtraClasses}" style="${escapeAttr(keyStyle)}"><span class="layout-key-blur-mask"></span><span class="layout-key-blur-tint"></span><span class="layout-key-main">${escapeHtml(previewTitleFromObj(key))}</span>${alt}</div></div>`;
      }).join("")}</div></div>`;
    }).join("");
    requestAnimationFrame(() => {
      pinPreviewContainerWidth();
      syncPreviewBlurMaskGeometry();
      fitLayoutPreviewText();
    });
    const height = getHeightOverride();
    setStatus("layout-preview-meta", `${entryKey(state.selectedBase, state.selectedSubmode)}${height ? `，键盘高度 ${height}%` : ""}`, "");
    renderThemeSupplementPreview();
    updateFixedChromeMetrics();
  }

  function pinPreviewContainerWidth() {
    const root = el("layout-preview");
    if (!root) return;
    // On narrow viewports, CSS mobile rules set width:100% — don't override
    if (window.innerWidth <= 1080) return;
    // Measure max row width after layout settles, set container to match
    const keysRows = root.querySelectorAll(".layout-row .keys");
    let maxW = 0;
    keysRows.forEach((row) => { maxW = Math.max(maxW, row.offsetWidth); });
    if (maxW > 0) {
      // 20 = 10px padding * 2 (box-sizing:border-box, no border)
      root.style.width = (maxW + 22) + "px";
    }
  }

  function syncPreviewBlurMaskGeometry() {
    const root = el("layout-preview");
    const theme = currentThemeEntry();
    if (!root || !theme) return;
    const sourceUrl = theme.backgroundImage || resolveThemeAssetUrl(theme.backgroundImageObject);
    const blurRadius = themeBackgroundBlurRadius(theme.backgroundImageObject);
    const brightness = themeBackgroundBrightness(theme.backgroundImageObject);
    const enabled = !!sourceUrl && blurRadius > 0;
    const rootRect = root.getBoundingClientRect();
    root.style.setProperty("--preview-bg-url", enabled ? `url("${sourceUrl}")` : "none");

    // Use center-crop sizing (matching Android's calculateCenterCropSource)
    // instead of stretching the image to the container.
    const meta = sourceUrl ? state.themeImageMetaByUrl.get(sourceUrl) : null;
    const imgW = Number(meta?.width) || 0;
    const imgH = Number(meta?.height) || 0;
    let bgWidth, bgHeight, cropOffsetX, cropOffsetY;
    if (imgW > 0 && imgH > 0 && rootRect.width > 0 && rootRect.height > 0) {
      const scale = Math.max(rootRect.width / imgW, rootRect.height / imgH);
      bgWidth = imgW * scale;
      bgHeight = imgH * scale;
      cropOffsetX = (bgWidth - rootRect.width) / 2;
      cropOffsetY = (bgHeight - rootRect.height) / 2;
    } else {
      // Fallback: stretch to container (no center-crop without image dimensions)
      bgWidth = rootRect.width;
      bgHeight = rootRect.height;
      cropOffsetX = 0;
      cropOffsetY = 0;
    }
    root.style.setProperty("--preview-bg-width", `${Math.max(1, bgWidth)}px`);
    root.style.setProperty("--preview-bg-height", `${Math.max(1, bgHeight)}px`);

    root.style.setProperty("--preview-bg-blur", `${blurRadius}px`);
    root.style.setProperty("--preview-bg-bleed", `${Math.max(16, blurRadius * 2)}px`);
    root.style.setProperty("--preview-bg-brightness", `${brightness}%`);
    root.style.setProperty("--preview-bg-mask-opacity", enabled ? "1" : "0");
    root.style.setProperty("--preview-bg-key-tint-opacity", enabled ? "0.58" : "1");
    root.querySelectorAll(".layout-key").forEach((key) => {
      const rect = key.getBoundingClientRect();
      key.style.setProperty("--preview-bg-x", `${rect.left - rootRect.left + cropOffsetX}px`);
      key.style.setProperty("--preview-bg-y", `${rect.top - rootRect.top + cropOffsetY}px`);
    });
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
      const hasBottomAlt = !!key.querySelector(".layout-key-alt.bottom");
      const isMain = node.classList.contains("layout-key-main");
      const isBottomAlt = node.classList.contains("layout-key-alt") && node.classList.contains("bottom");
      const maxHeight = isMain
        ? Math.max(8, key.clientHeight - (hasBottomAlt ? 12 : 4))
        : isBottomAlt
          ? 10
          : Math.max(6, Math.floor(key.clientHeight * 0.4));
      let size = maxSize;
      ctx.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;
      while (size > minSize && (ctx.measureText(value).width > width || size > maxHeight)) {
        size -= 1;
        ctx.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;
      }
      node.style.fontSize = `${size}px`;
    };

    document.querySelectorAll("#layout-preview .layout-key-main").forEach((node) => {
      const key = node.closest(".layout-key");
      const max = key?.classList.contains("language-key")
        ? 15
        : key?.classList.contains("alt-key")
          ? 16
          : key?.classList.contains("macro-key") || key?.classList.contains("accent-key")
            ? 20
            : key?.classList.contains("space-key")
              ? 18
              : 23;
      fitText(node, max, 7, 600, 8);
    });
    document.querySelectorAll("#layout-preview .layout-key-alt").forEach((node) => fitText(node, 10, 6, 500, 12));
  }

  function updateFixedChromeMetrics() {
    const topbar = document.querySelector(".topbar");
    const preview = document.querySelector(".keyboard-preview-panel");
    const topbarHeight = topbar?.offsetHeight || 0;

    const shell = document.querySelector(".preview-shell");
    // Temporarily reset zoom to measure natural height
    const savedZoom = shell?.style.zoom;
    if (shell) shell.style.zoom = "1";
    const naturalHeight = shell?.offsetHeight || 220;
    if (shell) shell.style.zoom = savedZoom || "";

    // Scale preview based on viewport height (CSS pixels at 100% browser zoom).
    // Derive this from physical screen dimensions so it stays stable regardless of
    // browser Ctrl+/- zoom on desktop. On Android WebView without browser zoom,
    // outerWidth/innerWidth ratio ≈ 1 and this degenerates to the DPR division.

    // Estimate browser zoom factor (desktop Ctrl+/-); ≈ 1 on mobile / WebView.
    const browserZoom = (window.outerWidth || window.innerWidth) / Math.max(1, window.innerWidth);
    // Native device pixel ratio (independent of browser zoom).
    const nativeDpr = (window.devicePixelRatio || 1) / Math.max(0.5, browserZoom);
    const cssVh = screen.height / nativeDpr;

    const isMobile = navigator.maxTouchPoints > 0;
    const isShortDesktop = !isMobile && cssVh <= 900;
    const ratio = isShortDesktop ? 0.16 : 0.22;
    const targetMax = Math.max(cssVh * ratio, isShortDesktop ? 140 : 200);
    let scale = 1;
    if (naturalHeight > targetMax && naturalHeight > 0) {
      scale = Math.max(0.45, targetMax / naturalHeight);
    }
    document.documentElement.style.setProperty("--preview-zoom", scale);

    const previewHeight = preview?.offsetHeight || 0;
    document.documentElement.style.setProperty("--topbar-height", `${topbarHeight}px`);
    document.documentElement.style.setProperty("--preview-panel-height", `${previewHeight}px`);

    // Balance theme side heights AFTER zoom is applied — purely visual, doesn't affect scaling
    requestAnimationFrame(() => balanceThemeSideHeights());
  }

  function balanceThemeSideHeights() {
    const center = document.querySelector(".preview-center");
    const sides = document.querySelectorAll(".theme-preview-extra-side");
    if (!center || sides.length === 0) return;
    const centerH = center.offsetHeight;
    sides.forEach(side => {
      if (centerH > 0) {
        side.style.minHeight = centerH + "px";
      } else {
        side.style.minHeight = "";
      }
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

  function normalizePreviewMetrics(raw) {
    if (!raw || typeof raw !== "object") return null;
    const screenWidthPx = Number(raw.screenWidthPx);
    const screenHeightPx = Number(raw.screenHeightPx);
    const keyboardHeightPx = Number(raw.keyboardHeightPx);
    if (!Number.isFinite(screenWidthPx) || !Number.isFinite(screenHeightPx) || !Number.isFinite(keyboardHeightPx)) {
      return null;
    }
    return {
      screenWidthPx,
      screenHeightPx,
      keyboardHeightPx,
      density: Number(raw.density) || 1,
      densityDpi: Number(raw.densityDpi) || 0,
      orientation: String(raw.orientation || ""),
      keyboardHeightPercent: Number(raw.keyboardHeightPercent) || 0,
      keyboardSidePaddingPx: Number(raw.keyboardSidePaddingPx) || 0,
      keyboardBottomPaddingPx: Number(raw.keyboardBottomPaddingPx) || 0,
      kawaiiBarHeightPx: Number(raw.kawaiiBarHeightPx) || 0
    };
  }

  function resolvePreviewMetrics() {
    const metrics = state.themeAppSync?.previewMetrics;
    if (!metrics || !Number.isFinite(Number(metrics.screenWidthPx)) || !Number.isFinite(Number(metrics.keyboardHeightPx))) {
      return null;
    }
    const screenWidthPx = Math.max(1, Number(metrics.screenWidthPx));
    const keyboardHeightPx = Math.max(1, Number(metrics.keyboardHeightPx));
    const density = Math.max(0.1, Number(metrics.density) || 1);
    const maxWidth = Math.min(720, Math.max(320, screenWidthPx / density));
    // Target height preserves phone's keyboard view aspect ratio (keys area, excluding kawaii bar and bottom padding)
    const targetHeight = Math.max(120, maxWidth * keyboardHeightPx / screenWidthPx);
    const sideDp = Math.max(0, Number(metrics.keyboardSidePaddingPx || 0) / density);
    const bottomDp = Math.max(0, Number(metrics.keyboardBottomPaddingPx || 0) / density);
    // Kawaii bar sits above the keyboard view in the IME; scale to preview dp space.
    const topBarDp = Math.max(0, Number(metrics.kawaiiBarHeightPx || 0) / density * maxWidth / (screenWidthPx / density));
    return {
      maxWidth,
      targetHeight,
      sidePadding: Math.min(maxWidth / 3, sideDp),
      bottomPadding: Math.min(targetHeight / 3, bottomDp),
      topBarHeight: topBarDp
    };
  }

  function resolvePreviewContentHeight(rows) {
    const metrics = resolvePreviewMetrics();
    if (!metrics) return null;
    const rowCount = Math.max(1, rows.length);
    // targetHeight represents keyboard view height (keys area), which does NOT include
    // bottom padding. bottomPadding is a separate space below the keys in the Android layout.
    // No rowGap subtraction needed (CSS margin-bottom on rows was removed).
    return Math.max(rowCount * 28, metrics.targetHeight);
  }

  function effectiveRowHeight(percent) {
    const h = Number(percent) || 0;
    return h > 0 ? Math.max(34, Math.round(48 * h / 25)) : 42;
  }

  function effectivePreviewKeyHeight(rowHeight, keyVGap) {
    const row = Math.max(1, Number(rowHeight) || 0);
    const gap = Math.max(0, Number(keyVGap) || 0);
    return Math.max(1, row - gap * 2);
  }

  function keyWeight(key) {
    if (key && Object.prototype.hasOwnProperty.call(key, "weight")) {
      const n = Number(key.weight);
      if (Number.isFinite(n)) return n;
    }
    return defaultKeyWeight(key);
  }

  function defaultKeyWeight(key) {
    switch (key?.type) {
      case "CapsKey":
      case "LayoutSwitchKey":
      case "LayerSwitchKey":
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
      case "NumPadKey":
        return 0.1;
      case "MiniSpaceKey":
        return 0.15;
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
      case "LayerSwitchKey":
      case "CommaKey":
      case "SymbolKey":
      case "LanguageKey":
      case "BackspaceKey":
        classes.push("alt-key");
        break;
      case "SpaceKey":
      case "MiniSpaceKey":
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
    const classes = keyVariantClass(key)
      .split(/\s+/)
      .filter((cls) => cls && cls !== "macro-key" && cls !== "compose-key")
    if (key?.type === "LanguageKey") classes.push("language-key");
    return classes.join(" ");
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
        let keyTapPointerId = null;
        let keyTapStartX = 0;
        let keyTapStartY = 0;
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
        const openLayoutKeyEditor = () => {
          openLayoutKeyDialog(rowIndex, keyIndex, false);
        };
        keyBtn.addEventListener("click", (ev) => {
          if (Date.now() < state.layoutChipNativeClickSuppressedUntil) return;
          if (!isStrictElementClick(ev, keyBtn)) return;
          if (Date.now() < state.layoutChipClickSuppressedUntil) return;
          openLayoutKeyEditor();
        });
        keyBtn.addEventListener("pointerdown", (ev) => {
          if (ev.button !== 0 || ev.pointerType === "mouse") return;
          state.layoutChipNativeClickSuppressedUntil = Date.now() + 700;
          keyTapPointerId = ev.pointerId;
          keyTapStartX = ev.clientX;
          keyTapStartY = ev.clientY;
        });
        keyBtn.addEventListener("pointerup", (ev) => {
          if (ev.pointerType === "mouse") return;
          if (keyTapPointerId !== ev.pointerId) return;
          keyTapPointerId = null;
          if (state.keyPointerDragActive) return;
          const dx = Math.abs(ev.clientX - keyTapStartX);
          const dy = Math.abs(ev.clientY - keyTapStartY);
          if (dx > 8 || dy > 8) return;
          if (!isPointInsideElement(ev.clientX, ev.clientY, keyBtn)) return;
          if (Date.now() < state.layoutChipClickSuppressedUntil) return;
          state.layoutKeyDialogTouchOpenUntil = Date.now() + 1000;
          openLayoutKeyEditor();
        });
        keyBtn.addEventListener("pointercancel", (ev) => {
          if (keyTapPointerId !== ev.pointerId) return;
          keyTapPointerId = null;
        });
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
    // 桌面端原生拖拽
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

    // 移动端（touch/pen）使用 pointer 长按拖拽，避免浏览器滚动吞掉触摸手势。
    node.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0 || ev.pointerType === "mouse") return;
      resetKeyPointerDragState();
      state.keyPointerDragPointerId = ev.pointerId;
      state.keyPointerDragStartX = ev.clientX;
      state.keyPointerDragStartY = ev.clientY;
      state.keyPointerDragNode = node;
      state.keyPointerDragSource = {
        row: Number(node.dataset.rowIndex),
        index: Number(node.dataset.keyIndex)
      };
      try {
        node.setPointerCapture(ev.pointerId);
      } catch (_) {}
      state.keyPointerDragHoldTimer = setTimeout(() => {
        if (state.keyPointerDragPointerId !== ev.pointerId || !state.keyPointerDragSource) return;
        state.dragKey = {
          row: state.keyPointerDragSource.row,
          index: state.keyPointerDragSource.index
        };
        state.keyPointerDragActive = true;
        node.classList.add("dragging");
        renderLayoutEditor();
      }, 150);
    });
  }

  function clearKeyPointerDragHoldTimer() {
    if (state.keyPointerDragHoldTimer != null) {
      clearTimeout(state.keyPointerDragHoldTimer);
      state.keyPointerDragHoldTimer = null;
    }
  }

  function resetKeyPointerDragState() {
    clearKeyPointerDragHoldTimer();
    state.keyPointerDragPointerId = null;
    state.keyPointerDragActive = false;
    state.keyPointerDragStartX = 0;
    state.keyPointerDragStartY = 0;
    state.keyPointerDragNode = null;
    state.keyPointerDragSource = null;
  }

  function abortKeyPointerDrag(pointerId = null) {
    const dragNode = state.keyPointerDragNode;
    resetKeyPointerDragState();
    if (dragNode && pointerId != null) {
      try {
        dragNode.releasePointerCapture(pointerId);
      } catch (_) {}
    }
  }

  function keyPointerDropTargetFromPoint(clientX, clientY) {
    const chip = document.elementFromPoint(clientX, clientY)?.closest?.(".layout-chip");
    if (!chip) return null;
    const direct = chip.closest?.(".key-list");
    if (!direct) return null;
    return {
      row: Number(direct.dataset.rowIndex),
      index: insertionIndexFromKeyEvent(chip, { clientX })
    };
  }

  function popupPointerDropTargetFromPoint(clientX, clientY) {
    const drag = state.popupCandidateDrag;
    if (!drag) return null;
    const chip = document.elementFromPoint(clientX, clientY)?.closest?.(".popup-chip");
    if (!chip) return null;
    const direct = chip.closest?.(".popup-entry-values");
    if (!direct || direct.dataset.popupKey !== drag.key) return null;
    const index = Number(chip.dataset.popupIndex);
    if (!Number.isInteger(index) || index < 0) return null;
    const rect = chip.getBoundingClientRect();
    const placeAfter = clientX > rect.left + rect.width / 2;
    return {
      key: drag.key,
      index: index + (placeAfter ? 1 : 0)
    };
  }

  function keyInsertionIndexFromPointerInRow(list, clientX, clientY) {
    const chips = Array.from(list.querySelectorAll(".layout-chip"));
    if (!chips.length) return 0;
    let bestIndex = chips.length;
    let bestDistance = Number.POSITIVE_INFINITY;
    chips.forEach((chip, index) => {
      const rect = chip.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = centerX - clientX;
      const dy = centerY - clientY;
      const distance = dx * dx + dy * dy;
      if (distance >= bestDistance) return;
      bestDistance = distance;
      bestIndex = clientX > centerX ? index + 1 : index;
    });
    return bestIndex;
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
    if (state.keyPointerDragPointerId === ev.pointerId) {
      if (!state.keyPointerDragActive) {
        const dx = Math.abs(ev.clientX - state.keyPointerDragStartX);
        const dy = Math.abs(ev.clientY - state.keyPointerDragStartY);
        if (dx > 8 || dy > 8) abortKeyPointerDrag(ev.pointerId);
      } else {
        ev.preventDefault();
        const target = keyPointerDropTargetFromPoint(ev.clientX, ev.clientY);
        if (target) previewMoveKey(target.row, target.index);
      }
    }
    if (state.dragRowPointerId !== ev.pointerId || state.dragRow == null) return;
    ev.preventDefault();
    const insertionIndex = rowInsertionIndexFromPointerY(ev.clientY);
    if (insertionIndex == null) return;
    previewMoveRowToInsertionIndex(insertionIndex);
  });

  document.addEventListener("pointerup", (ev) => {
    if (state.keyPointerDragPointerId === ev.pointerId) {
      const moved = state.keyPointerDragActive && !!state.dragKey;
      abortKeyPointerDrag(ev.pointerId);
      if (moved) {
        state.layoutChipClickSuppressedUntil = Date.now() + 250;
        state.dragKey = null;
        syncLayoutUiFromState();
      }
    }
    if (state.dragRowPointerId !== ev.pointerId) return;
    finishRowPointerDrag();
  });

  document.addEventListener("pointercancel", (ev) => {
    if (state.keyPointerDragPointerId === ev.pointerId) {
      abortKeyPointerDrag(ev.pointerId);
      state.dragKey = null;
      syncLayoutUiFromState();
    }
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
    if (state.popupPointerDragPointerId === ev.pointerId) {
      if (!state.popupPointerDragActive) {
        const dx = Math.abs(ev.clientX - state.popupPointerDragStartX);
        const dy = Math.abs(ev.clientY - state.popupPointerDragStartY);
        if (dx > 8 || dy > 8) abortPopupPointerDrag(ev.pointerId);
      } else {
        ev.preventDefault();
        const target = popupPointerDropTargetFromPoint(ev.clientX, ev.clientY);
        if (target) {
          previewMovePopupCandidate(target.key, target.index);
        }
      }
    }
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
    if (state.popupPointerDragPointerId === ev.pointerId) {
      const dragKey = state.popupCandidateDrag?.key || "";
      const moved = state.popupPointerDragActive && state.popupCandidateDragMoved;
      abortPopupPointerDrag(ev.pointerId);
      state.popupCandidateDrag = null;
      if (moved) {
        state.popupChipClickSuppressedUntil = Date.now() + 250;
        syncPopupJsonFromState();
        if (dragKey) setStatus("popup-editor-status", `已调整 ${dragKey} 的候选顺序`, "ok");
      }
      state.popupCandidateDragMoved = false;
      renderPopupEditor();
    }
    if (state.macroStepDragPointerId !== ev.pointerId) return;
    const wasActive = state.macroStepDragActive;
    resetMacroStepDragState();
    if (wasActive) renderMacroEventEditor();
  });

  document.addEventListener("pointercancel", (ev) => {
    if (state.popupPointerDragPointerId === ev.pointerId) {
      abortPopupPointerDrag(ev.pointerId);
      state.popupCandidateDrag = null;
      state.popupCandidateDragMoved = false;
      renderPopupEditor();
    }
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
      if (Date.now() < state.layoutKeyDialogTouchOpenUntil) {
        state.layoutKeyDialogConsumeNextClick = true;
      }
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
      hasEditableSubLabel: false,
      hasDisplayText: displayTextTypes.has(type),
      hasSwipeLabel: swipeTypes.has(type),
      hasMacroLabels: type === "MacroKey",
      hasTapAction: type === "MacroKey",
      hasSwipeAction: type === "MacroKey" || swipeTypes.has(type),
      hasLongPressAction: type === "MacroKey",
      // NumPadKey：数字符号下拉（label + sym）；LayoutSwitchKey：切换目标下拉（subLabel）
      hasNumpadSym: type === "NumPadKey",
      hasSwitchTarget: type === "LayoutSwitchKey"
    };
  }

  function populateMainKeyFieldsFromDraft() {
    const key = keyDialogState.draft || {};
    const type = key.type || "AlphabetKey";
    const typeSelect = el("layout-key-type");
    typeSelect.innerHTML = keyTypes.map((t) => `<option value="${escapeAttr(t)}">${escapeHtml(t)}</option>`).join("");
    typeSelect.value = keyTypes.includes(type) ? type : "AlphabetKey";
    el("layout-key-main").value = key.main || "";
    el("layout-key-alt").value = key.alt || "";
    el("layout-key-label").value = key.label || "";
    el("layout-key-sub-label").value = key.subLabel || "";
    el("layout-key-weight").value = key.weight == null ? "" : String(key.weight);
    el("layout-key-row-height").value = key.rowHeightPercent == null ? "" : String(key.rowHeightPercent);
    const numpadSel = el("layout-key-numpad-sym");
    numpadSel.innerHTML = numpadSymOptions
      .map((o) => `<option value="${escapeAttr(o.sym)}">${escapeHtml(o.label)}</option>`)
      .join("");
    const symName = resolveNumpadSymName(key.sym ?? key.label) || "KP_0";
    numpadSel.value = numpadSymOptions.some((o) => o.sym === symName) ? symName : "KP_0";
    const targetSel = el("layout-key-switch-target");
    targetSel.innerHTML = switchTargetOptions
      .map((o) => `<option value="${escapeAttr(o.value)}">${escapeHtml(o.label)}</option>`)
      .join("");
    targetSel.value = switchTargetOptions.some((o) => o.value === (key.subLabel || ""))
      ? (key.subLabel || "") : "";
    updateKeyDialogFieldVisibility(type);
    syncComposeInlineUi();
    refreshKeyDialogSummaries();
  }

  function updateKeyDialogFieldVisibility(type) {
    const c = keyTypeCapabilities(type);
    const inComposeEdit = !!state.composeNestedContext;
    const canEditCompose = !inComposeEdit;
    const showDisplay = c.hasDisplayText;
    const showLabels = c.hasSwipeLabel || c.hasMacroLabels;
    const showMacro = c.hasTapAction || c.hasSwipeAction || c.hasLongPressAction;
    document.querySelectorAll(".key-basic-main, .key-basic-alt").forEach((node) => { node.hidden = !c.hasMainAlt; });
    document.querySelectorAll(".key-basic-label").forEach((node) => { node.hidden = !c.hasLabel; });
    document.querySelectorAll(".key-basic-sublabel").forEach((node) => { node.hidden = !c.hasEditableSubLabel; });
    document.querySelectorAll(".key-basic-numpad-sym").forEach((node) => { node.hidden = !c.hasNumpadSym; });
    document.querySelectorAll(".key-basic-switch-target").forEach((node) => { node.hidden = !c.hasSwitchTarget; });
    document.querySelectorAll(".key-basic-weight, .key-basic-row-height").forEach((node) => { node.hidden = inComposeEdit; });
    const mainInput = el("layout-key-main");
    const altInput = el("layout-key-alt");
    const labelInput = el("layout-key-label");
    const subLabelInput = el("layout-key-sub-label");
    const weightInput = el("layout-key-weight");
    const rowHeightInput = el("layout-key-row-height");
    if (mainInput) mainInput.disabled = !c.hasMainAlt;
    if (altInput) altInput.disabled = !c.hasMainAlt;
    if (labelInput) labelInput.disabled = !c.hasLabel;
    if (subLabelInput) subLabelInput.disabled = !c.hasEditableSubLabel;
    if (weightInput) weightInput.disabled = inComposeEdit;
    if (rowHeightInput) rowHeightInput.disabled = inComposeEdit;
    const displayBtn = el("layout-key-open-display-text");
    const labelsBtn = el("layout-key-open-labels");
    const macroBtn = el("layout-key-open-macro");
    const colorsBtn = el("layout-key-open-colors");
    const composeBtn = el("layout-key-open-compose");
    if (displayBtn) displayBtn.hidden = !showDisplay;
    if (labelsBtn) labelsBtn.hidden = !showLabels;
    if (macroBtn) macroBtn.hidden = !showMacro;
    if (colorsBtn) colorsBtn.hidden = inComposeEdit && !isComposeIndependentColorEnabled();
    if (composeBtn) composeBtn.hidden = !canEditCompose;
    const displaySummary = el("layout-key-display-text-summary");
    const labelsSummary = el("layout-key-labels-summary");
    const macroSummary = el("layout-key-macro-summary");
    const composeSummary = el("layout-key-compose-summary");
    if (displaySummary) displaySummary.hidden = !showDisplay;
    if (labelsSummary) labelsSummary.hidden = !showLabels;
    if (macroSummary) macroSummary.hidden = !showMacro;
    if (composeSummary) composeSummary.hidden = inComposeEdit;
    if (!c.hasDisplayText && keyDialogState.draft) delete keyDialogState.draft.displayText;
    if (!c.hasSubLabel && keyDialogState.draft) delete keyDialogState.draft.subLabel;
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
      delete keyDialogState.draft.composeOverride;
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
    const c = keyTypeCapabilities(type || "AlphabetKey");
    const main = el("layout-key-main").value;
    const alt = el("layout-key-alt").value;
    const label = el("layout-key-label").value;
    const subLabel = el("layout-key-sub-label").value;
    const weightRaw = el("layout-key-weight").value.trim();
    const rowHeightRaw = el("layout-key-row-height").value.trim();
    const inComposeEdit = !!state.composeNestedContext;
    if (type) key.type = type;
    if (c.hasMainAlt) {
      if (main.trim()) key.main = main; else delete key.main;
      if (alt.trim()) key.alt = alt; else delete key.alt;
    } else {
      delete key.main;
      delete key.alt;
    }
    if (c.hasLabel) {
      if (type === "LayoutSwitchKey") key.label = label.trim() ? label : "?123";
      else if (type === "SymbolKey") key.label = label.trim() ? label : ".";
      else if (label.trim()) key.label = label;
      else delete key.label;
    } else {
      delete key.label;
    }
    if (c.hasEditableSubLabel) {
      if (subLabel.trim()) key.subLabel = subLabel;
      else delete key.subLabel;
    }
    if (c.hasNumpadSym) {
      const numpadSel = el("layout-key-numpad-sym");
      const opt = numpadSymOptions.find((o) => o.sym === numpadSel.value) || numpadSymOptions[0];
      key.sym = opt.sym;
      key.label = opt.label;
    }
    if (c.hasSwitchTarget) {
      const targetSel = el("layout-key-switch-target");
      const value = String(targetSel.value || "").trim();
      if (value) key.subLabel = value;
      else delete key.subLabel;
    }
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

  function normalizeDraftForSaveByAppRules(key) {
    const type = String(key?.type || "").trim();
    if (!type) throw new Error("type 不能为空");
    normalizeKeyFieldsForType(key);
    if (type === "AlphabetKey") {
      const main = String(key.main || "").trim();
      const alt = String(key.alt || "").trim();
      if (!main) throw new Error("主字符不能为空");
      if (!alt) throw new Error("副字符不能为空");
      if (Array.from(main).length !== 1) throw new Error("主字符必须是单个字符");
      if (Array.from(alt).length !== 1) throw new Error("副字符必须是单个字符");
    }
    if (type === "MacroKey") {
      const label = String(key.label || "").trim();
      if (!label) throw new Error("标签不能为空");
      const tapSteps = Array.isArray(key.tap?.macro) ? key.tap.macro : [];
      if (!tapSteps.length) {
        key.tap = { macro: [{ type: "text", text: "" }] };
      }
    }
    if (state.composeNestedContext) {
      delete key.composeOverride;
    }
  }

  function saveLayoutKeyDialog() {
    try {
      if (state.composeNestedContext) {
        updateDraftFromMainFields();
        syncComposeMetaToParentDraft();
        const key = deepClone(keyDialogState.draft || {});
        normalizeRowHeightKey(key);
        normalizeDraftForSaveByAppRules(key);
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
      normalizeDraftForSaveByAppRules(key);
      if (keyIndex >= 0 && keyIndex < rows[rowIndex].length) rows[rowIndex][keyIndex] = key;
      else rows[rowIndex].push(key);
      el("layout-key-dialog").close();
      syncLayoutUiFromState();
    } catch (e) {
      setStatus("layout-key-dialog-status", `保存失败：${e.message}`, "err");
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
      if (!code || !allowed.has(code)) return;
      const id = `fcitx:${code}`;
      if (seen.has(id)) return;
      seen.add(id);
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
      if (s.type === "edit") return `${s.type}:${macroEditActionLabels[s.keys?.[0]?.code] || s.keys?.[0]?.code || "?"}`;
      if (s.type === "app") return `${s.type}:${macroAppActionLabels[s.keys?.[0]?.code] || s.keys?.[0]?.code || "?"}`;
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
      select.innerHTML = options.map((v) => `<option value="${escapeAttr(v)}">${escapeHtml(stepType === "edit" ? (macroEditActionLabels[v] || v) : (macroAppActionLabels[v] || v))}</option>`).join("");
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
          key.code = codeSel.value || "";
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
    let name;
    if (/^[A-Z0-9]$/.test(raw) || /^F\d+$/.test(raw)) {
      name = raw;
    } else if (raw === "BackSpace") {
      name = "Backspace";
    } else if (raw === "Page_Up") {
      name = "Page Up";
    } else if (raw === "Page_Down") {
      name = "Page Down";
    } else if (raw === "Scroll_Lock") {
      name = "Scroll Lock";
    } else if (raw === "Caps_Lock") {
      name = "Caps Lock";
    } else if (raw === "Num_Lock") {
      name = "Num Lock";
    } else if (raw === "HomePage") {
      name = "Home Page";
    } else if (raw.startsWith("XF86")) {
      name = raw.slice(4);
    } else {
      name = raw.replace(/_/g, " ");
    }
    // Append the output character hint like the app's key picker (e.g. Grave(`)).
    const symbol = fcitxKeySymbol(raw);
    if (symbol) {
      const display = name.charAt(0).toUpperCase() + name.slice(1);
      return `${display} (${symbol})`;
    }
    return name;
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
      if (type === "edit") {
        const action = String(step.keys?.[0]?.code || "");
        return {
          type,
          keys: [{ keyType: "fcitx", code: macroEditActions.includes(action) ? action : (macroEditActions[0] || "copy") }],
          text: ""
        };
      }
      if (type === "app") {
        const action = String(step.keys?.[0]?.code || "");
        return {
          type,
          keys: [{ keyType: "fcitx", code: macroAppActions.includes(action) ? action : (macroAppActions[0] || "theme") }],
          text: ""
        };
      }
      if (type === "layer") {
        return {
          type,
          keys: [{ keyType: "fcitx", code: normalizeLayerMode(step.keys?.[0]?.code) }],
          text: String(step.text || "")
        };
      }
      if (type === "text") {
        return { type, keys: [], text: String(step.text || "") };
      }
      const keys = sanitizeMacroKeys(
        Array.isArray(step.keys)
          ? step.keys.map((k) => ({
            keyType: "fcitx",
            code: String(k?.code || "").trim()
          }))
          : []
      );
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

  function installInlineColorPicker(input, row, container = el("layout-key-colors-dialog")) {
    if (!window.jscolor || input.jscolor) return;
    try {
      const picker = new window.jscolor(input, {
        hash: true,
        closeButton: true,
        showOnClick: true,
        format: "hexa",
        alphaChannel: true,
        container,
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
      const dialog = input.closest("dialog") || el("layout-key-colors-dialog");
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

  function openLayoutGradientDialog() {
    const points = collectLayoutGradientPoints();
    if (!points.length) {
      setStatus("layout-json-status", "当前布局没有可处理的按键", "err");
      return;
    }
    gradientDialogState.anchors = buildDefault2dGradientAnchors(points);
    renderLayoutGradientAnchors();
    setStatus("layout-gradient-status", "可分别设置背景/文字/副文字/阴影；每个字段都会按二维位置独立插值。", "");
    el("layout-gradient-dialog").showModal();
  }

  function collectLayoutGradientPoints() {
    const rows = getRows();
    const rowPercents = resolveRowHeightPercents(rows);
    const rowHeights = rowPercents.map(effectiveRowHeight);
    const totalHeight = rowHeights.reduce((sum, value) => sum + value, 0);
    const points = [];
    let yCursor = 0;
    rows.forEach((row, rowIndex) => {
      const widths = resolveRegularRowWidths(row);
      const rowHeight = rowHeights[rowIndex] || 0;
      const top = totalHeight > 0 ? yCursor / totalHeight : rowIndex / Math.max(rows.length, 1);
      const bottom = totalHeight > 0 ? (yCursor + rowHeight) / totalHeight : (rowIndex + 1) / Math.max(rows.length, 1);
      const centerY = totalHeight > 0 ? (yCursor + rowHeight * 0.5) / totalHeight : (rowIndex + 0.5) / Math.max(rows.length, 1);
      let xCursor = 0;
      row.forEach((key, keyIndex) => {
        const width = Math.max(0, Number(widths[keyIndex]) || 0);
        const left = xCursor;
        const right = xCursor + width;
        const centerX = xCursor + width * 0.5;
        points.push({ rowIndex, keyIndex, key, x: centerX, y: centerY, left, right, top, bottom });
        xCursor += width;
      });
      yCursor += rowHeight;
    });
    return points;
  }

  function buildDefault2dGradientAnchors(points) {
    if (!points.length) return [];
    if (points.length === 1) return [{ keyRef: pointRef(points[0]), colors: defaultAnchorColorsFromPoint(points[0]) }];
    const sorted = points.slice().sort((a, b) => (a.y - b.y) || (a.x - b.x));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    return [
      { keyRef: pointRef(first), colors: defaultAnchorColorsFromPoint(first) },
      { keyRef: pointRef(last), colors: defaultAnchorColorsFromPoint(last) }
    ];
  }

  function defaultAnchorColorsFromPoint(point) {
    const colors = {};
    keyColorFields.forEach((field) => {
      const value = formatColorCode(point?.key?.[field.customKey]);
      colors[field.customKey] = value || "";
    });
    return colors;
  }

  function pointRef(point) {
    return `${point.rowIndex}:${point.keyIndex}`;
  }

  function parsePointRef(ref) {
    const text = String(ref || "");
    const parts = text.split(":");
    if (parts.length !== 2) return null;
    const rowIndex = Number(parts[0]);
    const keyIndex = Number(parts[1]);
    if (!Number.isInteger(rowIndex) || !Number.isInteger(keyIndex)) return null;
    return { rowIndex, keyIndex };
  }

  function syncGradientAnchorsFromDialog() {
    const anchorRows = Array.from(el("layout-gradient-anchor-list")?.querySelectorAll(".layout-gradient-anchor-row") || []);
    if (!anchorRows.length) return;
    gradientDialogState.anchors = anchorRows.map((rowNode) => {
      const keyRef = rowNode.querySelector(".layout-gradient-anchor-key")?.value || "";
      const colors = {};
      Array.from(rowNode.querySelectorAll(".layout-gradient-anchor-color")).forEach((input) => {
        const field = input.dataset.field;
        colors[field] = input.value;
      });
      return { keyRef, colors };
    });
  }

  function renderLayoutGradientAnchors(options = {}) {
    if (options.syncFromDom !== false) syncGradientAnchorsFromDialog();
    const points = collectLayoutGradientPoints();
    const pointMap = new Map(points.map((point) => [pointRef(point), point]));
    const list = el("layout-gradient-anchor-list");
    list.innerHTML = "";
    if (!points.length) {
      setStatus("layout-gradient-status", "当前布局没有可处理的按键", "err");
      return;
    }

    if (!Array.isArray(gradientDialogState.anchors) || !gradientDialogState.anchors.length) {
      gradientDialogState.anchors = buildDefault2dGradientAnchors(points);
    }

    gradientDialogState.anchors = gradientDialogState.anchors.map((anchor, index) => {
      const parsedRef = parsePointRef(anchor.keyRef);
      const fallbackRef = pointRef(points[Math.min(index, points.length - 1)]);
      const keyRef = parsedRef && pointMap.has(anchor.keyRef) ? anchor.keyRef : fallbackRef;
      const colors = {};
      keyColorFields.forEach((field) => {
        const raw = anchor?.colors?.[field.customKey] || "";
        colors[field.customKey] = raw ? (formatColorCode(raw) || String(raw)) : "";
      });
      return { keyRef, colors };
    });

    gradientDialogState.anchors.forEach((anchor, anchorIndex) => {
      const rowNode = document.createElement("div");
      rowNode.className = "layout-gradient-anchor-row";
      rowNode.innerHTML = `
        <select class="layout-gradient-anchor-key"></select>
        <input class="layout-gradient-anchor-color" data-field="backgroundColor" type="text" data-jscolor="{}" placeholder="背景 #AARRGGBB" value="${escapeAttr(anchor.colors.backgroundColor || "")}">
        <input class="layout-gradient-anchor-color" data-field="textColor" type="text" data-jscolor="{}" placeholder="文字 #AARRGGBB" value="${escapeAttr(anchor.colors.textColor || "")}">
        <input class="layout-gradient-anchor-color" data-field="altTextColor" type="text" data-jscolor="{}" placeholder="副文字 #AARRGGBB" value="${escapeAttr(anchor.colors.altTextColor || "")}">
        <input class="layout-gradient-anchor-color" data-field="shadowColor" type="text" data-jscolor="{}" placeholder="阴影 #AARRGGBB" value="${escapeAttr(anchor.colors.shadowColor || "")}">
        <button type="button" class="layout-gradient-anchor-remove" title="删除锚点">×</button>
      `;

      const keySel = rowNode.querySelector(".layout-gradient-anchor-key");
      keySel.innerHTML = points.map((point) => {
        const label = `第 ${point.rowIndex + 1} 行 / 键 ${point.keyIndex + 1} / ${editorKeyLabel(point.key)}`;
        return `<option value="${escapeAttr(pointRef(point))}">${escapeHtml(label)}</option>`;
      }).join("");
      if (pointMap.has(anchor.keyRef)) keySel.value = anchor.keyRef;
      keySel.addEventListener("change", () => {
        gradientDialogState.anchors[anchorIndex].keyRef = keySel.value;
      });

      Array.from(rowNode.querySelectorAll(".layout-gradient-anchor-color")).forEach((input) => {
        const field = input.dataset.field;
        input.addEventListener("input", () => {
          gradientDialogState.anchors[anchorIndex].colors[field] = input.value;
        });
        input.addEventListener("pointerdown", () => syncInlinePickerFromArgbInput(input, false));
        input.addEventListener("click", () => positionInlineColorPicker(input));
        input.addEventListener("change", () => {
          if (!input.value.trim()) {
            gradientDialogState.anchors[anchorIndex].colors[field] = "";
            return;
          }
          syncInlinePickerFromArgbInput(input);
          gradientDialogState.anchors[anchorIndex].colors[field] = input.value;
        });
        installInlineColorPicker(input, rowNode, el("layout-gradient-dialog"));
      });

      const removeBtn = rowNode.querySelector(".layout-gradient-anchor-remove");
      removeBtn.disabled = gradientDialogState.anchors.length <= 2;
      removeBtn.addEventListener("click", () => {
        if (gradientDialogState.anchors.length <= 2) return;
        syncGradientAnchorsFromDialog();
        gradientDialogState.anchors.splice(anchorIndex, 1);
        renderLayoutGradientAnchors({ syncFromDom: false });
      });

      list.appendChild(rowNode);
    });
  }

  function addLayoutGradientAnchor() {
    syncGradientAnchorsFromDialog();
    const points = collectLayoutGradientPoints();
    if (!points.length) return;
    const pick = points[Math.min(gradientDialogState.anchors.length, points.length - 1)];
    gradientDialogState.anchors.push({
      keyRef: pointRef(pick),
      colors: { backgroundColor: "", textColor: "", altTextColor: "", shadowColor: "" }
    });
    renderLayoutGradientAnchors({ syncFromDom: false });
  }

  function applyLayoutGradientColors() {
    const points = collectLayoutGradientPoints();
    if (!points.length) throw new Error("当前布局没有可处理的按键");
    const pointMap = new Map(points.map((point) => [pointRef(point), point]));
    const anchorRows = Array.from(el("layout-gradient-anchor-list").querySelectorAll(".layout-gradient-anchor-row"));
    const parsedAnchors = anchorRows.map((rowNode) => {
      const keyRef = rowNode.querySelector(".layout-gradient-anchor-key").value;
      const point = pointMap.get(keyRef);
      if (!point) throw new Error("锚点按键位置无效");
      const colors = {};
      Array.from(rowNode.querySelectorAll(".layout-gradient-anchor-color")).forEach((input) => {
        const field = input.dataset.field;
        const value = input.value.trim();
        if (!value) {
          colors[field] = null;
          return;
        }
        const parsed = parseColorValue(value);
        if (parsed == null) throw new Error(`颜色格式无效：${value}`);
        colors[field] = parsed >>> 0;
      });
      return { point, colors };
    });

    if (parsedAnchors.length < 2) throw new Error("至少需要两个锚点");
    const uniqueRefs = new Set(parsedAnchors.map((entry) => pointRef(entry.point)));
    if (uniqueRefs.size !== parsedAnchors.length) throw new Error("同一个按键不能设置多个锚点");

    let appliedCount = 0;
    let skippedCount = 0;
    keyColorFields.forEach((field) => {
      const channelAnchors = parsedAnchors
        .filter((entry) => entry.colors[field.customKey] != null)
        .filter((entry) => !field.supportedTypes || field.supportedTypes.has(entry.point.key?.type))
        .map((entry) => ({
          x: entry.point.x,
          y: entry.point.y,
          left: entry.point.left,
          right: entry.point.right,
          top: entry.point.top,
          bottom: entry.point.bottom,
          color: entry.colors[field.customKey]
        }));
      if (!channelAnchors.length) return;
      const bounds = calculateAnchorBounds(channelAnchors);

      points.forEach((point) => {
        const key = point.key;
        if (!key) return;
        if (field.supportedTypes && !field.supportedTypes.has(key.type)) {
          skippedCount += 1;
          return;
        }
        if (!isPointInsideBounds(point, bounds)) return;
        const color = interpolateColorByDistance(point.x, point.y, channelAnchors);
        key[field.customKey] = color;
        delete key[field.monetKey];
        appliedCount += 1;
      });
    });

    if (!appliedCount) throw new Error("没有可应用颜色，请至少在一个字段中填写两个有效锚点颜色");
    syncLayoutUiFromState();
    const skipText = skippedCount ? `，跳过 ${skippedCount} 次不支持字段的按键着色` : "";
    setStatus("layout-json-status", `已完成二维渐变着色，共应用 ${appliedCount} 次${skipText}`, "ok");
    el("layout-gradient-dialog").close();
  }

  function clearKeyColorOverrides(key) {
    if (!key || typeof key !== "object" || Array.isArray(key)) return 0;
    let count = 0;
    keyColorFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(key, field.customKey)) {
        delete key[field.customKey];
        count += 1;
      }
      if (Object.prototype.hasOwnProperty.call(key, field.monetKey)) {
        delete key[field.monetKey];
        count += 1;
      }
    });
    if (key.composeOverride && typeof key.composeOverride === "object" && !Array.isArray(key.composeOverride)) {
      count += clearKeyColorOverrides(key.composeOverride);
    }
    return count;
  }

  function clearLayoutKeyColors() {
    let cleared = 0;
    baseNames(state.layout).forEach((base) => {
      const value = state.layout[base];
      if (isRows(value)) {
        value.forEach((row) => row.forEach((key) => { cleared += clearKeyColorOverrides(key); }));
        return;
      }
      if (!value || typeof value !== "object" || Array.isArray(value)) return;
      Object.keys(value)
        .filter((key) => key !== META_KEY)
        .forEach((sub) => {
          const rows = unwrapRows(value[sub]);
          if (isRows(rows)) rows.forEach((row) => row.forEach((key) => { cleared += clearKeyColorOverrides(key); }));
        });
    });
    syncLayoutUiFromState();
    setStatus("layout-json-status", cleared ? `已清除 ${cleared} 个按键颜色覆盖` : "没有可清除的按键颜色覆盖", cleared ? "ok" : "");
    el("layout-clear-colors-dialog").close();
  }

  function interpolateColorByDistance(x, y, anchors) {
    let weightSum = 0;
    let aSum = 0;
    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    for (const anchor of anchors) {
      const dx = x - anchor.x;
      const dy = y - anchor.y;
      const dist2 = dx * dx + dy * dy;
      if (dist2 <= 1e-8) return toSignedInt32(anchor.color >>> 0);
      const w = 1 / dist2;
      const c = anchor.color >>> 0;
      aSum += ((c >>> 24) & 0xff) * w;
      rSum += ((c >>> 16) & 0xff) * w;
      gSum += ((c >>> 8) & 0xff) * w;
      bSum += (c & 0xff) * w;
      weightSum += w;
    }
    if (!weightSum) return toSignedInt32(0xffffffff);
    const a = Math.round(aSum / weightSum);
    const r = Math.round(rSum / weightSum);
    const g = Math.round(gSum / weightSum);
    const b = Math.round(bSum / weightSum);
    const unsigned = ((((a & 0xff) << 24) >>> 0) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)) >>> 0;
    return toSignedInt32(unsigned);
  }

  function calculateAnchorBounds(anchors) {
    const lefts = anchors.map((anchor) => anchor.left ?? anchor.x);
    const rights = anchors.map((anchor) => anchor.right ?? anchor.x);
    const tops = anchors.map((anchor) => anchor.top ?? anchor.y);
    const bottoms = anchors.map((anchor) => anchor.bottom ?? anchor.y);
    return {
      minX: Math.min(...lefts),
      maxX: Math.max(...rights),
      minY: Math.min(...tops),
      maxY: Math.max(...bottoms)
    };
  }

  function isPointInsideBounds(point, bounds) {
    const epsilon = 1e-6;
    return point.left < bounds.maxX - epsilon && point.right > bounds.minX + epsilon
      && point.top < bounds.maxY - epsilon && point.bottom > bounds.minY + epsilon;
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
    delete composeDraft.composeOverride;
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
    requestAnimationFrame(() => state.layoutKeyJsonEditor?.requestMeasure?.());
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

  function syncThemeJsonHeight() {
    if (state.activeTab !== "tab-theme") return;
    const jsonCard = el("theme-json-card");
    if (!jsonCard) return;
    if (!jsonCard.open) {
      return;
    }
    const mainCard = document.querySelector(".theme-main-card");
    let referenceCardHeight = Math.round(jsonCard.getBoundingClientRect().height || 0);
    if (mainCard) {
      const style = getComputedStyle(mainCard);
      const border =
        (Number.parseFloat(style.borderTopWidth || "0") || 0) +
        (Number.parseFloat(style.borderBottomWidth || "0") || 0);
      const scrollHeight = Math.round(mainCard.scrollHeight + border);
      const mainRectHeight = Math.round(mainCard.getBoundingClientRect().height || 0);
      referenceCardHeight = scrollHeight > 0 ? scrollHeight : (mainRectHeight > 0 ? mainRectHeight : referenceCardHeight);
      state.lastThemeJsonCardHeight = referenceCardHeight;
    }
    const summary = jsonCard.querySelector("summary");
    const status = el("theme-json-status");
    const toolbar = jsonCard.querySelector(".toolbar");
    const cardStyle = getComputedStyle(jsonCard);
    const cardVerticalPadding =
      (Number.parseFloat(cardStyle.paddingTop || "0") || 0) +
      (Number.parseFloat(cardStyle.paddingBottom || "0") || 0);
    const height = Math.max(
      200,
      Math.floor(
        referenceCardHeight -
        cardVerticalPadding -
        (summary?.offsetHeight || 0) -
        (status?.offsetHeight || 0) -
        (toolbar?.offsetHeight || 0) -
        24
      )
    );
    const editor = state.themeJsonEditor;
    if (editor) {
      editor.dom.style.height = `${height}px`;
      editor.dom.style.maxHeight = `${height}px`;
      editor.dom.style.minHeight = "0";
      editor.dom.style.width = "100%";
      const scroller = editor.dom.querySelector(".cm-scroller");
      if (scroller) {
        scroller.style.height = `${height}px`;
        scroller.style.maxHeight = `${height}px`;
        scroller.style.minHeight = "0";
        scroller.style.overflow = "auto";
      }
      editor.requestMeasure();
      return;
    }
    const textarea = el("theme-json");
    if (textarea) {
      textarea.style.height = `${height}px`;
      textarea.style.maxHeight = `${height}px`;
      textarea.style.minHeight = "0";
      textarea.style.width = "100%";
      textarea.style.overflow = "auto";
    }
  }

  function syncPopupJsonHeight() {
    if (state.activeTab !== "tab-popup") return;
    const jsonCard = el("popup-json-card");
    if (!jsonCard) return;
    if (!jsonCard.open) return;
    const mainCard = document.querySelector(".popup-main-card");
    let referenceCardHeight = Math.round(jsonCard.getBoundingClientRect().height || 0);
    if (mainCard) {
      const style = getComputedStyle(mainCard);
      const border =
        (Number.parseFloat(style.borderTopWidth || "0") || 0) +
        (Number.parseFloat(style.borderBottomWidth || "0") || 0);
      const scrollHeight = Math.round(mainCard.scrollHeight + border);
      const mainRectHeight = Math.round(mainCard.getBoundingClientRect().height || 0);
      referenceCardHeight = scrollHeight > 0 ? scrollHeight : (mainRectHeight > 0 ? mainRectHeight : referenceCardHeight);
      state.lastPopupJsonCardHeight = referenceCardHeight;
    }
    const summary = jsonCard.querySelector("summary");
    const status = el("popup-json-status");
    const toolbar = jsonCard.querySelector(".toolbar");
    const cardStyle = getComputedStyle(jsonCard);
    const cardVerticalPadding =
      (Number.parseFloat(cardStyle.paddingTop || "0") || 0) +
      (Number.parseFloat(cardStyle.paddingBottom || "0") || 0);
    const height = Math.max(
      200,
      Math.floor(
        referenceCardHeight -
        cardVerticalPadding -
        (summary?.offsetHeight || 0) -
        (status?.offsetHeight || 0) -
        (toolbar?.offsetHeight || 0) -
        24
      )
    );
    const editor = state.popupJsonEditor;
    if (editor) {
      editor.dom.style.height = `${height}px`;
      editor.dom.style.maxHeight = `${height}px`;
      editor.dom.style.minHeight = "0";
      editor.dom.style.width = "100%";
      const scroller = editor.dom.querySelector(".cm-scroller");
      if (scroller) {
        scroller.style.height = `${height}px`;
        scroller.style.maxHeight = `${height}px`;
        scroller.style.minHeight = "0";
        scroller.style.overflow = "auto";
      }
      editor.requestMeasure();
      return;
    }
    const textarea = el("popup-json");
    if (textarea) {
      textarea.style.height = `${height}px`;
      textarea.style.maxHeight = `${height}px`;
      textarea.style.minHeight = "0";
      textarea.style.width = "100%";
      textarea.style.overflow = "auto";
    }
  }

  function getThemeJsonText() {
    return state.themeJsonEditor?.state.doc.toString() ?? el("theme-json").value;
  }

  function setThemeJsonText(text) {
    const editor = state.themeJsonEditor;
    if (editor) {
      editor.dispatch({
        changes: { from: 0, to: editor.state.doc.length, insert: text }
      });
      return;
    }
    el("theme-json").value = text;
  }

  function setThemeJsonEditable(editable) {
    const textarea = el("theme-json");
    if (textarea) textarea.readOnly = !editable;
    const editor = state.themeJsonEditor;
    if (!editor) return;
    if (editor.contentDOM) {
      editor.contentDOM.contentEditable = editable ? "true" : "false";
      editor.contentDOM.setAttribute("aria-readonly", editable ? "false" : "true");
    }
    editor.dom.classList.toggle("cm-readonly", !editable);
  }

  function applyThemeJsonEditorInput() {
    if (state.suppressThemeJsonInput) return;
    const theme = currentThemeEntry();
    if (!theme || theme.builtin) {
      setStatus("theme-json-status", "内置主题不可直接编辑，请先复制为自定义主题", "err");
      return;
    }
    try {
      const parsed = JSON.parse(getThemeJsonText() || "{}");
      const candidateColors = parsed.colors && typeof parsed.colors === "object" ? parsed.colors : parsed;
      theme.colors = normalizeThemeColors(candidateColors);
      if (typeof parsed.name === "string" && parsed.name.trim()) {
        renameThemeAndSyncAssets(theme, parsed.name.trim());
      }
      if (typeof parsed.isDark === "boolean") theme.isDark = parsed.isDark;
      if (typeof parsed.backgroundImage === "string") {
        theme.backgroundImage = parsed.backgroundImage;
        theme.backgroundImageObject = null;
      } else if (parsed.backgroundImage && typeof parsed.backgroundImage === "object") {
        const bgSpec = normalizeThemeBackgroundImageObject(parsed.backgroundImage);
        theme.backgroundImageObject = bgSpec;
        theme.backgroundImage = resolveThemeAssetUrl(bgSpec);
      }
      renderThemeList();
      renderThemeEditor();
      renderThemeSupplementPreview();
      syncLayoutUiFromState();
      setStatus("theme-json-status", "JSON 合法，已实时应用到当前主题", "ok");
    } catch (e) {
      setStatus("theme-json-status", `JSON 无效：${e.message}`, "err");
    }
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

  async function initThemeJsonEditor() {
    if (state.themeJsonEditor || state.themeJsonEditorLoading) return;
    state.themeJsonEditorLoading = true;
    const textarea = el("theme-json");
    textarea.addEventListener("input", applyThemeJsonEditorInput);
    try {
      const { EditorView, basicSetup, json, oneDark } = await loadCodeMirrorModules();
      const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged) applyThemeJsonEditorInput();
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
      state.themeJsonEditor = editor;
      setThemeJsonEditable(isCurrentThemeEditable());
      syncThemeJsonHeight();
    } catch (e) {
      console.warn("CodeMirror failed to load, using textarea fallback", e);
      syncThemeJsonHeight();
    } finally {
      state.themeJsonEditorLoading = false;
    }
  }

  async function initPopupJsonEditor() {
    if (state.popupJsonEditor || state.popupJsonEditorLoading) return;
    state.popupJsonEditorLoading = true;
    const textarea = el("popup-json");
    textarea.addEventListener("input", applyPopupJsonEditorInput);
    try {
      const { EditorView, basicSetup, json, oneDark } = await loadCodeMirrorModules();
      const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged) applyPopupJsonEditorInput();
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
      state.popupJsonEditor = editor;
      syncPopupJsonHeight();
    } catch (e) {
      console.warn("CodeMirror failed to load, using textarea fallback", e);
      syncPopupJsonHeight();
    } finally {
      state.popupJsonEditorLoading = false;
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
      updateThemeQrUi();
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
    el("layout-open-gradient").addEventListener("click", openLayoutGradientDialog);
    el("layout-clear-colors").addEventListener("click", () => el("layout-clear-colors-dialog").showModal());
    el("layout-clear-colors-cancel").addEventListener("click", () => el("layout-clear-colors-dialog").close());
    el("layout-clear-colors-confirm").addEventListener("click", clearLayoutKeyColors);
    el("layout-gradient-anchor-add").addEventListener("click", addLayoutGradientAnchor);
    el("layout-gradient-cancel").addEventListener("click", () => el("layout-gradient-dialog").close());
    el("layout-gradient-apply").addEventListener("click", () => {
      try {
        applyLayoutGradientColors();
      } catch (err) {
        setStatus("layout-gradient-status", `应用失败：${err.message}`, "err");
      }
    });
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
    if (typeof window.bindKeyEditorDialogEvents === "function") {
      window.bindKeyEditorDialogEvents({
        el,
        setStatus,
        keyDialogState,
        deleteKey,
        updateDraftFromMainFields,
        updateKeyDialogFieldVisibility,
        saveLayoutKeyDialog,
        handleKeyDialogCancel,
        openDisplayTextDialog,
        openLabelsDialog,
        openMacroDialog,
        openColorsDialog,
        openComposeDialog,
        syncComposeMetaToParentDraft,
        clearComposeColorOverridesWhenInherited,
        refreshKeyDialogSummaries,
        clearComposeNested,
        openKeyJsonDialog,
        updateDisplayTextDialogVisibility,
        appendDisplayMapRow,
        saveDisplayTextDialog,
        saveLabelsDialog,
        saveMacroDialog,
        openMacroEventEditor,
        addMacroEventStep,
        resetMacroStepDragState,
        saveMacroEventEditor,
        saveColorsDialog,
        saveKeyJsonDialog
      });
    } else {
      console.error("bindKeyEditorDialogEvents not loaded");
      setStatus("layout-json-status", "按键编辑模块加载失败，请刷新页面重试", "err");
    }
    const keyDialog = el("layout-key-dialog");
    if (keyDialog) {
      keyDialog.addEventListener("click", (ev) => {
        if (!state.layoutKeyDialogConsumeNextClick) return;
        state.layoutKeyDialogConsumeNextClick = false;
        ev.preventDefault();
        ev.stopPropagation();
      }, true);
      keyDialog.addEventListener("close", () => {
        state.layoutKeyDialogConsumeNextClick = false;
      });
    }
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
    if (!window.lzma_wasm || typeof window.lzma_wasm.initWasm !== "function") {
      throw new Error("LZMA-Wasm 未加载");
    }
    if (!state.wasmInitPromise) {
      state.wasmInitPromise = window.lzma_wasm.initWasm()
        .then(() => {
          state.wasmReady = true;
        })
        .catch((err) => {
          state.wasmReady = false;
          state.wasmInitPromise = null;
          throw err;
        });
    }
    await state.wasmInitPromise;
  }

  function compressQrPayload(raw) {
    if (!window.lzma_wasm || typeof window.lzma_wasm.compress !== "function") {
      throw new Error("LZMA-Wasm 压缩器未加载");
    }
    const levels = [9, 6, 3, 1];
    let lastError = null;
    for (const level of levels) {
      try {
        const compressed = window.lzma_wasm.compress(raw, { format: "xz", level });
        if (!compressed || typeof compressed.length !== "number") {
          throw new Error("LZMA-Wasm 返回了无效压缩结果");
        }
        return compressed instanceof Uint8Array ? compressed : new Uint8Array(compressed);
      } catch (e) {
        lastError = e;
      }
    }
    const detail = lastError && lastError.message ? `：${lastError.message}` : "";
    throw new Error(`二维码数据压缩失败${detail}`);
  }

  async function encodeJsonToChunks(rawJson, profile, transferType = TRANSFER_TYPE_LAYOUT) {
    await ensureWasm();
    // 去除非必要空白字符再压缩
    let minifiedJson = rawJson;
    try {
      minifiedJson = JSON.stringify(JSON.parse(rawJson));
    } catch {}
    const raw = new TextEncoder().encode(minifiedJson);
    const compressed = compressQrPayload(raw);
    const crc = crc32(compressed);
    const transferId = buildTransferId(transferType, profile);
    // 限制每片最大不超过 MAX_CHUNK_BYTES，且尽量均匀分配
    const maxBytes = MAX_CHUNK_BYTES;
    let total = Math.ceil(compressed.length / maxBytes) || 1;
    // 使每片尽量均匀，且每片不超过 maxBytes
    let chunkSize = Math.ceil(compressed.length / total);
    if (chunkSize > maxBytes) chunkSize = maxBytes;
    const chunks = [];
    for (let i = 0; i < total; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, compressed.length);
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
    const bundle = await encodeJsonToChunks(payload.json, payload.profile, TRANSFER_TYPE_LAYOUT);
    return { ...bundle, profile: payload.profile };
  }

  function currentThemeQrPayload() {
    const theme = serializeCurrentTheme();
    const payload = {
      schema: "f5a-theme-qr-v1",
      theme: JSON.stringify({
        name: theme.name,
        isDark: theme.isDark,
        backgroundImage: theme.backgroundImage || "",
        ...theme.colors
      })
    };
    return { json: `${prettyJson(payload)}\n` };
  }

  async function generateThemeQrBundle() {
    const payload = currentThemeQrPayload();
    return await encodeJsonToChunks(payload.json, null, TRANSFER_TYPE_THEME);
  }

  function currentPopupQrPayload() {
    return { json: `${prettyJson(serializePopupEntries())}\n` };
  }

  async function generatePopupQrBundle() {
    const payload = currentPopupQrPayload();
    return await encodeJsonToChunks(payload.json, null, TRANSFER_TYPE_POPUP);
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

  function buildChunkLabels(bundle, profile, transferType = TRANSFER_TYPE_LAYOUT) {
    const label = transferType === TRANSFER_TYPE_THEME
      ? "Theme"
      : transferType === TRANSFER_TYPE_POPUP
        ? "Popup"
        : "Layout";
    const profilePart = transferType === TRANSFER_TYPE_LAYOUT ? ` · ${displayProfile(profile)}` : "";
    return bundle.chunks.map((_, i) => `${label}${profilePart} · Chunk ${i + 1}/${bundle.total} · ${bundle.transferId}`);
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

  function loadImageForCanvas(url) {
    return new Promise((resolve, reject) => {
      if (!url) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.onload = () => {
        state.themeImageMetaByUrl.set(url, {
          width: Number(img.naturalWidth || img.width || 0),
          height: Number(img.naturalHeight || img.height || 0)
        });
        requestAnimationFrame(() => {
          renderThemeList();
          renderThemeBackgroundEditor();
          applyPreviewThemeSurface();
        });
        resolve(img);
      };
      img.onerror = () => reject(new Error("主题背景图加载失败"));
      img.src = url;
    });
  }

  function drawCoverImage(ctx, image, width, height, rotation = 0) {
    const iw = Number(image?.naturalWidth || image?.width || 0);
    const ih = Number(image?.naturalHeight || image?.height || 0);
    if (!iw || !ih) return;
    const normalizedRotation = normalizeThemeBackgroundRotation(rotation);
    const rotated = normalizedRotation === 90 || normalizedRotation === 270;
    const sourceW = rotated ? ih : iw;
    const sourceH = rotated ? iw : ih;
    const scale = Math.max(width / sourceW, height / sourceH);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((normalizedRotation * Math.PI) / 180);
    ctx.drawImage(image, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }

  function applyCanvasBackgroundImageAdjustments(ctx, width, height, spec) {
    const brightness = themeBackgroundBrightness(spec);
    if (brightness < 100) {
      ctx.fillStyle = `rgba(0, 0, 0, ${(100 - brightness) / 100})`;
      ctx.fillRect(0, 0, width, height);
    }
    const blur = themeBackgroundBlurRadius(spec);
    if (blur > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.18, blur / 160)})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  async function renderPreviewCanvas(targetWidth) {
    const rows = getRows();
    const previewPadding = LONG_IMAGE_PREVIEW_PADDING;
    const rowGap = LONG_IMAGE_PREVIEW_ROW_GAP;
    const previewMetrics = resolvePreviewMetrics();
    const keyboardWidth = Math.min(
      LONG_IMAGE_PREVIEW_KEYBOARD_MAX_WIDTH,
      Math.max(1, targetWidth - previewPadding * 2)
    );
    const keyHGap = state.themeAppSync?.keyHGap ?? 3;
    const keyVGap = Math.max(0, Number(state.themeAppSync?.keyVGap ?? 3) || 0);
    const keyRadius = state.themeAppSync?.keyRadius ?? 4;
    const borderEnabled = !!state.themeAppSync?.borderEnabled;
    const borderOutline = !!state.themeAppSync?.borderOutline;
    const gboardStyle = !!state.themeAppSync?.gboardStyle;
    const punctPos = state.themeAppSync?.punctPos || 'bottom';
    const rowPercents = resolveRowHeightPercents(rows);
    const scaleForCanvas = previewMetrics ? keyboardWidth / Math.max(1, previewMetrics.maxWidth) : 1;
    const bottomPadding = previewMetrics ? previewMetrics.bottomPadding * scaleForCanvas : 0;
    const contentHeight = previewMetrics
      ? Math.max(rows.length * 28, previewMetrics.targetHeight * scaleForCanvas)
      : null;
    const rowHeights = contentHeight
      ? rowPercents.map((percent) => Math.max(28, Math.round(contentHeight * percent / 100)))
      : rowPercents.map(effectiveRowHeight);
    const height = Math.max(1, rowHeights.reduce((sum, h) => sum + h, 0) + Math.max(0, rows.length - 1) * rowGap + bottomPadding + previewPadding * 2);
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const keyboardColor = resolvePreviewSurfaceColor();
    const theme = currentThemeEntry();
    const sourceUrl = theme?.backgroundImage || resolveThemeAssetUrl(theme?.backgroundImageObject);
    let blurredBackgroundCanvas = null;
    if (sourceUrl) {
      try {
        const image = await loadImageForCanvas(sourceUrl);
        const backgroundCanvas = document.createElement("canvas");
        backgroundCanvas.width = targetWidth;
        backgroundCanvas.height = height;
        const bgCtx = backgroundCanvas.getContext("2d");
        if (image) drawCoverImage(bgCtx, image, targetWidth, height, themeBackgroundRotation(theme?.backgroundImageObject));
        applyCanvasBackgroundImageAdjustments(bgCtx, targetWidth, height, theme?.backgroundImageObject);
        blurredBackgroundCanvas = document.createElement("canvas");
        blurredBackgroundCanvas.width = targetWidth;
        blurredBackgroundCanvas.height = height;
        const blurCtx = blurredBackgroundCanvas.getContext("2d");
        blurCtx.filter = `blur(${themeBackgroundBlurRadius(theme?.backgroundImageObject)}px)`;
        blurCtx.drawImage(backgroundCanvas, 0, 0);
        blurCtx.filter = "none";
        ctx.drawImage(backgroundCanvas, 0, 0);
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = keyboardColor;
        ctx.fillRect(0, 0, targetWidth, height);
        ctx.globalCompositeOperation = "source-over";
      } catch (_) {
        ctx.fillStyle = keyboardColor;
        ctx.fillRect(0, 0, targetWidth, height);
      }
    } else {
      ctx.fillStyle = keyboardColor;
      ctx.fillRect(0, 0, targetWidth, height);
    }
    ctx.strokeStyle = argbToCss(resolveThemeTokenColor("dividerColor"));
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, targetWidth - 1, height - 1);

    let y = previewPadding;
    rows.forEach((row, rowIndex) => {
      const rowHeight = rowHeights[rowIndex];
      const widths = resolveRegularRowWidths(row);
      const rowWidth = widths.reduce((sum, width) => sum + width, 0);
      const sidePadding = previewMetrics ? previewMetrics.sidePadding * scaleForCanvas : 0;
      const availableKeyboardWidth = Math.max(1, keyboardWidth - sidePadding * 2);
      let x = (targetWidth - availableKeyboardWidth * rowWidth) / 2;
      row.forEach((key, keyIndex) => {
        const slotWidth = availableKeyboardWidth * (widths[keyIndex] || 0);
        const keyX = x + keyHGap;
        const keyY = y + keyVGap;
        const keyW = Math.max(1, slotWidth - keyHGap * 2);
        const keyH = effectivePreviewKeyHeight(rowHeight, keyVGap);
        const variant = keyVariantClass(key);
        const previewColors = resolvePreviewColorsForKey(key);
        const isMacro = variant.includes("macro-key");
        const isActionKey = key.type === 'ReturnKey' || key.type === 'LayoutSwitchKey' || key.type === 'LayerSwitchKey';
        const bg = previewColors.backgroundCss;
        const fg = previewColors.textCss;
        ctx.save();
        ctx.fillStyle = bg;
        drawRoundRect(ctx, keyX, keyY, keyW, keyH, gboardStyle && isActionKey ? keyH / 2 : keyRadius);
        if (blurredBackgroundCanvas && themeBackgroundBlurRadius(theme?.backgroundImageObject) > 0) {
          ctx.save();
          ctx.clip();
          ctx.drawImage(blurredBackgroundCanvas, 0, 0);
          ctx.fillStyle = bg;
          ctx.globalAlpha = 0.58;
          ctx.fillRect(keyX, keyY, keyW, keyH);
          ctx.restore();
          ctx.globalAlpha = 1;
        } else {
          ctx.fill();
        }
        if (borderEnabled && !borderOutline) {
          // Simulate App's non-stroke key shadow by drawing a thin bottom inset using keyShadowColor.
          ctx.beginPath();
          drawRoundRect(ctx, keyX, keyY + Math.max(1, Math.round(keyH * 0.04)), keyW, keyH, gboardStyle && isActionKey ? keyH / 2 : keyRadius);
          ctx.fillStyle = previewColors.borderCss;
          ctx.fill();
          ctx.beginPath();
          drawRoundRect(ctx, keyX, keyY, keyW, Math.max(1, keyH - 1), gboardStyle && isActionKey ? keyH / 2 : keyRadius);
          ctx.fillStyle = bg;
          ctx.fill();
        }
        if (borderEnabled && borderOutline) {
          ctx.lineWidth = isMacro ? 2 : 1;
          ctx.strokeStyle = previewColors.borderCss;
          ctx.stroke();
          ctx.lineWidth = (isMacro ? 2 : 1) + 2;
          ctx.strokeStyle = 'rgba(0,0,0,0.18)';
          ctx.stroke();
        }
        ctx.restore();
        const hasAlt = !!keySubText(key) && punctPos !== 'none';
        const punctPlacement = resolvePreviewPunctPlacement(key, punctPos, keyH);
        if (punctPlacement === 'bottom' && hasAlt) {
          const mainH = Math.max(1, keyH - 12);
          drawCenteredText(ctx, previewTitleFromObj(key), keyX, keyY, keyW, mainH, previewMainFontMaxForKey(key), fg);
          drawCenteredText(ctx, keySubText(key), keyX, keyY + mainH - 1, keyW, keyH - mainH + 1, 10, previewColors.altTextCss, 500, 6);
        } else if (punctPlacement === 'top-center' && hasAlt) {
          const altH = 10;
          drawCenteredText(ctx, keySubText(key), keyX, keyY, keyW, altH, 10, previewColors.altTextCss, 500, 6);
          const mainH = Math.max(1, keyH - altH);
          drawCenteredText(ctx, previewTitleFromObj(key), keyX, keyY + altH, keyW, mainH, previewMainFontMaxForKey(key), fg);
        } else {
          drawCenteredText(ctx, previewTitleFromObj(key), keyX, keyY, keyW, keyH, previewMainFontMaxForKey(key), fg);
        }
        const alt = keySubText(key);
        if (alt && punctPlacement === 'top-right') {
          drawRightTopText(ctx, alt, keyX, keyY, keyW, 10, previewColors.altTextCss);
        }
        x += slotWidth;
      });
      y += rowHeight + rowGap;
    });
    return canvas;
  }

  async function composeQrLongImage(bundle, profile, transferType = TRANSFER_TYPE_LAYOUT) {
    const labels = buildChunkLabels(bundle, profile, transferType);
    const pageHeight = LONG_IMAGE_PAGE_PADDING + LONG_IMAGE_QR_SIZE + LONG_IMAGE_TEXT_GAP + LONG_IMAGE_TEXT_SIZE + LONG_IMAGE_PAGE_PADDING;
    const width = LONG_IMAGE_QR_SIZE + LONG_IMAGE_PAGE_PADDING * 2;
    const previewCanvas = await renderPreviewCanvas(width);
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

  async function downloadQrLongImage(bundle, profile, transferType = TRANSFER_TYPE_LAYOUT) {
    const canvas = await composeQrLongImage(bundle, profile, transferType);
    const blob = await canvasToPngBlob(canvas);
    const prefix = transferType === TRANSFER_TYPE_THEME
      ? "text-keyboard-theme-qr"
      : transferType === TRANSFER_TYPE_POPUP
        ? "popup-preset-qr"
        : "text-keyboard-layout-qr";
    const fileName = `${prefix}-${Date.now()}.png`;
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
    if (!/^[A-Z][0-9a-f]{11}(?:~[A-Za-z0-9_-]+)?$/i.test(transferId)) return null;
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
    if (payloadBytesLength <= 0 || payloadBytesLength > MAX_CHUNK_BYTES_OF_APP) return null;
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

  function detectTransferType(transferId) {
    return String(transferId || "").charAt(0).toUpperCase();
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

  async function decodeQrChunksToJson(chunkTexts, expectedType) {
    const parsed = chunkTexts.map(parseQrChunkText).filter(Boolean);
    if (!parsed.length) throw new Error("未识别到有效二维码分片");
    const typed = parsed.filter((chunk) => detectTransferType(chunk.transferId) === expectedType);
    if (!typed.length) {
      throw new Error(`二维码类型不匹配，当前导入仅支持类型 ${expectedType}`);
    }

    const byTransfer = new Map();
    typed.forEach((chunk) => {
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
    return { text, transferId, total };
  }

  async function decodeLayoutFromQrChunks(chunkTexts) {
    const decoded = await decodeQrChunksToJson(chunkTexts, TRANSFER_TYPE_LAYOUT);
    const layout = normalizeLayoutObject(JSON.parse(decoded.text));
    return { layout, transferId: decoded.transferId, total: decoded.total };
  }

  async function decodeThemeFromQrChunks(chunkTexts) {
    const decoded = await decodeQrChunksToJson(chunkTexts, TRANSFER_TYPE_THEME);
    const raw = JSON.parse(decoded.text);
    if (raw && raw.schema && raw.schema !== "f5a-theme-qr-v1") {
      throw new Error(`不支持的主题二维码 schema：${raw.schema}`);
    }
    const themeData = normalizeImportedThemePayload(raw);
    return { themeData, transferId: decoded.transferId, total: decoded.total };
  }

  async function decodePopupFromQrChunks(chunkTexts) {
    const decoded = await decodeQrChunksToJson(chunkTexts, TRANSFER_TYPE_POPUP);
    const popupEntries = normalizePopupEntries(JSON.parse(decoded.text));
    return { popupEntries, transferId: decoded.transferId, total: decoded.total };
  }

  function inferMimeTypeByName(name) {
    const ext = String(name || "").split(".").pop()?.toLowerCase();
    if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
    if (ext === "webp") return "image/webp";
    if (ext === "bmp") return "image/bmp";
    if (ext === "gif") return "image/gif";
    return "image/png";
  }

  function inferExtensionByMime(mime) {
    const normalized = String(mime || "").toLowerCase();
    if (normalized.includes("jpeg") || normalized.includes("jpg")) return "jpg";
    if (normalized.includes("webp")) return "webp";
    if (normalized.includes("bmp")) return "bmp";
    if (normalized.includes("gif")) return "gif";
    return "png";
  }

  function normalizeZipEntryPath(path) {
    return String(path || "").replace(/^\/+/, "").replace(/\\/g, "/");
  }

  function normalizeRelativeThemeAssetPath(path, fallbackName) {
    const fallback = String(fallbackName || "").trim() || "background.png";
    let raw = String(path || "").trim();
    if (!raw) return fallback;
    raw = raw.replace(/\\/g, "/").replace(/^file:\/*/i, "/");
    const filesMarker = "/files/";
    const filesIndex = raw.lastIndexOf(filesMarker);
    if (filesIndex >= 0) {
      raw = raw.slice(filesIndex + filesMarker.length);
    } else if (/^[A-Za-z]:\//.test(raw) || raw.startsWith("/") || raw.startsWith("content:")) {
      raw = raw.split("/").pop() || "";
    }
    raw = raw.replace(/^\.\/+/, "").replace(/^\/+/, "").split(/[?#]/)[0];
    raw = raw.replace(/^theme\//i, "");
    const parts = raw.split("/").map((part) => part.trim()).filter((part) => part && part !== "." && part !== "..");
    if (!parts.length) return fallback;
    const normalized = parts.join("/");
    return normalizeZipEntryPath(normalized || fallback) || fallback;
  }

  function buildThemeBackgroundSpecForLocalImage(theme, file) {
    const fallbackExt = String(file?.name || "").includes(".")
      ? String(file.name).split(".").pop().toLowerCase()
      : inferExtensionByMime(file?.type || "image/png");
    const ext = fallbackExt || "png";
    const safeThemeName = String(theme?.name || "theme").replace(/[\\/:*?"<>|]/g, "_") || "theme";
    const fallbackCropped = `${safeThemeName}/${safeThemeName}.cropped.${ext}`;
    const fallbackSrc = `${safeThemeName}/${safeThemeName}.src.${ext}`;
    const source = theme?.backgroundImageObject || null;
    let croppedFilePath = normalizeRelativeThemeAssetPath(source?.croppedFilePath, fallbackCropped);
    let srcFilePath = normalizeRelativeThemeAssetPath(source?.srcFilePath, fallbackSrc);
    if (croppedFilePath === srcFilePath) srcFilePath = fallbackSrc;
    return {
      croppedFilePath,
      srcFilePath,
      brightness: Number.isFinite(Number(source?.brightness)) ? Number(source.brightness) : 70,
      cropRect: source?.cropRect ?? null,
      cropRotation: Number.isFinite(Number(source?.cropRotation)) ? Number(source.cropRotation) : 0,
      blurRadius: Number.isFinite(Number(source?.blurRadius)) ? Number(source.blurRadius) : 10
    };
  }

  function buildThemeZipBackgroundSpec(theme, ext, baseName) {
    const source = theme && theme.backgroundImageObject ? theme.backgroundImageObject : null;
    const fallbackCropped = `${baseName}.cropped.${ext}`;
    const fallbackSrc = `${baseName}.src.${ext}`;
    const croppedFilePath = normalizeRelativeThemeAssetPath(source?.croppedFilePath, fallbackCropped);
    let srcFilePath = normalizeRelativeThemeAssetPath(source?.srcFilePath, fallbackSrc);
    if (srcFilePath === croppedFilePath) srcFilePath = fallbackSrc;
    return {
      croppedFilePath,
      srcFilePath,
      brightness: Number.isFinite(Number(source?.brightness)) ? Number(source.brightness) : 70,
      cropRect: source?.cropRect ?? null,
      cropRotation: Number.isFinite(Number(source?.cropRotation)) ? Number(source.cropRotation) : 0,
      blurRadius: Number.isFinite(Number(source?.blurRadius)) ? Number(source.blurRadius) : 0
    };
  }

  function themeHasBackground(theme) {
    return !!(theme && (theme.backgroundImageObject || (typeof theme.backgroundImage === "string" && theme.backgroundImage.trim())));
  }

  async function readThemeBackgroundBlob(theme) {
    if (!themeHasBackground(theme)) return null;
    const sourceUrl = theme.backgroundImage || resolveThemeAssetUrl(theme.backgroundImageObject);
    if (!sourceUrl) return null;
    const resp = await fetch(sourceUrl);
    if (!resp.ok) throw new Error("无法读取主题背景图片数据");
    return await resp.blob();
  }

  async function buildThemeZipBlob(theme) {
    if (!window.JSZip) throw new Error("JSZip 未加载");
    const blob = await readThemeBackgroundBlob(theme);
    if (!blob) throw new Error("当前主题无可导出的背景图片");
    const ext = inferExtensionByMime(blob.type);
    const baseName = (theme.name || "theme").replace(/[\\/:*?"<>|]/g, "_");
    const spec = buildThemeZipBackgroundSpec(theme, ext, baseName);
    const exportTheme = {
      name: theme.name,
      isDark: !!theme.isDark,
      backgroundImage: {
        croppedFilePath: spec.croppedFilePath,
        srcFilePath: spec.srcFilePath,
        brightness: Number.isFinite(Number(spec.brightness)) ? Number(spec.brightness) : 70,
        cropRect: spec.cropRect ?? null,
        cropRotation: Number.isFinite(Number(spec.cropRotation)) ? Number(spec.cropRotation) : 0,
        blurRadius: Number.isFinite(Number(spec.blurRadius)) ? Number(spec.blurRadius) : 0
      },
      ...deepClone(theme.colors)
    };
    const zip = new window.JSZip();
    zip.file(`${baseName}.json`, `${prettyJson(exportTheme)}\n`);
    zip.file(exportTheme.backgroundImage.croppedFilePath, blob);
    zip.file(exportTheme.backgroundImage.srcFilePath, blob);
    return await zip.generateAsync({ type: "blob" });
  }

  async function exportThemeAsZip(theme) {
    const zipBlob = await buildThemeZipBlob(theme);
    const baseName = (theme.name || "theme").replace(/[\\/:*?"<>|]/g, "_");
    downloadBlob(`${baseName}.zip`, zipBlob);
  }

  async function decodeThemeFromZipFile(file) {
    if (!window.JSZip) throw new Error("JSZip 未加载");
    const zip = await window.JSZip.loadAsync(await file.arrayBuffer());
    const entries = Object.values(zip.files).filter((entry) => !entry.dir);
    const jsonEntry = entries.find((entry) => entry.name.toLowerCase().endsWith(".json"));
    if (!jsonEntry) throw new Error("ZIP 内未找到主题 JSON");
    const raw = await jsonEntry.async("string");
    const parsed = JSON.parse(raw);
    const themeData = normalizeImportedThemePayload(parsed);
    if (themeData.backgroundImage) return themeData;

    const bgObj = themeData.backgroundImageObject;
    if (!bgObj || typeof bgObj !== "object") return themeData;
    const fallbackExt = inferExtensionByMime(file.type || "image/png");
    const relativeBgObj = normalizeThemeBackgroundImageObject({
      ...bgObj,
      croppedFilePath: normalizeRelativeThemeAssetPath(bgObj.croppedFilePath, `theme.cropped.${fallbackExt}`),
      srcFilePath: normalizeRelativeThemeAssetPath(bgObj.srcFilePath, `theme.src.${fallbackExt}`)
    });
    if (!relativeBgObj) return themeData;
    const nameMap = new Map();
    entries.forEach((entry) => {
      const normalized = normalizeZipEntryPath(entry.name);
      nameMap.set(entry.name, entry);
      nameMap.set(normalized, entry);
      nameMap.set(entry.name.split(/[\\/]/).pop(), entry);
    });
    const croppedName = normalizeZipEntryPath(relativeBgObj.croppedFilePath || "");
    const srcName = normalizeZipEntryPath(relativeBgObj.srcFilePath || "");
    const imgEntry = nameMap.get(croppedName) || nameMap.get(srcName) ||
      nameMap.get(croppedName.split("/").pop()) || nameMap.get(srcName.split("/").pop()) || null;
    if (!imgEntry) return themeData;
    const mime = inferMimeTypeByName(imgEntry.name);
    const blob = await imgEntry.async("blob");
    const typedBlob = blob.type ? blob : new Blob([blob], { type: mime });
    const previewUrl = URL.createObjectURL(typedBlob);
    return {
      ...themeData,
      backgroundImage: previewUrl,
      backgroundImageObject: relativeBgObj
    };
  }

  async function importThemeFromQrLongImage(file) {
    if (!file) return;
    state.themeQr = { chunks: [], index: 0, transferId: "", themeSignature: "" };
    updateThemeQrUi();
    setStatus("theme-qr-meta", "正在读取主题二维码长图…", "");
    const image = await readFileAsImage(file);
    const chunkTexts = await decodeQrTextFromImage(image, (msg) => setStatus("theme-qr-meta", msg, ""));
    if (!chunkTexts.length) throw new Error("未识别到有效二维码分片，请确认长图完整清晰");
    setStatus("theme-qr-meta", "正在校验并解码主题分片…", "");
    const decoded = await decodeThemeFromQrChunks(chunkTexts);
    const ok = confirm(`确认导入二维码主题？\ntransferId=${decoded.transferId}\n分片数=${decoded.total}`);
    if (!ok) return;
    const imported = addImportedThemeEntry(decoded.themeData, "已导入二维码主题");
    setStatus("theme-qr-meta", `导入成功：${imported.name}（${decoded.total} 个分片）`, "ok");
  }

  async function importPopupFromQrLongImage(file) {
    if (!file) return;
    state.popupQr = { chunks: [], index: 0, transferId: "", popupSignature: "" };
    updatePopupQrUi();
    setStatus("popup-qr-meta", "正在读取弹出字符二维码长图…", "");
    const image = await readFileAsImage(file);
    const chunkTexts = await decodeQrTextFromImage(image, (msg) => setStatus("popup-qr-meta", msg, ""));
    if (!chunkTexts.length) throw new Error("未识别到有效二维码分片，请确认长图完整清晰");
    setStatus("popup-qr-meta", "正在校验并解码弹出字符分片…", "");
    const decoded = await decodePopupFromQrChunks(chunkTexts);
    const ok = confirm(`确认导入弹出字符映射？\ntransferId=${decoded.transferId}\n分片数=${decoded.total}\n当前映射将被覆盖。`);
    if (!ok) return;
    state.popupEntries = decoded.popupEntries;
    renderPopupEditor();
    syncPopupJsonFromState();
    state.popupQr = { chunks: [], index: 0, transferId: "", popupSignature: "" };
    updatePopupQrUi();
    setStatus("popup-editor-status", `已导入 ${Object.keys(decoded.popupEntries).length} 条映射`, "ok");
    setStatus("popup-qr-meta", `导入成功：${decoded.total} 个分片，transferId=${decoded.transferId}`, "ok");
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
    const canvas = el("layout-qr-canvas");
    const idx = el("layout-qr-index");
    if (idx) idx.textContent = `${has ? state.qr.index + 1 : 0} / ${state.qr.chunks.length}`;
    if (!canvas) return;
    // 自适应尺寸：最大为窗口宽高的80%，最小320，最大720
    const size = Math.max(320, Math.min(720, Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.8)));
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!has) return;
    const filled = makeQrCanvas(state.qr.chunks[state.qr.index], canvas.width);
    ctx.drawImage(filled, 0, 0);
  }

  function updateThemeQrUi() {
    const isStale = state.themeQr.themeSignature && state.themeQr.themeSignature !== currentThemeSignature();
    if (isStale) state.themeQr = { chunks: [], index: 0, transferId: "", themeSignature: "" };
    const has = state.themeQr.chunks.length > 0;
    const idx = el("theme-qr-index");
    if (idx) idx.textContent = `${has ? state.themeQr.index + 1 : 0} / ${state.themeQr.chunks.length}`;
    const canvas = el("theme-qr-canvas");
    if (!canvas) return;
    // 自适应尺寸：最大为窗口宽高的80%，最小320，最大720
    const size = Math.max(320, Math.min(720, Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.8)));
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!has) return;
    const filled = makeQrCanvas(state.themeQr.chunks[state.themeQr.index], canvas.width);
    ctx.drawImage(filled, 0, 0);
  }

  function updatePopupQrUi() {
    const isStale = state.popupQr.popupSignature && state.popupQr.popupSignature !== currentPopupSignature();
    if (isStale) state.popupQr = { chunks: [], index: 0, transferId: "", popupSignature: "" };
    const has = state.popupQr.chunks.length > 0;
    const idx = el("popup-qr-index");
    if (idx) idx.textContent = `${has ? state.popupQr.index + 1 : 0} / ${state.popupQr.chunks.length}`;
    const canvas = el("popup-qr-canvas");
    if (!canvas) return;
    // 自适应尺寸：最大为窗口宽高的80%，最小320，最大720
    const size = Math.max(320, Math.min(720, Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.8)));
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!has) return;
    const filled = makeQrCanvas(state.popupQr.chunks[state.popupQr.index], canvas.width);
    ctx.drawImage(filled, 0, 0);
  }

  function openThemeQrPreviewDialog() {
    const dialog = el("theme-qr-dialog");
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }

  function openPopupQrPreviewDialog() {
    const dialog = el("popup-qr-dialog");
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }

  function openLayoutQrPreviewDialog() {
    const dialog = el("layout-qr-dialog");
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }

  function setupQrActions() {
    el("layout-share-current").addEventListener("click", async () => {
      try {
        const bundle = await generateLayoutQrBundle();
        state.qr = { chunks: bundle.chunks, index: 0, transferId: bundle.transferId, layoutSignature: currentLayoutSignature() };
        setStatus("layout-qr-meta", `布局二维码：${bundle.total} 个分片，transferId=${bundle.transferId}`, "ok");
        updateQrUi();
        openLayoutQrPreviewDialog();
      } catch (e) {
        setStatus("layout-qr-meta", `布局分享失败：${e.message}`, "err");
      }
    });
    el("layout-download-qr-preview").addEventListener("click", async () => {
      if (!state.qr.chunks.length) {
        setStatus("layout-qr-meta", "请先分享布局生成二维码", "err");
        return;
      }
      try {
        const bundle = {
          chunks: state.qr.chunks.slice(),
          total: state.qr.chunks.length,
          transferId: state.qr.transferId,
          profile: el("layout-profile")?.value?.trim() || null
        };
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
  }

  function setupThemeQrActions() {
    el("theme-share-current").addEventListener("click", async () => {
      try {
        const theme = currentThemeEntry();
        if (!theme) throw new Error("未找到当前主题");
        if (themeHasBackground(theme)) {
          await exportThemeAsZip(theme);
          setStatus("theme-qr-meta", `已下载主题 ZIP：${theme.name}`, "ok");
          return;
        }
        const bundle = await generateThemeQrBundle();
        state.themeQr = {
          chunks: bundle.chunks,
          index: 0,
          transferId: bundle.transferId,
          themeSignature: currentThemeSignature()
        };
        setStatus("theme-qr-meta", `主题二维码：${bundle.total} 个分片，transferId=${bundle.transferId}`, "ok");
        updateThemeQrUi();
        openThemeQrPreviewDialog();
      } catch (e) {
        setStatus("theme-qr-meta", `主题分享失败：${e.message}`, "err");
      }
    });
    el("theme-download-qr-preview").addEventListener("click", async () => {
      if (!state.themeQr.chunks.length) {
        setStatus("theme-qr-meta", "请先生成主题二维码", "err");
        return;
      }
      try {
        const bundle = {
          chunks: state.themeQr.chunks.slice(),
          total: state.themeQr.chunks.length,
          transferId: state.themeQr.transferId
        };
        await downloadQrLongImage(bundle, null, TRANSFER_TYPE_THEME);
        setStatus("theme-qr-meta", `已下载主题二维码长图：${bundle.total} 个分片`, "ok");
      } catch (e) {
        setStatus("theme-qr-meta", `主题长图导出失败：${e.message}`, "err");
      }
    });
    el("theme-prev-qr").addEventListener("click", () => {
      if (!state.themeQr.chunks.length) return;
      state.themeQr.index = (state.themeQr.index - 1 + state.themeQr.chunks.length) % state.themeQr.chunks.length;
      updateThemeQrUi();
    });
    el("theme-next-qr").addEventListener("click", () => {
      if (!state.themeQr.chunks.length) return;
      state.themeQr.index = (state.themeQr.index + 1) % state.themeQr.chunks.length;
      updateThemeQrUi();
    });
  }

  function setupPopupQrActions() {
    el("popup-generate-qr").addEventListener("click", async () => {
      try {
        const bundle = await generatePopupQrBundle();
        state.popupQr = {
          chunks: bundle.chunks,
          index: 0,
          transferId: bundle.transferId,
          popupSignature: currentPopupSignature()
        };
        setStatus("popup-qr-meta", `弹出字符二维码：${bundle.total} 个分片，transferId=${bundle.transferId}`, "ok");
        updatePopupQrUi();
        openPopupQrPreviewDialog();
      } catch (e) {
        setStatus("popup-qr-meta", `生成失败：${e.message}`, "err");
      }
    });
    el("popup-download-qr-preview").addEventListener("click", async () => {
      if (!state.popupQr.chunks.length) {
        setStatus("popup-qr-meta", "请先生成弹出字符二维码", "err");
        return;
      }
      try {
        const bundle = {
          chunks: state.popupQr.chunks.slice(),
          total: state.popupQr.chunks.length,
          transferId: state.popupQr.transferId
        };
        await downloadQrLongImage(bundle, null, TRANSFER_TYPE_POPUP);
        setStatus("popup-qr-meta", `已下载弹出字符二维码长图：${bundle.total} 个分片`, "ok");
      } catch (e) {
        setStatus("popup-qr-meta", `长图导出失败：${e.message}`, "err");
      }
    });
    el("popup-prev-qr").addEventListener("click", () => {
      if (!state.popupQr.chunks.length) return;
      state.popupQr.index = (state.popupQr.index - 1 + state.popupQr.chunks.length) % state.popupQr.chunks.length;
      updatePopupQrUi();
    });
    el("popup-next-qr").addEventListener("click", () => {
      if (!state.popupQr.chunks.length) return;
      state.popupQr.index = (state.popupQr.index + 1) % state.popupQr.chunks.length;
      updatePopupQrUi();
    });
    el("popup-import-qr-image").addEventListener("click", () => {
      const input = el("popup-import-qr-image-file");
      if (!input) return;
      input.value = "";
      input.click();
    });
    el("popup-import-qr-image-file").addEventListener("change", async (ev) => {
      const file = ev.target && ev.target.files ? ev.target.files[0] : null;
      if (!file) return;
      if (state.popupImportRunning) {
        setStatus("popup-qr-meta", "已有导入任务在进行，请稍后重试", "err");
        return;
      }
      state.popupImportRunning = true;
      try {
        await importPopupFromQrLongImage(file);
      } catch (e) {
        setStatus("popup-qr-meta", `长图导入失败：${e.message}`, "err");
      } finally {
        state.popupImportRunning = false;
        const input = el("popup-import-qr-image-file");
        if (input) input.value = "";
      }
    });
  }

  function escapeHtml(s) {
    return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replaceAll("\"", "&quot;");
  }

  function syncThemeAppSyncUiFromState() {
    el('theme-app-border-enabled').checked = !!state.themeAppSync.borderEnabled;
    el('theme-app-border-outline').checked = !!state.themeAppSync.borderOutline;
    el('theme-app-gboard-style').checked = !!state.themeAppSync.gboardStyle;
    el('theme-app-key-hgap').value = state.themeAppSync.keyHGap;
    el('theme-app-key-vgap').value = state.themeAppSync.keyVGap;
    el('theme-app-key-radius').value = state.themeAppSync.keyRadius;
    el('theme-app-punct-pos').value = state.themeAppSync.punctPos;
    el('theme-app-border-outline').disabled = !state.themeAppSync.borderEnabled;
  }

  function syncThemeAppSyncStateFromUi() {
    state.themeAppSync.borderEnabled = !!el('theme-app-border-enabled').checked;
    state.themeAppSync.borderOutline = state.themeAppSync.borderEnabled && !!el('theme-app-border-outline').checked;
    state.themeAppSync.gboardStyle = !!el('theme-app-gboard-style').checked;
    state.themeAppSync.keyHGap = Number(el('theme-app-key-hgap').value) || 0;
    state.themeAppSync.keyVGap = Number(el('theme-app-key-vgap').value) || 0;
    state.themeAppSync.keyRadius = Number(el('theme-app-key-radius').value) || 0;
    state.themeAppSync.punctPos = el('theme-app-punct-pos').value;
    syncThemeAppSyncUiFromState();
  }

  function setupThemeAppSyncUi() {
    [
      'theme-app-border-enabled',
      'theme-app-border-outline',
      'theme-app-gboard-style',
      'theme-app-key-hgap',
      'theme-app-key-vgap',
      'theme-app-key-radius',
      'theme-app-punct-pos'
    ].forEach(id => {
      el(id).addEventListener('change', () => {
        syncThemeAppSyncStateFromUi();
        renderLayoutPreview();
        syncSurfaceColorIndicator();
      });
    });
    syncThemeAppSyncUiFromState();
  }

  async function imeApiRequest(path, options = {}) {
    if (!IME_API_BASE) throw new Error("当前页面未配置 IME API 地址");
    const url = `${IME_API_BASE}${path}`;
    const requestHeaders = {
      ...(options.body instanceof Blob ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    };
    const resp = await fetch(url, {
      cache: "no-store",
      ...options,
      headers: requestHeaders
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`${resp.status} ${resp.statusText}${text ? `: ${text}` : ""}`);
    }
    if (options.responseType === "blob") return await resp.blob();
    const contentType = String(resp.headers.get("content-type") || "").toLowerCase();
    if (contentType.includes("application/json")) return await resp.json();
    return {};
  }

  async function loadThemePackageFromIme(themeName) {
    const suffix = themeName ? `?name=${encodeURIComponent(themeName)}` : "";
    const blob = await imeApiRequest(`/api/v1/theme/package${suffix}`, {
      responseType: "blob",
      headers: { "Accept": "application/zip" }
    });
    const file = new File([blob], `${themeName || "theme"}.zip`, { type: blob.type || "application/zip" });
    return await decodeThemeFromZipFile(file);
  }

  async function enrichImeThemeDataWithPackage(themeData) {
    if (!themeData?.backgroundImageObject) return themeData;
    try {
      const packaged = await loadThemePackageFromIme(themeData.name);
      return {
        ...themeData,
        backgroundImage: packaged.backgroundImage || themeData.backgroundImage || "",
        backgroundImageObject: packaged.backgroundImageObject || themeData.backgroundImageObject
      };
    } catch (error) {
      console.warn("[web-editor] failed to load theme package", themeData.name, error);
      return themeData;
    }
  }

  function getSelectedImeLayoutProfile() {
    const selector = el("layout-ime-profile");
    if (selector && typeof selector.value === "string" && selector.value.trim()) return selector.value.trim();
    const fallback = el("layout-profile");
    return typeof fallback?.value === "string" ? fallback.value.trim() : "";
  }

  function setSelectedImeLayoutProfile(profile) {
    const value = String(profile || "").trim();
    const selector = el("layout-ime-profile");
    if (selector) {
      const exists = Array.from(selector.options || []).some((opt) => opt.value === value);
      if (!exists && value) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        selector.appendChild(option);
      }
      selector.value = value || selector.value;
    }
    const shareInput = el("layout-profile");
    if (shareInput) shareInput.value = value;
  }

  async function refreshImeLayoutProfiles(preferredProfile = "") {
    const payload = await imeApiRequest("/api/v1/layout/profiles");
    const profiles = Array.isArray(payload.profiles) ? payload.profiles.map((p) => String(p || "").trim()).filter(Boolean) : [];
    const current = String(preferredProfile || payload.currentProfile || "").trim();
    const selector = el("layout-ime-profile");
    if (!selector) return current;
    selector.innerHTML = "";
    profiles.forEach((profile) => {
      const option = document.createElement("option");
      option.value = profile;
      option.textContent = profile;
      selector.appendChild(option);
    });
    if (current) {
      setSelectedImeLayoutProfile(current);
    } else if (profiles.length > 0) {
      setSelectedImeLayoutProfile(profiles[0]);
    }
    return getSelectedImeLayoutProfile();
  }

  async function loadLayoutFromIme(profileOverride = "") {
    const profile = String(profileOverride || getSelectedImeLayoutProfile() || "").trim();
    const suffix = profile ? `?profile=${encodeURIComponent(profile)}` : "";
    const payload = await imeApiRequest(`/api/v1/layout${suffix}`);
    const raw = typeof payload.json === "string" ? payload.json : "{}";
    state.layout = normalizeLayoutObject(JSON.parse(raw));
    ensureSelection();
    setSelectedImeLayoutProfile(payload.profile || profile || "");
    syncLayoutUiFromState();
    setStatus("layout-json-status", "已从 IME 读取布局", "ok");
  }

  async function saveLayoutToIme() {
    const payload = currentLayoutQrPayload();
    const profile = getSelectedImeLayoutProfile() || payload.profile || "";
    await imeApiRequest("/api/v1/layout", {
      method: "PUT",
      body: JSON.stringify({ profile, json: payload.json })
    });
    setStatus("layout-json-status", `布局已保存到 IME（${profile || "default"}）`, "ok");
  }

  async function loadThemePrefsFromIme() {
    const payload = await imeApiRequest("/api/v1/theme/prefs");
    if (payload && typeof payload === "object") {
      state.themeAppSync.borderEnabled = typeof payload.borderEnabled === "boolean" ? payload.borderEnabled : PREVIEW_KEY_BORDER_ENABLED;
      state.themeAppSync.borderOutline = typeof payload.borderOutline === "boolean" ? payload.borderOutline : false;
      state.themeAppSync.gboardStyle = typeof payload.gboardStyle === "boolean" ? payload.gboardStyle : false;
      state.themeAppSync.keyHGap = typeof payload.keyHGap === "number" ? payload.keyHGap : 3;
      state.themeAppSync.keyVGap = typeof payload.keyVGap === "number" ? payload.keyVGap : 3;
      state.themeAppSync.keyRadius = typeof payload.keyRadius === "number" ? payload.keyRadius : 4;
      state.themeAppSync.punctPos = typeof payload.punctPos === "string" ? payload.punctPos : "bottom";
      state.themeAppSync.previewMetrics = normalizePreviewMetrics(payload);
      syncThemeAppSyncUiFromState();
      syncSurfaceColorIndicator();
      renderLayoutPreview();
    }
  }

  async function saveThemePrefsToIme() {
    await imeApiRequest("/api/v1/theme/prefs", {
      method: "PUT",
      body: JSON.stringify({
        borderEnabled: !!state.themeAppSync.borderEnabled,
        borderOutline: !!state.themeAppSync.borderOutline,
        gboardStyle: !!state.themeAppSync.gboardStyle,
        keyHGap: Number(state.themeAppSync.keyHGap) || 0,
        keyVGap: Number(state.themeAppSync.keyVGap) || 0,
        keyRadius: Number(state.themeAppSync.keyRadius) || 0,
        punctPos: state.themeAppSync.punctPos || "bottom"
      })
    });
  }
  async function loadThemeFromIme() {
    const payload = await imeApiRequest("/api/v1/theme");
    const themeList = Array.isArray(payload.themes) && payload.themes.length
      ? payload.themes
      : [payload.theme || payload];
    const builtinCatalog = createBuiltinThemeCatalog();
    const dedup = new Map();
    for (const item of themeList) {
      const normalized = normalizeImportedThemePayload(item);
      if (!normalized?.name) continue;
      if (dedup.has(normalized.name)) continue;
      const enriched = await enrichImeThemeDataWithPackage(normalized);
      dedup.set(enriched.name, enriched);
    }
    const customCatalog = Array.from(dedup.values()).map((themeData) => ({
      id: `custom-${Math.random().toString(36).slice(2, 10)}`,
      name: themeData.name,
      imeOriginalName: themeData.name,
      builtin: false,
      isDark: !!themeData.isDark,
      colors: normalizeThemeColors(themeData.colors),
      backgroundImage: typeof themeData.backgroundImage === "string" ? themeData.backgroundImage : "",
      backgroundImageObject: themeData.backgroundImageObject ? deepClone(themeData.backgroundImageObject) : null
    }));
    state.themeCatalog = [...customCatalog, ...builtinCatalog];
    const activeName = String(payload.activeThemeName || "").trim();
    if (activeName) {
      const match = state.themeCatalog.find((item) => item.name === activeName);
      if (match) state.selectedThemeId = match.id;
    }
    if (!state.themeCatalog.find((item) => item.id === state.selectedThemeId)) {
      state.selectedThemeId = state.themeCatalog[0]?.id || "";
    }
    renderThemeList();
    renderThemeEditor();
    syncThemeJsonFromState();
    syncLayoutUiFromState();
    setStatus("theme-editor-status", `已从 IME 读取 ${customCatalog.length} 个自定义主题`, "ok");
  }

  async function saveThemeToIme() {
    const current = currentThemeEntry();
    if (!current || current.builtin) {
      throw new Error("内置主题不可直接保存到 IME，请先复制为自定义主题");
    }
    const payload = {
      name: current.name,
      isDark: !!current.isDark,
      ...(current.backgroundImageObject ? { backgroundImage: deepClone(current.backgroundImageObject) } : { backgroundImage: null }),
      ...deepClone(current.colors)
    };
    const oldName = (typeof current.imeOriginalName === "string" && current.imeOriginalName !== current.name)
      ? current.imeOriginalName
      : "";
    if (themeHasBackground(current)) {
      const zipBlob = await buildThemeZipBlob({
        ...current,
        colors: deepClone(current.colors),
        backgroundImageObject: current.backgroundImageObject ? deepClone(current.backgroundImageObject) : null
      });
      await imeApiRequest(`/api/v1/theme/package?name=${encodeURIComponent(current.name)}`, {
        method: "PUT",
        body: zipBlob,
        headers: { "Content-Type": "application/zip" }
      });
    } else {
      await imeApiRequest("/api/v1/theme", {
        method: "PUT",
        body: JSON.stringify({ theme: payload })
      });
    }
    if (oldName) {
      try {
        await imeApiRequest(`/api/v1/theme?name=${encodeURIComponent(oldName)}`, { method: "DELETE" });
      } catch (_) { /* best-effort: old theme data removal may not be supported */ }
      try {
        await imeApiRequest(`/api/v1/theme/package?name=${encodeURIComponent(oldName)}`, { method: "DELETE" });
      } catch (_) { /* best-effort: old package removal may not be supported */ }
    }
    // After save, record current name as the IME original name so that
    // subsequent rename+save can detect the old name and delete it.
    current.imeOriginalName = current.name;
    setStatus("theme-editor-status", `主题已保存到 IME：${payload.name || ""}`, "ok");
    setStatus("theme-qr-meta", `主题已保存到 IME：${payload.name || ""}`, "ok");
  }

  async function loadPopupFromIme() {
    const payload = await imeApiRequest("/api/v1/popup");
    const raw = typeof payload.json === "string" ? payload.json : "{}";
    state.popupEntries = normalizePopupEntries(JSON.parse(raw));
    renderPopupEditor();
    syncPopupJsonFromState();
    syncLayoutUiFromState();
    setStatus("popup-editor-status", `已从 IME 读取 ${Object.keys(state.popupEntries).length} 条映射`, "ok");
  }

  async function savePopupToIme() {
    const jsonText = `${prettyJson(state.popupEntries)}\n`;
    await imeApiRequest("/api/v1/popup", {
      method: "PUT",
      body: JSON.stringify({ json: jsonText })
    });
    setStatus("popup-editor-status", "弹出字符映射已保存到 IME", "ok");
  }

  function setupImeBridgeActions() {
    const hasApi = !!IME_API_BASE;
    [
      "layout-ime-load", "layout-ime-save",
      "layout-ime-profile", "layout-ime-profile-refresh",
      "theme-ime-load", "theme-ime-save",
      "popup-ime-load", "popup-ime-save",
      "icon-theme-ime-load", "icon-theme-ime-save"
    ].forEach((id) => {
      const node = el(id);
      if (node) node.disabled = !hasApi;
    });
    if (!hasApi) return;
    el("layout-ime-load")?.addEventListener("click", async () => {
      try {
        await loadLayoutFromIme();
      } catch (e) {
        setStatus("layout-json-status", `读取失败：${e.message}`, "err");
      }
    });
    el("layout-ime-profile-refresh")?.addEventListener("click", async () => {
      try {
        await refreshImeLayoutProfiles(getSelectedImeLayoutProfile());
        setStatus("layout-json-status", "IME profile 列表已刷新", "ok");
      } catch (e) {
        setStatus("layout-json-status", `刷新 profile 列表失败：${e.message}`, "err");
      }
    });
    el("layout-ime-profile")?.addEventListener("change", async () => {
      const selected = getSelectedImeLayoutProfile();
      setSelectedImeLayoutProfile(selected);
      try {
        await loadLayoutFromIme(selected);
      } catch (e) {
        setStatus("layout-json-status", `切换 profile 失败：${e.message}`, "err");
      }
    });
    el("layout-ime-save")?.addEventListener("click", async () => {
      try {
        await saveLayoutToIme();
      } catch (e) {
        setStatus("layout-json-status", `保存失败：${e.message}`, "err");
      }
    });
    el("theme-ime-load")?.addEventListener("click", async () => {
      try {
        await loadThemeFromIme();
        await loadThemePrefsFromIme();
      } catch (e) {
        setStatus("theme-editor-status", `读取失败：${e.message}`, "err");
      }
    });
    el("theme-ime-save")?.addEventListener("click", async () => {
      try {
        await saveThemeToIme();
        await saveThemePrefsToIme();
      } catch (e) {
        setStatus("theme-editor-status", `保存失败：${e.message}`, "err");
        setStatus("theme-qr-meta", `保存失败：${e.message}`, "err");
      }
    });
    el("popup-ime-load")?.addEventListener("click", async () => {
      try {
        await loadPopupFromIme();
      } catch (e) {
        setStatus("popup-editor-status", `读取失败：${e.message}`, "err");
      }
    });
    el("popup-ime-save")?.addEventListener("click", async () => {
      try {
        await savePopupToIme();
      } catch (e) {
        setStatus("popup-editor-status", `保存失败：${e.message}`, "err");
      }
    });
  }

  async function autoLoadImeDataOnStartup() {
    if (!IME_API_BASE) return;
    try {
      await refreshImeLayoutProfiles();
      await loadLayoutFromIme(getSelectedImeLayoutProfile());
    } catch (e) {
      setStatus("layout-json-status", `自动读取 IME 布局失败：${e.message}`, "err");
    }
    try {
      await loadThemeFromIme();
      await loadThemePrefsFromIme();
    } catch (e) {
      setStatus("theme-editor-status", `自动读取 IME 主题失败：${e.message}`, "err");
    }
    try {
      await loadPopupFromIme();
    } catch (e) {
      setStatus("popup-editor-status", `自动读取 IME 弹出字符失败：${e.message}`, "err");
    }
    try {
      await loadIconThemeFromIme();
    } catch (e) {
      setStatus("icon-theme-editor-status", `自动读取 IME 图标主题失败：${e.message}`, "err");
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // ── Icon Theme ──
  // ══════════════════════════════════════════════════════════════════

  // Map of icon theme data URIs for file-ref previews fetched from IME
  // key: "themeName:slot", value: data URI (blob or base64)
  const iconThemePreviewCache = new Map();
  // Set of icon values that are local blob/data URIs (need upload on save)
  function isLocalIconRef(value) { return value && (value.startsWith("blob:") || value.startsWith("data:")); }
  function isFileIconRef(value) { return value && value.startsWith("file:"); }

  function currentIconThemeEntry() {
    return state.iconThemeCatalog.find((item) => item.id === state.selectedIconThemeId) || state.iconThemeCatalog[0];
  }

  function isCurrentIconThemeEditable() {
    return !!currentIconThemeEntry() && !currentIconThemeEntry().builtin;
  }

  function nextIconThemeName(baseName, excludeId) {
    const existed = new Set(state.iconThemeCatalog.filter((item) => item.id !== excludeId).map((item) => item.name));
    if (!existed.has(baseName)) return baseName;
    let i = 2;
    while (existed.has(`${baseName} ${i}`)) i++;
    return `${baseName} ${i}`;
  }

  function generateIconThemeUuid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    const seed = `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
    return `${seed.slice(0, 8)}-${seed.slice(8, 12)}-${seed.slice(12, 16)}-${seed.slice(16, 20)}-${seed.slice(20, 32)}`;
  }

  function iconThemeCatalogSignature() {
    try { return JSON.stringify(state.iconThemeCatalog); } catch (_) { return ""; }
  }

  function iconThemeHasChanges() {
    return iconThemeCatalogSignature() !== state.initialIconThemeCatalogSignature;
  }

  function updateIconThemeManageButtons(editable) {
    ["icon-theme-rename", "icon-theme-delete"].forEach((id) => {
      const btn = el(id); if (btn) btn.hidden = !editable;
    });
  }

  function isInlineSvgValue(value) {
    if (!value || typeof value !== "string") return false;
    const clean = value.trim()
      .replace(/^\uFEFF/, "")
      .replace(/^<\?xml[^>]*\?>\s*/i, "")
      .replace(/^<!DOCTYPE[^>]*>\s*/i, "")
      .replace(/^<!--[\s\S]*?-->\s*/, "");
    return clean.toLowerCase().startsWith("<svg");
  }

  function isInlineXmlDrawableValue(value) {
    if (!value || typeof value !== "string") return false;
    if (isInlineSvgValue(value)) return false;
    if (isFileIconRef(value)) return false;
    if (isLocalIconRef(value)) return false;
    return value.trimStart().startsWith("<");
  }

  function vectorDrawableToSvg(xml) {
    // Convert Android VectorDrawable XML to inline SVG for browser preview.
    // Android fillColor/strokeColor values (#ffffff) are tint masks, not display colors,
    // so we map them to currentColor (or "none" for #00000000).
    if (!xml || typeof xml !== "string") return "";
    const clean = xml.trim()
      .replace(/^\uFEFF/, "")
      .replace(/^<\?xml[^>]*\?>\s*/i, "")
      .replace(/^<!--[\s\S]*?-->\s*/, "");
    if (!clean.toLowerCase().includes("<vector")) return "";

    const vpMatch = clean.match(/viewportWidth\s*=\s*"(\d+)"/i);
    const vpHeight = clean.match(/viewportHeight\s*=\s*"(\d+)"/i);
    const vw = vpMatch ? vpMatch[1] : "24";
    const vh = vpHeight ? vpHeight[1] : "24";

    // Recursive converter: parse <vector>/<group>/<path> structure
    function parseTag(input, pos) {
      let out = "";
      while (pos < input.length) {
        const tagStart = input.indexOf("<", pos);
        if (tagStart === -1) break;

        // Check for closing tag
        if (input[tagStart + 1] === "/") {
          const tagEnd = input.indexOf(">", tagStart);
          if (tagEnd === -1) break;
          const tagName = input.slice(tagStart + 2, tagEnd).trim().toLowerCase();
          if (tagName === "vector" || tagName === "group") {
            pos = tagEnd + 1;
            return { svg: out, nextPos: pos };
          }
          pos = tagEnd + 1;
          continue;
        }

        const tagEnd = input.indexOf(">", tagStart);
        if (tagEnd === -1) break;

        const tagContent = input.slice(tagStart, tagEnd + 1);
        const isSelfClosing = tagContent.endsWith("/>");
        const tagMatch = tagContent.match(/^<(\w+)\b([^>]*)\/?>$/is);
        if (!tagMatch) { pos = tagEnd + 1; continue; }

        const tagName = tagMatch[1].toLowerCase();
        const attrsStr = tagMatch[2];

        if (tagName === "path") {
          const dMatch = attrsStr.match(/android:pathData\s*=\s*"([^"]*)"/i);
          if (!dMatch) { pos = tagEnd + 1; continue; }

          const fillMatch = attrsStr.match(/android:fillColor\s*=\s*"([^"]*)"/i);
          const fillTypeMatch = attrsStr.match(/android:fillType\s*=\s*"([^"]*)"/i);
          const strokeMatch = attrsStr.match(/android:strokeColor\s*=\s*"([^"]*)"/i);
          const strokeWidthMatch = attrsStr.match(/android:strokeWidth\s*=\s*"([^"]*)"/i);
          const strokeLineCapMatch = attrsStr.match(/android:strokeLineCap\s*=\s*"([^"]*)"/i);

          let pathAttrs = ` d="${dMatch[1]}"`;

          if (fillMatch) {
            pathAttrs += fillMatch[1] === "#00000000" ? ` fill="none"` : ` fill="currentColor"`;
          } else {
            pathAttrs += ` fill="currentColor"`;
          }

          if (fillTypeMatch && fillTypeMatch[1].toLowerCase() === "evenodd") {
            pathAttrs += ` fill-rule="evenodd"`;
          }

          if (strokeMatch) {
            if (strokeMatch[1] !== "#00000000") {
              pathAttrs += ` stroke="currentColor"`;
            }
          }
          if (strokeWidthMatch) pathAttrs += ` stroke-width="${strokeWidthMatch[1]}"`;
          if (strokeLineCapMatch) pathAttrs += ` stroke-linecap="${strokeLineCapMatch[1]}"`;

          out += `<path${pathAttrs}/>`;
          pos = tagEnd + 1;
        } else if (tagName === "group") {
          // Parse group attributes for transform.
          // SVG applies transforms right-to-left, Android left-to-right.
          // So we reverse: Android "scaleX=0.5 translateX=12" → SVG translate(12,0) scale(0.5,0.5)
          let transformParts = [];
          const scaleX = attrsStr.match(/android:scaleX\s*=\s*"([^"]*)"/i);
          const scaleY = attrsStr.match(/android:scaleY\s*=\s*"([^"]*)"/i);
          const tx = attrsStr.match(/android:translateX\s*=\s*"([^"]*)"/i);
          const ty = attrsStr.match(/android:translateY\s*=\s*"([^"]*)"/i);
          // Push in reverse order: translate first (SVG left), scale last (SVG right)
          if (tx || ty) {
            transformParts.push(`translate(${tx ? tx[1] : "0"},${ty ? ty[1] : "0"})`);
          }
          if (scaleX || scaleY) {
            transformParts.push(`scale(${scaleX ? scaleX[1] : "1"},${scaleY ? scaleY[1] : "1"})`);
          }
          const transformStr = transformParts.length > 0 ? ` transform="${transformParts.join(" ")}"` : "";

          if (isSelfClosing) {
            pos = tagEnd + 1;
            continue;
          }

          const result = parseTag(input, tagEnd + 1);
          const children = result.svg;
          pos = result.nextPos;
          if (children.trim()) {
            out += `<g${transformStr}>${children}</g>`;
          }
        } else if (tagName === "vector") {
          // top-level <vector> — recurse into children
          if (isSelfClosing) { pos = tagEnd + 1; continue; }
          const result = parseTag(input, tagEnd + 1);
          out += result.svg;
          pos = result.nextPos;
        } else {
          pos = tagEnd + 1;
        }
      }
      return { svg: out, nextPos: pos };
    }

    const result = parseTag(clean, 0);
    if (!result.svg.trim()) return "";
    return `<svg viewBox="0 0 ${vw} ${vh}" width="20" height="20" xmlns="http://www.w3.org/2000/svg">${result.svg}</svg>`;
  }

  async function fetchIconFilePreview(themeName, slot) {
    if (!IME_API_BASE) return null;
    const cacheKey = `${themeName}:${slot}`;
    const cached = iconThemePreviewCache.get(cacheKey);
    if (cached) return cached;
    try {
      const resp = await fetch(`${IME_API_BASE}/api/v1/icon-theme/preview?theme=${encodeURIComponent(themeName)}&slot=${encodeURIComponent(slot)}`);
      if (!resp.ok) return null;
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      iconThemePreviewCache.set(cacheKey, url);
      return url;
    } catch (_) { return null; }
  }

  function resolveIconSlotDisplayUrl(themeName, slot, value) {
    if (!value) return null;
    if (isLocalIconRef(value)) return value;
    if (isFileIconRef(value)) {
      const cacheKey = `${themeName}:${slot}`;
      const cached = iconThemePreviewCache.get(cacheKey);
      if (cached) return cached;
      // trigger async fetch and return null; caller should handle async update
      fetchIconFilePreview(themeName, slot).then((url) => {
        if (url) refreshSlotPreviewInDom(slot, url);
      });
      return null;
    }
    if (isInlineSvgValue(value)) return "svg:" + value;
    return null;
  }

  function refreshSlotPreviewInDom(slot, url) {
    const rows = document.querySelectorAll(`.icon-slot-row[data-slot="${CSS.escape(slot)}"]`);
    rows.forEach((row) => {
      const preview = row.querySelector(".icon-slot-custom-preview");
      if (preview) {
        preview.innerHTML = `<img src="${escapeAttr(url)}" alt="" style="max-width:100%;max-height:100%;object-fit:contain;">`;
      }
    });
  }

  function renderIconThemeSlotPreviewHtml(slot, value, themeName) {
    if (!value) return `<span style="color:var(--sub);font-size:11px;">--</span>`;
    if (isLocalIconRef(value)) {
      return `<img src="${escapeAttr(value)}" alt="" style="max-width:100%;max-height:100%;object-fit:contain;" data-slot-preview="${escapeAttr(slot)}">`;
    }
    if (isFileIconRef(value)) {
      const cacheKey = `${themeName}:${slot}`;
      const cached = iconThemePreviewCache.get(cacheKey);
      if (cached) {
        return `<img src="${escapeAttr(cached)}" alt="" style="max-width:100%;max-height:100%;object-fit:contain;">`;
      }
      // trigger async fetch
      if (IME_API_BASE) {
        fetchIconFilePreview(themeName, slot).then((url) => {
          if (url) refreshSlotPreviewInDom(slot, url);
        });
      }
      return `<span style="font-size:10px;color:var(--ok);" data-slot="${escapeAttr(slot)}" class="icon-file-placeholder">PNG</span>`;
    }
    if (isInlineSvgValue(value)) {
      return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;" title="SVG icon">${sanitizeSvgForPreview(value)}</div>`;
    }
    if (isInlineXmlDrawableValue(value)) {
      const svg = vectorDrawableToSvg(value);
      if (svg) return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;" title="Vector drawable">${svg}</div>`;
      return `<span style="font-size:10px;color:var(--primary);">XML</span>`;
    }
    return `<span style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(value.substring(0, 4))}</span>`;
  }

  function sanitizeSvgForPreview(svg) {
    const clean = svg.trim()
      .replace(/^\uFEFF/, "")
      .replace(/^<\?xml[^>]*\?>\s*/i, "")
      .replace(/^<!DOCTYPE[^>]*>\s*/i, "")
      .replace(/^<!--[\s\S]*?-->\s*/, "");
    // Strip script elements and event handlers; SVG can be inserted directly into innerHTML
    return clean
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<script\b[^>]*\/>/gi, "")
      .replace(/\bon\w+\s*=\s*"[^"]*"/gi, "")
      .replace(/\bon\w+\s*=\s*'[^']*'/gi, "");
  }

  function buildIconThemeThumbnailHtml(icons) {
    const svgSlots = iconThemeSlotsAll.filter((slot) => isInlineSvgValue(icons[slot]));
    const pngSlots = iconThemeSlotsAll.filter((slot) => isFileIconRef(icons[slot]) || isLocalIconRef(icons[slot]));
    const chosen = [...svgSlots, ...pngSlots].slice(0, 4);
    if (!chosen.length) return `<span style="color:var(--sub);font-size:11px;">无图标</span>`;
    return chosen.map((slot) => {
      const v = icons[slot];
      if (isInlineSvgValue(v)) return `<div class="icon-theme-card-preview-cell" title="${escapeAttr(slot)}">${sanitizeSvgForPreview(v)}</div>`;
      if (isFileIconRef(v) || isLocalIconRef(v)) return `<div class="icon-theme-card-preview-cell" title="${escapeAttr(slot)}"><span style="color:var(--ok);font-size:11px;">PNG</span></div>`;
      return `<div class="icon-theme-card-preview-cell" title="${escapeAttr(slot)}"><span style="color:var(--primary);font-size:11px;">✦</span></div>`;
    }).join("");
  }

  function renderIconThemeList() {
    const root = el("icon-theme-list");
    if (!root) return;
    root.innerHTML = state.iconThemeCatalog.map((theme) => {
      const customCount = Object.keys(theme.icons || {}).filter((k) => (theme.icons[k] || "").trim()).length;
      const isBuiltin = !!theme.builtin;
      const isActive = theme.id === state.selectedIconThemeId;
      return `<button type="button" class="icon-theme-card ${isActive ? "active" : ""}" data-icon-theme-id="${escapeAttr(theme.id)}">
        <div class="icon-theme-card-preview">${buildIconThemeThumbnailHtml(theme.icons || {})}</div>
        <div class="icon-theme-card-name">${escapeHtml(theme.name)}</div>
        <div class="icon-theme-card-count">${customCount} 个自定义图标${isBuiltin ? " · 内置" : ""}</div>
      </button>`;
    }).join("");
    root.querySelectorAll(".icon-theme-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.iconThemeId;
        if (!id) return;
        state.selectedIconThemeId = id;
        renderIconThemeEditor();
        syncIconThemeJsonFromState();
      });
    });
    updateIconThemeManageButtons(isCurrentIconThemeEditable());
  }

  function renderIconThemeSlots() {
    const root = el("icon-theme-slots");
    if (!root) return;
    const theme = currentIconThemeEntry();
    if (!theme) return;
    const icons = theme.icons || {};
    const sections = [
      { title: "键盘按键 (仅支持 SVG)", slots: iconThemeKeySlots },
      { title: "工具栏按钮 (支持文本/Emoji/SVG/PNG)", slots: iconThemeToolbarSlots },
      { title: "系统按钮 (支持文本/Emoji/SVG/PNG)", slots: iconThemeSystemSlots }
    ];
    const editable = isCurrentIconThemeEditable();
    let html = "";
    sections.forEach((section) => {
      const customizedCount = section.slots.filter((slot) => icons[slot] && icons[slot].trim()).length;
      html += `<div class="icon-slot-section-header">${escapeHtml(section.title)} — ${customizedCount} 个已自定义</div>`;
      section.slots.forEach((slot) => {
        const value = icons[slot] || "";
        const hasValue = !!value.trim();
        html += `<div class="icon-slot-row" data-slot="${escapeAttr(slot)}">
          <div class="icon-slot-builtin-icon">${getDefaultSlotPreviewHtml(slot)}</div>
          <div class="icon-slot-name">${escapeHtml(iconThemeSlotToDisplayName(slot))}</div>
          <div class="icon-slot-custom-preview">${renderIconThemeSlotPreviewHtml(slot, value, theme.name)}</div>
          <button type="button" class="icon-slot-edit-btn" data-slot="${escapeAttr(slot)}" ${!editable ? "disabled" : ""}>${hasValue ? "✎" : "+"}</button>
        </div>`;
      });
    });
    root.innerHTML = html;
    root.querySelectorAll(".icon-slot-edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const slot = btn.dataset.slot;
        if (slot) showIconSlotDialog(slot);
      });
    });
  }

  // Simple SVG icons matching the app's built-in Material drawables (24dp viewBox)
  const DEFAULT_ICON_SVGS = {
    "keys.capslock.none": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" fill-rule="evenodd" d="M12 2L2 11.8c-1.107 1.107-0.516 2.885 1 2.885h3v5.815c0 0.748 0.752 1.5 1.5 1.5h9c0.749 0 1.5-0.752 1.5-1.5V14.685h3c1 0 2.1-1.785 1-2.885L12 2zm0 2.8L20 12.685h-4v7.315H8V12.685H4L12 4.8z"/></svg>`,
    "keys.capslock.once": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2L2 11.8c-1.107 1.107-0.516 2.885 1 2.885h3v5.815c0 0.748 0.752 1.5 1.5 1.5h9c0.749 0 1.5-0.752 1.5-1.5V14.685h3c1 0 2.1-1.785 1-2.885L12 2z"/></svg>`,
    "keys.capslock.lock": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 0L2 9.8c-1.107 1.107-0.516 2.885 1 2.885h3v5.815C6 19.248 6.752 20 7.5 20h9c0.749 0 1.5-0.752 1.5-1.5V12.685h3c1 0 2.1-1.785 1-2.885L12 0z"/><rect x="6.6" y="22" width="10.8" height="2" rx="0.4" fill="currentColor"/></svg>`,
    "keys.backspace": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z"/></svg>`,
    "keys.return.default": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19 7v4H5.83l3.58-3.59L8 6l-6 6 6 6 1.41-1.41L5.83 13H21V7h-2z"/></svg>`,
    "keys.return.go": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/></svg>`,
    "keys.return.search": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`,
    "keys.return.send": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2 .01 7z"/></svg>`,
    "keys.return.next": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M11.59 7.41L15.17 11H1v2h14.17l-3.59 3.59L13 18l6-6-6-6-1.41 1.41zM20 6v12h2V6h-2z"/></svg>`,
    "keys.return.previous": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M11.41 16.59L7.83 13H22V11H7.83l3.59-3.59L10 6l-6 6 6 6zM3 18V6H1v12z"/></svg>`,
    "keys.return.done": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`,
    "keys.language": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 00-1.38-3.56A8.03 8.03 0 0118.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 015.08 16zm2.95-8H5.08a7.99 7.99 0 014.33-3.56A15.65 15.65 0 008.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 01-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg>`,
    "keys.quickphrase": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z"/></svg>`,
    "keys.space": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M18 9v4H6V9H4v6h16V9h-2z"/></svg>`,
    "keys.numpad": `<svg viewBox="0 0 24 24" width="20" height="20"><g fill="currentColor"><rect x="4" y="2" width="4" height="4" rx="1"/><rect x="10" y="2" width="4" height="4" rx="1"/><rect x="16" y="2" width="4" height="4" rx="1"/><rect x="4" y="8" width="4" height="4" rx="1"/><rect x="10" y="8" width="4" height="4" rx="1"/><rect x="16" y="8" width="4" height="4" rx="1"/><rect x="4" y="14" width="4" height="4" rx="1"/><rect x="10" y="14" width="4" height="4" rx="1"/><rect x="16" y="14" width="4" height="4" rx="1"/><rect x="4" y="20" width="4" height="4" rx="1"/><rect x="10" y="20" width="10" height="4" rx="1"/></g></svg>`,
    "keys.emoji": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>`,
    "keys.symbols": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M10 17c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zm-3-2c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm5-0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-3-3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm5-0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-3-3.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM9.5 11c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5zM14.5 8c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5z"/></svg>`,
    "keys.unicode": `<svg viewBox="0 0 24 24" width="20" height="20"><text x="4" y="18" font-size="16" font-weight="bold" fill="currentColor">U</text></svg>`,
    "keys.pageup": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"/></svg>`,
    "keys.pagedown": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>`,
    "toolbar.undo": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>`,
    "toolbar.redo": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>`,
    "toolbar.cursor_move": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="m17,16 l4,-4L17,8Z M7,8 l-4,4 4,4z M8,3v2h3.0137V19H8v2h3.0137,2H16V19H13.0137V5H16V3h-2.9863,-2z"/></svg>`,
    "toolbar.floating_toggle": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M20,3L4,3c-1.1,0 -1.99,0.9 -1.99,2L2,15c0,1.1 0.9,2 2,2h16c1.1,0 2,-0.9 2,-2L22,5c0,-1.1 -0.9,-2 -2,-2zM11,6h2v2h-2L11,6zM11,9h2v2h-2v-2zM8,8h2v2L8,10L8,8zM8,11h2v2L8,13v-2zM7,13L5,13v-2h2v2zM7,10L5,10L5,8h2v2zM16,17L8,17v-2h8v2zM16,11h-2v-2h2v2zM16,8h-2L14,6h2v2zM19,11h-2v-2h2v2zM19,8h-2L17,6h2v2z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M4,20 L20,20"/></svg>`,
    "toolbar.clipboard": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`,
    "toolbar.more": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>`,
    "toolbar.language_switch": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 00-1.38-3.56A8.03 8.03 0 0118.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 015.08 16zm2.95-8H5.08a7.99 7.99 0 014.33-3.56A15.65 15.65 0 008.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2z"/></svg>`,
    "toolbar.theme": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 3.31-2.69 6-6 6h-1.77c-.28 0-.5.22-.5.5 0 .12.05.23.13.33.41.47.64 1.06.64 1.67A2.5 2.5 0 0112 22zm0-18c-4.41 0-8 3.59-8 8s3.59 8 8 8c.28 0 .5-.22.5-.5a.54.54 0 00-.14-.35c-.41-.46-.63-1.05-.63-1.65a2.5 2.5 0 012.5-2.5H16c2.21 0 4-1.79 4-4 0-3.86-3.59-7-8-7z"/><circle cx="6.5" cy="11.5" r="1.5" fill="currentColor"/><circle cx="9.5" cy="7.5" r="1.5" fill="currentColor"/><circle cx="14.5" cy="7.5" r="1.5" fill="currentColor"/><circle cx="17.5" cy="11.5" r="1.5" fill="currentColor"/></svg>`,
    "toolbar.icon_theme": `<svg viewBox="0 0 24 24" width="20" height="20"><g transform="translate(0,0) scale(0.5)"><path fill="currentColor" d="M20,5L4,5c-1.1,0 -1.99,0.9 -1.99,2L2,17c0,1.1 0.9,2 2,2h16c1.1,0 2,-0.9 2,-2L22,7c0,-1.1 -0.9,-2 -2,-2zM11,8h2v2h-2L11,8zM11,11h2v2h-2v-2zM8,8h2v2L8,10L8,8zM8,11h2v2L8,13v-2zM7,13L5,13v-2h2v2zM7,10L5,10L5,8h2v2zM16,17L8,17v-2h8v2zM16,13h-2v-2h2v2zM16,10h-2L14,8h2v2zM19,13h-2v-2h2v2zM19,10h-2L17,8h2v2z"/></g><g transform="translate(12,0) scale(0.5)"><path fill="currentColor" d="M12,2C6.49,2 2,6.49 2,12s4.49,10 10,10c1.38,0 2.5,-1.12 2.5,-2.5c0,-0.61 -0.23,-1.2 -0.64,-1.67c-0.08,-0.1 -0.13,-0.21 -0.13,-0.33c0,-0.28 0.22,-0.5 0.5,-0.5H16c3.31,0 6,-2.69 6,-6C22,6.04 17.51,2 12,2zM17.5,13c-0.83,0 -1.5,-0.67 -1.5,-1.5c0,-0.83 0.67,-1.5 1.5,-1.5s1.5,0.67 1.5,1.5C19,12.33 18.33,13 17.5,13zM14.5,9C13.67,9 13,8.33 13,7.5C13,6.67 13.67,6 14.5,6S16,6.67 16,7.5C16,8.33 15.33,9 14.5,9zM5,11.5C5,10.67 5.67,10 6.5,10S8,10.67 8,11.5C8,12.33 7.33,13 6.5,13S5,12.33 5,11.5zM11,7.5C11,8.33 10.33,9 9.5,9S8,8.33 8,7.5C8,6.67 8.67,6 9.5,6S11,6.67 11,7.5z"/></g><g transform="translate(0,12) scale(0.5)"><path fill="currentColor" d="M12,1C10.7,1 9.5997,1.84 9.1797,3L5,3C3.9,3 3,3.9 3,5L3,20C3,21.1 3.9,22 5,22L19,22C20.1,22 21,21.1 21,20L21,5C21,3.9 20.1,3 19,3L14.8203,3C14.4003,1.84 13.3,1 12,1zM12,3A0.75,0.75 0,0 1,12.75 3.75A0.75,0.75 0,0 1,12 4.5A0.75,0.75 0,0 1,11.25 3.75A0.75,0.75 0,0 1,12 3zM5,5L7,5L7,7L17,7L17,5L19,5L19,20L5,20L5,5zM7,8.5L7,10.5L17,10.5L17,8.5L7,8.5zM7,12.5L7,14.5L17,14.5L17,12.5L7,12.5zM7,16.5L7,18.5L14,18.5L14,16.5L7,16.5z"/></g><g transform="translate(12,12) scale(0.5)"><path fill="currentColor" d="M12,15c1.66,0 2.99,-1.34 2.99,-3L15,6c0,-1.66 -1.34,-3 -3,-3S9,4.34 9,6v6c0,1.66 1.34,3 3,3zM17.3,12c0,3 -2.54,5.1 -5.3,5.1S6.7,15 6.7,12L5,12c0,3.42 2.72,6.23 6,6.72L11,22h2v-3.28c3.28,-0.48 6,-3.3 6,-6.72h-1.7z"/></g></svg>`,
    "toolbar.input_method_options": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>`,
    "toolbar.reload_config": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>`,
    "toolbar.virtual_keyboard": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M20 5H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 12H4V7h16v10zM9 8H7v2h2V8zm4 0h-2v2h2V8zm4 0h-2v2h2V8zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>`,
    "toolbar.one_handed_keyboard": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M11.59 7.41L15.17 11H1v2h14.17l-3.59 3.59L13 18l6-6-6-6-1.41 1.41zM20 6v12h2V6h-2z"/></svg>`,
    "toolbar.browse_user_data": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V6h5.17l2 2H20v10z"/></svg>`,
    "toolbar.settings_global": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/></svg>`,
    "toolbar.settings_ime": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 00-1.38-3.56A8.03 8.03 0 0118.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 015.08 16z"/></svg>`,
    "toolbar.edit_layout": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M20 5H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 12H4V7h16v10zM7 8H5v3h2V8zm3 0H8v3h2V8zm3 5h-2v3h2v-3zm3 0h-2v3h2v-3zm3 0h-2v3h2v-3z"/></svg>`,
    "toolbar.edit_fontset": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M9.93 13.5h4.14L12 7.98 9.93 13.5zM20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-4.05 16.5l-1.14-3H9.17l-1.12 3H5.96l5.11-13h1.86l5.11 13h-2.09z"/></svg>`,
    "system.toolbar_toggle": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>`,
    "system.hide_keyboard": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>`,
    "system.voice_input": `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>`
  };

  function getDefaultSlotPreviewHtml(slot) {
    return DEFAULT_ICON_SVGS[slot] || `<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
  }

  function renderIconThemeEditor() {
    const editable = isCurrentIconThemeEditable();
    setIconThemeJsonEditable(editable);
    renderIconThemeList();
    renderIconThemeSlots();
    syncIconThemeJsonHeight();
    setStatus("icon-theme-editor-status", editable ? "" : "内置主题不可编辑，请先新建或导入主题", "");
  }

  function serializeCurrentIconTheme() {
    const theme = currentIconThemeEntry();
    return {
      name: theme.name, author: theme.author || "",
      version: theme.version || 1, thumbnailSvg: theme.thumbnailSvg || null,
      icons: deepClone(theme.icons || {})
    };
  }

  function syncIconThemeJsonFromState() {
    const text = `${prettyJson(serializeCurrentIconTheme())}\n`;
    const textarea = el("icon-theme-json");
    if (textarea) textarea.value = text;
    setStatus("icon-theme-json-status", "JSON 已同步", "ok");
  }

  function setIconThemeJsonEditable(editable) {
    const textarea = el("icon-theme-json");
    if (textarea) textarea.readOnly = !editable;
  }

  function syncIconThemeJsonHeight() {}

  let iconSlotDialogState = { slot: "", draftValue: "" };

  function showIconSlotDialog(slot) {
    const theme = currentIconThemeEntry();
    if (!theme || theme.builtin) return;
    const currentValue = (theme.icons && theme.icons[slot]) || "";
    iconSlotDialogState = { slot, draftValue: currentValue };
    const dialog = el("icon-slot-dialog");
    const title = el("icon-slot-dialog-title");
    if (title) title.textContent = `编辑图标 — ${iconThemeSlotToDisplayName(slot)}`;

    const builtinPreview = el("icon-slot-builtin-preview");
    if (builtinPreview)       builtinPreview.innerHTML = `<span style="font-size:28px;display:flex;align-items:center;justify-content:center;">${getDefaultSlotPreviewHtml(slot)}</span>`;

    const customPreview = el("icon-slot-custom-preview");
    if (customPreview) {
      const url = resolveIconSlotDisplayUrl(theme.name, slot, currentValue);
      if (!currentValue) {
        customPreview.innerHTML = `<span style="color:var(--sub);font-size:11px;">空</span>`;
      } else if (url && !url.startsWith("svg:")) {
        customPreview.innerHTML = `<img src="${escapeAttr(url)}" alt="" style="max-width:100%;max-height:100%;object-fit:contain;">`;
      } else if (url && url.startsWith("svg:")) {
        customPreview.innerHTML = sanitizeSvgForPreview(url.slice(4));
      } else {
        customPreview.innerHTML = renderIconThemeSlotPreviewHtml(slot, currentValue, theme.name);
      }
    }

    const supportsText = iconThemeSlotSupportsText(slot);
    const emojiRow = el("icon-slot-emoji-row");
    if (emojiRow) emojiRow.hidden = !supportsText;
    const emojiInput = el("icon-slot-emoji");
    if (emojiInput) {
      const isXml = isInlineSvgValue(currentValue) || isInlineXmlDrawableValue(currentValue);
      emojiInput.value = supportsText && !isXml && !isFileIconRef(currentValue) && !isLocalIconRef(currentValue) ? currentValue : "";
    }
    const svgRow = el("icon-slot-pasted-svg");
    if (svgRow) svgRow.hidden = false;
    const svgTextarea = el("icon-slot-svg-textarea");
    if (svgTextarea) svgTextarea.value = isInlineSvgValue(currentValue) || isInlineXmlDrawableValue(currentValue) ? currentValue : "";
    const fileInput = el("icon-slot-file-input");
    if (fileInput) fileInput.value = "";
    setStatus("icon-slot-status", "", "");
    if (!dialog.open) dialog.showModal();
  }

  function applyIconSlotChange(value) {
    const theme = currentIconThemeEntry();
    if (!theme || theme.builtin) return;
    const slot = iconSlotDialogState.slot;
    if (!slot) return;
    if (!theme.icons) theme.icons = {};
    if (value == null || value.trim() === "") {
      delete theme.icons[slot];
    } else {
      theme.icons[slot] = value.trim();
    }
    iconSlotDialogState.draftValue = value || "";
    renderIconThemeSlots();
    renderIconThemeList();
    syncIconThemeJsonFromState();
    el("icon-slot-dialog").close();
    setStatus("icon-theme-editor-status", `已更新图标：${iconThemeSlotToDisplayName(slot)}`, "ok");
  }

  function handleIconSlotFileSelected(file) {
    if (!file) return;
    const slot = iconSlotDialogState.slot;
    const fileName = file.name.toLowerCase();
    const isSvg = fileName.endsWith(".svg") || file.type === "image/svg+xml";
    const isImage = file.type.startsWith("image/") && !isSvg;

    if (slot.startsWith("keys.")) {
      // Keyboard keys only support SVG
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result;
        if (typeof text === "string" && text.trim().toLowerCase().includes("<svg")) {
          applyIconSlotChange(text.trim());
        } else if (typeof text === "string" && text.trim().toLowerCase().includes("<vector")) {
          applyIconSlotChange(text.trim());
        } else {
          setStatus("icon-slot-status", "键盘按键仅支持 SVG 格式", "err");
        }
      };
      reader.onerror = () => setStatus("icon-slot-status", "文件读取失败", "err");
      reader.readAsText(file);
    } else {
      if (isImage) {
        // PNG/JPEG/WebP → store as data URI
        const reader = new FileReader();
        reader.onload = () => applyIconSlotChange(reader.result);
        reader.onerror = () => setStatus("icon-slot-status", "文件读取失败", "err");
        reader.readAsDataURL(file);
      } else {
        // SVG/XML → store as text
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result;
          if (typeof text === "string" && (text.includes("<svg") || text.includes("<vector"))) {
            applyIconSlotChange(text.trim());
          } else {
            setStatus("icon-slot-status", "不支持的文件格式，仅支持 SVG/XML/PNG", "err");
          }
        };
        reader.onerror = () => setStatus("icon-slot-status", "文件读取失败", "err");
        reader.readAsText(file);
      }
    }
  }

  // ── IME Bridge ──

  async function loadIconThemeFromIme() {
    if (!IME_API_BASE) return;
    const data = await imeApiRequest("/api/v1/icon-theme");
    if (data && Array.isArray(data.themes)) {
      // Clear preview cache for previous themes
      iconThemePreviewCache.clear();
      const themes = data.themes.map((raw) => ({
        id: raw.builtin ? "builtin-default" : `custom-${generateIconThemeUuid()}`,
        name: raw.name || "Untitled",
        author: raw.author || "",
        version: raw.version || 1,
        builtin: !!raw.builtin,
        thumbnailSvg: raw.thumbnailSvg || null,
        icons: raw.icons || {}
      }));
      if (themes.length) {
        state.iconThemeCatalog = themes;
        const activeName = data.activeThemeName || themes[0]?.name || "Default";
        const activeTheme = themes.find((t) => t.name === activeName) || themes[0];
        state.selectedIconThemeId = activeTheme?.id || "builtin-default";
        renderIconThemeEditor();
        syncIconThemeJsonFromState();
        // Prefetch file previews for current theme
        const theme = currentIconThemeEntry();
        if (theme && theme.icons) {
          for (const [slot, value] of Object.entries(theme.icons)) {
            if (isFileIconRef(value)) fetchIconFilePreview(theme.name, slot);
          }
        }
        setStatus("icon-theme-editor-status", `已从 IME 读取 ${themes.length} 个图标主题`, "ok");
      }
    }
  }

  async function saveIconThemeToIme() {
    if (!IME_API_BASE) return;
    const theme = currentIconThemeEntry();
    if (!theme || theme.builtin) {
      setStatus("icon-theme-editor-status", "请先选择或新建可编辑的主题", "err");
      return;
    }
    // Collect local data URIs that need uploading as files
    const icons = theme.icons || {};
    const uploads = {};
    const cleanIcons = {};
    for (const [slot, value] of Object.entries(icons)) {
      if (!value) continue;
      if (isLocalIconRef(value)) {
        // Keep as data URI; server will extract base64 and save as file
        cleanIcons[slot] = value;
        uploads[slot] = value;
      } else {
        cleanIcons[slot] = value;
      }
    }
    const payload = {
      name: theme.name,
      author: theme.author || "",
      version: theme.version || 1,
      thumbnailSvg: theme.thumbnailSvg || null,
      icons: cleanIcons
    };
    if (Object.keys(uploads).length > 0) {
      payload._uploads = uploads;
    }
    await imeApiRequest("/api/v1/icon-theme", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    // After successful save, reload to get updated file refs
    await loadIconThemeFromIme();
    setStatus("icon-theme-editor-status", "图标主题已保存到 IME", "ok");
  }

  // ── ZIP Export (matching app structure) ──

  async function exportIconThemeAsZip() {
    const theme = currentIconThemeEntry();
    if (!theme) throw new Error("no theme selected");
    const zip = new JSZip();
    const safeName = theme.name.replace(/[\\/:*?"<>|]/g, "_") || "theme";

    // Prepare normalized icons for export: local data URIs → base64 files in ZIP
    const exportIcons = {};
    const fileEntries = []; // { slot, fileName, dataBase64, mime }

    for (const [slot, value] of Object.entries(theme.icons || {})) {
      if (!value) continue;
      if (isLocalIconRef(value)) {
        const match = value.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          const mime = match[1];
          const ext = mime.includes("png") ? "png" : mime.includes("jpeg") ? "jpg" :
            mime.includes("svg") ? "svg" : mime.includes("webp") ? "webp" : "png";
          const fileName = `${slot.replace(/[^a-zA-Z0-9_-]/g, "_")}.${ext}`;
          exportIcons[slot] = `file:button_icons/${safeName}/${fileName}`;
          fileEntries.push({ fileName, dataBase64: match[2], ext });
        }
      } else if (isFileIconRef(value)) {
        // Try to fetch the file from IME and re-pack it
        const blobUrl = await fetchIconFilePreview(theme.name, slot);
        if (blobUrl) {
          try {
            const resp = await fetch(blobUrl);
            const blob = await resp.blob();
            const base64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result.split(",")[1]);
              reader.readAsDataURL(blob);
            });
            const ext = blob.type.includes("png") ? "png" : blob.type.includes("jpeg") ? "jpg" :
              blob.type.includes("svg") ? "svg" : blob.type.includes("webp") ? "webp" : "png";
            const fileName = value.replace("file:", "").split("/").pop() || `${slot.replace(/[^a-zA-Z0-9_-]/g, "_")}.${ext}`;
            exportIcons[slot] = `file:button_icons/${safeName}/${fileName}`;
            fileEntries.push({ fileName, dataBase64: base64, ext });
          } catch (_) { exportIcons[slot] = value; }
        } else {
          exportIcons[slot] = value;
        }
      } else {
        exportIcons[slot] = value;
      }
    }

    const exportTheme = {
      name: theme.name,
      author: theme.author || "",
      version: theme.version || 1,
      thumbnailSvg: theme.thumbnailSvg || null,
      icons: exportIcons
    };

    // JSON entry
    zip.file(`${safeName}.json`, JSON.stringify(exportTheme, null, 2));

    // File entries under button_icons/<safeName>/
    for (const entry of fileEntries) {
      zip.file(`button_icons/${safeName}/${entry.fileName}`, entry.dataBase64, { base64: true });
    }

    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(`${safeName}.icon-theme.zip`, blob);
    setStatus("icon-theme-editor-status", `已导出 ZIP：${safeName}.icon-theme.zip`, "ok");
  }

  // ── ZIP Import (matching app structure) ──

  async function importIconThemeFromZipFile(file) {
    const zip = await JSZip.loadAsync(file);
    let jsonText = null;
    const fileDataMap = {}; // relativePath → base64

    const promises = [];
    zip.forEach((relativePath, zipEntry) => {
      if (zipEntry.dir) return;
      if (relativePath.endsWith(".json")) {
        promises.push(zipEntry.async("string").then((text) => { jsonText = text; }));
      } else {
        promises.push(zipEntry.async("base64").then((b64) => {
          fileDataMap[relativePath] = b64;
        }));
      }
    });
    await Promise.all(promises);
    if (!jsonText) throw new Error("ZIP 中未找到 JSON 文件");

    const parsed = JSON.parse(jsonText);
    const icons = {};
    if (parsed.icons && typeof parsed.icons === "object") {
      for (const [slot, value] of Object.entries(parsed.icons)) {
        if (typeof value === "string" && value.startsWith("file:")) {
          // Resolve file reference to data URI from ZIP contents
          const refPath = value.replace("file:", "");
          const refName = refPath.split("/").pop();
          let found = false;
          for (const [zipPath, b64] of Object.entries(fileDataMap)) {
            if (zipPath.endsWith(refName || "")) {
              const ext = (refName || "").split(".").pop()?.toLowerCase() || "png";
              const mime = ext === "svg" ? "image/svg+xml" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";
              icons[slot] = `data:${mime};base64,${b64}`;
              found = true;
              break;
            }
          }
          // If not found as base64, keep the file reference
          if (!found) icons[slot] = value;
        } else {
          icons[slot] = value;
        }
      }
    }

    const theme = {
      id: `custom-${generateIconThemeUuid()}`,
      name: nextIconThemeName(parsed.name || "Imported"),
      author: parsed.author || "",
      version: parsed.version || 1,
      builtin: false,
      thumbnailSvg: parsed.thumbnailSvg || null,
      icons
    };
    state.iconThemeCatalog.unshift(theme);
    state.selectedIconThemeId = theme.id;
    renderIconThemeEditor();
    syncIconThemeJsonFromState();
    return theme;
  }

  // ── QR Share (to be implemented) ──
  // The app uses schema "f5a-icon-theme-qr-v1" with transfer type "I"

  function initIconThemeTab() {
    el("icon-theme-create-new").addEventListener("click", () => {
      const id = `custom-${generateIconThemeUuid()}`;
      const name = nextIconThemeName("New Theme");
      const newTheme = { id, name, author: "", version: 1, builtin: false, thumbnailSvg: null, icons: {} };
      state.iconThemeCatalog.unshift(newTheme);
      state.selectedIconThemeId = id;
      renderIconThemeEditor();
      syncIconThemeJsonFromState();
      setStatus("icon-theme-editor-status", `已创建主题：${name}`, "ok");
    });

    el("icon-theme-rename").addEventListener("click", () => {
      const theme = currentIconThemeEntry();
      if (!theme || theme.builtin) return;
      const nextName = prompt("输入新名称", theme.name);
      if (nextName == null) return;
      const trimmed = nextName.trim();
      if (!trimmed) { setStatus("icon-theme-editor-status", "名称不能为空", "err"); return; }
      const resolved = nextIconThemeName(trimmed, theme.id);
      theme.name = resolved;
      renderIconThemeEditor();
      syncIconThemeJsonFromState();
      setStatus("icon-theme-editor-status", `已重命名：${resolved}`, "ok");
    });

    el("icon-theme-delete").addEventListener("click", () => {
      const theme = currentIconThemeEntry();
      if (!theme || theme.builtin) return;
      if (!confirm(`确认删除图标主题「${theme.name}」？`)) return;
      state.iconThemeCatalog = state.iconThemeCatalog.filter((item) => item.id !== theme.id);
      state.selectedIconThemeId = state.iconThemeCatalog[0]?.id || "builtin-default";
      renderIconThemeEditor();
      syncIconThemeJsonFromState();
      setStatus("icon-theme-editor-status", `已删除主题：${theme.name}`, "ok");
    });

    el("icon-theme-export-json").addEventListener("click", () => {
      const theme = currentIconThemeEntry();
      downloadFile(`${theme.name}.icon-theme.json`, `${prettyJson(serializeCurrentIconTheme())}\n`);
      setStatus("icon-theme-editor-status", `已导出 JSON：${theme.name}`, "ok");
    });

    el("icon-theme-import-json").addEventListener("click", () => {
      const input = el("icon-theme-import-json-file");
      if (input) { input.value = ""; input.click(); }
    });

    el("icon-theme-import-json-file").addEventListener("change", async (ev) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const theme = {
          id: `custom-${generateIconThemeUuid()}`, name: nextIconThemeName(parsed.name || "Imported"),
          author: parsed.author || "", version: parsed.version || 1, builtin: false,
          thumbnailSvg: parsed.thumbnailSvg || null, icons: parsed.icons || {}
        };
        state.iconThemeCatalog.unshift(theme);
        state.selectedIconThemeId = theme.id;
        renderIconThemeEditor(); syncIconThemeJsonFromState();
        setStatus("icon-theme-editor-status", `已导入主题：${theme.name}`, "ok");
      } catch (e) { setStatus("icon-theme-editor-status", `导入失败：${e.message}`, "err"); }
      finally { ev.target.value = ""; }
    });

    el("icon-theme-import-shared").addEventListener("click", () => {
      const input = el("icon-theme-import-file");
      if (input) { input.value = ""; input.click(); }
    });

    el("icon-theme-import-file").addEventListener("change", async (ev) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      try {
        const fileName = String(file.name || "").toLowerCase();
        const isZip = file.type === "application/zip" || fileName.endsWith(".zip");
        if (isZip) {
          await importIconThemeFromZipFile(file);
          setStatus("icon-theme-editor-status", `已导入 ZIP`, "ok");
        } else {
          const text = await file.text();
          let parsed;
          try { parsed = JSON.parse(text); } catch (_) { throw new Error("不是有效的 JSON 或 ZIP 文件"); }
          const theme = {
            id: `custom-${generateIconThemeUuid()}`, name: nextIconThemeName(parsed.name || "Imported"),
            author: parsed.author || "", version: parsed.version || 1, builtin: false,
            thumbnailSvg: parsed.thumbnailSvg || null, icons: parsed.icons || {}
          };
          state.iconThemeCatalog.unshift(theme);
          state.selectedIconThemeId = theme.id;
          renderIconThemeEditor(); syncIconThemeJsonFromState();
          setStatus("icon-theme-editor-status", `已导入主题：${theme.name}`, "ok");
        }
      } catch (e) { setStatus("icon-theme-editor-status", `导入失败：${e.message}`, "err"); }
      finally { ev.target.value = ""; }
    });

    // IME buttons
    el("icon-theme-ime-load").addEventListener("click", async () => {
      try { await loadIconThemeFromIme(); } catch (e) { setStatus("icon-theme-editor-status", `读取失败：${e.message}`, "err"); }
    });
    el("icon-theme-ime-save").addEventListener("click", async () => {
      try { await saveIconThemeToIme(); } catch (e) { setStatus("icon-theme-editor-status", `保存失败：${e.message}`, "err"); }
    });

    // Export as ZIP (matching app structure)
    el("icon-theme-export-zip")?.addEventListener("click", async () => {
      try { await exportIconThemeAsZip(); } catch (e) { setStatus("icon-theme-editor-status", `ZIP 导出失败：${e.message}`, "err"); }
    });

    // Dialog buttons
    el("icon-slot-cancel").addEventListener("click", () => { el("icon-slot-dialog").close(); });
    el("icon-slot-save").addEventListener("click", () => {
      const slot = iconSlotDialogState.slot;
      if (!slot) return;
      const supportsText = iconThemeSlotSupportsText(slot);
      const emojiInput = el("icon-slot-emoji");
      const svgTextarea = el("icon-slot-svg-textarea");
      if (supportsText && emojiInput && emojiInput.value.trim()) {
        applyIconSlotChange(emojiInput.value.trim()); return;
      }
      if (svgTextarea && svgTextarea.value.trim()) {
        applyIconSlotChange(svgTextarea.value.trim()); return;
      }
      applyIconSlotChange("");
    });
    el("icon-slot-clear").addEventListener("click", () => { applyIconSlotChange(""); setStatus("icon-theme-editor-status", "已清除图标", "ok"); });
    el("icon-slot-select-file").addEventListener("click", () => {
      const input = el("icon-slot-file-input");
      if (input) input.click();
    });
    el("icon-slot-file-input").addEventListener("change", (ev) => {
      const file = ev.target.files?.[0];
      if (file) handleIconSlotFileSelected(file);
      ev.target.value = "";
    });

    renderIconThemeEditor();
    syncIconThemeJsonFromState();
    state.initialIconThemeCatalogSignature = iconThemeCatalogSignature();
  }

  async function main() {
    await initializeBuiltinData();
    setupBeforeUnloadGuard();
    installThemeCropInteractions();
    initTabs();
    initLayoutTab();
    initThemeTab();
    initPopupTab();
    initIconThemeTab();
    setupQrActions();
    setupThemeQrActions();
    setupPopupQrActions();
    setupThemeAppSyncUi();
    setupImeBridgeActions();
    await autoLoadImeDataOnStartup();
    const previewPanel = document.querySelector(".keyboard-preview-panel");
    if (previewPanel) {
      previewPanel.addEventListener("toggle", () => {
        updateFixedChromeMetrics();
        syncJsonEditorHeight();
      });
    }
    const mobilePreviewCard = el("theme-preview-mobile-card");
    if (mobilePreviewCard) {
      mobilePreviewCard.addEventListener("toggle", () => {
        requestAnimationFrame(() => {
          updateFixedChromeMetrics();
          requestAnimationFrame(() => {
            syncPreviewBlurMaskGeometry();
            fitLayoutPreviewText();
          });
        });
      });
    }
    state.layoutHeightObserver = new ResizeObserver(() => syncJsonEditorHeight());
    const mainCardEl = document.getElementById("layout-main-column-card") || document.querySelector(".layout-main-column-card");
    if (mainCardEl) state.layoutHeightObserver.observe(mainCardEl);
    state.themeHeightObserver = new ResizeObserver(() => syncThemeJsonHeight());
    const themeMainCardEl = document.querySelector(".theme-main-card");
    if (themeMainCardEl) state.themeHeightObserver.observe(themeMainCardEl);
    state.popupHeightObserver = new ResizeObserver(() => syncPopupJsonHeight());
    const popupMainCardEl = document.querySelector(".popup-main-card");
    if (popupMainCardEl) state.popupHeightObserver.observe(popupMainCardEl);
    window.addEventListener("resize", syncJsonEditorHeight);
    window.addEventListener("resize", syncThemeJsonHeight);
    window.addEventListener("resize", syncPopupJsonHeight);
    window.addEventListener("resize", updateFixedChromeMetrics);
    window.addEventListener("resize", () => requestAnimationFrame(() => {
      syncThemeCardBlurMaskGeometry();
      syncPreviewBlurMaskGeometry();
      fitLayoutPreviewText();
    }));
    updateFixedChromeMetrics();
    // Move layout-preview-meta out of preview-shell to avoid zoom,
    // then position it on the same line as the summary via CSS.
    const meta = document.getElementById("layout-preview-meta");
    const panel = document.querySelector(".keyboard-preview-panel");
    if (meta && panel && meta.parentElement?.closest(".preview-shell")) {
      panel.appendChild(meta);
    }
    setStatus("layout-qr-meta", "点击“生成二维码”后会自动按 App 协议分片编码", "");
    setStatus("theme-qr-meta", "点击“分享当前激活主题”可自动导出 ZIP 或二维码长图", "");
    setStatus("popup-qr-meta", "点击“生成二维码”可预览并下载弹出字符长图", "");
    if (IME_API_BASE) {
      setStatus("layout-qr-meta", `IME API：${IME_API_BASE}`, "");
    }
  }

  main();
})();
