var wms_layers = [];


        var lyr_OpenStreetMap_0 = new ol.layer.Tile({
            // no 'title' property so it will not appear in the layer switcher
            'opacity': 1.000000,
            source: new ol.source.OSM()
});
var format_PropertyValuationsPolygons_1 = new ol.format.GeoJSON();
var features_PropertyValuationsPolygons_1 = format_PropertyValuationsPolygons_1.readFeatures(json_PropertyValuationsPolygons_1, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_PropertyValuationsPolygons_1 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_PropertyValuationsPolygons_1.addFeatures(features_PropertyValuationsPolygons_1);
var lyr_PropertyValuationsPolygons_1 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_PropertyValuationsPolygons_1, 
                style: style_PropertyValuationsPolygons_1,
                popuplayertitle: 'Property Valuations, Polygons',
                interactive: true,
    title: 'Property Valuations, Polygons<br />\
    <img src="styles/legend/PropertyValuationsPolygons_1_0.png" /> 0 - 2<br />\
    <img src="styles/legend/PropertyValuationsPolygons_1_1.png" /> 2 - 249<br />\
    <img src="styles/legend/PropertyValuationsPolygons_1_2.png" /> 249 - 567<br />\
    <img src="styles/legend/PropertyValuationsPolygons_1_3.png" /> 567 - 981<br />\
    <img src="styles/legend/PropertyValuationsPolygons_1_4.png" /> 981 - 6,206<br />' });
var format_PropertyValuations_2 = new ol.format.GeoJSON();
var features_PropertyValuations_2 = format_PropertyValuations_2.readFeatures(json_PropertyValuations_2, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_PropertyValuations_2 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_PropertyValuations_2.addFeatures(features_PropertyValuations_2);
var lyr_PropertyValuations_2 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_PropertyValuations_2, 
                style: style_PropertyValuations_2,
                popuplayertitle: 'Property Valuations',
                interactive: true,
    title: 'Property Valuations<br />\
    <img src="styles/legend/PropertyValuations_2_0.png" /> 0 - 2<br />\
    <img src="styles/legend/PropertyValuations_2_1.png" /> 2 - 249<br />\
    <img src="styles/legend/PropertyValuations_2_2.png" /> 249 - 567<br />\
    <img src="styles/legend/PropertyValuations_2_3.png" /> 567 - 981<br />\
    <img src="styles/legend/PropertyValuations_2_4.png" /> 981 - 6,206<br />' });

lyr_OpenStreetMap_0.setVisible(true);lyr_PropertyValuationsPolygons_1.setVisible(false);lyr_PropertyValuations_2.setVisible(true);
var layersList = [lyr_OpenStreetMap_0,lyr_PropertyValuationsPolygons_1,lyr_PropertyValuations_2];
lyr_PropertyValuationsPolygons_1.set('fieldAliases', {'fid': 'fid', 'inspireid': 'inspireid', 'date_migra': 'date_migra', 'Area': 'Area (m2)', 'label': 'label', 'nationalca': 'nationalca', 'county': 'county', 'layer': 'layer', 'path': 'path', 'Value': 'Value', 'properties_with_predictions_all_rows_y_pred': 'Predicted (£)', 'properties_with_predictions_all_rows_y_true': 'Actual (£)', 'properties_with_predictions_all_rows_land_value_residual': 'Predicted Land Value (£)', 'Value per m2': 'Predicted Land Value per m2 (£)', });
lyr_PropertyValuations_2.set('fieldAliases', {'fid': 'fid', 'inspireid': 'inspireid', 'date_migra': 'date_migra', 'label': 'label', 'nationalca': 'nationalca', 'county': 'county', 'layer': 'layer', 'path': 'path', 'area (m2)': 'Area (m2)', 'perimeter (m)': 'perimeter (m)', 'ClosestRailwayStationName': 'ClosestRailwayStationName', 'ClosestRailwayStationDist (m)': 'ClosestRailwayStationDist (m)', 'ClosestAeroportName': 'ClosestAeroportName', 'ClosestAeroportDist (m)': 'ClosestAeroportDist (m)', 'ClosestEducationName': 'ClosestEducationName', 'ClosestEducationDist (m)': 'ClosestEducationDist (m)', 'ClosestMedicalName': 'ClosestMedicalName', 'ClosestMedicalDist (m)': 'ClosestMedicalDist (m)', 'ClosestSupermarketName': 'ClosestSupermarketName', 'ClosestSupermarketDist (m)': 'ClosestSupermarketDist (m)', 'ClosestGreenspaceWoodlandtype1': 'ClosestGreenspaceWoodlandtype1', 'ClosestGreenspaceWoodlandType2': 'ClosestGreenspaceWoodlandType2', 'ClosestGreenspaceWoodlandDist (m)': 'ClosestGreenspaceWoodlandDist (m)', 'ClosestForeshoreDist (m)': 'ClosestForeshoreDist (m)', 'RoadsNationalDist (m)': 'RoadsNationalDist (m)', 'RoadsRegionalType': 'RoadsRegionalType', 'RoadsRegionalNumber': 'RoadsRegionalNumber', 'RoadsRegionalDist (m)': 'RoadsRegionalDist (m)', 'CityTownDist (m)': 'CityTownDist (m)', 'flooding_extent_m_area': 'flooding_extent_m_area', 'flooding_extent_m_pc': 'flooding_extent_m_pc', 'AWA': 'AWA', 'area': 'area', 'name': 'name', 'Popcount': 'Popcount', 'Shape_Area': 'Shape_Area', 'QS102SC_edited_field_2': 'QS102SC_edited_field_2', 'flooding extent H_area': 'flooding extent H_area', 'flooding extent H_pc': 'flooding extent H_pc', 'Cleaned_area': 'Cleaned_area', 'Cleaned_pc': 'Cleaned_pc', 'Name_2': 'Name_2', 'gross-disposable-household-income-per-head-map-data_Value (£)': 'gross-disposable-household-income-per-head-map-data_Value (£)', 'Title number': 'Title number', 'Application type': 'Application type', 'Consideration': 'Consideration', 'Value': 'Value', 'Land Class': 'Land Class', 'House Type': 'House Type', 'properties_with_predictions_all_rows_y_pred': 'Predicted (£)', 'properties_with_predictions_all_rows_y_true': 'Actual (£)', 'properties_with_predictions_all_rows_residual': 'properties_with_predictions_all_rows_residual', 'properties_with_predictions_all_rows_abs_residual': 'properties_with_predictions_all_rows_abs_residual', 'properties_with_predictions_all_rows_pct_error': 'properties_with_predictions_all_rows_pct_error', 'properties_with_predictions_all_rows_land_value_residual': 'Predicted Land Value (£)', 'properties_with_predictions_all_rows_building_value_residual': 'properties_with_predictions_all_rows_building_value_residual', 'properties_with_predictions_all_rows_land_share_residual': 'properties_with_predictions_all_rows_land_share_residual', 'properties_with_predictions_all_rows_neg_building_from_residual_flag': 'properties_with_predictions_all_rows_neg_building_from_residual_flag', 'properties_with_predictions_all_rows_land_value_alloc': 'properties_with_predictions_all_rows_land_value_alloc', 'properties_with_predictions_all_rows_building_value_alloc': 'properties_with_predictions_all_rows_building_value_alloc', 'properties_with_predictions_all_rows_land_share_alloc': 'properties_with_predictions_all_rows_land_share_alloc', 'Value per m2': 'Predicted Land Value per m2 (£)', });
lyr_PropertyValuationsPolygons_1.set('fieldImages', {'fid': 'Hidden', 'inspireid': 'Hidden', 'date_migra': 'Hidden', 'Area': 'TextEdit', 'label': 'Hidden', 'nationalca': 'Hidden', 'county': 'Hidden', 'layer': 'Hidden', 'path': 'Hidden', 'Value': 'Hidden', 'properties_with_predictions_all_rows_y_pred': 'TextEdit', 'properties_with_predictions_all_rows_y_true': 'TextEdit', 'properties_with_predictions_all_rows_land_value_residual': 'TextEdit', 'Value per m2': 'Range', });
lyr_PropertyValuations_2.set('fieldImages', {'fid': 'Hidden', 'inspireid': 'Hidden', 'date_migra': 'Hidden', 'label': 'Hidden', 'nationalca': 'Hidden', 'county': 'Hidden', 'layer': 'Hidden', 'path': 'Hidden', 'area (m2)': 'TextEdit', 'perimeter (m)': 'Hidden', 'ClosestRailwayStationName': 'Hidden', 'ClosestRailwayStationDist (m)': 'Hidden', 'ClosestAeroportName': 'Hidden', 'ClosestAeroportDist (m)': 'Hidden', 'ClosestEducationName': 'Hidden', 'ClosestEducationDist (m)': 'Hidden', 'ClosestMedicalName': 'Hidden', 'ClosestMedicalDist (m)': 'Hidden', 'ClosestSupermarketName': 'Hidden', 'ClosestSupermarketDist (m)': 'Hidden', 'ClosestGreenspaceWoodlandtype1': 'Hidden', 'ClosestGreenspaceWoodlandType2': 'Hidden', 'ClosestGreenspaceWoodlandDist (m)': 'Hidden', 'ClosestForeshoreDist (m)': 'Hidden', 'RoadsNationalDist (m)': 'Hidden', 'RoadsRegionalType': 'Hidden', 'RoadsRegionalNumber': 'Hidden', 'RoadsRegionalDist (m)': 'Hidden', 'CityTownDist (m)': 'Hidden', 'flooding_extent_m_area': 'Hidden', 'flooding_extent_m_pc': 'Hidden', 'AWA': 'Hidden', 'area': 'Hidden', 'name': 'Hidden', 'Popcount': 'Hidden', 'Shape_Area': 'Hidden', 'QS102SC_edited_field_2': 'Hidden', 'flooding extent H_area': 'Hidden', 'flooding extent H_pc': 'Hidden', 'Cleaned_area': 'Hidden', 'Cleaned_pc': 'Hidden', 'Name_2': 'Hidden', 'gross-disposable-household-income-per-head-map-data_Value (£)': 'Hidden', 'Title number': 'Hidden', 'Application type': 'Hidden', 'Consideration': 'Hidden', 'Value': 'Hidden', 'Land Class': 'Hidden', 'House Type': 'Hidden', 'properties_with_predictions_all_rows_y_pred': 'TextEdit', 'properties_with_predictions_all_rows_y_true': 'TextEdit', 'properties_with_predictions_all_rows_residual': 'Hidden', 'properties_with_predictions_all_rows_abs_residual': 'Hidden', 'properties_with_predictions_all_rows_pct_error': 'Hidden', 'properties_with_predictions_all_rows_land_value_residual': 'TextEdit', 'properties_with_predictions_all_rows_building_value_residual': 'Hidden', 'properties_with_predictions_all_rows_land_share_residual': 'Hidden', 'properties_with_predictions_all_rows_neg_building_from_residual_flag': 'Hidden', 'properties_with_predictions_all_rows_land_value_alloc': 'Hidden', 'properties_with_predictions_all_rows_building_value_alloc': 'Hidden', 'properties_with_predictions_all_rows_land_share_alloc': 'Hidden', 'Value per m2': 'Range', });
lyr_PropertyValuationsPolygons_1.set('fieldLabels', {'Area': 'inline label - visible with data', 'properties_with_predictions_all_rows_y_pred': 'inline label - visible with data', 'properties_with_predictions_all_rows_y_true': 'inline label - visible with data', 'properties_with_predictions_all_rows_land_value_residual': 'inline label - visible with data', 'Value per m2': 'inline label - visible with data', });
lyr_PropertyValuations_2.set('fieldLabels', {'area (m2)': 'inline label - visible with data', 'properties_with_predictions_all_rows_y_pred': 'inline label - visible with data', 'properties_with_predictions_all_rows_y_true': 'inline label - visible with data', 'properties_with_predictions_all_rows_land_value_residual': 'inline label - visible with data', 'Value per m2': 'inline label - visible with data', });
lyr_PropertyValuations_2.on('precompose', function(evt) {
    evt.context.globalCompositeOperation = 'normal';
});