### 26.0.1

2026-02-15 12:33

#### CHANGED

- Settings label "Random Wallpaper" to "Picsum Wallpaper"; template and README/docs describe Picsum (seed, blur, grayscale)
- Toolbar bar overlay: hard-light blend and hsla overlay; top-level menu item text color #111 (dark) with .dark overrides for Apple/app name
- Help search field: no background on .helpsearch, rounded field, padding for icon, 90% width
- Dark mode: .dark > ul ul mix-blend-mode multiply; submenu li and first dropdown color set for contrast; expose and screenshot-close text color

#### NEW

- Picsum wallpaper: dialog with seed (stored in localStorage), blur slider (0-10), grayscale; 2400x1350 (16:9) image; replaces Unsplash
- Help search: input type search, placeholder "Search", no "Search" label text; magnifying glass icon in field via CSS (label::before)

#### IMPROVED

- Handler/callout: quote style consistency; Option-click adds .last when adding arrow or shortcut callout

#### FIXED

- Option-click callout (arrow or shortcut) now also applies .last so the menu item is highlighted with the callout
- Picsum dialog labels visible in dark mode (explicit color:#111 and light input styling so dialog stays light-themed)

### 1.0.9

2023-05-03 12:05

#### IMPROVED

- Update submenu indicator for Ventura styling
- Reduce font size for Ventura visible compatibility
- Better font stack for macOS system font

### 1.0.8

- Update submenu indicator

### 1.0.7

- update docs

### 1.0.4

- force wallpaper update when switching dark mode
- reload page after expose to restore width
- reorder submenu
- menu transparency in dark mode

### 1.0.1

- Refactored all JS code

### 1.0.0

- Rewritten JavaScript API
- Keyboard shortcuts in menu
- Customizable desktop images

### 0.1.4

- js api touchup
- Adds keyboard shortcuts in menu


### 0.1.3

- Click behavior, demo tutorial
- Better callout handling
- Onscreen tutorial for demo pages
- Position arrow callout on left if item has submenu


### 0.1

- Initial release
