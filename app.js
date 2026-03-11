// LVT Calculator — MapLibre GL JS with native PMTiles support
let map;
let selectedFeatureId = null;
let selectedLayer     = null;
let taxConfig         = null;
let currentLandValue  = 0;
let viewMode          = 'grid';   // 'grid' | 'parcel'
let prevZoomBand      = null;     // 'high' | 'low' — tracks zoom-band for auto-switch

// New England & Wales dataset hosted on Cloudflare R2
const PMTILES_URL = 'https://pub-0c22d4d57e6b471ba2094e8367175705.r2.dev/land_values.pmtiles';

// Zoom threshold above which parcel view is the default
const PARCEL_DEFAULT_ZOOM = 15;

// Reference plot area used in the Step 11 normalisation (m²)
const REF_AREA_M2 = 150;

// Continuous colour ramp for background and grid layers, keyed on
// land_value_per_sqm (£/m²) stored on the normalised 150 m² basis.
// Uses interpolate/linear so adjacent features blend smoothly.
// to-number coercion is required because tippecanoe stores some values as
// strings (Mixed type in PMTiles metadata).
//
// Stop calibration — approximate E&W distribution:
//   £0–50      near-zero / missing data (very dark navy)
//   £50–300    rural / agricultural
//   £300–800   suburban residential
//   £800–3000  urban / town centres
//   £3000–10k  major city cores (Birmingham, Manchester, Leeds …)
//   £10k–20k   prime London
const LV_COLOUR_RAMP = [
    'interpolate',
    ['linear'],
    ['to-number', ['coalesce', ['get', 'land_value_per_sqm'], 0], 0],
    0,     '#0f172a',
    50,    '#1e3a8a',
    150,   '#2563eb',
    300,   '#0ea5e9',
    600,   '#06b6d4',
    1200,  '#14b8a6',
    2500,  '#10b981',
    5000,  '#22c55e',
    10000, '#a3e635',
    20000, '#fde047'
];

// Parcel colour ramp — same stops as LV_COLOUR_RAMP but keyed on the
// ACTUAL land value per m² (corrected for plot size) rather than the
// normalised 150 m² stored value.
//
// The stored land_value_per_sqm in PMTiles is on a normalised 150 m² basis
// (Step 11: lv_per_sqm_stored = land_value_est / sqrt(plot_area × 150)).
// To recover the actual per-m² value we multiply by sqrt(150 / area_m2).
// MapLibre evaluates this entirely client-side using the feature's area_m2
// attribute — no PMTiles regeneration required.
const LV_COLOUR_RAMP_PARCEL = [
    'interpolate',
    ['linear'],
    [
        '*',
        ['to-number', ['coalesce', ['get', 'land_value_per_sqm'], 0], 0],
        ['sqrt', ['/', 150, ['max', ['to-number', ['coalesce', ['get', 'area_m2'], 150], 150], 1]]]
    ],
    0,     '#0f172a',
    50,    '#1e3a8a',
    150,   '#2563eb',
    300,   '#0ea5e9',
    600,   '#06b6d4',
    1200,  '#14b8a6',
    2500,  '#10b981',
    5000,  '#22c55e',
    10000, '#a3e635',
    20000, '#fde047'
];

// Area filter: hide parcels larger than 10,000 m².  Large landholdings are
// covered adequately by the grid layer and create visual clutter as parcels.
const PARCEL_AREA_FILTER = ['<', ['to-number', ['get', 'area_m2'], 0], 10000];

// Register the PMTiles protocol with MapLibre before the map is created.
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile.bind(protocol));

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setupEventListeners();
    fetch('tax_config.json')
        .then(r => r.json())
        .then(cfg => { taxConfig = cfg; })
        .catch(err => console.warn('tax_config.json not loaded:', err));
});

function initMap() {
    map = new maplibregl.Map({
        container: 'map',
        style: {
            version: 8,
            sources: {
                'carto-basemap': {
                    type: 'raster',
                    tiles: [
                        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
                        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
                        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'
                    ],
                    tileSize: 256,
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                },
                'land-values': {
                    type: 'vector',
                    url: 'pmtiles://' + PMTILES_URL
                },
                'grid-selected': {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: [] }
                }
            },
            layers: [
                {
                    id: 'basemap',
                    type: 'raster',
                    source: 'carto-basemap'
                },

                // ── Background layer ─────────────────────────────────────────────
                // 1 km × 1 km cells — median-aggregated from the 100 m grid.
                // Visible at z6–z13 to cover the country-level view before the
                // finer grid and parcel layers kick in at z13.
                {
                    id: 'background-fill',
                    type: 'fill',
                    source: 'land-values',
                    'source-layer': 'background',
                    maxzoom: 14,
                    paint: {
                        'fill-color': LV_COLOUR_RAMP,
                        'fill-opacity': 0.6
                    }
                },

                // ── Grid layer ───────────────────────────────────────────────────
                // 100 m × 100 m cells covering all of England & Wales.
                // Coloured on the normalised 150 m² reference plot basis.
                {
                    id: 'grid-fill',
                    type: 'fill',
                    source: 'land-values',
                    'source-layer': 'grid',
                    minzoom: 13,
                    paint: {
                        'fill-color': LV_COLOUR_RAMP,
                        'fill-opacity': 0.45
                    }
                },

                // ── Parcel layer ─────────────────────────────────────────────────
                // INSPIRE-registered land parcel polygons.
                // Coloured on the actual plot-size basis in parcel mode;
                // applyViewMode() swaps the paint expression as needed.
                {
                    id: 'parcels-fill',
                    type: 'fill',
                    source: 'land-values',
                    'source-layer': 'parcels',
                    minzoom: 13,
                    filter: PARCEL_AREA_FILTER,
                    paint: {
                        'fill-color': LV_COLOUR_RAMP,
                        'fill-opacity': 0.65
                    }
                },
                // Parcel outlines only from z14
                {
                    id: 'parcels-outline',
                    type: 'line',
                    source: 'land-values',
                    'source-layer': 'parcels',
                    minzoom: 14,
                    filter: PARCEL_AREA_FILTER,
                    paint: {
                        'line-color': '#ffffff',
                        'line-width': 0.5,
                        'line-opacity': 0.4
                    }
                },

                // ── Selection highlight (parcel) ──────────────────────────────────
                {
                    id: 'parcels-selected-fill',
                    type: 'fill',
                    source: 'land-values',
                    'source-layer': 'parcels',
                    minzoom: 13,
                    paint: {
                        'fill-color': '#facc15',
                        'fill-opacity': 0.7
                    },
                    filter: ['==', ['get', 'inspire_id'], '']
                },
                {
                    id: 'parcels-selected-outline',
                    type: 'line',
                    source: 'land-values',
                    'source-layer': 'parcels',
                    minzoom: 13,
                    paint: {
                        'line-color': '#facc15',
                        'line-width': 2.5,
                        'line-opacity': 1
                    },
                    filter: ['==', ['get', 'inspire_id'], '']
                },

                // ── Selection highlight (grid) ────────────────────────────────────
                {
                    id: 'grid-selected-fill',
                    type: 'fill',
                    source: 'grid-selected',
                    paint: {
                        'fill-color': '#facc15',
                        'fill-opacity': 0.7
                    }
                },
                {
                    id: 'grid-selected-outline',
                    type: 'line',
                    source: 'grid-selected',
                    paint: {
                        'line-color': '#facc15',
                        'line-width': 2.5,
                        'line-opacity': 1
                    }
                }
            ]
        },
        center: [-1.8, 52.5],
        zoom: 6
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
        console.log('MapLibre map loaded');
        document.getElementById('loadingOverlay').classList.add('hidden');

        // Set initial view mode based on starting zoom.
        // prevZoomBand must be initialised here so the first zoomend event
        // doesn't trigger an unwanted mode switch.
        const initialZoom = map.getZoom();
        prevZoomBand = initialZoom >= PARCEL_DEFAULT_ZOOM ? 'high' : 'low';
        applyViewMode(prevZoomBand === 'high' ? 'parcel' : 'grid');
        updateToggleVisibility(initialZoom);
    });

    map.on('error', (e) => {
        console.error('MapLibre error:', e);
    });

    // ── Auto-switch view mode on zoom threshold crossing ──────────────────────
    // Only fires when crossing z15 (PARCEL_DEFAULT_ZOOM), not on every zoom.
    map.on('zoomend', () => {
        if (!map.isStyleLoaded()) return;
        const zoom = map.getZoom();
        const band = zoom >= PARCEL_DEFAULT_ZOOM ? 'high' : 'low';
        if (band !== prevZoomBand) {
            prevZoomBand = band;
            applyViewMode(band === 'high' ? 'parcel' : 'grid');
        }
        updateToggleVisibility(zoom);
    });

    // ── Mode-aware click handler ──────────────────────────────────────────────
    map.on('click', (e) => {
        if (!map.isStyleLoaded()) return;

        if (viewMode === 'parcel') {
            // Parcel mode: only query the parcel layer (grid is hidden)
            const parcelFeatures = map.queryRenderedFeatures(e.point, { layers: ['parcels-fill'] });
            if (parcelFeatures.length > 0) {
                const props = parcelFeatures[0].properties;
                selectedFeatureId = props.inspire_id;
                selectedLayer     = 'parcels';
                map.setFilter('parcels-selected-fill',    ['==', ['get', 'inspire_id'], selectedFeatureId]);
                map.setFilter('parcels-selected-outline', ['==', ['get', 'inspire_id'], selectedFeatureId]);
                showPropertyDetails(props, 'parcel');
            }
            return;
        }

        // Grid mode: query grid first, then fall back to background
        const gridFeatures = map.queryRenderedFeatures(e.point, { layers: ['grid-fill'] });
        if (gridFeatures.length > 0) {
            const props = gridFeatures[0].properties;
            selectedLayer = 'grid';
            map.setFilter('parcels-selected-fill',    ['==', ['get', 'inspire_id'], '']);
            map.setFilter('parcels-selected-outline', ['==', ['get', 'inspire_id'], '']);
            map.getSource('grid-selected').setData({ type: 'FeatureCollection', features: [gridFeatures[0]] });
            showPropertyDetails(props, 'grid');
            return;
        }

        // Fall back to background cell (1 km, visible at low zoom).
        // Background cells are too coarse for LVT estimates — reset panels.
        const bgFeatures = map.queryRenderedFeatures(e.point, { layers: ['background-fill'] });
        if (bgFeatures.length > 0) {
            selectedLayer = 'background';
            map.setFilter('parcels-selected-fill',    ['==', ['get', 'inspire_id'], '']);
            map.setFilter('parcels-selected-outline', ['==', ['get', 'inspire_id'], '']);
            map.getSource('grid-selected').setData({ type: 'FeatureCollection', features: [] });
            resetPanels();
        }
    });

    // Pointer cursor when hovering over clickable layers (mode-aware)
    map.on('mousemove', (e) => {
        if (!map.isStyleLoaded()) return;
        const activeLayers = viewMode === 'parcel'
            ? ['parcels-fill']
            : ['background-fill', 'grid-fill'];
        const features = map.queryRenderedFeatures(e.point, { layers: activeLayers });
        map.getCanvas().style.cursor = features.length > 0 ? 'pointer' : '';
    });
}

// Apply a view mode ('grid' or 'parcel'), updating layer visibility,
// colour ramp, toggle button state, and resetting any active selection.
function applyViewMode(mode) {
    viewMode = mode;
    const isParcel = (mode === 'parcel');

    // Layer visibility: show the active mode, hide the other
    map.setLayoutProperty('grid-fill',                'visibility', isParcel ? 'none' : 'visible');
    map.setLayoutProperty('grid-selected-fill',       'visibility', isParcel ? 'none' : 'visible');
    map.setLayoutProperty('grid-selected-outline',    'visibility', isParcel ? 'none' : 'visible');
    map.setLayoutProperty('parcels-fill',             'visibility', isParcel ? 'visible' : 'none');
    map.setLayoutProperty('parcels-outline',          'visibility', isParcel ? 'visible' : 'none');
    map.setLayoutProperty('parcels-selected-fill',    'visibility', isParcel ? 'visible' : 'none');
    map.setLayoutProperty('parcels-selected-outline', 'visibility', isParcel ? 'visible' : 'none');

    // Colour ramp: actual per-m² (area-corrected) in parcel mode,
    // normalised 150 m² basis in grid mode.
    map.setPaintProperty(
        'parcels-fill', 'fill-color',
        isParcel ? LV_COLOUR_RAMP_PARCEL : LV_COLOUR_RAMP
    );

    // Segmented toggle: highlight the active button
    document.getElementById('viewToggleBtnGrid')?.classList.toggle('active', !isParcel);
    document.getElementById('viewToggleBtnParcel')?.classList.toggle('active', isParcel);

    // Clear any active selection
    selectedFeatureId = null;
    selectedLayer     = null;
    map.setFilter('parcels-selected-fill',    ['==', ['get', 'inspire_id'], '']);
    map.setFilter('parcels-selected-outline', ['==', ['get', 'inspire_id'], '']);
    map.getSource('grid-selected').setData({ type: 'FeatureCollection', features: [] });

    resetPanels();
}

// Show or hide the view toggle button based on zoom level.
// The toggle is only meaningful at z13+ where both grid and parcel
// data are present in the tiles.
function updateToggleVisibility(zoom) {
    const el = document.getElementById('viewToggle');
    if (el) el.style.display = zoom >= 13 ? '' : 'none';
}

function resetPanels() {
    currentLandValue = 0;
    document.getElementById('propertyDetails').innerHTML =
        '<p class="placeholder-text">Click a property or grid cell on the map to begin.</p>';
    document.getElementById('taxPlaceholder').classList.remove('hidden');
    document.getElementById('taxCalculator').classList.add('hidden');
    document.getElementById('calculateHint').classList.add('hidden');
    document.getElementById('resultsPanel').classList.add('hidden');
    const gridHint = document.getElementById('gridViewHint');
    if (gridHint) gridHint.style.display = 'none';
}

function showPropertyDetails(props, layerType) {
    const lvPerSqmStored = Number(props.land_value_per_sqm) || 0;
    // area_m2 is a parcel attribute; grid cells don't carry it.
    // Fall back to REF_AREA_M2 so correction factor = sqrt(150/150) = 1.
    const areaSqm = Number(props.area_m2) || REF_AREA_M2;

    let lvPerSqmDisplay, landValue, areaDisplay, lvLabel, lvtLabel;

    if (viewMode === 'parcel' && layerType === 'parcel') {
        // Actual basis — correct for plot size using the Step 11b
        // back-transformation:
        //   lv_per_sqm_actual = lv_per_sqm_stored × sqrt(REF_AREA / area)
        //   land_value_actual  = lv_per_sqm_stored × sqrt(REF_AREA × area)
        lvPerSqmDisplay = lvPerSqmStored * Math.sqrt(REF_AREA_M2 / areaSqm);
        landValue       = lvPerSqmStored * Math.sqrt(REF_AREA_M2 * areaSqm);
        areaDisplay     = areaSqm.toLocaleString('en-GB', { maximumFractionDigits: 0 }) + '\u00A0m\u00B2';
        lvLabel         = 'Land value per m\u00B2';
        lvtLabel        = 'Est. land value';
    } else {
        // Grid / normalised basis — one 150 m² reference residential plot.
        // Using lv_per_sqm × 10,000 (full cell area) would give a meaningless
        // ~£24 M figure; 150 m² gives a human-scale household estimate.
        lvPerSqmDisplay = lvPerSqmStored;
        landValue       = lvPerSqmStored * REF_AREA_M2;
        areaDisplay     = '150\u00A0m\u00B2';
        lvLabel         = 'Land value per m\u00B2';
        lvtLabel        = 'Est. land value';
    }

    // currentLandValue feeds calculate() for the LVT comparison
    currentLandValue = landValue;

    document.getElementById('propertyDetails').innerHTML = `
        <div class="property-info">
            <div class="info-row">
                <span class="info-label">Area</span>
                <span class="info-value">${areaDisplay}</span>
            </div>
            <div class="info-row">
                <span class="info-label">${lvLabel}</span>
                <span class="info-value">${formatCurrency(lvPerSqmDisplay)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">${lvtLabel}</span>
                <span class="info-value">${formatCurrency(landValue)}</span>
            </div>
        </div>
    `;

    // Hide stale results whenever a new property is selected
    document.getElementById('resultsPanel').classList.add('hidden');

    // Grid-view hint: show only in grid mode when a property is selected
    const gridHint = document.getElementById('gridViewHint');
    if (gridHint) gridHint.style.display = (viewMode === 'grid') ? '' : 'none';

    // Only parcel and grid clicks activate the calculator; background (1 km)
    // cells are too coarse for a meaningful per-household LVT estimate.
    const canUseCalc = (layerType === 'parcel' || layerType === 'grid');
    document.getElementById('taxPlaceholder').classList.toggle('hidden', canUseCalc);
    document.getElementById('taxCalculator').classList.toggle('hidden', !canUseCalc);
    document.getElementById('calculateHint').classList.toggle('hidden', !canUseCalc);

    updateCalculateBtn();
}

function updateCalculateBtn() {
    const btn = document.getElementById('calculateBtn');
    if (!btn) return;
    const canCalc = (selectedLayer === 'parcels' || selectedLayer === 'grid') && currentLandValue > 0;
    btn.disabled = !canCalc;
}

function calculate() {
    if (!taxConfig) return;
    if (selectedLayer !== 'parcels' && selectedLayer !== 'grid') return;

    const totalLV = taxConfig.meta.total_land_value_gbp;
    const rows = [];
    let currentTotal = 0;
    let lvtTotal = 0;

    document.querySelectorAll('.tax-check').forEach(cb => {
        if (!cb.checked) return;
        const id = cb.id.replace('tx-', '');
        const input = document.getElementById('val-' + id);
        const current = Number(input?.value) || 0;
        const taxData = taxConfig.taxes[id];
        if (!taxData) return;
        const lvt = Math.round(currentLandValue * taxData.annual_revenue_gbp / totalLV);
        const nameEl = cb.closest('.tax-row')?.querySelector('.tax-name');
        const name = nameEl ? nameEl.textContent.trim() : id;
        rows.push({ name, current, lvt, diff: lvt - current, annual: taxData.annual });
        currentTotal += current;
        lvtTotal += lvt;
    });

    const diff = lvtTotal - currentTotal;

    document.getElementById('resCurrent').textContent = formatCompact(currentTotal);
    document.getElementById('resLvt').textContent     = formatCompact(lvtTotal);
    document.getElementById('resDiff').textContent    = formatDiff(diff);

    const diffCard = document.getElementById('resDiffCard');
    const diffSub  = document.getElementById('resDiffSub');
    diffCard.className = 'result-card' + (diff < 0 ? ' result-better' : diff > 0 ? ' result-worse' : '');
    diffSub.textContent = diff < 0 ? 'better off under LVT' : diff > 0 ? 'worse off under LVT' : 'no change';

    // Build breakdown table
    let tableHtml = `
        <table class="breakdown">
            <thead>
                <tr>
                    <th>Tax</th>
                    <th>Current</th>
                    <th>LVT equiv.</th>
                    <th>Change</th>
                </tr>
            </thead>
            <tbody>
    `;
    rows.forEach(r => {
        const cls    = r.diff < 0 ? 'change-better' : r.diff > 0 ? 'change-worse' : '';
        const oneOff = !r.annual ? ' <span class="one-off-tag">one-off</span>' : '';
        tableHtml += `
                <tr>
                    <td>${r.name}${oneOff}</td>
                    <td>${formatCompact(r.current)}</td>
                    <td>${formatCompact(r.lvt)}</td>
                    <td class="${cls}">${formatDiff(r.diff)}</td>
                </tr>
        `;
    });
    const totalCls = diff < 0 ? 'change-better' : diff > 0 ? 'change-worse' : '';
    tableHtml += `
            </tbody>
            <tfoot>
                <tr class="breakdown-total">
                    <td>Total</td>
                    <td>${formatCompact(currentTotal)}</td>
                    <td>${formatCompact(lvtTotal)}</td>
                    <td class="${totalCls}">${formatDiff(diff)}</td>
                </tr>
            </tfoot>
        </table>
    `;

    const wrap   = document.getElementById('breakdownTable');
    const toggle = document.getElementById('breakdownToggle');
    wrap.innerHTML = tableHtml;
    wrap.classList.add('hidden');
    toggle.textContent = 'Show breakdown \u25BE';
    toggle.classList.remove('open');

    document.getElementById('resultsPanel').classList.remove('hidden');
}

function formatCompact(value) {
    return '\u00A3' + Math.round(value).toLocaleString('en-GB');
}

function formatDiff(diff) {
    const abs  = Math.round(Math.abs(diff));
    const sign = diff < 0 ? '\u2212' : diff > 0 ? '+' : '';
    return sign + '\u00A3' + abs.toLocaleString('en-GB');
}

function updateLiveTotal() {
    let total = 0;
    document.querySelectorAll('.tax-check').forEach(cb => {
        if (!cb.checked || cb.dataset.annual !== 'true') return;
        const input = document.getElementById(cb.id.replace('tx-', 'val-'));
        if (input) total += Number(input.value) || 0;
    });
    const el = document.getElementById('taxLiveTotal');
    if (el) el.textContent = '\u00A3' + total.toLocaleString('en-GB', { maximumFractionDigits: 0 });
}

function setupEventListeners() {
    document.getElementById('infoToggle').addEventListener('click', () => {
        document.getElementById('infoContent').classList.toggle('open');
        document.getElementById('infoToggle').classList.toggle('open');
    });

    // Tax checkboxes: toggle input enabled state + update live total
    document.querySelectorAll('.tax-check').forEach(cb => {
        cb.addEventListener('change', () => {
            const input = document.getElementById(cb.id.replace('tx-', 'val-'));
            if (input) input.disabled = !cb.checked;
            updateLiveTotal();
        });
    });

    // Tax inputs: update live total on typing
    document.querySelectorAll('.tax-input').forEach(input => {
        input.addEventListener('input', updateLiveTotal);
    });

    // Calculate button
    document.getElementById('calculateBtn').addEventListener('click', calculate);

    // Breakdown toggle
    document.getElementById('breakdownToggle').addEventListener('click', () => {
        const wrap   = document.getElementById('breakdownTable');
        const toggle = document.getElementById('breakdownToggle');
        const isHidden = wrap.classList.toggle('hidden');
        toggle.textContent = isHidden ? 'Show breakdown \u25BE' : 'Hide breakdown \u25B4';
        toggle.classList.toggle('open', !isHidden);
    });

    // View mode segmented toggle
    document.getElementById('viewToggleBtnGrid')?.addEventListener('click', () => applyViewMode('grid'));
    document.getElementById('viewToggleBtnParcel')?.addEventListener('click', () => applyViewMode('parcel'));
}

function formatCurrency(value) {
    if (value === null || value === undefined) return '\u00A30';
    return Math.abs(Number(value)).toLocaleString('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}
