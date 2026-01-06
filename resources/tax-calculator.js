// Constants. change these to dynamic inputs? I just made these up...
const TOTAL_LAND_VALUE = 28000000000; 
const TOTAL_COUNCIL_TAX = 350000000;  
const TOTAL_INCOME_TAX = 1400000000;  
const TOTAL_VAT = 900000000;          

const LVT_RATES = {
    council: TOTAL_COUNCIL_TAX / TOTAL_LAND_VALUE,
    income:  TOTAL_INCOME_TAX / TOTAL_LAND_VALUE,
    vat:     TOTAL_VAT / TOTAL_LAND_VALUE
};

function formatNumber(value, decimals = 0) {
    if (value === null || value === undefined || value === '') return '';
    const num = Number(value);
    if (!isFinite(num)) return '';

    const rounded = Number(num.toFixed(decimals));

    return rounded.toLocaleString('en-GB', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function formatIfNumeric(value, decimals = 0) {
    if (value === null || value === undefined || value === '') return '';
    const num = Number(value);
    if (!isFinite(num)) {
        return value;
    }
    return formatNumber(num, decimals);
}

function formatCurrency(amount) {
    return '£' + formatNumber(amount || 0, 0);
}

function parseMoneyString(str) {
    if (!str) return 0;
    const clean = String(str).replace(/[^0-9.]/g, '');
    const num = Number(clean);
    return isFinite(num) ? num : 0;
}

function parseMoneyInput(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const raw = (el.value || '').replace(/,/g, '').trim();
    const num = Number(raw);
    return isFinite(num) ? num : 0;
}

function getSelectedTaxes() {
    return {
        council: !!document.getElementById('tax-council')?.checked,
        income:  !!document.getElementById('tax-income')?.checked,
        vat:     !!document.getElementById('tax-vat')?.checked
    };
}

function getCurrentTaxTotal() {
    const selected = getSelectedTaxes();
    let total = 0;

    if (selected.council) total += parseMoneyInput('tax-council-input');
    if (selected.income)  total += parseMoneyInput('tax-income-input');
    if (selected.vat)     total += parseMoneyInput('tax-vat-input');

    return total;
}

function extractLandValueFromPanel() {
    const container = document.getElementById('selected-content');
    if (!container) return 0;

    const raw = container.innerText || container.textContent || '';
    if (!raw.trim()) return 0;

    const lines = raw.split(/\r?\n/);

    function findNumberInLines(label) {
        const labelLower = label.toLowerCase();

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lower = line.toLowerCase();

            if (!lower.includes(labelLower)) continue;
            if (lower.includes('per m2')) continue; 

            const match = line.match(/[-+]?\d[\d,]*(?:\.\d+)?/g);
            if (!match || !match.length) continue;

            const lastNumber = match[match.length - 1];
            const value = parseMoneyString(lastNumber);
            if (value > 0) return value;
        }
        return 0;
    }

    let val = findNumberInLines('Predicted Land Value (£)');
    if (val > 0) return val;

    val = findNumberInLines('Predicted Land Value');
    if (val > 0) return val;

    val = findNumberInLines('Predicted (£)');
    return val > 0 ? val : 0;
}


function computeLvtFromPanel() {
    const landValue = extractLandValueFromPanel();
    if (!landValue || !isFinite(landValue)) return 0;

    const totalRate =
        LVT_RATES.council +
        LVT_RATES.income +
        LVT_RATES.vat;

    const total = landValue * totalRate;
    return isFinite(total) ? total : 0;
}
function updateTaxGraph() {
    const current = getCurrentTaxTotal();
    const lvt = computeLvtFromPanel();

    const currentFill = document.getElementById('tax-current-fill');
    const lvtFill = document.getElementById('tax-lvt-fill');
    const diffFill = document.getElementById('tax-diff-fill');

    const currentVal = document.getElementById('tax-current-value');
    const lvtVal = document.getElementById('tax-lvt-value');
    const diffVal = document.getElementById('tax-diff-value');
    const diffLabel = document.getElementById('tax-diff-label');
    const summary = document.getElementById('tax-summary-text');

    if (!currentFill || !lvtFill || !diffFill || !currentVal || !lvtVal || !diffVal || !diffLabel || !summary) {
        return;
    }

    const maxValue = Math.max(current, lvt, 1);
    const currentHeight = maxValue > 0 ? (current / maxValue) * 100 : 0;
    const lvtHeight = maxValue > 0 ? (lvt / maxValue) * 100 : 0;

    currentFill.style.height = currentHeight + '%';
    currentFill.style.bottom = '0';

    lvtFill.style.height = lvtHeight + '%';
    lvtFill.style.bottom = '0';

    let diffHeight = 0;
    let diffStart = 0;

    if (current > 0 && lvt > 0) {
        diffHeight = Math.abs(currentHeight - lvtHeight);
        diffStart = Math.min(currentHeight, lvtHeight);
    }

    diffFill.style.height = diffHeight + '%';
    diffFill.style.bottom = diffStart + '%';

    diffFill.classList.remove('tax-graph-bar-fill-diff-less', 'tax-graph-bar-fill-diff-more');

    currentVal.textContent = formatCurrency(current);
    lvtVal.textContent = formatCurrency(lvt);

    if (!current && !lvt) {
        diffLabel.textContent = 'Difference';
        diffVal.textContent = '£0';
        summary.textContent = 'Select taxes and a property to see your result.';
        return;
    }

    if (!current && lvt > 0) {
        diffLabel.textContent = 'Difference';
        diffVal.textContent = '£0';
        summary.textContent = 'Enter the taxes you currently pay to compare with LVT.';
        return;
    }

    const delta = lvt - current;

    if (delta < 0) {
        diffLabel.textContent = 'You pay less';
        diffVal.textContent = formatCurrency(-delta);
        diffFill.classList.add('tax-graph-bar-fill-diff-less');

        summary.innerHTML =
            'You would pay <span class="tax-summary-value tax-summary-less">' +
            formatCurrency(-delta) +
            ' less</span> per year';
    } else if (delta > 0) {
        diffLabel.textContent = 'You pay more';
        diffVal.textContent = formatCurrency(delta);
        diffFill.classList.add('tax-graph-bar-fill-diff-more');

        summary.innerHTML =
            'You would pay <span class="tax-summary-value tax-summary-more">' +
            formatCurrency(delta) +
            ' more</span> per year';
    } else {
        diffLabel.textContent = 'No difference';
        diffVal.textContent = '£0';
        summary.textContent = 'You would pay the same amount of tax per year.';
    }
}

function escapeHtml(s){
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function renderProps(props){
    var skip = {geometry:1,the_geom:1,geom:1,extent:1,layer:1};
    var keys = Object.keys(props || {}).filter(function(k){
        return !skip[k] && k !== 'feature' && k !== 'style' && k !== 'geometry' && k !== 'layer';
    });
    if (!keys.length) return '<p class="empty">No attributes available for this feature.</p>';

    var html = '<dl class="attrs">';
    keys.forEach(function(k){
        var v = props[k];
        if (typeof v === 'object') return;

        var displayValue = formatIfNumeric(v, 0);
        html += '<dt>' + escapeHtml(k) + '</dt><dd>' +
                escapeHtml(displayValue === undefined ? '' : displayValue) +
                '</dd>';
    });
    html += '</dl>';
    return html;
}

document.addEventListener('DOMContentLoaded', function () {

    var ids = [
        'tax-council-input',
        'tax-income-input',
        'tax-vat-input',
        'tax-council',
        'tax-income',
        'tax-vat'
    ];

    ids.forEach(function(id) {
        var el = document.getElementById(id);
        if (!el) return;

        if (el.type === 'checkbox') {
            el.addEventListener('change', updateTaxGraph);
        } else {
            el.addEventListener('input', updateTaxGraph);
            el.addEventListener('change', updateTaxGraph);
        }
    });

    var selectedContainer = document.getElementById('selected-content');
    if (selectedContainer && 'MutationObserver' in window) {
        var observer = new MutationObserver(function () {
            updateTaxGraph();
        });
        observer.observe(selectedContainer, {
            childList: true,
            subtree: true
        });
    }

    updateTaxGraph();
});

