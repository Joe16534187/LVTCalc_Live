# Land Value Tax Calculator — Scotland

A static web application that displays property land values across Aberdeenshire and Aberdeen on an interactive map, and allows users to compare their current tax payments against estimated Land Value Tax (LVT) figures.

## What it does

Users can explore a map of properties colour-coded by land value per m², click on any property to view its details, and then enter their actual Council Tax and/or LBTT payments to see whether they would pay more or less under a Land Value Tax system.

## Technology

- **MapLibre GL JS v4** — interactive map with GPU-accelerated vector tile rendering
- **PMTiles v3** — cloud-optimised tile format served from Cloudflare R2
- **CartoDB Voyager** — map tiles
- No build process, no backend, no dependencies to install

## Files

```
├── index.html     # Main page
├── styles.css     # Stylesheet
├── app.js         # Application logic
```

## Data

Property polygons (145,722 features) are served as a PMTiles file from Cloudflare R2, enabling efficient HTTP range requests without loading the full dataset.

Each feature includes:

| Field | Description |
|---|---|
| `Label` | Property identifier |
| `Area` | Area in m² |
| `Land_Value_Combined` | Total land value (£) |
| `Building_Value_Combined` | Total building value (£) |
| `Council_Tax_Amount` | Estimated LVT equivalent of Council Tax (£) |
| `LBTT_Amount` | Estimated LVT equivalent of LBTT (£) |
| `Land_Value_per_m2` | Land value per m² (£) — used for map colouring |

## Disclaimer

Values are estimates based on statistical models. For research and comparison purposes only — not for use in financial or legal decisions.
