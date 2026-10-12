# Dash to Panel agent handoff

Updated 2026-10-12. Read any additional applicable `AGENTS.md` files.

## Maintaining this file

- Keep this handoff current after authorized work. Update repository state,
  useful discoveries, validation results, known limitations, and remaining work.
- Correct stale information instead of appending a chronological activity log.
  Distinguish verified facts from assumptions and provide enough context for
  another agent to continue.
- This file is intended for a public repository. Never include credentials,
  tokens, passwords, personal information, private application or document
  contents, or sensitive logs.
- Use repository-relative paths and generic placeholders for personal filesystem
  paths and machine identifiers. Review additions for private data before saving.

## User preferences

The user supplied this instruction:

> Always discuss the issues only, never makes unless I explicitely require.

- Investigate and explain questions or bug reports. Change files only when the
  user explicitly requests implementation or tells you to proceed.
- Once a change is requested, complete implementation and appropriate verification
  without repeatedly asking for authorization already given.
- Commit, push, tag, publish, and install only when requested. Creating or updating
  this file does not authorize those actions.
- Check Git status before editing and preserve unrelated changes.
- Do not delegate to other agents unless explicitly requested.
- Keep updates and final answers concise. Distinguish source changes, built
  packages, published releases, installed files, and behavior verified in Shell.
- Never log out the user or restart their live GNOME Shell automatically.

## Repository

- Fork: https://github.com/tiagosantosvdl/dash-to-panel; branch `master`.
- Upstream: https://github.com/home-sweet-gnome/dash-to-panel.
- Extension UUID: `dash-to-panel@tiagosantosvdl.github.com`.
- Settings schema: `org.gnome.shell.extensions.dash-to-panel`.
  Preserve existing saved preferences and schema compatibility.
- Runtime source is GJS using ES modules under `src/`; UI definitions are under
  `ui/`, schemas under `schemas/`, and translations under `po/`.
- The Makefile copies runtime source into the root of ignored `_build/`.
  Edit source files, not installed copies or generated build output.
- Keep README installation and support instructions explicit about this fork,
  its Codex maintenance, and upstream credit. The GNOME Extensions listing
  distributes upstream rather than this fork.
- Inspect neighboring extension repositories when useful, but do not modify them
  unless included in the requested scope.

## Current state

Recorded 2026-10-12; recheck Git, GitHub, and installed files when taking over.

- Source release: **74.3.1**; integer GNOME version: **74**.
- Release commit: `6e67dda` (`Remove startup update notifications; release 74.3.1`).
- `master` and annotated tag `v74.3.1` were pushed successfully.
- GitHub workflow completion and published release assets were not verified in
  that session. Do not describe the tag push alone as verified publication.
- Debian package `gnome-shell-extension-dash-to-panel-tiagosantosvdl` is installed
  at version 74.3.1; the package query was rechecked for this handoff.
- The installed package was built locally, checksum-verified, and installed using
  `pkexec /usr/bin/apt install -y <absolute-deb-path>`. Installed-file equality
  against the ZIP was not checked.
- Declared GNOME Shell support is 46–51. Automated checks are not a complete
  visual compatibility matrix.
- Installation does not reload an already imported extension. The user was told
  to log out and back in; do not assume they did so or that the extension is active.
- No feature work remains outstanding from the requests recorded here.
  This handoff was requested separately from the release; check its Git status.
- README now follows the neighboring forks' structure: project status,
  installation, source builds, configuration/logs, verification, releases,
  support, and credits. Its examples use 74.3.1 and retain upstream contributor
  and translation credits. This documentation update does not change runtime code.

## Behavior and implementation to preserve

### Independent corner radii

- The existing `global-border-radius` key now controls window buttons only.
  Preferences labels it **Window button border radius**. Retain the key name so
  existing window-button preferences survive upgrades.
- `tray-border-radius` controls the clock, system tray, and other `.panel-button`
  elements. Preferences labels it **Tray border radius**; its default is zero.
- Both settings store steps 0–5, displayed as 0–20 pixels in increments of four.
  Zero means square corners rather than inheriting theme rounding.
- `src/extension.js` applies `br<px>` and `tray-br<px>` classes to `uiGroup` and
  removes both sets on disable. `src/panelManager.js` observes both settings.
- `src/stylesheet.css` keeps window and tray selectors independent. Dock frames,
  Show Applications, Show Desktop, and window previews no longer inherit the
  window-button radius setting.
- `src/prefs.js`, `ui/SettingsStyle.ui`, and the schema define the controls.
  The app-icon highlight override remains a separate existing preference.

### Panel highlights and spacing

- Panel buttons use background fills for hover, focus, active, and checked states.
  Do not restore the earlier inset-shadow-only implementation: after theme-border
  removal, the user reported missing overlays on all buttons except the clock.
- The clock highlight covers the entire date-menu button, including the
  notification bell. The inner `.clock` highlight is suppressed to avoid overlap.
  The bell belongs to the clock/date-menu button, not the system-menu button.
- Theme borders, outer margins, and CSS padding are normalized. Tray item padding
  and status-icon padding are distinct from panel outer margins and padding.
- `src/panelStyle.js` applies equal natural/minimum horizontal padding for custom
  tray padding. Vertical padding applies to the clock's content wrapper as well
  as other panel-button content wrappers.
- With custom status-icon padding, icon margins and status-group spacing are
  cleared. The notification indicator receives that padding too.
- The user adjusted padding and confirmed the spacing looked good. Preserve
  their settings; do not reset them to solve an overlay problem.
- A Freon temperature indicator can look asymmetric despite equal outer padding:
  its narrow thermometer sits in a wider icon box with status-icon padding, while
  the adjacent text has different internal spacing. This was investigated, not
  changed. Do not assume every third-party indicator has the same content layout.

### Startup notifications

- Version 74.3.1 removed the install/update notification and its “See what's new”
  button from `src/extension.js`. Do not reintroduce them.
- The previous code compared integer version 74 and linked to `v74`, missing
  changes to the fork's `version-name`. That logic is now gone.
- The legacy `extension-version` schema key remains for compatibility; startup
  no longer reads or writes it. Ordinary application notification handling remains.

## Verification

Use checks appropriate to the change. Release CI runs:

```sh
for source in src/*.js; do node --check "$source" || exit; done
glib-compile-schemas --strict --dry-run schemas
node --experimental-vm-modules tests/workspace_selector_test.mjs
python3 -m unittest discover -s tests -p '*test.py'
git diff --check
```

- The 74.3.1 release passed five workspace-selector cases, seven packaging tests,
  JavaScript syntax, schema validation, whitespace, and package checksum checks.
- `tests/workspace_selector_test.mjs` uses real modules with mocked Shell APIs.
- `tests/release_package_test.py` exercises real ZIP and Debian builds without
  installation, including payload equality, checksums, versions, and permissions.
- `tests/panel_theme_test.js` uses native GNOME St to check every combination of
  window/tray radius, both orientations, and all interaction states. It previously
  passed against installed Yaru and Yaru-dark themes. It verifies computed styles,
  not actual compositor painting; its standalone ThemeContext can emit teardown
  warnings because there is no stage. It is not currently run by release CI.
- Run the native test with `gjs -m tests/panel_theme_test.js <shell-theme-css>`.
  Set `GSETTINGS_BACKEND=memory`, use the system schema directory, and provide the
  installed GNOME Shell/Mutter typelib and library paths through `GI_TYPELIB_PATH`
  and `LD_LIBRARY_PATH`. Their locations depend on the installed Shell version.
- GTK/libadwaita successfully loaded the two radius controls with separate
  adjustments. Standalone Builder checks need a scope for existing signal handlers.
- `npm run lint` rewrites files using Prettier and ESLint fixes. For read-only
  verification, use their check modes when dependencies are available.
- Use isolated temporary configurations and memory-backed settings for diagnostics.
  An inherited editor environment previously selected outdated GSettings schemas;
  explicitly use the system schemas for native checks. Never write live dconf to
  make a diagnostic pass. Automated checks do not prove fresh-login behavior.

## Releases and installation

Only release or install when requested.

1. Check status, branch, remote head, and tag availability. Preserve unrelated
   edits. Never force-push or replace published tags.
2. Bump `version-name` in `metadata.json` and update README release examples.
   Keep GNOME's integer `version` at 74 under the current fork convention.
   `package.json` has no release version to synchronize.
3. Run relevant checks and commit with a concrete behavior description and version.
4. Build with `make release`. This stages `_build/` and generates ZIP, Debian
   package, and `SHA256SUMS` in ignored `dist/`, without installing.
   The default build records HEAD's commit in metadata; build after the release
   commit when that identifier must match. Makefile `VERSION` is an integer
   GNOME version override, not the semantic release version.
5. Verify packaged metadata, changed files, and checksums from the directory
   containing `SHA256SUMS`. Do not commit generated packages or compiled schemas.
6. Create an annotated `v<version-name>` tag and push it atomically with `master`.
   `.github/workflows/release.yml` builds and publishes assets on tag pushes.
   Manual dispatch builds downloadable artifacts without publishing.
7. Check workflow success and actual release assets before claiming publication
   is complete. Local `gh` is unnecessary; GitHub's REST API can verify status.
   For installation of a published release, download its assets into ignored
   `dist/published-<version>/` and verify checksums. Local and CI bytes can differ.
8. Inspect the package installation transaction for unexpected changes. Use
   desktop authentication when needed: `pkexec /usr/bin/apt install -y
   <absolute-deb-path>` previously succeeded. Noninteractive sudo failed; the tool's
   interactive terminal did not provide a user password-input channel. Give the
   user time to approve the desktop dialog and never request a password in chat.
9. Verify `dpkg-query`, installed metadata, and files under
   `/usr/share/gnome-shell/extensions/dash-to-panel@tiagosantosvdl.github.com/`
   against the corresponding verified ZIP. Check Git status afterward.
10. Tell the user to log out and back in to load the update; do not trigger logout.
    Report blocked installation separately from successful build or publication.

Assets: `<uuid>-<version>.zip`,
`gnome-shell-extension-dash-to-panel-tiagosantosvdl_<debian-version>_all.deb`,
and `SHA256SUMS`. Debian prereleases use `~rc.1` while tags and ZIP filenames use
`-rc.1`. Ignored output includes `_build/`, `dist/`, translation binaries, and
compiled schemas.
