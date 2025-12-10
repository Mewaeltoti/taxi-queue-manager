
-- Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'dispatcher');
CREATE TYPE public.queue_status AS ENUM ('waiting', 'dispatched', 'skipped', 'not_ready', 'returned', 'canceled');
CREATE TYPE public.report_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.report_reason AS ENUM ('wrong_fermata', 'wrong_association', 'unauthorized_dispatch', 'excessive_skips', 'timeout', 'other');
CREATE TYPE public.audit_action AS ENUM ('queue_created', 'queue_updated', 'queue_skipped', 'queue_dispatched', 'queue_canceled', 'taxi_not_ready', 'taxi_returned', 'unauthorized_attempt', 'report_created', 'report_resolved', 'dispatcher_assigned', 'fermata_created', 'driver_created', 'taxi_created');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Fermatas table
CREATE TABLE public.fermatas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dispatcher-Fermata assignments
CREATE TABLE public.dispatcher_fermatas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatcher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fermata_id UUID REFERENCES public.fermatas(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dispatcher_id, fermata_id)
);

-- Associations (taxi companies/groups)
CREATE TABLE public.associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Association-Fermata authorization (which associations can use which fermatas)
CREATE TABLE public.association_fermatas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id UUID REFERENCES public.associations(id) ON DELETE CASCADE NOT NULL,
  fermata_id UUID REFERENCES public.fermatas(id) ON DELETE CASCADE NOT NULL,
  is_authorized BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (association_id, fermata_id)
);

-- Drivers table
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  license_id TEXT,
  association_id UUID REFERENCES public.associations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Taxis table
CREATE TABLE public.taxis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'sedan',
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  association_id UUID REFERENCES public.associations(id) ON DELETE SET NULL,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Queue entries table with extended statuses
CREATE TABLE public.queue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_number INTEGER NOT NULL,
  taxi_id UUID REFERENCES public.taxis(id) ON DELETE CASCADE NOT NULL,
  fermata_id UUID REFERENCES public.fermatas(id) ON DELETE CASCADE NOT NULL,
  dispatcher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status queue_status NOT NULL DEFAULT 'waiting',
  skip_count INTEGER NOT NULL DEFAULT 0,
  last_skip_at TIMESTAMPTZ,
  arrival_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  dispatched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fermata_id, queue_number, status) -- Prevent duplicate queue numbers for active entries
);

-- Dispatch logs
CREATE TABLE public.dispatch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_entry_id UUID REFERENCES public.queue_entries(id) ON DELETE SET NULL,
  taxi_id UUID REFERENCES public.taxis(id) ON DELETE SET NULL NOT NULL,
  fermata_id UUID REFERENCES public.fermatas(id) ON DELETE SET NULL NOT NULL,
  dispatcher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  driver_name TEXT,
  plate_number TEXT,
  dispatched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxi_id UUID REFERENCES public.taxis(id) ON DELETE SET NULL,
  dispatcher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fermata_id UUID REFERENCES public.fermatas(id) ON DELETE SET NULL,
  reason report_reason NOT NULL,
  description TEXT,
  status report_status NOT NULL DEFAULT 'open',
  is_auto_generated BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  admin_comments TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Queue activity logs (for skip tracking)
CREATE TABLE public.queue_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_entry_id UUID REFERENCES public.queue_entries(id) ON DELETE SET NULL,
  taxi_id UUID REFERENCES public.taxis(id) ON DELETE SET NULL NOT NULL,
  fermata_id UUID REFERENCES public.fermatas(id) ON DELETE SET NULL NOT NULL,
  dispatcher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  old_position INTEGER,
  new_position INTEGER,
  old_status queue_status,
  new_status queue_status,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Full audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  taxi_id UUID,
  fermata_id UUID,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-report configuration
CREATE TABLE public.auto_report_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skip_threshold INTEGER NOT NULL DEFAULT 3,
  timeout_minutes INTEGER NOT NULL DEFAULT 120,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default config
INSERT INTO public.auto_report_config (skip_threshold, timeout_minutes) VALUES (3, 120);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fermatas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatcher_fermatas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.association_fermatas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_report_config ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Security definer function to check fermata access
CREATE OR REPLACE FUNCTION public.has_fermata_access(_user_id UUID, _fermata_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dispatcher_fermatas
    WHERE dispatcher_id = _user_id AND fermata_id = _fermata_id
  ) OR public.has_role(_user_id, 'admin')
$$;

-- Function to get next queue number for a fermata
CREATE OR REPLACE FUNCTION public.get_next_queue_number(_fermata_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(queue_number), 0) + 1
  FROM public.queue_entries
  WHERE fermata_id = _fermata_id
    AND status IN ('waiting', 'skipped', 'not_ready', 'returned')
$$;

-- Function to normalize queue positions (auto-healing)
CREATE OR REPLACE FUNCTION public.normalize_queue_positions(_fermata_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  entry RECORD;
  pos INTEGER := 1;
BEGIN
  FOR entry IN
    SELECT id FROM public.queue_entries
    WHERE fermata_id = _fermata_id
      AND status IN ('waiting', 'skipped', 'not_ready', 'returned')
    ORDER BY queue_number ASC, arrival_time ASC
  LOOP
    UPDATE public.queue_entries SET queue_number = pos WHERE id = entry.id;
    pos := pos + 1;
  END LOOP;
END;
$$;

-- Function to check taxi authorization for fermata
CREATE OR REPLACE FUNCTION public.check_taxi_fermata_authorization(_taxi_id UUID, _fermata_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.taxis t
    JOIN public.association_fermatas af ON t.association_id = af.association_id
    WHERE t.id = _taxi_id
      AND af.fermata_id = _fermata_id
      AND af.is_authorized = true
  ) OR NOT EXISTS (
    -- If no association_fermatas exist, allow all
    SELECT 1 FROM public.association_fermatas WHERE fermata_id = _fermata_id
  )
$$;

-- Function to skip a taxi (swap positions)
CREATE OR REPLACE FUNCTION public.skip_taxi_in_queue(
  _entry_id UUID,
  _dispatcher_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_entry RECORD;
  next_entry RECORD;
  result JSONB;
  skip_config RECORD;
BEGIN
  -- Get the current entry
  SELECT * INTO current_entry FROM public.queue_entries WHERE id = _entry_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Entry not found');
  END IF;
  
  -- Check dispatcher has access to this fermata
  IF NOT public.has_fermata_access(_dispatcher_id, current_entry.fermata_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- Prevent rapid double-skip (5 second debounce)
  IF current_entry.last_skip_at IS NOT NULL AND 
     current_entry.last_skip_at > now() - interval '5 seconds' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Please wait before skipping again');
  END IF;
  
  -- Get the next entry in queue
  SELECT * INTO next_entry FROM public.queue_entries
  WHERE fermata_id = current_entry.fermata_id
    AND queue_number = current_entry.queue_number + 1
    AND status IN ('waiting', 'skipped', 'not_ready', 'returned');
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No taxi below to swap with');
  END IF;
  
  -- Swap positions
  UPDATE public.queue_entries 
  SET queue_number = current_entry.queue_number,
      updated_at = now()
  WHERE id = next_entry.id;
  
  UPDATE public.queue_entries 
  SET queue_number = next_entry.queue_number,
      status = 'skipped',
      skip_count = skip_count + 1,
      last_skip_at = now(),
      updated_at = now()
  WHERE id = _entry_id;
  
  -- Log the activity
  INSERT INTO public.queue_activity_logs (
    queue_entry_id, taxi_id, fermata_id, dispatcher_id,
    action, old_position, new_position, old_status, new_status
  ) VALUES (
    _entry_id, current_entry.taxi_id, current_entry.fermata_id, _dispatcher_id,
    'skip', current_entry.queue_number, next_entry.queue_number, current_entry.status, 'skipped'
  );
  
  -- Check if skip threshold exceeded and create auto-report
  SELECT * INTO skip_config FROM public.auto_report_config LIMIT 1;
  IF current_entry.skip_count + 1 >= skip_config.skip_threshold THEN
    INSERT INTO public.reports (
      taxi_id, dispatcher_id, fermata_id, reason, 
      description, is_auto_generated, metadata
    ) VALUES (
      current_entry.taxi_id, _dispatcher_id, current_entry.fermata_id,
      'excessive_skips', 'Taxi skipped ' || (current_entry.skip_count + 1) || ' times',
      true, jsonb_build_object('skip_count', current_entry.skip_count + 1)
    );
  END IF;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function to dispatch taxi
CREATE OR REPLACE FUNCTION public.dispatch_taxi(
  _entry_id UUID,
  _dispatcher_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  entry RECORD;
  taxi RECORD;
  driver RECORD;
BEGIN
  -- Get the entry
  SELECT * INTO entry FROM public.queue_entries WHERE id = _entry_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Entry not found');
  END IF;
  
  -- Check dispatcher has access
  IF NOT public.has_fermata_access(_dispatcher_id, entry.fermata_id) THEN
    -- Log unauthorized attempt
    INSERT INTO public.audit_logs (
      actor_id, action, entity_type, entity_id, taxi_id, fermata_id, metadata
    ) VALUES (
      _dispatcher_id, 'unauthorized_attempt', 'queue_entry', _entry_id, 
      entry.taxi_id, entry.fermata_id, 
      jsonb_build_object('attempted_action', 'dispatch')
    );
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- Check taxi authorization for fermata
  IF NOT public.check_taxi_fermata_authorization(entry.taxi_id, entry.fermata_id) THEN
    -- Create auto-report for unauthorized dispatch attempt
    INSERT INTO public.reports (
      taxi_id, dispatcher_id, fermata_id, reason,
      description, is_auto_generated
    ) VALUES (
      entry.taxi_id, _dispatcher_id, entry.fermata_id,
      'unauthorized_dispatch', 'Taxi association not authorized for this fermata',
      true
    );
    RETURN jsonb_build_object('success', false, 'error', 'Taxi not authorized for this fermata');
  END IF;
  
  -- Get taxi and driver info
  SELECT * INTO taxi FROM public.taxis WHERE id = entry.taxi_id;
  SELECT * INTO driver FROM public.drivers WHERE id = taxi.driver_id;
  
  -- Update entry status
  UPDATE public.queue_entries
  SET status = 'dispatched',
      dispatched_at = now(),
      updated_at = now()
  WHERE id = _entry_id;
  
  -- Create dispatch log
  INSERT INTO public.dispatch_logs (
    queue_entry_id, taxi_id, fermata_id, dispatcher_id,
    driver_name, plate_number
  ) VALUES (
    _entry_id, entry.taxi_id, entry.fermata_id, _dispatcher_id,
    COALESCE(driver.name, 'Unknown'), taxi.plate_number
  );
  
  -- Normalize queue positions
  PERFORM public.normalize_queue_positions(entry.fermata_id);
  
  -- Log the dispatch
  INSERT INTO public.audit_logs (
    actor_id, action, entity_type, entity_id, taxi_id, fermata_id
  ) VALUES (
    _dispatcher_id, 'queue_dispatched', 'queue_entry', _entry_id,
    entry.taxi_id, entry.fermata_id
  );
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- RLS Policies

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- User roles: viewable by authenticated, manageable by admin
CREATE POLICY "User roles viewable by authenticated" ON public.user_roles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Fermatas: viewable by all authenticated, manageable by admin
CREATE POLICY "Fermatas viewable by authenticated" ON public.fermatas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage fermatas" ON public.fermatas
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Dispatcher fermatas: viewable by authenticated, manageable by admin
CREATE POLICY "Dispatcher fermatas viewable by authenticated" ON public.dispatcher_fermatas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage dispatcher fermatas" ON public.dispatcher_fermatas
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Associations: viewable by authenticated, manageable by admin
CREATE POLICY "Associations viewable by authenticated" ON public.associations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage associations" ON public.associations
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Association fermatas: viewable by authenticated, manageable by admin
CREATE POLICY "Association fermatas viewable by authenticated" ON public.association_fermatas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage association fermatas" ON public.association_fermatas
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Drivers: viewable by authenticated, manageable by admin
CREATE POLICY "Drivers viewable by authenticated" ON public.drivers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage drivers" ON public.drivers
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Taxis: viewable by authenticated, manageable by admin
CREATE POLICY "Taxis viewable by authenticated" ON public.taxis
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage taxis" ON public.taxis
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Queue entries: dispatchers see their fermatas, admins see all
CREATE POLICY "Queue entries viewable by authorized users" ON public.queue_entries
  FOR SELECT TO authenticated 
  USING (public.has_fermata_access(auth.uid(), fermata_id));
CREATE POLICY "Dispatchers can insert queue entries" ON public.queue_entries
  FOR INSERT TO authenticated 
  WITH CHECK (
    public.has_role(auth.uid(), 'dispatcher') AND 
    public.has_fermata_access(auth.uid(), fermata_id)
  );
CREATE POLICY "Dispatchers can update queue entries" ON public.queue_entries
  FOR UPDATE TO authenticated 
  USING (
    public.has_role(auth.uid(), 'dispatcher') AND 
    public.has_fermata_access(auth.uid(), fermata_id)
  );

-- Dispatch logs: viewable by authorized users
CREATE POLICY "Dispatch logs viewable by authorized users" ON public.dispatch_logs
  FOR SELECT TO authenticated 
  USING (public.has_fermata_access(auth.uid(), fermata_id));
CREATE POLICY "Dispatchers can insert dispatch logs" ON public.dispatch_logs
  FOR INSERT TO authenticated WITH CHECK (dispatcher_id = auth.uid());

-- Reports: viewable by all authenticated, manageable by admin
CREATE POLICY "Reports viewable by authenticated" ON public.reports
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Dispatchers can create reports" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (dispatcher_id = auth.uid());
CREATE POLICY "Admins can update reports" ON public.reports
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Queue activity logs: viewable by authenticated
CREATE POLICY "Queue activity logs viewable" ON public.queue_activity_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert queue activity logs" ON public.queue_activity_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Audit logs: viewable by admin only
CREATE POLICY "Audit logs viewable by admin" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Auto report config: viewable by all, manageable by admin
CREATE POLICY "Auto report config viewable" ON public.auto_report_config
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage config" ON public.auto_report_config
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for auto-assigning queue number
CREATE OR REPLACE FUNCTION public.auto_assign_queue_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.queue_number IS NULL OR NEW.queue_number = 0 THEN
    NEW.queue_number := public.get_next_queue_number(NEW.fermata_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_queue_number
  BEFORE INSERT ON public.queue_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_queue_number();

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fermatas_updated_at BEFORE UPDATE ON public.fermatas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_taxis_updated_at BEFORE UPDATE ON public.taxis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_queue_entries_updated_at BEFORE UPDATE ON public.queue_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_associations_updated_at BEFORE UPDATE ON public.associations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for queue_entries
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
