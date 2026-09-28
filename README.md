# SOUTH BLR Check-in

Standalone, frontend-only QR scanner for event staff. The event window is fixed to 4 October 2026, 7:30–11:30 PM Asia/Kolkata. It reads and displays QR contents; it does not validate passes.

## Run locally

```sh
npm install
npm run dev
```

Camera access requires a secure context (HTTPS, or localhost during development). `npm run build` creates the static site in `dist/`; deploy that folder to any static host.

The window calculation is in `src/main.jsx` as UTC instants matching the published IST times. Before and after the event there is no scanner component and no camera permission request. While active, allow camera access and use a rear-camera-capable phone browser.
