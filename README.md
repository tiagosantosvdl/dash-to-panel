# Dash to Panel

<p align="left">
  <img src="media/design/svg/D2P_logo.svg" width="620" alt="Dash to Panel logo" />
</p>

A GNOME Shell taskbar that combines application launchers, running windows,
the clock, and system icons in one configurable panel.

![Dash to Panel desktop](media/design/png/dtp-main-p2.png)

## Project status

This is [@tiagosantosvdl's fork](https://github.com/tiagosantosvdl/dash-to-panel)
of [upstream Dash to Panel](https://github.com/home-sweet-gnome/dash-to-panel),
maintained using OpenAI Codex. This fork provides its own extension packages.

- Current version: **74.3.1**, based on upstream v74.
- Extension UUID: `dash-to-panel@tiagosantosvdl.github.com`.
- Supported GNOME Shell versions: **46–51**, as declared in
  [metadata.json](metadata.json). This is not a completed compatibility test matrix.
- Settings schema: `org.gnome.shell.extensions.dash-to-panel`, shared with
  upstream to preserve existing preferences.

The fork adds independent workspace-selector positioning, separate window-button
and tray corner radii, and full-button hover highlights that include the clock's
notification bell. Version 74.3.1 removes install/update notifications and the
“See what's new” button.

Automated checks cover workspace-selector integration, computed panel styles,
and release packaging. Validate behavior in a running GNOME session separately.
Rebuilding and installing do not reload code already imported by Shell.

## Features

- Configurable panel position, size, element order, and multi-monitor display
- Grouped or separate window buttons, favorites, and custom click actions
- Running indicators with configurable appearance and position
- Live window previews, peek behavior, and keyboard application launching
- Intellihide and dynamic transparency
- Show Desktop and independent workspace-selector placement
- Separate border radii for window buttons and tray elements
- Import and export of saved settings

![Customizable panel appearance](media/design/gif/customizable.gif)

![Live window previews](media/design/gif/previews.gif)

## Installation

Download the packages from this repository's
[GitHub Releases](https://github.com/tiagosantosvdl/dash-to-panel/releases).
Each release includes an extension ZIP, a Debian package, and `SHA256SUMS`.

Disable upstream Dash to Panel before enabling this fork. The fork has a different
UUID, so installation does not replace upstream automatically. Both use the same
saved settings. Choose one installation method: a per-user copy takes precedence
over a system-wide copy with the same UUID.

### Debian / Ubuntu package

For release `74.3.1`, install the downloaded package:

```sh
sudo apt install ./gnome-shell-extension-dash-to-panel-tiagosantosvdl_74.3.1_all.deb
```

The package declares dependencies on GNOME Shell 46–51 and `gir1.2-adw-1`.
It installs under
`/usr/share/gnome-shell/extensions/dash-to-panel@tiagosantosvdl.github.com/`.

Log out and back in after installation or an upgrade to load the installed code.
Enable the extension with:

```sh
gnome-extensions enable dash-to-panel@tiagosantosvdl.github.com
```

### Per-user ZIP

Install the downloaded ZIP:

```sh
gnome-extensions install --force ./dash-to-panel@tiagosantosvdl.github.com-74.3.1.zip
```

Install libadwaita's introspection bindings (`gir1.2-adw-1` on Debian / Ubuntu)
for preferences. Log out and back in, then enable the extension using the command
above.

The [GNOME Extensions listing](https://extensions.gnome.org/extension/1160/dash-to-panel/)
distributes upstream rather than this fork.

### Verify downloads

Place `SHA256SUMS` and both release packages in the same directory, then run:

```sh
sha256sum -c SHA256SUMS
```

## Build from source

On Debian / Ubuntu, install the build tools and clone this repository:

```sh
sudo apt install git gettext libglib2.0-bin make python3 dpkg-dev
git clone https://github.com/tiagosantosvdl/dash-to-panel.git
cd dash-to-panel
make release
```

Building packages stages the extension under `_build/` without installing or
activating it. For version `74.3.1`, the output is:

- `dist/dash-to-panel@tiagosantosvdl.github.com-74.3.1.zip`
- `dist/gnome-shell-extension-dash-to-panel-tiagosantosvdl_74.3.1_all.deb`
- `dist/SHA256SUMS`

Verify and install the local Debian build:

```sh
(cd dist && sha256sum -c SHA256SUMS)
sudo apt install ./dist/gnome-shell-extension-dash-to-panel-tiagosantosvdl_74.3.1_all.deb
```

Alternatively, `make install` builds and installs a per-user copy directly from
the checkout. After either installation method, log out and back in and enable
the extension as described above.

The Makefile's optional `VERSION` variable is an integer GNOME extension-version
override. The human-readable release version comes from `version-name` in
`metadata.json`; do not pass `74.3.1` as Makefile `VERSION`.

## Configuration and logs

Open preferences with:

```sh
gnome-extensions prefs dash-to-panel@tiagosantosvdl.github.com
```

Preferences cover panel position, visibility, appearance, window-button behavior,
keyboard shortcuts, and multiple monitors. Existing saved preferences take
precedence over repository defaults. Upstream's
[customization guide](https://github.com/home-sweet-gnome/dash-to-panel/wiki/Enable-and-Customize#customize-it)
provides additional background.

### Appearance and spacing

Under **Style → Global style**, **Window button border radius** controls window
buttons and **Tray border radius** controls the clock, system icons, and other
panel buttons. They are independent, support 0–20 pixels in steps of four, and
default to zero for square corners. The existing app-icon highlight radius
remains a separate override.

**Tray item padding** sets spacing around tray buttons. **Status icon padding**
sets spacing around individual status icons, including the notification bell.
These are separate from panel outer margins and padding. Icons and text supplied
by other extensions can also have internal spacing of their own.

### Workspace selector

Enable GNOME's Workspace Indicator extension, then open Dash to Panel preferences
→ **Position**. Move **Workspace selector** between **Taskbar** and **Right box**
in the panel element list. It has its own visibility and alignment controls and
defaults to immediately before the right box, including in existing saved layouts.

This positions the existing indicator on the panel that replaces GNOME's top bar.
It does not create indicators on other monitors or move the indicator when the
original top bar is kept.

### Troubleshooting

If the extension is not discovered immediately after installation, check the
installed package and log out and back in:

```sh
dpkg-query -W gnome-shell-extension-dash-to-panel-tiagosantosvdl
```

Follow relevant Shell messages with:

```sh
journalctl --user --follow --output=short-iso --grep 'dash-to-panel|Dash to Panel'
```

When reporting a problem, include relevant errors and the names and versions of
other extensions that modify the panel. Shell themes and third-party indicators
can affect appearance; declared compatibility does not establish every combination.

## Development and verification

Runtime source lives in `src/`, preferences UI in `ui/`, schemas in `schemas/`,
and translations in `po/`. Packaging uses the [Makefile](Makefile) and
[scripts/package-release.py](scripts/package-release.py). Agent guidance is in
[AGENTS.md](AGENTS.md).

Run checks relevant to your change:

```sh
node --check src/extension.js
node --experimental-vm-modules tests/workspace_selector_test.mjs
python3 -m unittest discover -s tests -p '*test.py'
glib-compile-schemas --strict --dry-run schemas
git diff --check
```

Syntax-check every changed JavaScript file. Workspace-selector tests use mocked
Shell dependencies. Packaging tests build real ZIP and Debian packages without
installing them and check payloads, checksums, versions, and permissions.

With development dependencies installed using `yarn.lock`, run Prettier and
ESLint in check mode:

```sh
yarn install --frozen-lockfile
yarn prettier 'src/**/*.js' --check
yarn eslint 'src/**/*.js'
```

`npm run lint` applies formatting and automatic fixes, so it changes source files.

The native [panel theme test](tests/panel_theme_test.js) checks every combination
of window and tray radius, both panel orientations, and interaction states using
GNOME St. It requires installed Shell/Mutter libraries and typelibs, memory-backed
settings, and a Shell theme stylesheet. See [AGENTS.md](AGENTS.md) for setup notes.
Computed styles and mocked tests do not verify compositor painting or login behavior.

Validate desktop behavior separately: both panel orientations, multiple monitors,
workspace-selector placement, window and tray highlighting, notification-bell
coverage, padding changes, and independent radius controls.

## Releases

Update `version-name` in `metadata.json` and version examples in this README.
Keep the integer GNOME `version` at `74` under this fork's current convention.
Release tags must match `version-name`, such as `v74.3.1`.

The [release workflow](.github/workflows/release.yml) checks source syntax,
schemas, tests, version consistency, and package checksums. It builds and publishes
packages when a matching version tag is pushed or a GitHub Release is published.
The manual **Run workflow** option builds downloadable artifacts without
publishing a release.

After checking and committing the release changes, build with `make release`,
verify its output, create an annotated tag for the new version, and push it with
`master`. Use a new version for each release; do not replace a published tag.
Confirm workflow success and actual release assets before announcing publication.

Release filenames follow the convention used by the neighboring extension forks:
`<uuid>-<version>.zip`,
`gnome-shell-extension-<name>-tiagosantosvdl_<debian-version>_all.deb`, and
`SHA256SUMS`. Prerelease tags such as `v74.3.1-rc.1` use `version-name`
`74.3.1 rc.1`, ZIP version `74.3.1-rc.1`, and Debian version `74.3.1~rc.1`.

## Issues and contributions

Report bugs and request features in
[this repository's issue tracker](https://github.com/tiagosantosvdl/dash-to-panel/issues).
Include your distribution, GNOME Shell and extension versions, session type,
monitor arrangement, Shell theme, relevant panel extensions, reproduction steps,
and relevant Shell error logs.

Submit changes through
[pull requests](https://github.com/tiagosantosvdl/dash-to-panel/pulls), with a
description of the behavior changed and verification performed. Upstream's
[contributing guide](https://github.com/home-sweet-gnome/dash-to-panel/wiki/Contributing)
provides additional background.

## Credits and licensing

This fork builds on Dash to Panel by [@jderose9](https://github.com/jderose9),
[@charlesg99](https://github.com/charlesg99), and the contributors and translators
credited below. Upstream project and donation links remain available through
[the original repository](https://github.com/home-sweet-gnome/dash-to-panel).

Significant portions of the code derive from
[Dash to Dock](https://micheleg.github.io/dash-to-dock/index.html) and
[ZorinOS Taskbar](https://github.com/ZorinOS/zorin-taskbar). Anchor positioning
uses work from [Bottom Panel](https://github.com/Thoma5/gnome-shell-extension-bottompanel).
Panel movement follows [Frippery Move Clock](http://frippery.org/extensions/)
by R M Yorston, and inline-style traversal draws on StatusAreaHorizontalSpacing.

Licensed under GPL-2.0-or-later; see [COPYING](COPYING).

### Contributors

- @franglais125 for launching apps by number (w/ overlay), bug fixes, and issue support
- @LinxGem33 and @sbarrett322 for artwork, logos, screenshots and design effort
- @dziku1337 for peek mode in window previews
- @robrobinbin for configuring appMenu on/off in the panel
- @MartinPL for toggling favorites on/off in panel
- @jackwickham for thumbnail middle and right click actions
- @abakkk for centering the taskbar icons in the panel, and animated taskbar hovering
- @quasoft for changing of font weight of ungrouped application titles
- @jordanribera for using icon's dominant color as running indicator color
- @tper0700 for dynamically building context menu based on system capabilities
- @levacic for configurable minimized application title font color
- @l3nn4rt for toggling workspace switch popup
- @hlechner for adjustable show desktop line color and window preview icon size
- @ArtyomZorin for animated urgent icons
- @jvpessoa10 for additional click window cycle options
- @marksvc for assigning percent of display for panel length
- @philippun1 for GNOME 40 support :rocket:
- @HaselLoyance for toggle for notification counter badge
- @rastersoft for Desktop Icons NG integration
- @max-dw-i for symbolic icons
- @Hirnmoder for Beautify DTP and panel border
- @JimBroad for grayscale icons
- @lufog for Gnome 50 support

### Bug fixes
@imrvelj, @Teslator, @bil-elmoussaoui, @brandon-schumann, @sw9, @rockon999 , @lexruee, @3v1n0, @freeroot, @moqmar, @ArtyomZorin, @lkc0987, @saibotk, @vanillajonathan, @Zkdc, @leebickmtu, @l3nn4rt, @Melix19, @Aikatsui, @melix99, @kyrillzorin, @oneshadab, @CorvetteCole, @vantu5z, @spectreseven1138, @aperezdc, @smedir, @lucaxvi, @andyholmes, @vowstar, @T99Rots, @City-busz, @guoqiyi, @gcrabbe, @Anduin2017, @xalt7x, @Survolog, @TorosFanny

### Documentation
@BoQsc, @zakkak, @dandv, @elliotwutingfeng

### Translations
@frnogueira / @victorwpbastos / @vagkaefer / @jotavionm (pt_BR), @zeten30 / @Amereyeu (cs), @franglais125 / @calotam / @oeramirez / @jhonatanseminario / @oscfdezdz (es), @LaurentTreguier / @SolarLiner / @DelphinPETER (fr), @elsieholmes / @xalt7x (uk), @hosiet / @zhmars (zh\_CN), @jonnius / @linuxr01 / @Etamuk / @daPhipz (de), @urbalazs / @pappfer (hu), @crayxt (kk), @pkomur / @MartinPL / @alex4401 / @konradmb / @alewicki95 / @0rzech (pl), @AlexGluck / @GoodNike / @rjapolov / @vantu5z / @Keleth / @code-ascend / @antohami (ru), @sicklylife-jp / @ryonakano / @nexryai / @Umoxfo (ja), @oltulu / @TeknoMobil / @daenney / @osmancoskun (tr), @sbadux / @kowalski7cc / @l3nn4rt / @albanobattistella (it), @OriginCode / @pan93412 (zh\_TW), @ojn (sv), @frandieguez (gl), @kuroehanako / @MarongHappy (ko), @jose1711 / @dodog (sk), @eshagh79 (fa), @EkaterinePapava (ka), @jamalkamaladdin (az)
