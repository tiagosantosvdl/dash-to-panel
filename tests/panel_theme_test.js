// Run with gjs -m and GNOME Shell/Mutter libraries on the GI and library paths.
// Pass a Shell theme stylesheet as the first argument.
import Gio from 'gi://Gio'
import St from 'gi://St'

const context = new St.ThemeContext()
const theme = new St.Theme({
  application_stylesheet: Gio.File.new_for_path(ARGV[0]),
})
theme.load_stylesheet(Gio.File.new_for_path('src/stylesheet.css'))

function node(parent, id, classes, state = '', inline = '') {
  return St.ThemeNode.new(
    context, parent, theme, St.Widget.$gtype, id, classes, state, inline,
  )
}

function equal(actual, expected, message) {
  if (actual !== expected)
    throw new Error(`${message}: expected ${expected}, got ${actual}`)
}

for (const windowRadius of [0, 4, 8, 12, 16, 20]) {
  for (const radius of [0, 4, 8, 12, 16, 20]) {
    for (const orientation of ['horizontal', 'vertical']) {
      const root = node(null, 'uiGroup', `br${windowRadius} tray-br${radius}`)
      const panel = node(root, 'panel', `dashtopanelMainPanel ${orientation}`)
      for (const window of [node(panel, null, 'dtp-container'), node(panel, null, 'dtp-dots-container')]) {
        for (let side = 0; side < 4; side++)
          equal(window.get_border_radius(side), windowRadius, 'window button radius')
      }
      for (const [state, alpha] of [
        ['', 0], ['hover', 43], ['focus', 43], ['active', 71],
        ['checked', 71], ['active hover', 81], ['checked hover', 81],
      ]) {
        const clock = node(panel, null, 'panel-button clock-display', state)
        const label = node(clock, null, 'clock')
        equal(clock.get_background_color().alpha, alpha, `clock ${state} fill`)
        equal(label.get_background_color().alpha, 0, 'inner clock fill')
        for (const button of [
          clock,
          node(panel, null, 'panel-button', state),
          node(panel, null, 'panel-button panel-status-button', state),
        ]) {
          equal(button.get_background_color().alpha, alpha, `panel button ${state} fill`)
          for (let side = 0; side < 4; side++) {
            equal(button.get_border_radius(side), radius, 'button radius')
            equal(button.get_border_width(side), 0, 'button border')
            equal(button.get_margin(side), 0, 'button margin')
          }
        }
        const icon = node(clock, null, 'system-status-icon', '', 'padding: 0; margin: 0;')
        for (let side = 0; side < 4; side++) {
          equal(icon.get_margin(side), 0, 'custom icon margin')
          equal(icon.get_padding(side), 0, 'custom icon padding')
        }
      }
    }
  }
}
print('Panel theme checks passed: all radii, orientations, and interaction states')
// Standalone ThemeContext can log a warning during teardown because it has no stage.
