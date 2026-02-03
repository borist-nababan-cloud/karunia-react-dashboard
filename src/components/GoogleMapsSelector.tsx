'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, MapPin, RotateCcw } from 'lucide-react';
import { GoogleMapsLoader } from '@/utils/GoogleMapsLoader';

interface GoogleMapsSelectorProps {
  latitude?: number;
  longitude?: number;
  onLocationChange: (latitude: number, longitude: number) => void;
  defaultLocation?: { lat: number; lng: number };
  height?: string;
  showSearch?: boolean;
  disabled?: boolean;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export default function GoogleMapsSelector({
  latitude,
  longitude,
  onLocationChange,
  defaultLocation = { lat: -6.1944, lng: 106.8229 }, // Default: Jakarta
  height = '400px',
  showSearch = true,
  disabled = false,
}: GoogleMapsSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [isMapsLoading, setIsMapsLoading] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);

  // Initialize map
  const initMap = useCallback(() => {
    if (!mapRef.current || typeof window === 'undefined') return;

    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not loaded');
      setMapsError('Google Maps API failed to load');
      return;
    }

    setIsMapsLoading(true);

    try {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        center: latitude && longitude ? { lat: latitude, lng: longitude } : defaultLocation,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        clickableIcons: true,
        gestureHandling: 'cooperative',
      });

      const mapMarker = new window.google.maps.Marker({
        position: latitude && longitude ? { lat: latitude, lng: longitude } : defaultLocation,
        map: mapInstance,
        draggable: !disabled,
        title: 'Branch Location',
        animation: window.google.maps.Animation.DROP,
      });

      // Handle marker drag events
      mapMarker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
        const lat = event.latLng?.lat();
        const lng = event.latLng?.lng();
        if (lat && lng) {
          onLocationChange(lat, lng);
        }
      });

      // Handle map click events (only if not disabled)
      if (!disabled) {
        mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
          const lat = event.latLng?.lat();
          const lng = event.latLng?.lng();
          if (lat && lng) {
            mapMarker.setPosition({ lat, lng });
            onLocationChange(lat, lng);
          }
        });
      }

      setMap(mapInstance);
      setMarker(mapMarker);
      setMapsError(null);
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapsError('Failed to initialize map');
    } finally {
      setIsMapsLoading(false);
    }
  }, [latitude, longitude, defaultLocation, disabled, onLocationChange]);

  // Update marker position when coordinates change from form inputs
  useEffect(() => {
    if (latitude && longitude && marker && map) {
      const newPosition = { lat: latitude, lng: longitude };
      marker.setPosition(newPosition);
      map.panTo(newPosition);
    }
  }, [latitude, longitude, marker, map]);

  // Initialize autocomplete
  const initAutocomplete = useCallback(() => {
    if (!searchRef.current || !window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    try {
      const autocompleteInstance = new window.google.maps.places.Autocomplete(searchRef.current, {
        types: ['establishment', 'address'],
        fields: ['place_id', 'geometry', 'formatted_address', 'name'],
        componentRestrictions: { country: ['id'] }, // Restrict to Indonesia
      });

      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();

        if (!place.geometry || !place.geometry.location) {
          console.error('Place has no geometry');
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        if (lat && lng) {
          // Update map center and marker
          if (map) {
            map.panTo({ lat, lng });
            map.setZoom(17);
          }

          if (marker) {
            marker.setPosition({ lat, lng });
          }

          // Update form coordinates
          onLocationChange(lat, lng);

          // Update search input with formatted address
          if (searchRef.current && place.formatted_address) {
            searchRef.current.value = place.formatted_address;
          }
        }
      });

      setAutocomplete(autocompleteInstance);
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
    }
  }, [map, marker, onLocationChange]);

  // Load Google Maps API
  const loadGoogleMaps = useCallback((callback: () => void) => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapsError('Google Maps API key is not configured');
      return;
    }

    GoogleMapsLoader.load(GOOGLE_MAPS_API_KEY, callback)
      .catch(() => {
        setMapsError('Failed to load Google Maps API. Please check your internet connection.');
      });
  }, []);

  // Initialize when component mounts
  useEffect(() => {
    if (mapRef.current && !map) {
      loadGoogleMaps(() => {
        initMap();
        if (showSearch) {
          setTimeout(initAutocomplete, 500); // Small delay to ensure map is ready
        }
      });
    }
  }, [map, loadGoogleMaps, initMap, showSearch, initAutocomplete]);

  // Handle manual coordinate input
  const handleCoordinateChange = (type: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const newLat = type === 'lat' ? numValue : latitude || 0;
      const newLng = type === 'lng' ? numValue : longitude || 0;
      onLocationChange(newLat, newLng);
    }
  };

  // Reset to default location
  const handleReset = () => {
    if (marker && map) {
      marker.setPosition(defaultLocation);
      map.panTo(defaultLocation);
      map.setZoom(15);
      onLocationChange(defaultLocation.lat, defaultLocation.lng);

      if (searchRef.current) {
        searchRef.current.value = '';
      }
    }
  };

  // Get current location (geolocation)
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        if (marker && map) {
          marker.setPosition({ lat, lng });
          map.panTo({ lat, lng });
          map.setZoom(17);
          onLocationChange(lat, lng);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your current location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="space-y-2">
          <Label htmlFor="address-search">Search Address</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              ref={searchRef}
              id="address-search"
              type="text"
              placeholder="Search for address or place..."
              className="pl-10"
              disabled={disabled}
            />
          </div>
        </div>
      )}

      <div className="relative">
        {mapsError ? (
          <div className="border rounded-lg bg-red-50 border-red-200 p-4 text-red-700">
            <p className="text-sm">{mapsError}</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div
              ref={mapRef}
              style={{ width: '100%', height }}
              className="bg-gray-100"
            />
            {isMapsLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        )}
      </div>

      {!disabled && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              value={latitude || ''}
              onChange={(e) => handleCoordinateChange('lat', e.target.value)}
              placeholder="e.g., -6.1944"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              value={longitude || ''}
              onChange={(e) => handleCoordinateChange('lng', e.target.value)}
              placeholder="e.g., 106.8229"
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGetCurrentLocation}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <MapPin className="h-4 w-4" />
          Use My Location
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      <p className="text-xs text-gray-500">
        {!disabled
          ? "Click on the map or drag the marker to set the location. You can also search for an address or enter coordinates manually."
          : "Location view - editing is disabled"
        }
      </p>
    </div>
  );
}