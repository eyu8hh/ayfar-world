# Local design and browser CLIs

The project pins these development tools in package.json. Run from the repository root after `npm install`.

## Impeccable detector
```sh
npx impeccable --help
npx impeccable detect .
npx impeccable detect --json . > artifacts/impeccable.json
```

The detector reports design-quality findings; it does not modify source files.

## Playwright CLI
```sh
npx playwright-cli --help
npx playwright-cli open http://127.0.0.1:4173/
npx playwright-cli screenshot
```

For repeatable project tests:
```sh
npm run test:e2e
npm run qa
```

## Lighthouse
```sh
npm run serve
npx lighthouse http://127.0.0.1:4173/ --form-factor=mobile
```

The GitHub Actions quality workflow installs Chromium and runs the repeatable checks. Interactive CLI sessions require a local terminal/browser session; they are not provided by the static GitHub Pages runtime.
