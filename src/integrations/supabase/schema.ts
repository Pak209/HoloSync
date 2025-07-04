export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      battle_participants: {
        Row: {
          battle_id: number
          holobot_id: number
          id: number
        }
        Insert: {
          battle_id?: number
          holobot_id?: number
          id?: never
        }
        Update: {
          battle_id?: number
          holobot_id?: number
          id?: never
        }
        Relationships: []
      }
      battles: {
        Row: {
          created_at: string
          id: number
          participant_ids: number[]
          rewards: Json
          winner_id: number
        }
        Insert: {
          created_at?: string
          id?: never
          participant_ids: number[]
          rewards: Json
          winner_id: number
        }
        Update: {
          created_at?: string
          id?: never
          participant_ids?: number[]
          rewards?: Json
          winner_id?: number
        }
        Relationships: []
      }
      holobots: {
        Row: {
          created_at: string
          id: number
          name: string
          owner_id: string
          stats: Json
        }
        Insert: {
          created_at?: string
          id?: never
          name: string
          owner_id: string
          stats: Json
        }
        Update: {
          created_at?: string
          id?: never
          name?: string
          owner_id?: string
          stats?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          username: string
        }
        Insert: {
          created_at?: string
          id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          username?: string
        }
        Relationships: []
      }
      training_rewards: {
        Row: {
          created_at: string
          holobot_id: number
          id: number
          rewards: Json
          training_id: string
        }
        Insert: {
          created_at?: string
          holobot_id: number
          id?: never
          rewards: Json
          training_id: string
        }
        Update: {
          created_at?: string
          holobot_id?: number
          id?: never
          rewards?: Json
          training_id?: string
        }
        Relationships: []
      }
      user_missions: {
        Row: {
          id: string
          user_id: string
          mission_id: string
          progress: number
          status: 'locked' | 'in_progress' | 'completed' | 'claimed'
          completed_at?: string
          expires_at?: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mission_id: string
          progress: number
          status: 'locked' | 'in_progress' | 'completed' | 'claimed'
          completed_at?: string
          expires_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mission_id?: string
          progress?: number
          status?: 'locked' | 'in_progress' | 'completed' | 'claimed'
          completed_at?: string
          expires_at?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Workout History Table with Automatic Sync Trigger
export const createWorkoutHistoryTable = `
CREATE TABLE IF NOT EXISTS workout_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  holobot_name TEXT NOT NULL,
  holobot_rank TEXT NOT NULL,
  player_rank TEXT NOT NULL,
  steps INTEGER NOT NULL,
  calories INTEGER NOT NULL,
  duration INTEGER NOT NULL, -- in seconds
  sync_points INTEGER NOT NULL,
  holos INTEGER NOT NULL,
  exp_earned INTEGER NOT NULL,
  attribute_boosts INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced BOOLEAN DEFAULT false,
  
  -- Indexes
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index on user_id and created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_workout_history_user_date ON workout_history(user_id, created_at);

-- Create function to handle workout sync
CREATE OR REPLACE FUNCTION handle_workout_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Update holobot stats
  UPDATE holobots
  SET stats = jsonb_set(
    stats,
    '{experience}',
    (COALESCE((stats->>'experience')::int, 0) + NEW.exp_earned)::text::jsonb
  )
  WHERE owner_id = NEW.user_id AND name = NEW.holobot_name;

  -- Update user sync points
  UPDATE profiles
  SET sync_points = COALESCE(sync_points, 0) + NEW.sync_points
  WHERE id = NEW.user_id;

  -- Mark as synced
  NEW.synced := true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic sync
DROP TRIGGER IF EXISTS workout_sync_trigger ON workout_history;
CREATE TRIGGER workout_sync_trigger
  BEFORE INSERT OR UPDATE
  ON workout_history
  FOR EACH ROW
  WHEN (NEW.synced = false)
  EXECUTE FUNCTION handle_workout_sync();
`;

// RLS Policies for Workout History
export const workoutHistoryPolicies = `
-- Enable RLS
ALTER TABLE workout_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own workout history"
ON workout_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own workout history"
ON workout_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout history"
ON workout_history FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
`;

// User Missions Table
export const createUserMissionsTable = `
CREATE TABLE IF NOT EXISTS user_missions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('locked', 'in_progress', 'completed', 'claimed')) DEFAULT 'locked',
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate missions per user
  UNIQUE(user_id, mission_id),
  
  -- Indexes
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index on user_id and status for faster queries
CREATE INDEX IF NOT EXISTS idx_user_missions_user_status ON user_missions(user_id, status);
`;

// RLS Policies for User Missions
export const userMissionsPolicies = `
-- Enable RLS
ALTER TABLE user_missions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own missions"
ON user_missions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own missions"
ON user_missions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own missions"
ON user_missions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
`;

// Add sync_points column to profiles if it doesn't exist
export const addSyncPointsToProfiles = `
-- Add sync_points column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'sync_points'
  ) THEN
    ALTER TABLE profiles ADD COLUMN sync_points INTEGER DEFAULT 0;
  END IF;
END $$;
`; 