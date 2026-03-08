# Running Notes

Working notes for design and implementation decisions that are useful to keep around, but do not belong in the main product spec.

## Map Design

### Current behavior

- The map defaults to an endpoint-focused view instead of the full-world view.
- The SVG `viewBox` is computed from the padded bounding box that contains the puzzle start and target countries.
- Country outline borders are configurable and default to off.

### Implementation details

- Map presentation defaults live in `src/lib/border-chain/config.ts` under `MAP_PRESENTATION`.
- Viewport calculation lives in `src/lib/border-chain/mapView.ts`.
- The viewport falls back to the full-world `viewBox` for seam-crossing country geometry so the map does not zoom to a broken bounds box.

### Current tuning knobs

- `endpointPadding`
- `minViewportWidth`
- `minViewportHeight`
- `showCountryBorders`
- `zoomToEndpoints`
