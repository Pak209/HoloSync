import { create } from 'zustand';
import { Mission, MissionStatus, SEASON_1_MISSIONS } from '../types/missions';
import { supabase } from '../integrations/supabase/client';
import { Database } from '../integrations/supabase/types';
import { v4 as uuidv4 } from 'uuid'; // Import v4 as uuidv4

type UserMission = Database['public']['Tables']['user_missions']['Row'];
type UserMissionInsert = Database['public']['Tables']['user_missions']['Insert'];

interface MissionsState {
  missions: Mission[];
  activeSeason: number;
  loading: boolean;
  error: string | null;
  initializeMissions: () => Promise<void>;
  updateMissionProgress: (missionId: string, progress: number) => Promise<void>;
  claimMissionReward: (missionId: string) => Promise<void>;
  checkMissionCompletion: (missionId: string) => Promise<void>;
  getActiveMissions: () => Mission[];
  getCompletedMissions: () => Mission[];
  getMissionById: (missionId: string) => Mission | undefined;
}

export const useMissionsStore = create<MissionsState>((set, get) => ({
  missions: [],
  activeSeason: 1,
  loading: false,
  error: null,

  initializeMissions: async () => {
    set({ loading: true, error: null });
    try {
      // Get user's missions from Supabase
      const { data: userMissions, error: fetchError } = await supabase
        .from('user_missions')
        .select('*') as { data: UserMission[] | null; error: Error | null };

      if (fetchError) throw fetchError;

      // If no missions exist for the user, initialize them
      if (!userMissions || userMissions.length === 0) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) throw new Error('No authenticated user');

        // Create initial mission entries for the user
        const initialMissions: UserMissionInsert[] = SEASON_1_MISSIONS.map(mission => ({
          id: uuidv4(), // Generate a new UUID for the mission entry
          user_id: userData.user.id,
          mission_id: mission.id,
          progress: 0,
          status: 'locked',
          created_at: new Date().toISOString(),
        }));

        const { error: insertError } = await supabase
          .from('user_missions')
          .insert(initialMissions);

        if (insertError) throw insertError;

        // Fetch the newly created missions
        const { data: newUserMissions, error: refetchError } = await supabase
          .from('user_missions')
          .select('*') as { data: UserMission[] | null; error: Error | null };

        if (refetchError) throw refetchError;
        
        // Merge with season missions
        const missions = SEASON_1_MISSIONS.map(mission => {
          const userMission = newUserMissions?.find(um => um.mission_id === mission.id);
          return {
            ...mission,
            status: userMission?.status || 'locked',
            requirements: {
              ...mission.requirements,
              progress: userMission?.progress || 0
            },
            completedAt: userMission?.completed_at,
            expiresAt: userMission?.expires_at
          };
        });

        set({ missions, loading: false });
        return;
      }

      // Merge existing missions with season missions
      const missions = SEASON_1_MISSIONS.map(mission => {
        const userMission = userMissions.find(um => um.mission_id === mission.id);
        if (!userMission) return mission;

        return {
          ...mission,
          status: userMission.status as MissionStatus,
          requirements: {
            ...mission.requirements,
            progress: userMission.progress
          },
          completedAt: userMission.completed_at,
          expiresAt: userMission.expires_at
        };
      });

      set({ missions, loading: false });
    } catch (error) {
      console.error('Error initializing missions:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  updateMissionProgress: async (missionId: string, progress: number) => {
    try {
      const mission = get().getMissionById(missionId);
      if (!mission) return;

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('No authenticated user');

      // Update local state
      const updatedMissions = get().missions.map(m =>
        m.id === missionId
          ? {
              ...m,
              requirements: { ...m.requirements, progress },
              status: m.status === 'locked' ? 'in_progress' as const : m.status
            }
          : m
      );

      set({ missions: updatedMissions });

      // Update Supabase
      const missionUpdate: Partial<UserMission> = {
        progress,
        status: 'in_progress',
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_missions')
        .update(missionUpdate)
        .eq('user_id', userData.user.id)
        .eq('mission_id', missionId);

      if (error) throw error;

      // Check if mission is completed
      await get().checkMissionCompletion(missionId);
    } catch (error) {
      console.error('Error updating mission progress:', error);
      set({ error: (error as Error).message });
    }
  },

  claimMissionReward: async (missionId: string) => {
    try {
      const mission = get().getMissionById(missionId);
      if (!mission || mission.status !== 'completed') return;

      // Update mission status to claimed
      const updatedMissions = get().missions.map(m =>
        m.id === missionId ? { ...m, status: 'claimed' as const } : m
      );

      set({ missions: updatedMissions });

      // Update Supabase
      const { error } = await supabase
        .from('user_missions')
        .update({ status: 'claimed' } satisfies Partial<UserMission>)
        .eq('mission_id', missionId);

      if (error) throw error;

      // Apply reward (this would need to be implemented based on reward type)
      // TODO: Implement reward application logic
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  checkMissionCompletion: async (missionId: string) => {
    const mission = get().getMissionById(missionId);
    if (!mission || mission.status === 'completed' || mission.status === 'claimed') return;

    if (mission.requirements.progress >= mission.requirements.target) {
      const updatedMissions = get().missions.map(m =>
        m.id === missionId
          ? {
              ...m,
              status: 'completed' as const,
              completedAt: new Date().toISOString()
            }
          : m
      );

      set({ missions: updatedMissions });

      const { error } = await supabase
        .from('user_missions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        } satisfies Partial<UserMission>)
        .eq('mission_id', missionId);

      if (error) throw error;
    }
  },

  getActiveMissions: () => {
    return get().missions.filter(m => 
      m.status === 'locked' || m.status === 'in_progress'
    );
  },

  getCompletedMissions: () => {
    return get().missions.filter(m => 
      m.status === 'completed' || m.status === 'claimed'
    );
  },

  getMissionById: (missionId: string) => {
    return get().missions.find(m => m.id === missionId);
  },
})); 