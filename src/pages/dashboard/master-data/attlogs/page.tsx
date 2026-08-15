import React, { useMemo, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Download, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, parseISO } from 'date-fns';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

type AttLog = {
  id: number;
  user_id: string;
  branch_id: number;
  distance: number;
  latitude: number;
  longitude: number;
  created_at: string;
  user_profiles?: { full_name: string };
  branches?: { name: string };
};

export default function AttLogsPage() {
  const [data, setData] = useState<AttLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Default to today
  const today = format(new Date(), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const fetchAttLogs = async () => {
    setIsLoading(true);
    try {
      // Append time to end date to ensure it covers the entire day up to 23:59:59
      // Since created_at is stored in UTC, and the user's input is local,
      // a highly accurate production app would convert this to UTC explicitly.
      // We will use local timestamps and Supabase handles it reasonably if we use ISO string
      const endDateTime = new Date(`${endDate}T23:59:59`).toISOString();
      const startDateTime = new Date(`${startDate}T00:00:00`).toISOString();

      const { data: attlogs, error } = await supabase
        .from('attlogs')
        .select(`
          *,
          user_profiles(full_name),
          branches(name)
        `)
        .gte('created_at', startDateTime)
        .lte('created_at', endDateTime)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching attendance logs:", error);
        alert("Terjadi kesalahan pada sistem, silakan hubungi tim IT.");
      } else {
        setData(attlogs || []);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const handleExportData = () => {
    if (data.length === 0) return;

    // Create CSV content
    const headers = ['User', 'Branch', 'Distance (meters)', 'Date', 'Time (24h)', 'Latitude', 'Longitude'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => {
        const dateObj = parseISO(row.created_at);
        const localizedDate = format(dateObj, 'dd MMM yyyy');
        const localizedTime = format(dateObj, 'HH:mm'); // 24-hour format

        return [
          `"${row.user_profiles?.full_name || 'Unknown'}"`,
          `"${row.branches?.name || 'Unknown'}"`,
          `${row.distance}`,
          `"${localizedDate}"`,
          `"${localizedTime}"`,
          `${row.latitude}`,
          `${row.longitude}`
        ].join(',');
      })
    ].join('\n');

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Attendance_Logs_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns = useMemo<MRT_ColumnDef<AttLog>[]>(
    () => [
      {
        accessorFn: (row) => row.user_profiles?.full_name || 'Unknown User',
        id: 'user',
        header: 'User',
      },
      {
        accessorFn: (row) => row.branches?.name || 'Unknown Branch',
        id: 'branch',
        header: 'Branch',
      },
      {
        accessorFn: (row) => `${row.distance} meters`,
        id: 'distance',
        header: 'Distance',
      },
      {
        accessorFn: (row) => format(parseISO(row.created_at), 'dd MMM yyyy'),
        id: 'date',
        header: 'Date',
      },
      {
        accessorFn: (row) => format(parseISO(row.created_at), 'HH:mm'),
        id: 'time',
        header: 'Time',
      },
    ],
    []
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance Logs</h1>
        <p className="text-gray-600">Track and manage geofenced attendance records</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100 flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:w-64">
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <div className="relative">
            <Input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-10"
            />
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        <div className="w-full md:w-64">
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <div className="relative">
            <Input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-10"
            />
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
        <MaterialReactTable
          columns={columns}
          data={data}
          state={{ isLoading }}
          enableRowSelection={false}
          enableColumnFilters={true}
          enableGlobalFilter={true}
          enablePagination={true}
          renderTopToolbarCustomActions={() => (
            <div className="flex gap-2">
              <Button onClick={handleExportData} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export to CSV
              </Button>
            </div>
          )}
          muiTablePaperProps={{
            elevation: 0,
            sx: {
              borderRadius: '0',
            },
          }}
        />
      </div>
    </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
