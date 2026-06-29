<!-- @context: {
  "kind": "design.checkpoint",
  "layer": "docs",
  "name": "flare_brand_identity_v0",
  "domains": ["flare", "brand", "design", "identity", "logo", "visual-system"]
} -->

# Flare Brand Identity V0 Checkpoint

## Decision

Flare's visual identity should center on a calm but urgent help signal: a red-white beacon rising from a grounded horizon, surrounded by soft signal rings.

The chosen concept direction is:

- soft, minimal, and premium
- emotionally calm but clearly urgent
- red flare as the focal signal
- pale background with subtle atmospheric glow
- dark, elegant wordmark
- tagline: `SEND A SIGNAL. GET HELP.`

## Visual metaphor

Flare is not decorative "flair." It is a signal.

The logo should communicate:

- urgent reach-out
- interruption of the spiral
- help signal sent
- grounded support
- calm emergency response

## Keeper concept

The current keeper concept uses:

- a thin vertical white-red beacon beam
- a bright red-white starburst flare
- translucent red/pink concentric signal rings
- a low abstract curved horizon/base
- dark charcoal `FLARE` wordmark
- small uppercase tagline with `GET HELP.` emphasized in red

The curved base is preferred over the earlier mountain/volcano shape because it reduces the chance of reading the mark as an erupting volcano.

## Avoid

Future iterations should avoid:

- volcano or eruption imagery
- mountains that imply lava or pressure release
- decorative stickers, badges, pins, or work-vest "flair"
- harsh alarmist emergency styling
- overly clinical or institutional design
- busy support-network diagrams for the main logo

## Production asset set needed

Create production-ready versions of:

1. Full lockup
   - icon + `FLARE` + `SEND A SIGNAL. GET HELP.`

2. Logo lockup
   - icon + `FLARE`
   - no tagline

3. Icon mark
   - flare + rings + curved horizon
   - no text

4. App icon
   - simplified flare/star/rings
   - optimized for small sizes

5. Dark mode variant
   - dark navy/charcoal background
   - red-white beacon remains primary focus

6. Monochrome variant
   - docs, loading states, favicons, print, fallback use

## Initial color direction

Suggested starting tokens:

```ts
export const flareBrand = {
  flareRed: "#EF3B3B",
  flareRedSoft: "#F7A3A3",
  flareInk: "#1F2A33",
  flareMist: "#F7F3F2",
  flareGray: "#8A949E",
};
Production criteria

The final logo should:

remain legible at small sizes
work without the tagline
preserve the calm/urgent emotional balance
clearly read as a beacon/help signal
be recreated as controlled vector/SVG assets rather than relying only on generated raster output
support app icon, splash screen, onboarding, and landing page use
Current status

Status: concept direction selected.

Next step: recreate the keeper concept as controlled vector/SVG assets and derive the app icon, logo mark, full lockup, and dark-mode variants.
