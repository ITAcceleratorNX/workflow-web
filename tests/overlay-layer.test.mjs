import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const config = require('../tailwind.config.js');

// Node cannot strip JSX. Use the project's existing compiler to load the real source.
async function loadSource(relativePath, dependencies = {}, globals = {}) {
  const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(compiled, {
    ...globals,
    require: (id) => dependencies[id] ?? require(id),
    module: loaded,
    exports: loaded.exports,
  });
  return loaded.exports;
}

const overlay = await loadSource('../components/ui/overlay-layer.tsx');
const { OverlayLayerProvider, useOverlayLayer, usePopupLayerStyle } = overlay;

function PopupProbe() {
  return React.createElement('div', { style: usePopupLayerStyle() });
}

function DialogProbe() {
  return React.createElement('output', null, useOverlayLayer());
}

function renderInside(parentLayer, component) {
  return renderToStaticMarkup(
    React.createElement(OverlayLayerProvider, { level: parentLayer }, React.createElement(component)),
  );
}

test('a popup inside a management window stays above its parent at layer 200', () => {
  assert.match(renderInside(200, PopupProbe), /--overlay-popup-z:210/);
});

test('legacy request popups and nested dialogs remain above request windows', () => {
  assert.match(renderToStaticMarkup(React.createElement(PopupProbe)), /--overlay-popup-z:120/);
  assert.match(renderInside(110, PopupProbe), /--overlay-popup-z:120/);
  assert.equal(renderInside(110, DialogProbe), '<output>120</output>');
});

test('dialog restores an explicit pointer trigger, preserves keyboard return, and never targets BODY', async () => {
  const document = { activeElement: null, body: null, documentElement: null };
  const frames = [];
  let childScopeRemoved = false;
  class FocusableElement {
    isConnected = true;
    focusCount = 0;
    focus() {
      this.focusCount += 1;
      if (childScopeRemoved) document.activeElement = this;
    }
  }
  document.body = new FocusableElement();
  document.documentElement = new FocusableElement();
  const { useDialogFocusReturn } = await loadSource('../components/ui/overlay-layer.tsx', {}, {
    document,
    HTMLElement: FocusableElement,
    requestAnimationFrame: (callback) => { frames.push(callback); },
  });
  function captureHandlers(returnFocusRef) {
    let handlers;
    function Probe() {
      handlers = useDialogFocusReturn(returnFocusRef);
      return null;
    }
    renderToStaticMarkup(React.createElement(Probe));
    handlers.onOpenAutoFocus();
    return handlers;
  }
  function closeEvent() {
    return { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  }

  // Touch activation can leave BODY active instead of focusing the trigger button.
  const trigger = new FocusableElement();
  document.activeElement = document.body;
  const pointer = captureHandlers({ current: trigger });
  document.activeElement = new FocusableElement();
  const pointerClose = closeEvent();
  pointer.onCloseAutoFocus(pointerClose);
  assert.equal(pointerClose.defaultPrevented, true);
  assert.equal(trigger.focusCount, 0, 'wait until Radix removes the child scope after dispatching the close event');
  childScopeRemoved = true;
  frames.splice(0).forEach((callback) => callback());
  assert.equal(document.activeElement, trigger);

  document.activeElement = trigger;
  const keyboard = captureHandlers();
  document.activeElement = new FocusableElement();
  keyboard.onCloseAutoFocus(closeEvent());
  frames.splice(0).forEach((callback) => callback());
  assert.equal(document.activeElement, trigger);

  document.activeElement = document.body;
  const noTrigger = captureHandlers();
  const fallbackClose = closeEvent();
  noTrigger.onCloseAutoFocus(fallbackClose);
  assert.equal(fallbackClose.defaultPrevented, false, 'leave Radix fallback available without a real trigger');
  assert.equal(document.body.focusCount, 0);

  trigger.isConnected = false;
  const removedClose = closeEvent();
  pointer.onCloseAutoFocus(removedClose);
  assert.equal(removedClose.defaultPrevented, false);
});

test('request shell gives Radix Portal separate ref-capable children', async () => {
  const radix = require('@radix-ui/react-dialog');
  let portalChildren;
  const { RequestModalShell } = await loadSource('../components/requests/request-modal-shell.tsx', {
    '@/components/ui/overlay-layer': overlay,
    '@/lib/utils': await loadSource('../lib/utils.ts'),
    '@radix-ui/react-dialog': {
      ...radix,
      // Inspect the actual shell-to-Portal boundary without requiring a browser DOM.
      // Radix attaches Presence refs to each child; Fragment is not a valid target.
      Portal({ children }) {
        portalChildren = React.Children.toArray(children);
        return null;
      },
    },
  });
  renderToStaticMarkup(React.createElement(RequestModalShell, { isOpen: true, onClose() {} }, 'Request'));
  assert.equal(portalChildren?.length, 2);
  assert.equal(portalChildren[0].type, radix.Overlay);
  assert.equal(portalChildren[1].type, radix.Content);
});

test('recipient fallback for users without a company retains the explicit return target', async () => {
  let pickerReturnRef;
  const utils = await loadSource('../lib/utils.ts');
  const theme = { useTaskPickerTheme: () => ({ text: '#fff', textMuted: '#aaa', primary: '#e25b21', border: '#333', cardBg: '#222' }) };
  const assignment = await loadSource('../components/tasks/task-assignment-pickers.tsx', {
    '@/lib/utils': utils,
    '@/components/tasks/assign-user-search-filters': { AssignUserSearchFilters: () => null },
    '@/hooks/use-assign-user-search-scope': { useAssignUserSearchScope: () => ({ searchOptions: {} }) },
    '@/hooks/use-task-picker-theme': theme,
    '@/lib/user-search-display': {},
    '@/lib/user-search': {},
    '@/components/tasks/task-picker-shell': {
      TaskPickerShell({ returnFocusRef }) {
        pickerReturnRef = returnFocusRef;
        return null;
      },
    },
  });
  const { TaskRecipientPicker } = await loadSource('../components/tasks/task-recipient-picker.tsx', {
    '@/lib/utils': utils,
    '@/components/tasks/task-assignment-pickers': assignment,
    '@/components/tasks/task-picker-shell': {},
    '@/hooks/use-task-picker-theme': theme,
    '@/hooks/use-task-recipients': { useTaskRecipients: () => ({ directory: { my_company: null, available_companies: [] } }) },
    '@/lib/employee-display': {},
    '@/lib/task-recipients-api': {},
    '@/stores/confirm-dialog-store': {},
  });
  const returnFocusRef = { current: {} };
  renderToStaticMarkup(React.createElement(TaskRecipientPicker, {
    visible: true, currentUserId: 1, value: null, onClose() {}, onConfirm() {}, returnFocusRef,
  }));
  assert.equal(pickerReturnRef, returnFocusRef);
});

test('production Tailwind globs generate constant-only classes and portal layer utilities', async (t) => {
  const fixture = await mkdtemp(path.join(tmpdir(), 'workflow-overlay-css-'));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  // Keep the real globs, but isolate the inputs: no component can accidentally supply
  // a class that should have been discovered in constants/.
  for (const file of ['constants/mobile-requests-ui.ts', 'components/ui/select.tsx', 'components/ui/dialog.tsx']) {
    const target = path.join(fixture, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, await readFile(new URL(`../${file}`, import.meta.url)));
  }
  const result = await postcss([
    tailwindcss({ ...config, content: config.content.map((glob) => path.join(fixture, glob)) }),
  ]).process('@tailwind utilities;', { from: undefined });

  const declarations = [];
  result.root.walkDecls((declaration) => declarations.push(declaration));
  assert.ok(
    declarations.some((declaration) => declaration.prop === '--tw-ring-color' && declaration.value === 'rgb(243 87 19 / 0.3)'),
    'focus:ring-[#F35713]/30 from constants/mobile-requests-ui.ts must be included in generated CSS',
  );
  for (const value of ['var(--overlay-popup-z)', 'var(--overlay-dialog-z,50)']) {
    assert.ok(
      declarations.some((declaration) => declaration.prop === 'z-index' && declaration.value === value),
      `Missing portal layer utility: z-index: ${value}`,
    );
  }
});
