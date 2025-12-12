import { Driver, Fermata, QueueEntry, DispatchLog, DailyStats, User, Taxi } from '@/types/taxi';

// Dispatchers - each has exactly ONE assigned fermata
export const mockUsers: User[] = [
  { id: '1', email: 'admin@taxi.com', name: 'ኣብርሃም ገብረ', role: 'admin' },
  { id: '2', email: 'dispatcher@taxi.com', name: 'ሳራ ተወልደ', role: 'dispatcher', assignedFermatas: ['1'] },
  { id: '3', email: 'dispatcher2@taxi.com', name: 'ዳዊት ሃይለ', role: 'dispatcher', assignedFermatas: ['2'] },
  { id: '4', email: 'dispatcher3@taxi.com', name: 'ሃና ተስፋይ', role: 'dispatcher', assignedFermatas: ['3'] },
  { id: '5', email: 'dispatcher4@taxi.com', name: 'ዮሃንስ ኪዳነ', role: 'dispatcher', assignedFermatas: ['4'] },
];

// Drivers with license info
export const mockDrivers: Driver[] = [
  { id: '1', name: 'መዋእል ወረደ', phone: '+251 978-187178', licenseId: 'DL-2024-001' },
  { id: '2', name: 'ማርያም ገብረ', phone: '+251 911-234567', licenseId: 'DL-2024-002' },
  { id: '3', name: 'ዳዊት ዮሃንስ', phone: '+251 912-345678', licenseId: 'DL-2024-003' },
  { id: '4', name: 'ሳራ ውልደ', phone: '+251 913-456789', licenseId: 'DL-2024-004' },
  { id: '5', name: 'ሚካኤል ብርሃነ', phone: '+251 914-567890', licenseId: 'DL-2024-005' },
  { id: '6', name: 'ኤሚሊ ዳዊት', phone: '+251 915-678901', licenseId: 'DL-2024-006' },
  { id: '7', name: 'ገብረ መስፍን', phone: '+251 916-789012', licenseId: 'DL-2024-007' },
  { id: '8', name: 'ተኽለ ኣብርሃም', phone: '+251 917-890123', licenseId: 'DL-2024-008' },
];

// Taxis linked to drivers (one-to-one relationship)
export const mockTaxis: Taxi[] = [
  { id: '1', plateNumber: 'TX-1234', type: 'sedan', driverId: '1' },
  { id: '2', plateNumber: 'TX-5678', type: 'suv', driverId: '2' },
  { id: '3', plateNumber: 'TX-9012', type: 'van', driverId: '3' },
  { id: '4', plateNumber: 'TX-3456', type: 'minibus', driverId: '4' },
  { id: '5', plateNumber: 'TX-7890', type: 'sedan', driverId: '5' },
  { id: '6', plateNumber: 'TX-2468', type: 'sedan', driverId: '6' },
  { id: '7', plateNumber: 'TX-1357', type: 'suv', driverId: '7' },
  { id: '8', plateNumber: 'TX-8024', type: 'van', driverId: '8' },
];

export const mockFermatas: Fermata[] = [
  { id: '1', code: 'ሀ', name: 'ፍልፍል' },
  { id: '2', code: 'ለ', name: 'ኣየር ፖርት' },
  { id: '3', code: 'ሐ', name: 'መርካቶ' },
  { id: '4', code: 'መ', name: 'ዩኒቨርሲቲ' },
  { id: '5', code: 'ሰ', name: 'ሆስፒታል' },
  { id: '6', code: 'ረ', name: 'ፒያሳ' },
];

const now = new Date();

export const mockQueueEntries: QueueEntry[] = [
  {
    id: '1',
    queueNumber: 1,
    plateNumber: 'TX-1234',
    driverName: 'መዋእል ወረደ',
    arrivalTime: new Date(now.getTime() - 45 * 60000),
    status: 'waiting',
  },
  {
    id: '2',
    queueNumber: 2,
    plateNumber: 'TX-5678',
    driverName: 'ማርያም ገብረ',
    arrivalTime: new Date(now.getTime() - 32 * 60000),
    status: 'waiting',
  },
  {
    id: '3',
    queueNumber: 3,
    plateNumber: 'TX-9012',
    driverName: 'ዳዊት ዮሃንስ',
    arrivalTime: new Date(now.getTime() - 18 * 60000),
    status: 'waiting',
  },
  {
    id: '4',
    queueNumber: 4,
    plateNumber: 'TX-3456',
    driverName: 'ሳራ ውልደ',
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
      plateNumber: 'TX-7890',
      driverName: 'ሚካኤል ብርሃነ',
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
      plateNumber: 'TX-2468',
      driverName: 'ኤሚሊ ዳዊት',
      arrivalTime: new Date(now.getTime() - 100 * 60000),
      status: 'dispatched',
      dispatchedAt: new Date(now.getTime() - 75 * 60000),
    },
    destination: mockFermatas[1],
    dispatchedAt: new Date(now.getTime() - 75 * 60000),
  },
  {
    id: '2',
    queueEntry: {
      id: 'log3',
      queueNumber: 3,
      plateNumber: 'TX-2468',
      driverName: 'ኤሚሊ ዳዊት',
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
  mostFrequentDestination: 'ኣየር ፖርት',
  averageWaitTime: 23,
};
