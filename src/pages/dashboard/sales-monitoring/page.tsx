'use client';

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { MapPin, Phone, Mail, Activity, Map as MapIcon, RefreshCw, User, Car } from 'lucide-react';
import { salesMonitoringAPI } from '@/services/api';
import { toast } from 'sonner';
import { getOptimalImageUrl, getImageUrl } from '@/utils/imageUtils';
import { GoogleMapsLoader } from '@/utils/GoogleMapsLoader';

interface SalesStaff {
  id: number;
  documentId: string;
  sales_uid: string;
  email: string;
  surename: string;
  address: string;
  city: string;
  province: string;
  phonenumber: string;
  wanumber: string;
  namasupervisor: string;
  approved: boolean;
  blocked: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
  online_stat: boolean | null;
  photo_profile?: {
    url: string;
    formats?: {
      small?: {
        url: string;
      };
      thumbnail?: {
        url: string;
      };
    };
  };
  spks?: Array<{
    id: number;
    noSPK: string;
    namaCustomer: string;
    finish: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
export default function SalesMonitoringPage() {
  const [salesData, setSalesData] = useState<SalesStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [map, setMap] = useState<any | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [mapInitialized, setMapInitialized] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const MAP_CONTAINER_ID = 'sales-monitoring-map-container';

  const branches = [
    { value: 'all', label: 'All Branches' },
    { value: 'SURABAYA', label: 'Surabaya' },
    { value: 'JAKARTA', label: 'Jakarta' },
    { value: 'BANDUNG', label: 'Bandung' },
    { value: 'BALI', label: 'Bali' },
  ];

  const getMarkerColor = (onlineStat: boolean | null) => {
    return onlineStat === true ? '#10b981' : '#ef4444'; // Green for online, Red for offline
  };

  // Fetch sales data from API
  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const response = await salesMonitoringAPI.getSalesProfilesWithSPK();
      const salesData = response.data || [];

      setSalesData(salesData);
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchSalesData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSalesData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Use a ref to track if map was initialized to avoid dependency issues
  const mapInitRef = useRef(false);

  const initMap = useCallback(() => {
    // Prevent duplicate initialization using ref instead of state
    if (mapInitRef.current) {
      return;
    }

    // Check if Google Maps API is loaded
    if (typeof window === 'undefined' || !window.google || !window.google.maps) {
      console.error('[SalesMonitoring] Google Maps API not loaded yet');
      return;
    }

    // Try to get the map container by ID
    const mapContainer = document.getElementById(MAP_CONTAINER_ID);
    if (!mapContainer) {
      console.warn('[SalesMonitoring] Map container element not found (ID:', MAP_CONTAINER_ID, ')');
      return;
    }

    try {
      const mapInstance = new window.google.maps.Map(mapContainer, {
        zoom: 11,
        center: { lat: -6.2088, lng: 106.8456 }, // Jakarta center
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      setMap(mapInstance);
      setMapInitialized(true);
      mapInitRef.current = true;
    } catch (error) {
      console.error('[SalesMonitoring] Failed to initialize Google Maps:', error);
    }
  }, []);

  const updateMarkers = useCallback(() => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    const newMarkers: any[] = [];
    const bounds = new (window.google.maps.LatLngBounds as any)();
    let markerCount = 0;
    const locationCounts: Record<string, number> = {};

    salesData
      .filter(sales => {
        // Only show sales with location data
        if (!sales.location || !sales.location.latitude || !sales.location.longitude) {
          return false;
        }
        return selectedBranch === 'all' || sales.city === selectedBranch;
      })
      .forEach(sales => {
        const originalLat = sales.location!.latitude;
        const originalLng = sales.location!.longitude;

        // Create a unique key for this location
        const locKey = `${originalLat.toFixed(6)},${originalLng.toFixed(6)}`;
        const count = locationCounts[locKey] || 0;
        locationCounts[locKey] = count + 1;

        let finalLat = originalLat;
        let finalLng = originalLng;

        // Apply jitter if this location has been seen before (or if we want to jitter everything a tiny bit)
        if (count > 0) {
          // Spiral jitter algorithm
          // 0.0002 degrees is roughly 20-25 meters
          const angle = count * (2 * Math.PI / 6); // 6 markers per 'ring'
          const ring = Math.floor(count / 6) + 1;
          const radius = 0.00025 * ring;

          finalLat = originalLat + (Math.sin(angle) * radius);
          finalLng = originalLng + (Math.cos(angle) * radius);
        }

        const marker = new (window.google.maps.Marker as any)({
          position: { lat: finalLat, lng: finalLng },
          map,
          title: `${sales.surename} (${sales.city})`, // Improved tooltip
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: getMarkerColor(sales.online_stat),
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWidth: 2,
          },
          zIndex: count + 1, // Ensure stacked markers have different z-indexes
        });

        // Create info window content with photo, name, and WhatsApp
        let photoUrl = '';
        if (sales.photo_profile) {
          // Use thumbnail or small image as per sample-data.md structure
          if (sales.photo_profile.formats && sales.photo_profile.formats.small) {
            photoUrl = sales.photo_profile.formats.small.url;
          } else if (sales.photo_profile.formats && sales.photo_profile.formats.thumbnail) {
            photoUrl = sales.photo_profile.formats.thumbnail.url;
          } else if (sales.photo_profile.url) {
            photoUrl = sales.photo_profile.url;
          }
        }

        const fullPhotoUrl = photoUrl ? getImageUrl(photoUrl) : '';

        const infoContent = `
          <div style="padding: 10px; min-width: 200px; display: flex; align-items: center; gap: 10px;">
            ${fullPhotoUrl ? `<img src="${fullPhotoUrl}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;" />` : '<div style="width: 50px; height: 50px; border-radius: 50%; background-color: #e5e7eb; display: flex; align-items: center; justify-content: center;"><span style="font-weight: bold; color: #6b7280;">${sales.surename.charAt(0)}</span></div>'}
            <div>
              <h3 style="margin: 0 0 5px 0; font-weight: bold; font-size: 14px;">${sales.surename}</h3>
              <p style="margin: 2px 0; font-size: 12px; color: #6b7280;">📱 ${sales.wanumber || 'No WhatsApp'}</p>
              <p style="margin: 2px 0; font-size: 12px; color: ${sales.online_stat === true ? '#10b981' : '#ef4444'}; font-weight: bold;">
                ● ${sales.online_stat === true ? 'ONLINE' : 'OFFLINE'}
              </p>
              <p style="margin: 4px 0 0 0; font-size: 10px; color: #9ca3af;">
                ${sales.city || 'Unknown Location'}
              </p>
            </div>
          </div>
        `;

        const infoWindow = new (window.google.maps.InfoWindow as any)({
          content: infoContent,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        newMarkers.push(marker);
        bounds.extend({ lat: finalLat, lng: finalLng });
      });





    setMarkers(newMarkers);

    // Fit map to show all markers
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, salesData, selectedBranch]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  const loadGoogleMaps = useCallback(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('[SalesMonitoring] Google Maps API key is not configured');
      toast.error('Google Maps API key is not configured');
      return;
    }

    console.log('[SalesMonitoring] Loading Google Maps API...');
    GoogleMapsLoader.load(GOOGLE_MAPS_API_KEY)
      .then(() => {
        // Try to initialize map with retries
        let retries = 0;
        const maxRetries = 20; // Try for up to 10 seconds (20 * 500ms)

        const tryInitMap = () => {
          const mapContainer = document.getElementById(MAP_CONTAINER_ID);
          if (mapContainer) {
            initMap();
          } else if (retries < maxRetries) {
            retries++;
            setTimeout(tryInitMap, 500);
          } else {
            console.error('[SalesMonitoring] Failed to find map container after', maxRetries, 'retries');
            toast.error('Failed to initialize map');
          }
        };

        tryInitMap();
      })
      .catch((error) => {
        console.error('[SalesMonitoring] Failed to load Google Maps API:', error);
        toast.error('Failed to load Google Maps');
      });
  }, [initMap]);

  // Load Google Maps after component is mounted and DOM is ready
  useLayoutEffect(() => {
    loadGoogleMaps();
  }, [loadGoogleMaps]);

  const filteredSalesData = salesData.filter(sales =>
    selectedBranch === 'all' || sales.city === selectedBranch
  );

  const onlineCount = filteredSalesData.filter(s => s.online_stat === true).length;
  const totalCount = filteredSalesData.length;
  const totalSPKs = filteredSalesData.reduce((acc, s) => acc + (s.spks?.length || 0), 0);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales Monitoring</h1>
              <p className="text-gray-600">Live tracking of sales staff locations and activities</p>
            </div>
            <div className="flex gap-3 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchSalesData()}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.value} value={branch.value}>
                      {branch.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCount}</div>
                <p className="text-xs text-muted-foreground">
                  {selectedBranch === 'all' ? 'Across all branches' : `In ${selectedBranch}`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Online Now</CardTitle>
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{onlineCount}</div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total SPKs</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSPKs}</div>
                <p className="text-xs text-muted-foreground">
                  Sales orders
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">With Location</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredSalesData.filter(s => s.location && s.location.latitude && s.location.longitude).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Trackable sales
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Map and Sales List */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Map */}
            <Card>
              <CardHeader>
                <CardTitle>Live Map</CardTitle>
                <CardDescription>
                  Real-time location of sales staff.
                  <span className="inline-flex items-center gap-1 ml-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Online
                    <span className="w-2 h-2 bg-red-500 rounded-full ml-2"></span>
                    Offline
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  id={MAP_CONTAINER_ID}
                  ref={mapRef}
                  style={{ width: '100%', height: '500px' }}
                  className="bg-gray-100 rounded-lg"
                />
              </CardContent>
            </Card>

            {/* Sales List */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Staff</CardTitle>
                <CardDescription>
                  {onlineCount} of {totalCount} currently online
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredSalesData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No sales staff found
                    </div>
                  ) : (
                    filteredSalesData.map((sales) => (
                      <div
                        key={sales.id}
                        className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <Avatar>
                          <AvatarImage
                            src={getOptimalImageUrl(sales.photo_profile)}
                          />
                          <AvatarFallback>{sales.surename.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{sales.surename}</p>
                            <Badge
                              variant={sales.online_stat === true ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {sales.online_stat === true ? 'online' : 'offline'}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {sales.city || 'Unknown city'}
                          </p>
                          <p className="text-xs text-gray-500">
                            📱 {sales.wanumber || 'No WhatsApp'} • {sales.spks?.length || 0} SPKs
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <div className="flex items-center space-x-1">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: getMarkerColor(sales.online_stat) }}
                            ></div>
                          </div>
                          {!sales.location && (
                            <span className="text-xs text-gray-400">No location</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}