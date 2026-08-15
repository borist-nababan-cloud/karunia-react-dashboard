import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import GoogleMapsViewer from '@/components/GoogleMapsViewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, parseISO } from 'date-fns';
import { MapIcon } from 'lucide-react';

type SalesLog = {
  id: number;
  user_id: string;
  latitude: number;
  longitude: number;
  activity_type: string;
  created_at: string;
  user_profiles?: {
    full_name: string;
  };
};

export default function SalesTrackPage() {
  const [salesLogs, setSalesLogs] = useState<SalesLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Date filter (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // Selected record for map
  const [selectedLog, setSelectedLog] = useState<SalesLog | null>(null);

  const fetchSalesLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      setSelectedLog(null); // Reset selection when date changes

      // Create start and end of selected day in UTC
      const startDate = new Date(`${selectedDate}T00:00:00`).toISOString();
      const endDate = new Date(`${selectedDate}T23:59:59.999`).toISOString();

      const { data, error: fetchError } = await supabase
        .from('sales_logs')
        .select(`
          *,
          user_profiles (
            full_name
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setSalesLogs(data || []);
      
      // Auto-select the first log if available
      if (data && data.length > 0) {
        setSelectedLog(data[0]);
      }
    } catch (err: any) {
      console.error('Error fetching sales logs:', err);
      setError(err.message || 'Failed to load sales logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesLogs();
  }, [selectedDate]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in pb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Track</h1>
            <p className="text-gray-600">Monitor real-time field sales locations</p>
          </div>

          {/* Filter Section */}
          <div className="flex items-end gap-4 p-4 bg-white rounded-xl shadow-soft">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="date-filter" className="text-sm font-medium text-gray-700">
                Select Date
              </label>
              <Input
                id="date-filter"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-48"
              />
            </div>
            <Button onClick={fetchSalesLogs} disabled={loading}>
              Refresh
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {/* Split Screen Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Section: Data Grid */}
            <div className="bg-white rounded-xl shadow-soft overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-gray-500" />
                <h2 className="font-semibold text-gray-800">Tracking Data</h2>
              </div>
              
              <div className="flex-1 overflow-auto p-4">
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : salesLogs.length === 0 ? (
                  <div className="flex justify-center items-center h-32 text-gray-500">
                    No sales tracking records found for the selected date.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-600 uppercase bg-gray-50 sticky top-0 z-10 border-b">
                        <tr>
                          <th className="px-4 py-3">Sales Person</th>
                          <th className="px-4 py-3">Coordinates</th>
                          <th className="px-4 py-3 whitespace-nowrap">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesLogs.map((log) => {
                          const isSelected = selectedLog?.id === log.id;
                          return (
                            <tr
                              key={log.id}
                              onClick={() => setSelectedLog(log)}
                              className={`border-b cursor-pointer transition-colors ${
                                isSelected 
                                  ? 'bg-red-50 border-red-200' 
                                  : 'hover:bg-gray-50 border-gray-100'
                              }`}
                            >
                              <td className="px-4 py-3 font-medium text-gray-900">
                                {log.user_profiles?.full_name || 'Unknown User'}
                              </td>
                              <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                                {Number(log.latitude).toFixed(5)}, {Number(log.longitude).toFixed(5)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {format(parseISO(log.created_at), 'dd-MMM-yyyy HH:mm:ss')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Section: Google Maps */}
            <div className="bg-white rounded-xl shadow-soft overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-semibold text-gray-800">Map View</h2>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                {selectedLog ? (
                  <div className="h-full flex flex-col" key={selectedLog.id}>
                    <GoogleMapsViewer
                      latitude={Number(selectedLog.latitude)}
                      longitude={Number(selectedLog.longitude)}
                      title={selectedLog.user_profiles?.full_name || 'Sales Location'}
                      address={format(parseISO(selectedLog.created_at), 'dd-MMM-yyyy HH:mm:ss')}
                      height="450px"
                      zoom={16}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <MapIcon className="h-12 w-12 mb-2 text-gray-300" />
                    <p>Select a record on the left to view its location</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
