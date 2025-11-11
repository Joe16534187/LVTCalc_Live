(function(){
    // Wait for the map variable to exist, then attach click handler.
    function waitForMap(cb, timeoutMs) {
        var waited = 0;
        var interval = setInterval(function(){
            if (window.map) {
                clearInterval(interval);
                cb(window.map);
                return;
            }
            waited += 200;
            if (timeoutMs && waited > timeoutMs) {
                clearInterval(interval);
            }
        }, 200);
    }

    function escapeHtml(s){
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function renderProps(props){
        // Build a simple key/value list skipping geometry and internal keys.
        var skip = {geometry:1,the_geom:1,geom:1,extent:1,layer:1};
        var keys = Object.keys(props || {}).filter(function(k){
            return !skip[k] && k !== 'feature' && k !== 'style' && k !== 'geometry' && k !== 'layer';
        });
        if (!keys.length) return '<p class="empty">No attributes available for this feature.</p>';
        var html = '<dl class="attrs">';
        keys.forEach(function(k){
            var v = props[k];
            if (typeof v === 'object') return;
            html += '<dt>' + escapeHtml(k) + '</dt><dd>' + escapeHtml(v === undefined ? '' : v) + '</dd>';
        });
        html += '</dl>';
        return html;
    }

    function attachMapClick(map){
        if (!map || !map.on) return;
        map.on('singleclick', function(evt){
            var feat = map.forEachFeatureAtPixel(evt.pixel, function(f){ return f; });
            var container = document.getElementById('selected-content');
            if (!container) return;
            if (feat) {
                var props = (typeof feat.getProperties === 'function') ? feat.getProperties() : (feat.properties || {});
                container.innerHTML = renderProps(props);
            } else {
                container.innerHTML = '<p class="empty">Click a property on the map to see details here.</p>';
            }
        });
    }

    // Also mirror the popup content if the existing popup is used elsewhere in the code.
    function mirrorPopupContent(){
        var popup = document.getElementById('popup-content');
        var container = document.getElementById('selected-content');
        if (!popup || !container) return;
        var obs = new MutationObserver(function(){
            var html = popup.innerHTML && popup.innerHTML.trim();
            if (html) container.innerHTML = html;
        });
        obs.observe(popup, { childList: true, subtree: true, characterData: true });
    }

    waitForMap(function(map){
        attachMapClick(map);
        mirrorPopupContent();
    }, 10000);
})();