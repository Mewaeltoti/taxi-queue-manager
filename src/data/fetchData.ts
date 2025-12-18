import { supabase } from '@/integrations/supabase/client'

// Fetch drivers
export async function fetchDrivers() {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
  if (error) throw error
  return data
}

// Fetch taxis
export async function fetchTaxis() {
  const { data, error } = await supabase
    .from('taxis')
    .select('*')
  if (error) throw error
  return data
}