# Land Value Tax Calculator — England & Wales

A static web application that displays estimated land values across England and Wales on an interactive map, and allows users to compare their current tax payments against an equivalent Land Value Tax (LVT) figure.

## What it does

Users can explore a map colour-coded by land value per m², zoom in to view individual land parcels, and enter what they currently pay across up to 14 common UK taxes to see the equivalent LVT amount for their selected property.

## Technology

- **MapLibre GL JS 4** — WebGL-accelerated vector tile rendering
- **PMTiles** — single-file tile archive format, served from Cloudflare R2
- **CartoDB Voyager** — base map tiles
- No build process, no backend, no dependencies to install

## Files

```
├── index.html          # Main page and tax calculator UI
├── styles.css          # Stylesheet
├── app.js              # Map logic and calculator
└── tax_config.json     # Tax definitions and national revenue figures
```

## Map layers

The PMTiles archive contains three vector layers that activate at different zoom levels:

| Layer      | Source layer | Zoom | Description                       |
|------------|--------------|------|-----------------------------------|
| Background | `background` | 6–13 | 1 km² aggregate cells             |
| Grid       | `grid`       | 13+  | 100 m × 100 m grid cells          |
| Parcels    | `parcels`    | 13+  | Individual Land Registry polygons |

At zoom 13 a toggle button appears, allowing you to switch between grid view and parcel view. The map defaults to grid view below zoom 15 and switches automatically to parcel view at zoom 15 and above.

Clicking a grid cell or parcel shows its details and enables the tax calculator. Clicking a background cell resets both panels to their placeholder state.

## Colour scale

Features are coloured continuously by land value per m²:

| £/m²   | Colour         |
|--------|----------------|
| 0      | Very dark navy |
| 50     | Dark blue      |
| 150    | Blue           |
| 300    | Sky blue       |
| 600    | Cyan           |
| 1,200  | Teal           |
| 2,500  | Emerald        |
| 5,000  | Green          |
| 10,000 | Lime           |
| 20,000 | Yellow         |

## Tax calculator

The calculator supports 14 UK taxes across four groups:

- **Earnings** — Income Tax, National Insurance
- **Capital** — Capital Gains Tax, Inheritance Tax
- **Property** — Council Tax, SDLT / LTT
- **Consumption** — VAT, Fuel Duty, Alcohol Duty, Tobacco Duty, IPT, VED, Betting Duty, SDIL

Users enter what they currently pay for any combination of taxes. The calculator sums the annual total and converts it to an equivalent LVT rate, applied to the selected parcel's estimated land value. Tax definitions and national revenue figures are loaded from `tax_config.json`.

## Running locally

The site must be served from a web server (not opened as a file) because browsers block cross-origin PMTiles requests from `file://`.

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploying

The site is 100% static. It is deployed on GitHub Pages from the root of the `main` branch. Tile data is hosted separately on Cloudflare R2 and requires no configuration.

Settings → Pages → Deploy from branch → main / root.

## Data sources

Land value estimates are derived from modelled valuation data for England and Wales. Property geometries are sourced from HM Land Registry INSPIRE Index Polygons. Tax revenue figures used to calculate the national LVT rate are drawn from HMRC statistics.

## Disclaimer

Values are modelled estimates and should be treated as indicative only. For research and educational purposes — not for use in financial or legal decisions.
