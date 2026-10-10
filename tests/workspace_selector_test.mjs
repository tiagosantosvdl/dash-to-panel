// Run with: node --experimental-vm-modules --test tests/workspace_selector_test.mjs
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { SourceTextModule, SyntheticModule } from 'node:vm'
import * as Pos from '../src/panelPositions.js'

// Load the real modules with substitutes for GNOME APIs unavailable in Node.
async function loadModule(path, imports) {
  const module = new SourceTextModule(
    await readFile(new URL(path, import.meta.url), 'utf8'),
  )
  await module.link((specifier) => {
    const exports = imports[specifier] || { default: {} }
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports))
        this.setExport(name, value)
    })
  })
  await module.evaluate()
  return module.namespace
}

const settingsModule = await loadModule('../src/panelSettings.js', {
  'gi://Gio': { default: { DBusProxy: { makeProxyWrapper: () => class {} } } },
  './panelPositions.js': Pos,
})

function getPositions(layout, defaultLayout = '') {
  const values = {
    'panel-element-positions': JSON.stringify(layout ? { 0: layout } : {}),
    'panel-element-positions-default': defaultLayout,
  }
  return settingsModule.getPanelElementPositions(
    { get_string: (key) => values[key] },
    0,
  )
}

test('default layout places the selector between taskbar and tray', () => {
  const elements = getPositions().map((pos) => pos.element)
  assert.ok(
    elements.indexOf(Pos.TASKBAR) < elements.indexOf(Pos.WORKSPACE_SELECTOR),
  )
  assert.equal(
    elements.indexOf(Pos.WORKSPACE_SELECTOR) + 1,
    elements.indexOf(Pos.RIGHT_BOX),
  )
})

test('old saved and synchronized layouts gain the selector without losing customizations', () => {
  const old = [
    { element: Pos.TASKBAR, visible: false, position: Pos.CENTERED },
    { element: Pos.RIGHT_BOX, visible: true, position: Pos.STACKED_TL },
  ]
  for (const positions of [
    getPositions(old),
    getPositions(null, JSON.stringify(old)),
  ]) {
    assert.deepEqual(
      positions.filter((pos) => pos.element !== Pos.WORKSPACE_SELECTOR),
      old,
    )
    assert.equal(positions[1].element, Pos.WORKSPACE_SELECTOR)
    assert.equal(positions[1].position, Pos.STACKED_TL)
  }
})

test('saved selector order, visibility and alignment survive subsequent reads', () => {
  const custom = [
    { element: Pos.WORKSPACE_SELECTOR, visible: false, position: Pos.CENTERED },
  ]
  assert.deepEqual(getPositions(custom), custom)
  assert.equal(
    getPositions([{ element: Pos.TASKBAR }]).at(-1).element,
    Pos.WORKSPACE_SELECTOR,
  )
})

class Actor {
  children = []
  signals = new Map()
  get_parent() {
    return this.parent
  }
  get_children() {
    return [...this.children]
  }
  get_n_children() {
    return this.children.length
  }
  add_child(actor) {
    this.insert_child_at_index(actor, this.children.length)
  }
  insert_child_at_index(actor, index) {
    assert.ok(!actor.parent, 'actor must be detached before insertion')
    this.children.splice(index, 0, actor)
    actor.parent = this
  }
  remove_child(actor) {
    this.children.splice(this.children.indexOf(actor), 1)
    actor.parent = null
  }
  connect(signal, callback) {
    const id = this.signals.size + 1
    this.signals.set(id, { signal, callback })
    return id
  }
  disconnect(id) {
    this.signals.delete(id)
  }
  destroy() {
    for (const { signal, callback } of this.signals.values())
      if (signal === 'destroy') callback()
    this.signals.clear()
    this.parent?.remove_child(this)
  }
}

let idleCallback
const { Panel } = await loadModule('../src/panel.js', {
  'gi://GObject': { default: { registerClass: (options, klass) => klass } },
  'gi://St': { default: { Widget: class {} } },
  'gi://GLib': {
    default: {
      idle_add: (priority, callback) => {
        idleCallback = callback
        return 1
      },
    },
  },
  './extension.js': {
    SETTINGS: {},
    DESKTOPSETTINGS: {},
    PERSISTENTSTORAGE: {},
    tracker: {},
  },
  'resource:///org/gnome/shell/extensions/extension.js': {
    gettext: (text) => text,
    InjectionManager: class {},
  },
})

function makePanel() {
  return Object.assign(Object.create(Panel.prototype), {
    statusArea: {},
    geom: { vertical: false },
    _workspaceSelectorBox: new Actor(),
    _setVertical: (actor, vertical) => {
      actor.vertical = vertical
    },
  })
}

test('existing selector is separated from icons and restored on disable', () => {
  const panel = makePanel()
  const tray = new Actor()
  const before = new Actor()
  const selector = new Actor()
  const after = new Actor()
  for (const actor of [before, selector, after]) tray.add_child(actor)
  panel.statusArea['workspace-indicator'] = { container: selector }
  panel._syncWorkspaceSelector()
  panel._syncWorkspaceSelector()
  assert.deepEqual(tray.children, [before, after])
  assert.deepEqual(panel._workspaceSelectorBox.children, [selector])
  tray.add_child(new Actor())
  panel._restoreWorkspaceSelector()
  assert.deepEqual(tray.children.slice(0, 3), [before, selector, after])
  assert.equal(selector.signals.size, 0)
  assert.equal(panel._workspaceSelectorBox.children.length, 0)
})

test('late registration, selector reload and vertical panels are supported', () => {
  const panel = makePanel()
  const tray = new Actor()
  panel.geom.vertical = true
  panel._syncWorkspaceSelector() // Indicator extension is not enabled yet.
  panel._onBoxActorAdded(tray)
  const selector = new Actor()
  tray.add_child(selector)
  panel.statusArea['workspace-indicator'] = { container: selector }
  idleCallback() // Registration has completed by the next main loop iteration.
  assert.equal(selector.parent, panel._workspaceSelectorBox)
  assert.equal(panel._workspaceSelectorBox.vertical, true)
  selector.destroy()
  assert.equal(panel._workspaceSelectorContainer, null)
  const replacement = new Actor()
  tray.add_child(replacement)
  panel.statusArea['workspace-indicator'] = { container: replacement }
  panel._onBoxActorAdded(tray)
  idleCallback()
  assert.deepEqual(panel._workspaceSelectorBox.children, [replacement])
  panel._restoreWorkspaceSelector()
  assert.equal(replacement.parent, tray)
  assert.equal(replacement.vertical, false)
})
