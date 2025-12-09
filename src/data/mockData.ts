import { Driver, Fermata, QueueEntry, DispatchLog, DailyStats } from '@/types/taxi';

export const mockDrivers: Driver[] = [
  { id: '1', name: 'Mewael Werede', phone: '+251 978-187178', licenseId: 'DL-2024-001' },
  { id: '2', name: 'Maria Garcia', phone: '+1 555-0102', licenseId: 'DL-2024-002' },
  { id: '3', name: 'David Johnson', phone: '+1 555-0103', licenseId: 'DL-2024-003' },
  { id: '4', name: 'Sarah Williams', phone: '+1 555-0104', licenseId: 'DL-2024-004' },
  { id: '5', name: 'Michael Brown', phone: '+1 555-0105', licenseId: 'DL-2024-005' },
];

export const mockFermatas: Fermata[] = [
  { id: '1', code: 'A', name: 'Central Station' },
  { id: '2', code: 'B', name: 'Airport Terminal' },
  { id: '3', code: 'C', name: 'City Mall' },
  { id: '4', code: 'D', name: 'University Campus' },
  { id: '5', code: 'E', name: 'Business District' },
  { id: '6', code: 'F', name: 'Hospital Complex' },
];

const now = new Date();

export const mockQueueEntries: QueueEntry[] = [
  {
    id: '1',
    queueNumber: 1,
    taxiId: 'T001',
    plateNumber: 'TX-1234',
    driverName: 'John Smith',
    arrivalTime: new Date(now.getTime() - 45 * 60000),
    status: 'waiting',
  },
  {
    id: '2',
    queueNumber: 2,
    taxiId: 'T002',
    plateNumber: 'TX-5678',
    driverName: 'Maria Garcia',
    arrivalTime: new Date(now.getTime() - 32 * 60000),
    status: 'waiting',
  },
  {
    id: '3',
    queueNumber: 3,
    taxiId: 'T003',
    plateNumber: 'TX-9012',
    driverName: 'David Johnson',
    arrivalTime: new Date(now.getTime() - 18 * 60000),
    status: 'waiting',
  },
  {
    id: '4',
    queueNumber: 4,
    taxiId: 'T004',
    plateNumber: 'TX-3456',
    driverName: 'Sarah Williams',
    arrivalTime: new Date(now.getTime() - 8 * 60000),
    status: 'waiting',
  },
];

export const mockDispatchLogs: DispatchLog[] = [
  {
    id: '1',
    queueEntry: {
      id: 'log1',
      queueNumber: 1,
      taxiId: 'T010',
      plateNumber: 'TX-7890',
      driverName: 'Michael Brown',
      arrivalTime: new Date(now.getTime() - 120 * 60000),
      status: 'dispatched',
      dispatchedAt: new Date(now.getTime() - 90 * 60000),
    },
    destination: mockFermatas[0],
    dispatchedAt: new Date(now.getTime() - 90 * 60000),
  },
  {
    id: '2',
    queueEntry: {
      id: 'log2',
      queueNumber: 2,
      taxiId: 'T011',
      plateNumber: 'TX-2468',
      driverName: 'Emily Davis',
      arrivalTime: new Date(now.getTime() - 100 * 60000),
      status: 'dispatched',
      dispatchedAt: new Date(now.getTime() - 75 * 60000),
    },
    destination: mockFermatas[1],
    dispatchedAt: new Date(now.getTime() - 75 * 60000),
  },
];

export const mockDailyStats: DailyStats = {
  totalDispatched: 47,
  peakHour: '08:00 - 09:00',
  mostFrequentDestination: 'Airport Terminal',
  averageWaitTime: 23,
};
