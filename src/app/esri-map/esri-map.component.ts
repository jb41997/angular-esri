/*
  Copyright 2019 Esri
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  OnDestroy
} from "@angular/core";
import { loadModules } from "esri-loader";
import esri = __esri; // Esri TypeScript Types

@Component({
  selector: "app-esri-map",
  templateUrl: "./esri-map.component.html",
  styleUrls: ["./esri-map.component.scss"]
})
export class EsriMapComponent implements OnInit, OnDestroy {
  @Output() mapLoadedEvent = new EventEmitter<boolean>();
  @Output() layersLoadedEvent = new EventEmitter<boolean>();

  // The <div> where we will place the map
  @ViewChild("mapViewNode", { static: true }) private mapViewEl: ElementRef;

  /**
   * _zoom sets map zoom
   * _center sets map center
   * _basemap sets type of map
   * _loaded provides map loaded status
   */
  private _zoom = 10;
  private _center: Array<number> = [0.1278, 51.5074];
  private _basemap = "streets";
  private _loaded = false;
  private _view: esri.MapView = null;
  private _wUtils: esri.watchUtils = null;
  private coordsWidget = document.createElement("div");

  get mapLoaded(): boolean {
    return this._loaded;
  }

  @Input()
  set zoom(zoom: number) {
    this._zoom = zoom;
  }

  get zoom(): number {
    return this._zoom;
  }

  @Input()
  set center(center: Array<number>) {
    this._center = center;
  }

  get center(): Array<number> {
    return this._center;
  }

  @Input()
  set basemap(basemap: string) {
    this._basemap = basemap;
  }

  get basemap(): string {
    return this._basemap;
  }

  constructor() {}

  async initializeMap() {
    try {
      // Load the modules for the ArcGIS API for JavaScript
      const [EsriMap, EsriMapView, Expand, BasemapGallery, GraphicsLayer, Sketch, Search, FeatureLayer, GeoJSONLayer, LayerList, Editor, watchUtils] = await loadModules([
        "esri/Map",
        "esri/views/MapView",
        "esri/widgets/Expand",
        "esri/widgets/BasemapGallery",
        "esri/layers/GraphicsLayer",
        "esri/widgets/Sketch",
        "esri/widgets/Search",
        "esri/layers/FeatureLayer",
        "esri/layers/GeoJSONLayer",
        "esri/widgets/LayerList",
        "esri/widgets/Editor",
        "esri/core/watchUtils"
      ]);

      var parcelPop = {
        "title": "{AIN}",
        "content": "<b>Address: </b>{SitusConcatenated}<br><b>City: </b> {SitusCity}<br><b>Zip: </b> {SitusZIP}<br>",
        "outFields": ["*"]
      }

      var trailHeadPop = {
        "title": "{TRL_NAME}",
        "content": "<b>City:</b>{CITY_JUR}<br><b>Cross Street:</b> {X_STREET}<br><b>Parking:</b> {PARKING}<br><b>Elevation:</b> {ELEV_FT} ft",
        "outFields": ["*"]
      }

      var trailPop = {
        "title": "Trail Information",
        "content": () => {
           return "This is {TRL_NAME} with {ELEV_GAIN} ft of climbing.";
        },
        "outFields": ["*"]
       }

      var parksPop = {
        "title": "{PARK_NAME}",
        "content": () => {
           return "Access Type: {ACCESS_TYP}";
        },
        "outFields": ["*"]
       }

      var parcelLayer = new GeoJSONLayer({
        // url: "https://services6.arcgis.com/708LZoWlLL5mAZXZ/ArcGIS/rest/services/malibu_parcels/FeatureServer/0/query?where=OBJECTID%3C1000&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=&returnGeometry=true&returnCentroid=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pgeojson&token=",
        // popupTemplate: parcelPop,
        // displayField: "AIN"
      });

      var trailheadsLayer = new FeatureLayer({
        url: "https://services6.arcgis.com/708LZoWlLL5mAZXZ/arcgis/rest/services/trailheads/FeatureServer",
        popupTemplate: trailHeadPop,
        displayField: "TRL_NAME"
      });

      var trailsLayer = new FeatureLayer({
        url: "https://services6.arcgis.com/708LZoWlLL5mAZXZ/arcgis/rest/services/Trails/FeatureServer",
        popupTemplate: trailPop,
        displayField: "TRL_NAME"
      });

      var parksLayer = new FeatureLayer({
        url: "https://services6.arcgis.com/708LZoWlLL5mAZXZ/arcgis/rest/services/parks_and_open_space/FeatureServer",
        popupTemplate: parksPop,
        displayField: "PARK_NAME"
      });


      var graphicsLayer = new GraphicsLayer({
       title: "Graphics",
       listMode: "hide"
      });

      // Configure the Map
      const mapProperties: esri.MapProperties = {
        basemap: this._basemap,
        layers: [graphicsLayer, parksLayer, trailsLayer, parcelLayer, trailheadsLayer]
      };

      const map: esri.Map = new EsriMap(mapProperties);

      // Initialize the MapView
      const mapViewProperties: esri.MapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: this._center,
        zoom: this._zoom,
        map: map
      };

      this._view = new EsriMapView(mapViewProperties);
      this._wUtils = watchUtils;


      var basemapGallery = new BasemapGallery({
        view: this._view,
        source: {
          portal: {
            url: "https://www.arcgis.com",
            useVectorBasemaps: true  // Load vector tile basemaps
          }
        }
      });

      var layerList = LayerList ({
        container: document.createElement("div"),
        view: this._view
      });

      this.coordsWidget.id = "coordsWidget";
      this.coordsWidget.className = "esri-widget esri-component";
      this.coordsWidget.style.padding = "1px 5px 1px";
      this.coordsWidget.style.background = "rgba(255,255,255,1)";

      var search = new Search ({
        view: this._view
      });

      var sketch = new Sketch ({
        view: this._view,
        layer: graphicsLayer
      });

      var editor = new Editor ({
        view: this._view,
        layerInfos: [{
          layer: trailheadsLayer,
          fieldConfig: [
            {
              name: "TRL_NAME",
              label: "Trail Name"
            },
            {
              name: "CITY_JUR",
              label: "City"              
            }]           
        },
        {
          layer: trailsLayer,
          fieldConfig: [
          {
            name: "TRL_NAME",
            label: "Trail Name"
          }]
        }]
      });

       var stroke = {
         color: [255,0,0],
         width: 1
       }

       //*** White fill color with 50% transparency ***//
       var fillColor = [255,255,255,.5];

       //*** Override all of the default symbol colors and sizes ***//
       var pointSymbol = sketch.viewModel.pointSymbol;
       pointSymbol.color = fillColor;
       pointSymbol.outline = stroke;
       pointSymbol.size = 8;

       var polylineSymbol = sketch.viewModel.polylineSymbol;
       polylineSymbol.color = stroke.color;
       polylineSymbol.width = stroke.width;

       var polygonSymbol = sketch.viewModel.polygonSymbol;
       polygonSymbol.color = fillColor;
       polygonSymbol.outline = stroke;

      var bgExpand = new Expand ({
        view: this._view,
        content: basemapGallery,
        group: "top-right"
      });

      var layerListExpand = new Expand ({
        expandIconClass: "esri-icon-layers",
        view: this._view,
        content: layerList.domNode,
        group: "top-right"
      });

      var searchExpand = new Expand ({
        expandIconClass: "esri-icon-search",
        view: this._view,
        content: search,
        group: "top-right"
      });

      var editorExpand = new Expand ({
        expandIconClass: "esri-icon-edit",
        view: this._view,
        content: editor,
        group: "top-right"
      });

      var sketchExpand = new Expand ({
        expandIconClass: "esri-icon-sketch-rectangle",
        view: this._view,
        content: sketch,
        group: "top-right"
      });

      this._view.ui.add([searchExpand,bgExpand,layerListExpand,editorExpand, sketchExpand],"top-right");
      this._view.ui.add(this.coordsWidget, "bottom-left");

      await this._view.when();
      return this._view;
    } catch (error) {
      console.log("EsriLoader: ", error);
    }
  }

  ngOnInit() {
    // Initialize MapView and return an instance of MapView
    this.initializeMap().then(mapView => {
      // The map has been initialized
      console.log("mapView ready: ", this._view.ready);
      this._loaded = this._view.ready;
      this.mapLoadedEvent.emit(true);

      //loaded layers true
      this._wUtils.whenTrue(this._view, "updating", () => {
        this.layersLoadedEvent.emit(true);
      });

      this._wUtils.whenFalse(this._view, "updating", () => {
        this.layersLoadedEvent.emit(false);
      });

      // this._view.whenLayerView(parksLayer).then(layerView => {
      //   this._wUtils.whenFalse(layerView, "updating", () => {
      //     console.log("You Should see me.");
      //   });
      // });

      let showCoordinates = (pt) => {
        var coords = "Lat: " + pt.latitude.toFixed(3) + " | Long: " + pt.longitude.toFixed(3);
            // " | Scale 1:" + Math.round(this._view.scale * 1) / 1;
            // " | Zoom " + this._view.zoom;
        this.coordsWidget.innerHTML = coords;
      }

      showCoordinates(this._view.center)


      this._view.on("pointer-move", (evt) => {
        var sPoint = {
          x: evt.x,
          y: evt.y
        };
        showCoordinates(this._view.toMap(sPoint));
      });

    });
  }

  ngOnDestroy() {
    if (this._view) {
      // destroy the map view
      this._view.container = null;
    }
  }
}
