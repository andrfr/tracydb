import _ from 'lodash';
import $ from 'jquery';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import './style.css';

import LayerManager from './LayerManager';
import WorldWind from '@nasaworldwind/worldwind';
import blueImageLayer from './BlueImageLayer';
import Quantile from 'compute-quantile';

import indicatorFile from './data/indicators.json';
import aspectFile from './data/aspects.json';


let _data;

//set up indicator list
for (let i = 0; i < aspectFile.length; i++) {
    let aspect = aspectFile[i];
    let header = "<h6 class='dropdown-header'>" + aspect.aspect + "</h6>";
    $('.js-indicator-list').append(header);
    for (let j = 0; j < aspect.indicators.length; j++) {
        let indicator = aspect.indicators[j];
        let indicatorData = _.find(indicatorFile, { indicator });
        let indicatorName = indicatorData.meta.name;
        let indicatorOrigin = indicatorData.meta.legal.origin;
        let item = "<a class='dropdown-item js-select-indicator' data-indicator='" + indicator + "'>" + indicatorName 
            + " <span class='font-italic'>(" + indicatorOrigin + ")</span></a>";
        $('.js-indicator-list').append(item);
    }
}

//react to user input
$('.js-select-indicator').click(function () {
    console.log($(this).attr('data-indicator'));
    let indicator = $(this).attr('data-indicator');
    initialize(indicator);
});

function initialize(indicator) {
    _data = loadData(indicator);
    _impactAssessment.init(_data);

    cardInfo(_data.meta);
    drawShapes(indicator);
}

function cardInfo(info) {
    let aspect = info.aspect;
    let name = info.name;
    let link = info.legal.link;
    let origin = info.legal.origin;
    let year = info.year;
    let description = info.description;
    let minimum = _impactAssessment.minimum;
    let quartile_25 = _impactAssessment.quartile_25;
    let quartile_75 = _impactAssessment.quartile_75;
    let maximum = _impactAssessment.maximum;

    $('.js-aspect').text(aspect);
    $('.js-name').text(name);
    $('.js-value').text("No Country Selected");
    $('.js-link').attr('href', link);
    $('.js-link').text(origin);
    $('.js-year').text(year);
    $('.js-description').text(description);
    $('.js-quartile-25').text('from ' + minimum + " to " + quartile_25);
    $('.js-middle-50').text('from ' + quartile_25 + " (excl.) to " + quartile_75 + " (excl.)");
    $('.js-quartile-75').text('from ' + quartile_75 + " to " + maximum);

}



//data loader
function loadData(indicator) {
    let data = _.find(indicatorFile, { indicator })
    return data;
}


// impact assessment
const COLOR_DARK = new WorldWind.Color(
    0,
    76 / 255,
    109 / 255,
    1.0
);
const COLOR_MEDIUM = new WorldWind.Color(
    105 / 255,
    150 / 255,
    179 / 255,
    1.0
);
const COLOR_LIGHT = new WorldWind.Color(
    193 / 255,
    231 / 255,
    255 / 255,
    1.0
);
const COLOR_GRAY = new WorldWind.Color(
    221 / 255,
    221 / 255,
    221 / 255,
    1.0
);

let _impactAssessment = {
    minimum: 0,
    quartile_25: 0,
    quartile_75: 0,
    maximum: 0,

    init: function (data) {
        let cleanedData = _.pickBy(data, function(value, key) {
            if (key === "meta" || key === "indicator") {
                return false; 
            } else {
                return (value !== "");
            }
        });

        let values = _.toArray(cleanedData);

        this.minimum = _.min(values);
        this.maximum = _.max(values);
        this.quartile_25 = Quantile(values, 0.25);
        this.quartile_75 = Quantile(values, 0.75);
    },

    assess(indicatorValue) {
        if (indicatorValue === "") {
            return COLOR_GRAY;
        } else if (indicatorValue <= this.quartile_25) {
            return COLOR_LIGHT;
        } else if (indicatorValue > this.quartile_25 && indicatorValue < this.quartile_75) {
            return COLOR_MEDIUM;
        } else if (indicatorValue >= this.quartile_75) {
            return COLOR_DARK;
        } else {
            return COLOR_GRAY;
        }

    }


}



let wwd;
function initWorldWind() {
    console.log('init worldwind');
    // Tell WorldWind to log only warnings and errors.
    WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);

    // Create the WorldWindow.
    wwd = new WorldWind.WorldWindow("canvasOne");

    let starFieldLayer = new WorldWind.StarFieldLayer();
    var now = new Date();
    starFieldLayer.time = now;
    // Create and add layers to the WorldWindow.
    var layers = [
        { layer: new blueImageLayer(), enabled: true },
        { layer: starFieldLayer, enabled: true }
    ];

    for (var l = 0; l < layers.length; l++) {
        layers[l].layer.enabled = layers[l].enabled;
        wwd.addLayer(layers[l].layer);
    }
    // add mousedown, mouseup, drag listeners to prevent firing on globe move
    wwd.addEventListener('click', handlePick);

    // Create a layer manager for controlling layer visibility.
    var layerManager = new LayerManager(wwd);

}

// Create data for the world.
let worldLayer;
function drawShapes(indicator) {
    initWorldWind();


    // TODO: maybe better just change color than add and remove layer
    worldLayer = new WorldWind.RenderableLayer("Countries");
    var worldShapefile = new WorldWind.Shapefile('./shapefiles/ne_110m_admin_0_countries/ne_110m_admin_0_countries.shp');
    worldShapefile.load(null, shapeConfigurationCallback, worldLayer);
    wwd.addLayer(worldLayer);
    wwd.redraw();
}




// Callback function for configuring shapefile visualization.
var shapeConfigurationCallback = function (attributes, record) {
    var configuration = {};
    configuration.name = attributes.values.name || attributes.values.Name || attributes.values.NAME;

    if (record.isPolygonType()) { // Configure polygon-based features (countries, in this example).
        configuration.attributes = new WorldWind.ShapeAttributes(null);
        let countryCode = attributes.values.ISO_A2;
        let indicatorValue = _data[countryCode];


        configuration.attributes.interiorColor = _impactAssessment.assess(indicatorValue);

        // Paint the outline in a darker variant of the interior color.
        configuration.attributes.outlineColor = new WorldWind.Color(
            0.5 * configuration.attributes.interiorColor.red,
            0.5 * configuration.attributes.interiorColor.green,
            0.5 * configuration.attributes.interiorColor.blue,
            1.0);

        configuration.userProperties = { countryCode, indicatorValue };
    }

    return configuration;
};



var handlePick = function (o) {
    // The input argument is either an Event or a TapRecognizer. Both have the same properties for determining
    // the mouse or tap location.
    var x = o.clientX,
        y = o.clientY;

    // Perform the pick. Must first convert from window coordinates to canvas coordinates, which are
    // relative to the upper left corner of the canvas rather than the upper left corner of the page.
    var rectRadius = 1,
        pickPoint = wwd.canvasCoordinates(x, y),
        pickRectangle = new WorldWind.Rectangle(pickPoint[0] - rectRadius, pickPoint[1] + rectRadius,
            2 * rectRadius, 2 * rectRadius);

    var pickList = wwd.pickShapesInRegion(pickRectangle);

    // only select Top item
    let topObject = _.find(pickList.objects, function (obj) {
        //only select objects from countryshapes
        if (obj.parentLayer.displayName === "Countries") {
            return obj.isOnTop;
        } else {
            return false;
        }
    });

    if (topObject) {
        let country = topObject.userObject._displayName;
        let value = topObject.userObject.userProperties.indicatorValue;
        // Todo: data quality should be adressed elsewhere...
        if (value === null || value === undefined || value === "") {
            value = "no data";
        }
        $('.js-value').text(country + ": " + value);
        console.log(topObject);
    }

};

initialize("fa_1");