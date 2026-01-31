# 10 - API & HOOKS DESIGN

## API Structure (Supabase)

### Plants API

```typescript
// Get all plants for user
const getPlants = async (userId: string) => {
  return supabase
    .from('plants')
    .select(`
      *,
      plant_type:plant_types(*),
      goal:goals(*)
    `)
    .eq('user_id', userId)
    .order('position');
};

// Get single plant
const getPlant = async (plantId: string) => {
  return supabase
    .from('plants')
    .select(`
      *,
      plant_type:plant_types(*),
      goal:goals(*),
      watering_logs(*)
    `)
    .eq('id', plantId)
    .single();
};

// Create plant
const createPlant = async (plant: CreatePlantInput) => {
  return supabase
    .from('plants')
    .insert(plant)
    .select()
    .single();
};

// Water plant
const waterPlant = async (plantId: string, data?: WateringData) => {
  // 1. Insert watering log
  // 2. Update plant moisture, streak, growth
  // 3. Check achievements
  // 4. Return updated plant
};

// Delete plant
const deletePlant = async (plantId: string) => {
  return supabase
    .from('plants')
    .delete()
    .eq('id', plantId);
};
Goals API
Copy// Create goal for plant
const createGoal = async (goal: CreateGoalInput) => {
  // 1. Generate weekly_targets
  // 2. Insert goal
  // 3. Update plant.goal_mode
  return supabase.from('goals').insert(goal).select().single();
};

// Log goal value
const logGoalValue = async (goalId: string, value: number, notes?: string) => {
  // 1. Get current goal
  // 2. Check for PR
  // 3. Insert log
  // 4. Update goal.current_value
  // 5. Also water plant
  // 6. Return log + PR info
};

// Get goal stats
const getGoalStats = async (goalId: string) => {
  // Aggregate from goal_logs
  return {
    sum, max, min, average,
    count, personalRecords,
    weeklyBreakdown
  };
};
Adaptive API
Copy// Check for adjustment trigger
const checkAdaptiveTrigger = async (goalId: string) => {
  // 1. Get last 4 weeks data
  // 2. Calculate performance score
  // 3. Determine trend
  // 4. Apply decision matrix
  // 5. Return suggestion or null
};

// Apply adjustment
const applyAdjustment = async (
  adjustmentId: string, 
  response: 'accepted' | 'rejected'
) => {
  // 1. Update adjustment record
  // 2. If accepted, update goal
  // 3. Recalculate weekly_targets
};

// Request recovery week
const requestRecoveryWeek = async (goalId: string) => {
  // 1. Create adjustment record
  // 2. Reduce target 50% for 1 week
  // 3. Mark plant as "recovering"
};
React Hooks
usePlants
Copyexport function usePlants() {
  const { data: user } = useUser();
  
  return useQuery({
    queryKey: ['plants', user?.id],
    queryFn: () => getPlants(user!.id),
    enabled: !!user,
  });
}

export function usePlant(plantId: string) {
  return useQuery({
    queryKey: ['plant', plantId],
    queryFn: () => getPlant(plantId),
  });
}

export function useCreatePlant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createPlant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants'] });
    },
  });
}
useWatering
Copyexport function useWatering() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ plantId, data }: WateringInput) => 
      waterPlant(plantId, data),
    onSuccess: (result, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['plants'] });
      queryClient.invalidateQueries({ queryKey: ['plant', variables.plantId] });
      
      // Show XP popup
      toast.success(`+${result.xpEarned} XP`);
      
      // Show PR celebration if applicable
      if (result.isPersonalRecord) {
        showPRCelebration(result);
      }
      
      // Check achievements
      if (result.newAchievements?.length) {
        showAchievements(result.newAchievements);
      }
    },
  });
}

export function useCanWaterToday(plantId: string) {
  const { data: plant } = usePlant(plantId);
  
  if (!plant) return false;
  
  const today = new Date().toDateString();
  const lastWatered = plant.last_watered_at 
    ? new Date(plant.last_watered_at).toDateString()
    : null;
    
  return lastWatered !== today;
}
useGoal
Copyexport function useGoal(plantId: string) {
  return useQuery({
    queryKey: ['goal', plantId],
    queryFn: () => getGoalByPlantId(plantId),
  });
}

export function useGoalLogs(goalId: string) {
  return useQuery({
    queryKey: ['goal-logs', goalId],
    queryFn: () => getGoalLogs(goalId),
  });
}

export function useLogGoalValue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: logGoalValue,
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goal', variables.plantId] });
      queryClient.invalidateQueries({ queryKey: ['goal-logs', variables.goalId] });
      queryClient.invalidateQueries({ queryKey: ['plants'] });
    },
  });
}

export function useCurrentWeekTarget(goal: Goal | null) {
  if (!goal) return null;
  
  const weekNumber = calculateWeekNumber(goal.started_at);
  const target = goal.weekly_targets?.find(w => w.week === weekNumber);
  
  return {
    weekNumber,
    target: target?.target ?? goal.target_value,
    isLastWeek: weekNumber >= goal.duration_weeks,
  };
}
useAdaptive
Copyexport function useAdaptiveSuggestion(goalId: string) {
  return useQuery({
    queryKey: ['adaptive-suggestion', goalId],
    queryFn: () => checkAdaptiveTrigger(goalId),
    refetchInterval: 1000 * 60 * 60, // Check hourly
  });
}

export function useApplyAdjustment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: applyAdjustment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goal'] });
      queryClient.invalidateQueries({ queryKey: ['adaptive-suggestion'] });
    },
  });
}
useGamification
Copyexport function useUserStats() {
  const { data: user } = useUser();
  
  return useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: () => getUserStats(user!.id),
    enabled: !!user,
  });
}

export function useAchievements() {
  const { data: user } = useUser();
  
  return useQuery({
    queryKey: ['achievements', user?.id],
    queryFn: () => getUserAchievements(user!.id),
    enabled: !!user,
  });
}

export function useDailyWeather() {
  return useQuery({
    queryKey: ['weather', new Date().toDateString()],
    queryFn: () => getDailyWeather(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
Zustand Stores
gardenStore
Copyinterface GardenStore {
  // State
  selectedPlantId: string | null;
  isWatering: boolean;
  showPlantDetail: boolean;
  
  // Actions
  selectPlant: (id: string | null) => void;
  setWatering: (watering: boolean) => void;
  openPlantDetail: (id: string) => void;
  closePlantDetail: () => void;
}

export const useGardenStore = create<GardenStore>((set) => ({
  selectedPlantId: null,
  isWatering: false,
  showPlantDetail: false,
  
  selectPlant: (id) => set({ selectedPlantId: id }),
  setWatering: (watering) => set({ isWatering: watering }),
  openPlantDetail: (id) => set({ selectedPlantId: id, showPlantDetail: true }),
  closePlantDetail: () => set({ showPlantDetail: false }),
}));
userStore
Copyinterface UserStore {
  // State
  profile: Profile | null;
  isLoading: boolean;
  
  // Actions
  setProfile: (profile: Profile) => void;
  updateXP: (amount: number) => void;
  useWaterReserve: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  profile: null,
  isLoading: true,
  
  setProfile: (profile) => set({ profile, isLoading: false }),
  updateXP: (amount) => set((state) => ({
    profile: state.profile 
      ? { ...state.profile, xp: state.profile.xp + amount }
      : null
  })),
  useWaterReserve: () => set((state) => ({
    profile: state.profile
      ? { ...state.profile, water_reserves: state.profile.water_reserves - 1 }
      : null
  })),
}));
Real-time Subscriptions
Copy// Subscribe to plant updates (for community features)
export function usePlantSubscription(plantId: string) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const subscription = supabase
      .channel(`plant:${plantId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'plants',
        filter: `id=eq.${plantId}`,
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['plant', plantId] });
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [plantId, queryClient]);
}