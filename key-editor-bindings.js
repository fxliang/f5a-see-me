(function () {
  "use strict";

  window.bindKeyEditorDialogEvents = function bindKeyEditorDialogEvents(deps) {
    const {
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
    } = deps;

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
  };
})();
