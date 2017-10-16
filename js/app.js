var map;

var markers = ko.observableArray([]);

var types = ko.observableArray(['All', 'Music', 'Pioneer Site', 'Early Figure', 'Civil War Site']);

var nashGovUrl = 'https://data.na shville.gov/resource/m4hn-ihe4.json';

var nashGovToken = 'U4sjKdpViz8YBaBIzSfPZiVg0';

var largeInfoWindow;

// Google Map related functions --
// functionality based on code from Udacity class on Google Maps APIs--
// this function initializes the map, creates and renders the markers, creates
// and renders the infowindow with 3rd party API info from Nashville.gov.
function initMap()  {
  // Constructor creates a new map with a center on Nashville, TN.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 36.1627, lng: -86.7816},
    zoom: 13
  });

  largeInfoWindow = new google.maps.InfoWindow();

  // Creating the default marker
  var defaultIcon = makeMarkerIcon('0091ff');

  // The following loop uses the location array to create an array of markers on initialize.
  locations.forEach(function(location)  {
    // Get the position, title, type and number from the location array.
    var position = location.location;
    var title = location.title;
    var type = location.type;
    var number = location.number;
    // Create a marker per location, and put into markers array.
    var marker = new google.maps.Marker({
      position: position,
      title: title,
      type: type,
      number: number,
      animation: google.maps.Animation.DROP,
      id: i
    });
    // Push the marker to our array of markers.
    markers.push(marker);
    // Create an onclick event to open the large infowindow at each marker.
    marker.addListener("click", function() {
      populateInfoWindow(this, largeInfoWindow);
    });
    // Create an onclick event to animate the marker
    marker.addListener("click", function() {
      markers().forEach(function(marker) {
        marker.setAnimation(null);
      });
      this.setAnimation(google.maps.Animation.BOUNCE);
    });
  });

  renderMarkers();

  // This function takes in a COLOR, and then creates a new marker
  // icon of that color. The icon will be 21 px wide by 34 high, have an origin
  // of 0, 0 and be anchored at 10, 34).
  function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
      'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+
      markerColor + '|40|_|%E2%80%A2',
      new google.maps.Size(21, 34),
      new google.maps.Point(0, 0),
      new google.maps.Point(10, 34),
      new google.maps.Size(21,34));
    return markerImage;
  }
}

// Displays the markers on the map.
function renderMarkers()  {
  var bounds = new google.maps.LatLngBounds();
  // Extend the boundaries of the map for each marker and display the marker
  for (var i = 0; i < markers().length; i++) {
    markers()[i].setMap(map);
    bounds.extend(markers()[i].position);
  }
  map.fitBounds(bounds);
}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
  // Check to make sure the infowindow is not already opened on this marker.
  if (infowindow.marker != marker) {
    // Clear the infowindow content to give the streetview time to load.
    infowindow.setContent('');
    infowindow.marker = marker;
    // Clears the marker property if the infowindow is closed.
    // Clears the animation on the marker if the infowindow is closed.
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
      marker.setAnimation(null);
    });
    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;

    // Calls to Nashville.gov API requesting the text of the relevant marker
    // then gets the street view panorama from the location of the marker.
    // If panorama is not available, a message is returned, if the AJAX query
    // fails, the user is told via pop-up window.
    $.ajax({
      headers: {"X-App-Token": nashGovToken,
                "Accept": "*/*"},
      dataType: 'json',
      url: nashGovUrl,
      data: {"number": infowindow.marker.number},
      success: function(response) {
        // Save the relevant response of the request in a variable
        marker.content = response[0].marker_text;

        // If the status is OK, compute the position of the streetview image,
        // calculate the heading, get a panorama from that, and set the options
        function getStreetView(data, status) {
          if (status == google.maps.StreetViewStatus.OK) {
            var nearStreetViewLocation = data.location.latLng;
            var heading = google.maps.geometry.spherical.computeHeading(
              nearStreetViewLocation, marker.position);
              infowindow.setContent('<div class="windowBox">' +
                                      '<div class="title">' +
                                      marker.title + '</div><div id="pano">' +
                                      '</div>' + marker.content + '</div>');
                var panoramaOptions = {
                  position: nearStreetViewLocation,
                  pov: {
                    heading: heading,
                    pitch: 10
                  }
                };
            var panorama = new google.maps.StreetViewPanorama(
              document.getElementById('pano'), panoramaOptions);
          } else {
            infowindow.setContent('<div class="windowBox"><div>' +
                                  marker.title +
                                  '</div><div>No Street View Found</div>' +
                                  marker.content + '</div>');
          }
        }
        // Use streetview service to get the closest streetview image within
        // 50 meters of the markers position
        streetViewService.getPanoramaByLocation(marker.position,
                                                radius, getStreetView);
        // Open the infowindow on the correct marker.
        infowindow.open(map, marker);

      },
      error: function(xhr, ajaxOptions, thrownError)  {
        alert("An error has occurred retreiving the marker's information.");
      }
    });
  }
}

// Animates the Open/Close icon on the sidebar
function myFunction(x) {
    x.classList.toggle("change");
}

//knockoutJS viewModel
var ViewModel = function()  {
  var self = this;

  this.chosenType = ko.observable(['All']);
  // This is a computed observable of all the markers that match the "chosen"
  // type.
  this.chosenMarkers = ko.computed(function()  {
    // Does not filter out any markers if "all" is selected (which is the
    // default).
    if (self.chosenType() == 'All') {
      for (i=0; i<markers().length; i++) {
        markers()[i].visible = true;
      }
      return markers();
    } else { // Uses a for loop to cycle through all the markers
      this.newMarkers = ko.observableArray([]);
      for (i=0; i < markers().length; i++) {
        if (self.chosenType() == markers()[i].type) {
          markers()[i].visible = true; // makes chosen marker visible
          newMarkers.push(markers()[i]); // pushes chosen marker to new variable
        } else {
          markers()[i].visible = false; // makes unchosen markers invisible
        }
      }
      largeInfoWindow.close(); // Clears the infowindow for invisible markers
      return newMarkers();
    }
    renderMarkers(); // Re-renders the markers to change visibility of them
  });

  // Makes the marker bounce when its corresponding list item is chosen
  this.animateMarker = function(data) {
    for (i=0; i<markers().length; i++) {
      if (data.number == markers()[i].number) {
        if (markers()[i].getAnimation() !== null) {
          markers()[i].setAnimation(null);
        } else {
          markers()[i].setAnimation(google.maps.Animation.BOUNCE);
        }
      } else {
        markers()[i].setAnimation(null);
      }
    }
    // Opens the infowindow of a marker when corresponding list item is chosen.
    populateInfoWindow(data, largeInfoWindow);
  };

  this.toggleMenu = function()  {
    $( ".sidebarLeft" ).fadeToggle("slow", "linear");
    $( ".toggle" ).toggleClass('change');
  };
};

ko.applyBindings(new ViewModel());

//Error Handlers
googleError = function()  {
  alert("An error has occured when loading your map");
};
