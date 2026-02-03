'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoogleMapsLoader } from '@/utils/GoogleMapsLoader';

interface GoogleMapsViewerProps {
  latitude: number;
  longitude: number;
  title?: string;
  address?: string;
  height?: string;
  zoom?: number;
  showDirections?: boolean;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export default function GoogleMapsViewer({
  latitude,
  longitude,
  title,
  address,
  height = '300px',
  zoom = 15,
  showDirections = true,
}: GoogleMapsViewerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [isMapsLoading, setIsMapsLoading] = useState(false);

  // Initialize static map
  const initMap = () => {
    if (!mapRef.current || typeof window === 'undefined') return;

    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not loaded');
      setMapsError('Google Maps API failed to load');
      return;
    }

    setIsMapsLoading(true);

    try {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: zoom,
        center: { lat: latitude, lng: longitude },
        mapTypeControl: false,
        streetViewControl: true,
        fullscreenControl: false,
        zoomControl: true,
        clickableIcons: false,
        gestureHandling: 'none', // Disable panning/zooming for static view
      });

      const marker = new window.google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: mapInstance,
        title: title || 'Location',
        animation: window.google.maps.Animation.DROP,
      });

      // Add info window if title or address is provided
      if (title || address) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="max-width: 200px; padding: 8px;">
              ${title ? `<h3 style="margin: 0 0 4px 0; font-weight: bold;">${title}</h3>` : ''}
              ${address ? `<p style="margin: 0; font-size: 14px; color: #666;">${address}</p>` : ''}
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstance, marker);
        });
      }

      setMap(mapInstance);
      setMapsError(null);
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapsError('Failed to initialize map');
    } finally {
      setIsMapsLoading(false);
    }
  };

  // Load Google Maps API
  const loadGoogleMaps = (callback: () => void) => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapsError('Google Maps API key is not configured');
      return;
    }

    GoogleMapsLoader.load(GOOGLE_MAPS_API_KEY, callback)
      .catch(() => {
        setMapsError('Failed to load Google Maps API');
      });
  };

  // Get Google Maps directions URL
  const getDirectionsUrl = () => {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  };

  // Get Google Maps view URL
  const getMapsViewUrl = () => {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  };

  // Initialize when component mounts
  useEffect(() => {
    if (mapRef.current && !map) {
      loadGoogleMaps(initMap);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return (
    <div className="space-y-2">
      <div className="relative">
        {mapsError ? (
          <div className="border rounded-lg bg-red-50 border-red-200 p-4 text-red-700">
            <p className="text-sm">{mapsError}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.open(getMapsViewUrl(), '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Google Maps
            </Button>
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
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        )}
      </div>

      {showDirections && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(getMapsViewUrl(), '_blank')}
            className="flex items-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            View on Maps
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(getDirectionsUrl(), '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Get Directions
          </Button>
        </div>
      )}

      <div className="text-xs text-gray-500">
        {latitude && longitude ? (
          <p>
            Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>
        ) : (
          <p>No coordinates available</p>
        )}
      </div>
    </div>
  );
}