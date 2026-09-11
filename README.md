# Google AI Search Auto-Continue

A small browser extension that automatically clicks **Yes, continue** on Google's
**Continue with this search?** warning dialog. One unpacked directory runs on
Chrome/Chromium, Firefox desktop, and Firefox for Android.

It does not hide the dialog with CSS. The content script watches Google pages for
new UI, requires the URL query parameter `udm=50`, verifies the dialog title, warning
text, **No thanks** option, and visible **Yes, continue** button, then performs a real
button click. This makes it work with Google's client-side navigation while reducing
the chance of clicking an unrelated button.

## Install in Chrome / Chromium

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select this project directory.
5. Reload any Google tabs that were already open.

Chrome ignores the `browser_specific_settings` key; some Chromium builds note it as an
unrecognized manifest key, which is harmless.

## Install in Firefox (desktop)

For a temporary install that lasts until you restart Firefox:

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and pick this directory's `manifest.json`.
3. Reload any Google tabs that were already open.

Release Firefox only installs *signed* add-ons permanently. To keep it across restarts,
either sign it on [addons.mozilla.org](https://addons.mozilla.org/developers/) and
install the resulting `.xpi` via **about:addons → gear → Install Add-on From File**, or
use Firefox Developer Edition / Nightly with `xpinstall.signatures.required` set to
`false` in `about:config`.

Check **about:addons → this extension → Permissions** and make sure it is allowed to run
on `google.com`.

## Install in Firefox for Android

Android has no "install from file" option, so there are two routes.

**Testing over USB** (temporary, no signing). Needs Firefox Nightly on the phone with
*Settings → Advanced → Remote debugging via USB* enabled, plus `adb` on your machine:

```sh
adb devices                 # confirm the phone is listed and authorized
npm run start:android       # downloads web-ext on first run
```

If you have more than one device, pass it through:
`npm run start:android -- --adb-device <serial>`.

**Permanent install.** Submit the built `.xpi` to
[addons.mozilla.org](https://addons.mozilla.org/developers/) as a listed add-on (you can
mark it as not shown in search results), then open its AMO page in Firefox for Android
and tap **Add to Firefox**. See [Building](#building) for the packaging step.

The manifest declares Android support via `browser_specific_settings.gecko_android`, so
AMO will list it as Android-compatible.

Open the extension's popup to pause or resume it — the toolbar icon on desktop, or
**⋮ → Extensions** on Android. It is enabled by default.

## Building

There is no build step. The source in this directory *is* the extension — that is what
`Load unpacked` and `Load Temporary Add-on…` consume, and editing a file and reloading
the extension is the whole edit cycle.

You only need a package when uploading to a store or signing for a permanent install:

```sh
npm run build:firefox
# -> web-ext-artifacts/google_ai_search_auto-continue-1.0.0.zip
```

That produces a plain zip of the extension files, excluding `test/` and `package.json`.
The version in the filename comes from `manifest.json`, so bump `version` there before
packaging a new release.

- **Firefox / AMO** — upload the zip at
  [addons.mozilla.org/developers](https://addons.mozilla.org/developers/). AMO signs it
  and returns an `.xpi`. Run `npm run lint:firefox` first; it runs the same validator
  AMO does, and CI runs it on every push.
- **Chrome Web Store** — the same zip works. Chrome ignores `browser_specific_settings`.
  Note the store requires extension icons, which this manifest does not yet declare.

## Privacy and scope

- Runs only on `google.com` and `www.google.com` — not on any other Google subdomain
  (no Gmail, Docs, Drive) — and clicks only when `udm=50` is set.
- Uses no network requests and collects no browsing or query data.
- Stores only the enabled toggle, the number of prompts handled, and the last-click
  timestamp in local extension storage.

## Important

This deliberately bypasses a Google safety confirmation. Enable it only if you want
every matching prompt accepted automatically. Google may change the prompt's wording
or markup; the extension intentionally stops clicking if its safety checks no longer
match.

## Development

The extension itself has no dependencies. Run the tests with:

```sh
npm test
```

The Firefox helper scripts shell out to Mozilla's `web-ext` at a pinned version via
`npx`, so nothing is installed into the project; the first run of each downloads it:

```sh
npm run lint:firefox        # validates the manifest against AMO's rules
npm run start:firefox       # launches a temporary profile on the desktop browser
npm run start:android       # side-loads onto Firefox Nightly over adb
npm run build:firefox       # packages web-ext-artifacts/*.zip for signing
```

`.github/workflows/ci.yml` runs the tests, a syntax check of the page-facing scripts,
and the AMO linter on every push to `master` and every pull request.
