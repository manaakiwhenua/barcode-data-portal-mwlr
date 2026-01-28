# Issue: JS ChunkLoadError - Elementor chunks loading from v5.boldsystems.org

**Status:** Deferred  
**Date Identified:** 2026-01-28  
**Severity:** Medium (causes console errors, may affect some UI features)

## Symptoms

Browser console shows errors like:
```
ChunkLoadError: Loading chunk 645 failed.
(error: https://v5.boldsystems.org/wp-content/plugins/elementor/assets/js/text-editor.2c35aafbe5bf0e127950.bundle.min.js)
```

The page tries to load JavaScript chunks from the original upstream domain (`v5.boldsystems.org`) instead of locally.

## Root Cause

The WordPress/Elementor templates contain **base64-encoded inline JavaScript** that hardcodes the original domain for asset URLs.

### Location of Hardcoded Config

In HTML templates like `src/templates/wp-templates/inst_home.html`, there's a base64-encoded script:
```html
<script id="starter-templates-zip-preview-js-extra">
var starter_templates_zip_preview = {"starter_templates_starter_templates_zip_preview":".....BASE64....."};
</script>
```

When decoded, this contains `elementorFrontendConfig` with:
```javascript
"urls": {
  "assets": "https://v5.boldsystems.org/wp-content/plugins/elementor/assets/"
}
```

This tells Elementor's webpack runtime where to load dynamic chunks from.

### Webpack Chunk Loading Mechanism

The LiteSpeed-optimized JS bundle at:
```
src/static/wp-content/litespeed/js/57242b137be14958b765098d4cc102573bba.js
```

Contains the chunk loader that uses `elementorFrontendConfig.urls.assets` as the base path.

The chunk mappings found in the bundle:
| Chunk ID | Filename |
|----------|----------|
| 48 | lightbox.26bf6b6c4232d8789c0e.bundle.min.js |
| 58 | text-path.2bc8a9cd0e50cf1a5a9c.bundle.min.js |
| 209 | accordion.8799675460c73eb48972.bundle.min.js |
| 331 | alert.cbc2a0fee74ee3ed0419.bundle.min.js |
| 498 | counter.4470d7d tried8234a85ef572a7.bundle.min.js |
| 520 | progress.985f012a6336ab21cb44.bundle.min.js |
| 536 | tabs.c2af5be7f9cb3cdcf3d5.bundle.min.js |
| 608 | toggle.31881477c45ff5cf9d4d.bundle.min.js |
| 632 | video.78c625e89ab767d621c5.bundle.min.js |
| 637 | image-carousel.4455c6362492d9067512.bundle.min.js |
| 645 | text-editor.2c35aafbe5bf0e127950.bundle.min.js |
| 698 | wp-audio.75f0ced143febb8cd31a.bundle.min.js |
| 723 | container.c65a2a923085e1120e75.bundle.min.js |

### Missing Local Chunks

The local directory `src/static/wp-content/plugins/elementor/assets/js/` is nearly empty - it only contains:
- `counter.4470d78234a85ef572a7.bundle.min.js`

All other chunks are missing.

## Potential Solutions

### Option 1: Download Missing Chunks (Quick Fix)

Download the missing chunks from v5.boldsystems.org to the local static directory:

```bash
cd /home/users/wydrac/src/github.com/manaakiwhenua/barcode-data-portal-mwlr/src/static/wp-content/plugins/elementor/assets/js/

CHUNKS=(
  "lightbox.26bf6b6c4232d8789c0e.bundle.min.js"
  "text-path.2bc8a9cd0e50cf1a5a9c.bundle.min.js"
  "accordion.8799675460c73eb48972.bundle.min.js"
  "alert.cbc2a0fee74ee3ed0419.bundle.min.js"
  "progress.985f012a6336ab21cb44.bundle.min.js"
  "tabs.c2af5be7f9cb3cdcf3d5.bundle.min.js"
  "toggle.31881477c45ff5cf9d4d.bundle.min.js"
  "video.78c625e89ab767d621c5.bundle.min.js"
  "image-carousel.4455c6362492d9067512.bundle.min.js"
  "text-editor.2c35aafbe5bf0e127950.bundle.min.js"
  "wp-audio.75f0ced143febb8cd31a.bundle.min.js"
  "container.c65a2a923085e1120e75.bundle.min.js"
)

for chunk in "${CHUNKS[@]}"; do
  curl -o "$chunk" "https://v5.boldsystems.org/wp-content/plugins/elementor/assets/js/$chunk"
done
```

**Pros:** Quick fix, no template changes needed  
**Cons:** Still relies on upstream version, may need updating if upstream changes

### Option 2: Patch Base64-Encoded Configs (Long-term Fix)

1. Decode the base64 sections in HTML templates
2. Replace `https://v5.boldsystems.org` with relative paths or local domain
3. Re-encode and update templates

Affected templates (likely):
- `src/templates/wp-templates/inst_home.html`
- `src/templates/wp-templates/datasets.html`
- Other wp-templates files

**Pros:** Proper fix, removes upstream dependency  
**Cons:** More complex, need to handle multiple templates

### Option 3: Nginx/Traefik Proxy Rewrite

Add a reverse proxy rule to intercept requests to v5.boldsystems.org and serve local files instead.

**Pros:** No code changes needed  
**Cons:** Adds infrastructure complexity, masks the real issue

## Files Involved

- `src/templates/wp-templates/*.html` - HTML templates with base64 configs
- `src/static/wp-content/litespeed/js/57242b137be14958b765098d4cc102573bba.js` - Webpack bundle
- `src/static/wp-content/plugins/elementor/assets/js/` - Where chunks should exist

## Impact

- Console errors on page load
- Some Elementor widgets may not function (accordions, tabs, video players, etc.)
- Affects visual components on institution and dataset pages

## Notes

- The upstream site v5.boldsystems.org is the original BOLD Systems portal
- This project appears to be a fork/adaptation of the BOLD portal
- The hardcoded URLs are an artifact of the original WordPress/Elementor setup
