// LVT Calculator — MapLibre GL JS with native PMTiles support
let map;
let selectedFeatureId = null;
let selectedProperties = null;

const PMTILES_URL = 'https://pub-8a44c156b385402db64e9c2f62df723f.r2.dev/properties.pmtiles';
const SOURCE_LAYER = 'properties_stripped';

// Register the PMTiles protocol with MapLibre before the map is created.
// MapLibre will resolve any pmtiles:// URL by making HTTP range requests
// via this protocol adapter — no VectorGrid or custom fetch hacks needed.
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile.bind(protocol));

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setupEventListeners();
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
                'properties': {
                    type: 'vector',
                    // MapLibre resolves this via the pmtiles protocol registered above
                    url: 'pmtiles://' + PMTILES_URL
                }
            },
            layers: [
                {
                    id: 'basemap',
                    type: 'raster',
                    source: 'carto-basemap'
                },
                {
                    id: 'properties-fill',
                    type: 'fill',
                    source: 'properties',
                    'source-layer': SOURCE_LAYER,
                    paint: {
                        'fill-color': [
                            'step',
                            ['coalesce', ['get', 'Land_Value_per_m2'], 0],
                            '#1e3a8a',
                            100,  '#2563eb',
                            200,  '#0ea5e9',
                            400,  '#06b6d4',
                            800,  '#14b8a6',
                            1600, '#10b981',
                            3200, '#22c55e'
                        ],
                        'fill-opacity': 0.65
                    }
                },
                {
                    id: 'properties-outline',
                    type: 'line',
                    source: 'properties',
                    'source-layer': SOURCE_LAYER,
                    paint: {
                        'line-color': '#ffffff',
                        'line-width': 0.5,
                        'line-opacity': 0.5
                    }
                },
                // Selected feature highlight layers (hidden until a property is clicked)
                {
                    id: 'properties-selected-fill',
                    type: 'fill',
                    source: 'properties',
                    'source-layer': SOURCE_LAYER,
                    paint: {
                        'fill-color': '#facc15',
                        'fill-opacity': 0.6
                    },
                    filter: ['==', ['get', 'Label'], '']
                },
                {
                    id: 'properties-selected-outline',
                    type: 'line',
                    source: 'properties',
                    'source-layer': SOURCE_LAYER,
                    paint: {
                        'line-color': '#facc15',
                        'line-width': 2.5,
                        'line-opacity': 1
                    },
                    filter: ['==', ['get', 'Label'], '']
                }
            ]
        },
        center: [-2.5205, 57.3655],
        zoom: 10
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
        console.log('MapLibre map loaded');
        document.getElementById('loadingOverlay').classList.add('hidden');
    });

    map.on('error', (e) => {
        console.error('MapLibre error:', e);
    });

    // Click handler — select property and populate sidebar
    map.on('click', 'properties-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        const props = e.features[0].properties;
        selectedFeatureId = props.Label;
        selectedProperties = props;

        // Update selection highlight by swapping the filter
        map.setFilter('properties-selected-fill',    ['==', ['get', 'Label'], selectedFeatureId]);
        map.setFilter('properties-selected-outline', ['==', ['get', 'Label'], selectedFeatureId]);

        showPropertyDetails(props);
    });

    // Pointer cursor on hover
    map.on('mouseenter', 'properties-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'properties-fill', () => { map.getCanvas().style.cursor = ''; });
}

function showPropertyDetails(props) {
    document.getElementById('propertyDetails').innerHTML = `
        <div class="property-info">
            <div class="info-row">
                <span class="info-label">Area (m²)</span>
                <span class="info-value">${props.Area ? Number(props.Area).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Land Value</span>
                <span class="info-value">${formatCurrency(props.Land_Value_Combined)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Land Value per m²</span>
                <span class="info-value">${formatCurrency(props.Land_Value_per_m2)}</span>
            </div>
        </div>
    `;
    document.querySelector('.info-text').style.display = 'none';
    document.getElementById('calculatorForm').style.display = 'flex';
    document.getElementById('comparisonResults').style.display = 'none';
    updateInputStates();
}

function updateInputStates() {
    document.getElementById('actualCouncilTax').disabled = !document.getElementById('includeCouncilTax').checked;
    document.getElementById('actualLBTT').disabled        = !document.getElementById('includeLBTT').checked;
}

function calculateComparison() {
    if (!selectedProperties) return;

    const includeCouncilTax = document.getElementById('includeCouncilTax').checked;
    const includeLBTT       = document.getElementById('includeLBTT').checked;

    if (!includeCouncilTax && !includeLBTT) {
        alert('Please select at least one tax type to compare');
        return;
    }

    const actualCouncilTax = includeCouncilTax ? parseFloat(document.getElementById('actualCouncilTax').value) || 0 : 0;
    const actualLBTT       = includeLBTT       ? parseFloat(document.getElementById('actualLBTT').value)       || 0 : 0;
    const lvtCouncilTax    = includeCouncilTax ? (selectedProperties.Council_Tax_Amount || 0) : 0;
    const lvtLBTT          = includeLBTT       ? (selectedProperties.LBTT_Amount || 0)        : 0;

    const totalCurrent = actualCouncilTax + actualLBTT;
    const totalLVT     = lvtCouncilTax    + lvtLBTT;
    const difference   = totalCurrent - totalLVT;

    document.getElementById('totalCurrent').textContent    = formatCurrency(totalCurrent);
    document.getElementById('totalLVT').textContent        = formatCurrency(totalLVT);
    document.getElementById('totalDifference').textContent = formatCurrency(Math.abs(difference));

    const differenceLabel = document.getElementById('differenceLabel');
    const differenceValue = document.getElementById('totalDifference');

    if (difference > 0) {
        differenceLabel.textContent  = 'You would SAVE:';
        differenceValue.className    = 'result-value positive';
    } else if (difference < 0) {
        differenceLabel.textContent  = 'You would PAY MORE:';
        differenceValue.className    = 'result-value negative';
    } else {
        differenceLabel.textContent  = 'Difference:';
        differenceValue.className    = 'result-value';
    }

    let breakdownHTML = '';
    if (includeCouncilTax) {
        breakdownHTML += `<tr><td>Council Tax</td><td>${formatCurrency(actualCouncilTax)}</td><td>${formatCurrency(lvtCouncilTax)}</td></tr>`;
    }
    if (includeLBTT) {
        breakdownHTML += `<tr><td>LBTT</td><td>${formatCurrency(actualLBTT)}</td><td>${formatCurrency(lvtLBTT)}</td></tr>`;
    }
    document.getElementById('breakdownTableBody').innerHTML = breakdownHTML;

    document.getElementById('calculatorForm').style.display    = 'none';
    document.getElementById('comparisonResults').style.display = 'block';
}

function resetCalculator() {
    document.getElementById('actualCouncilTax').value  = '';
    document.getElementById('actualLBTT').value        = '';
    document.getElementById('includeCouncilTax').checked = true;
    document.getElementById('includeLBTT').checked       = false;
    document.getElementById('calculatorForm').style.display    = 'flex';
    document.getElementById('comparisonResults').style.display = 'none';
    updateInputStates();
}

function setupEventListeners() {
    document.getElementById('calculateBtn').addEventListener('click', calculateComparison);
    document.getElementById('resetBtn').addEventListener('click', resetCalculator);
    document.getElementById('includeCouncilTax').addEventListener('change', updateInputStates);
    document.getElementById('includeLBTT').addEventListener('change', updateInputStates);

    document.getElementById('infoToggle').addEventListener('click', () => {
        document.getElementById('infoContent').classList.toggle('open');
        document.getElementById('infoToggle').classList.toggle('open');
    });
}

function formatCurrency(value) {
    if (value === null || value === undefined) return '£0.00';
    return Math.abs(Number(value)).toLocaleString('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
