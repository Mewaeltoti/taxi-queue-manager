// Database types matching Supabase schema
export type AppRole = 'admin' | 'dispatcher';
export type QueueStatus = 'waiting' | 'dispatched' | 'skipped' | 'not_ready' | 'returned' | 'canceled';
export type ReportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type ReportReason = 'wrong_fermata' | 'wrong_association' | 'unauthorized_dispatch' | 'excessive_skips' | 'timeout' | 'other';
export type AuditAction = 
  | 'queue_created' 
  | 'queue_updated' 
  | 'queue_skipped' 
  | 'queue_dispatched' 
  | 'queue_canceled' 
  | 'taxi_not_ready' 
  | 'taxi_returned' 
  | 'unauthorized_attempt' 
  | 'report_created' 
  | 'report_resolved' 
  | 'dispatcher_assigned' 
  | 'fermata_created' 
  | 'driver_created' 
  | 'taxi_created';

export interface Profile {
  id: string;
  email: string | null;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Fermata {
  id: string;
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DispatcherFermata {
  id: string;
  dispatcher_id: string;
  fermata_id: string;
  created_at: string;
  fermata?: Fermata;
  dispatcher?: Profile;
}

export interface Association {
  id: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface AssociationFermata {
  id: string;
  association_id: string;
  fermata_id: string;
  is_authorized: boolean;
  created_at: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string | null;
  license_id: string | null;
  association_id: string | null;
  created_at: string;
  updated_at: string;
  association?: Association;
}

export interface Taxi {
  id: string;
  plate_number: string;
  type: string;
  driver_id: string | null;
  association_id: string | null;
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
  driver?: Driver;
  association?: Association;
}

export interface QueueEntry {
  id: string;
  queue_number: number;
  taxi_id: string;
  fermata_id: string;
  dispatcher_id: string | null;
  arrival_time: string;
  status: QueueStatus;
  skip_count: number;
  last_skip_at: string | null;
  dispatched_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields for display
  plate_number?: string;
  driver_name?: string;
  taxi?: Taxi;
  fermata?: Fermata;
}

export interface DispatchLog {
  id: string;
  queue_entry_id: string | null;
  taxi_id: string;
  fermata_id: string;
  dispatcher_id: string | null;
  driver_name: string | null;
  plate_number: string | null;
  dispatched_at: string;
  taxi?: Taxi;
  fermata?: Fermata;
  dispatcher?: Profile;
}

export interface Report {
  id: string;
  taxi_id: string | null;
  dispatcher_id: string | null;
  fermata_id: string | null;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  is_auto_generated: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  admin_comments: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  taxi?: Taxi;
  fermata?: Fermata;
  dispatcher?: Profile;
  resolver?: Profile;
}

export interface QueueActivityLog {
  id: string;
  queue_entry_id: string | null;
  taxi_id: string;
  fermata_id: string;
  dispatcher_id: string | null;
  action: string;
  old_position: number | null;
  new_position: number | null;
  old_status: QueueStatus | null;
  new_status: QueueStatus | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  taxi_id: string | null;
  fermata_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  actor?: Profile;
}

export interface AutoReportConfig {
  id: string;
  skip_threshold: number;
  timeout_minutes: number;
  created_at: string;
  updated_at: string;
}
