import { Component } from '@angular/core';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  //loading spinner
  public loading = true;
  public layersLoading = false;

  // Set our map properties
  mapCenter = [-118.65, 34.09];
  basemapType = 'dark-gray-vector';
  mapZoomLevel = 10;

  crLogo = "assets/img/coastal_risk.png";

  // See app.component.html
  mapLoadedEvent(status: boolean) {
    console.log('The map loaded: ' + status);
    this.loading = false;
  }

  layersLoadedEvent(status: boolean) {
    this.layersLoading = status;
  }
}
