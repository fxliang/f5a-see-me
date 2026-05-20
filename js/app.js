(function () {
  "use strict";
  const WEB_EDITOR_BUILD = "2026-05-20T11:36+08:00";
  console.info("[web-editor] app.js loaded", WEB_EDITOR_BUILD);

  const MAGIC = "F5AQR1";
  const MAX_CHUNK_BYTES = 1500;
  const TRANSFER_TYPE_LAYOUT = "L";
  const TRANSFER_TYPE_THEME = "T";
  const TRANSFER_TYPE_POPUP = "P";
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
  const PREVIEW_KEY_BORDER_ENABLED = true;

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
  const themeColorLabels = {
    backgroundColor: "背景颜色",
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
    qr: { chunks: [], index: 0, transferId: "", layoutSignature: "" },
    themeQr: { chunks: [], index: 0, transferId: "", themeSignature: "" },
    qrImportRunning: false,
    themeImportRunning: false,
    popupImportRunning: false,
    themeAssetUrlByPath: new Map(),
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
      punctPos: 'bottom'
    }
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
    return layoutHasChanges() || popupHasChanges() || themeHasChanges() || themeAppSyncHasChanges();
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

  function applyPreviewThemeSurface() {
    const root = el("layout-preview");
    if (!root) return;
    const theme = currentThemeEntry();
    root.style.backgroundColor = argbToCss(resolveThemeTokenColor("keyboardColor"));
    root.style.backgroundImage = theme?.backgroundImage ? `url("${theme.backgroundImage}")` : "none";
    root.style.backgroundSize = theme?.backgroundImage ? "cover" : "";
    root.style.backgroundPosition = theme?.backgroundImage ? "center" : "";
    root.style.backgroundBlendMode = theme?.backgroundImage ? "multiply" : "";
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
      const previewStyle = `background-color:${escapeAttr(keyboardColor)};border-color:${escapeAttr(dividerColor)};${theme.backgroundImage ? `background-image:url('${escapeAttr(theme.backgroundImage)}');background-size:cover;background-position:center;` : ""}`;
      return `
        <button type="button" class="theme-card ${theme.id === state.selectedThemeId ? "active" : ""}" data-theme-id="${escapeAttr(theme.id)}">
          <div class="theme-card-preview" style="${previewStyle}">
            <span class="theme-card-preview-bar" style="background:${escapeAttr(barColor)}"></span>
            <span class="theme-card-preview-name" style="color:${escapeAttr(keyTextColor)}">${escapeHtml(theme.name)}</span>
            <span class="theme-card-preview-space" style="background:${escapeAttr(spaceBarColor)}"></span>
            <span class="theme-card-preview-return" style="background:${escapeAttr(accentBg)}"></span>
          </div>
        </button>
      `;
    }).join("");
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
    const brightness = Number.isFinite(Number(raw.brightness)) ? Number(raw.brightness) : 70;
    const cropRotation = Number.isFinite(Number(raw.cropRotation)) ? Number(raw.cropRotation) : 0;
    const blurRadius = Number.isFinite(Number(raw.blurRadius)) ? Number(raw.blurRadius) : 0;
    return {
      croppedFilePath,
      srcFilePath,
      brightness,
      cropRect: raw.cropRect ?? null,
      cropRotation,
      blurRadius
    };
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
    const backgroundImageObject = normalizeThemeBackgroundImageObject(themeObj.backgroundImage);
    return {
      name: typeof themeObj.name === "string" && themeObj.name.trim() ? themeObj.name.trim() : "Imported Theme",
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
      buildBackgroundItem("背景", "Background", resolveThemeTokenColor("backgroundColor")),
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
    rows.innerHTML = themeColorTokens.map((token) => {
      const value = resolveThemeTokenColor(token);
      const argb = toArgbHex(value);
      return `
        <div class="theme-color-row" data-token="${escapeAttr(token)}">
          <label>${escapeHtml(themeColorLabels[token] || token)}</label>
          <div class="theme-color-inputs">
            <input type="text" class="theme-color-input" value="${escapeAttr(argb)}" placeholder="#AARRGGBB" aria-label="${escapeAttr(`${themeColorLabels[token] || token} ARGB`)}" ${editable ? "" : "readonly"}>
          </div>
        </div>
      `;
    }).join("");

    rows.querySelectorAll(".theme-color-row").forEach((row) => {
      const token = row.dataset.token;
      const input = row.querySelector(".theme-color-input");
      const applyColor = (nextColor) => {
        const normalized = normalizeColorValue(nextColor);
        if (normalized == null) return false;
        theme.colors[token] = normalized;
        renderThemeList();
        syncThemeJsonFromState();
        renderThemeSupplementPreview();
        syncLayoutUiFromState();
        return true;
      };
      const syncInputToState = () => {
        if (!applyColor(input.value.trim())) {
          input.value = toArgbHex(resolveThemeTokenColor(token));
          setStatus("theme-editor-status", `${themeColorLabels[token] || token} 颜色格式无效`, "err");
        } else {
          setStatus("theme-editor-status", "主题颜色已更新并同步到预览", "ok");
        }
      };
      installThemeColorPicker(input, token, syncInputToState);
      input.addEventListener("change", syncInputToState);
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
          if (typeof onChange === "function") onChange();
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
    if (preferred !== 'bottom') return preferred;
    if (!keySubText(key)) return 'none';
    // Match App behavior: fallback to top-right when stacked main+alt doesn't fit.
    const stackedMinHeight = previewMainFontMaxForKey(key) + 10 + 1;
    return keyHeight >= stackedMinHeight ? 'bottom' : 'top-right';
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
    const cfg = state.themeAppSync;
    const keyVGap = Math.max(0, Number(cfg.keyVGap) || 0);
    const punctPos = cfg.punctPos || 'bottom';
    applyPreviewThemeSurface();
    root.style.setProperty('--preview-row-gap', '8px');
    root.style.setProperty('--preview-key-hgap', `${cfg.keyHGap || 0}px`);
    root.style.setProperty('--preview-key-vgap', `${keyVGap}px`);
    root.style.setProperty('--preview-key-radius', `${cfg.keyRadius || 0}px`);
    root.innerHTML = rows.map((row, rowIndex) => {
      const rowHeight = effectiveRowHeight(rowPercents[rowIndex] ?? 0);
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
          punctPlacement === 'bottom' ? 'punct-bottom' : ''
        ].filter(Boolean).join(' ');
        const borderWidth = cfg.borderEnabled ? (cfg.borderOutline ? 1 : 0) : 0;
        const keyStyle = `background:${previewColors.backgroundCss};color:${previewColors.textCss};border-color:${previewColors.borderCss};--preview-key-shadow:${previewColors.borderCss};border-width:${borderWidth}px;border-style:${borderWidth > 0 ? 'solid' : 'none'};`;
        const alt = keySubText(key) && punctPlacement !== 'none'
          ? `<span class="layout-key-alt ${punctPlacement === 'bottom' ? 'bottom' : ''}" style="color:${escapeAttr(previewColors.altTextCss)}">${escapeHtml(keySubText(key))}</span>`
          : "";
        return `<div class="layout-key-slot" style="--key-width:${widthPercent}"><div class="layout-key ${previewVariantClass(key)} ${keyExtraClasses}" style="${escapeAttr(keyStyle)}"><span class="layout-key-main">${escapeHtml(previewTitleFromObj(key))}</span>${alt}</div></div>`;
      }).join("")}</div></div>`;
    }).join("");
    requestAnimationFrame(fitLayoutPreviewText);
    const height = getHeightOverride();
    setStatus("layout-preview-meta", `${entryKey(state.selectedBase, state.selectedSubmode)}${height ? `，键盘高度 ${height}%` : ""}`, "");
    renderThemeSupplementPreview();
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
    const previewHeight = preview?.offsetHeight || 0;
    document.documentElement.style.setProperty("--topbar-height", `${topbarHeight}px`);
    document.documentElement.style.setProperty("--preview-panel-height", `${previewHeight}px`);
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
      case "LayerSwitchKey":
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
      hasLongPressAction: type === "MacroKey"
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
    await window.lzma_wasm.initWasm();
    state.wasmReady = true;
  }

  async function encodeJsonToChunks(rawJson, profile, transferType = TRANSFER_TYPE_LAYOUT) {
    await ensureWasm();
    const raw = new TextEncoder().encode(rawJson);
    const compressed = window.lzma_wasm.compress(raw, { format: "xz", level: 6 });
    const crc = crc32(compressed);
    const transferId = buildTransferId(transferType, profile);
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
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("主题背景图加载失败"));
      img.src = url;
    });
  }

  function drawCoverImage(ctx, image, width, height) {
    const iw = Number(image?.naturalWidth || image?.width || 0);
    const ih = Number(image?.naturalHeight || image?.height || 0);
    if (!iw || !ih) return;
    const scale = Math.max(width / iw, height / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (width - dw) / 2;
    const dy = (height - dh) / 2;
    ctx.drawImage(image, dx, dy, dw, dh);
  }

  async function renderPreviewCanvas(targetWidth) {
    const rows = getRows();
    const previewPadding = LONG_IMAGE_PREVIEW_PADDING;
    const rowGap = LONG_IMAGE_PREVIEW_ROW_GAP;
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
    const rowHeights = rowPercents.map(effectiveRowHeight);
    const contentHeight = rowHeights.reduce((sum, h) => sum + h, 0) + rows.length * rowGap;
    const height = Math.max(1, contentHeight + previewPadding * 2);
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const keyboardColor = argbToCss(resolveThemeTokenColor("keyboardColor"));
    const theme = currentThemeEntry();
    if (theme?.backgroundImage) {
      try {
        const image = await loadImageForCanvas(theme.backgroundImage);
        if (image) drawCoverImage(ctx, image, targetWidth, height);
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
      let x = (targetWidth - keyboardWidth * rowWidth) / 2;
      row.forEach((key, keyIndex) => {
        const slotWidth = keyboardWidth * (widths[keyIndex] || 0);
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
        ctx.fill();
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
      blurRadius: Number.isFinite(Number(source?.blurRadius)) ? Number(source.blurRadius) : 0
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

  async function exportThemeAsZip(theme) {
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
      colors: deepClone(theme.colors)
    };
    const zip = new window.JSZip();
    zip.file(`${baseName}.json`, `${prettyJson(exportTheme)}\n`);
    zip.file(exportTheme.backgroundImage.croppedFilePath, blob);
    zip.file(exportTheme.backgroundImage.srcFilePath, blob);
    const zipBlob = await zip.generateAsync({ type: "blob" });
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
        // 主题预览长图等也用到
      });
    });
    syncThemeAppSyncUiFromState();
  }

  async function main() {
    await initializeBuiltinData();
    setupBeforeUnloadGuard();
    initTabs();
    initLayoutTab();
    initThemeTab();
    initPopupTab();
    setupQrActions();
    setupThemeQrActions();
    setupPopupQrActions();
    setupThemeAppSyncUi();
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
        updateFixedChromeMetrics();
        requestAnimationFrame(fitLayoutPreviewText);
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
    window.addEventListener("resize", () => requestAnimationFrame(fitLayoutPreviewText));
    updateFixedChromeMetrics();
    setStatus("layout-qr-meta", "点击“生成二维码”后会自动按 App 协议分片编码", "");
    setStatus("theme-qr-meta", "点击“分享当前激活主题”可自动导出 ZIP 或二维码长图", "");
    setStatus("popup-qr-meta", "点击“生成二维码”可预览并下载弹出字符长图", "");
  }

  main();
})();
