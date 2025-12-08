import { useState } from 'react';
import { Calendar, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatsCards } from '@/components/reports/StatsCards';
import { DispatchLogTable } from '@/components/reports/DispatchLogTable';
import { Button } from '@/components/ui/button';
import { mockDailyStats, mockDispatchLogs } from '@/data/mockData';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const Reports = () => {
  const [selectedDate] = useState(new Date());

  const handleExportCSV = () => {
    toast.success('Exporting report as CSV...');
  };

  const handleExportPDF = () => {
    toast.success('Exporting report as PDF...');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        associationName="Metro Taxi Association" 
        dispatcherName="Alex Johnson"
      />

      <main className="p-4 lg:p-6 max-w-[1600px] mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Daily Report</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(selectedDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-6">
          <StatsCards stats={mockDailyStats} />
        </div>

        {/* Dispatch Log */}
        <DispatchLogTable 
          logs={mockDispatchLogs}
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
        />
      </main>
    </div>
  );
};

export default Reports;
