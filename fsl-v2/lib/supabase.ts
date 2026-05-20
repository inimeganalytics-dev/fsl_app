import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Series {
  id: string
  name: string
  short_name: string
  description: string
  color: string
}

export interface Category {
  id: string
  name: string
  short_name: string
  description: string
  max_pilots: number
  points_system: Record<string, number>
  series_id: string
  series?: Series
}

export interface Championship {
  id: string
  name: string
  season: number
  category_id: string
  status: 'active' | 'finished' | 'upcoming'
  description: string
  rules_version: string
  created_at: string
  categories?: Category
}

export interface Event {
  id: string
  championship_id: string
  name: string
  circuit_name: string
  country_code: string
  scheduled_date: string
  status: 'scheduled' | 'live' | 'finished' | 'cancelled'
  max_pilots: number
  registrations_open: boolean
  notes: string
  championships?: Championship
}

export interface Pilot {
  id: string
  user_id: string
  pilot_number: number
  lp: number
  safety_rating: number
  total_races: number
  total_wins: number
  total_podiums: number
  users?: {
    real_name: string
    steam_name: string
    country_code: string
    avatar_url: string
  }
}

export interface RaceResult {
  id: string
  event_id: string
  pilot_id: string
  finish_position: number
  qualifying_position: number
  points_earned: number
  lp_earned: number
  best_lap_time: string
  laps_completed: number
  has_fastest_lap: boolean
  pole_position: boolean
  dnf: boolean
  dsq: boolean
  pilots?: Pilot
  events?: Event
}

export interface Sanction {
  id: string
  pilot_id: string
  sanction_type: string
  time_penalty: number
  lp_penalty: number
  dsq: boolean
  suspension_races: number
  reason: string
  issued_at: string
  pilots?: Pilot
}

export interface PublicRegistration {
  id: string
  pilot_name: string
  pilot_number: number
  country: string
  steam_username: string
  discord_username: string
  email: string
  category_id: string
  championship_id: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  categories?: Category
  championships?: Championship
}

export interface PublicComplaint {
  id: string
  reporter_name: string
  reporter_discord: string
  reported_pilot_name: string
  championship_id: string
  event_name: string
  lap_number: number
  incident_time: string
  incident_description: string
  video_url: string
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
  admin_notes: string
  created_at: string
  championships?: Championship
}
