# FORMA Construction

A responsive construction company website with architectural imagery, scroll reveals, perspective hover effects, and a real WebGL house and interior tour using Three.js. The reference-inspired two-storey house has a carport, car, stone cladding, glass balcony, exterior stairs, planted courtyard, timber gate, and warm lighting.

The exterior is an approximation from the supplied photograph, not a measured reconstruction. The living room, kitchen, and bedroom are illustrative interior designs; the balcony uses the exterior model. Room navigation switches between furnished scenes, with bounded walking inside each room rather than a continuous measured floor plan.

## Preview

Run `npm run dev`, then open http://localhost:3000/#approach. Run `npm run check` for JavaScript syntax validation. Three.js and OrbitControls are vendored locally, so no installation or build is needed to preview. The npm dependency and lockfile record the bundled library version; its MIT license is retained in `vendor/THREE-LICENSE.txt`.

## Customize

- Replace the sample FORMA brand, copy, and illustrative project concepts in `index.html` and `script.js`.
- Set colors and typography in `styles.css`.
- Photographs load from Unsplash and fonts from Google Fonts; internet access is needed for these assets.
- The project brief form downloads a text file locally. It does not send inquiries or store data on a server. Connect a real submission service and company contact details before using it for lead collection.

## Interactions

Click the house or **Step inside** to enter the tour. Outside, drag to orbit and scroll/pinch to zoom. Inside, drag or use arrow keys to look, use WASD or the on-screen buttons to move, and use the four room buttons to change spaces. Escape or **Exit tour** returns to the exterior. **Dusk** toggles the lighting. Keyboard users can focus the canvas and press Enter to enter. Furniture collision bounds limit movement within rooms. The tour uses a native modal dialog, supports touch, and respects reduced-motion preferences.

Also includes project category filters and detail dialogs, service selector, mobile navigation, project brief download, and scroll progress. The renderer pauses offscreen and caps pixel density. WebGL is required for the tour; an explanatory fallback appears if initialization fails.

## Deploy

Host `index.html`, `styles.css`, `script.js`, `house-tour.css`, `house-tour.mjs`, `assets/`, and `vendor/` with any static website provider. `server.js` is a local preview server and is not required by static hosting. Keep the import map and vendored module paths together. Other than the site's original remote photography and fonts, the 3D experience is self-contained.
