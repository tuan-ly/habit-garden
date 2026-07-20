
-- RLS: wrap auth.uid() in SELECT subquery for init-plan evaluation
DROP POLICY IF EXISTS "Users can insert their own activity logs" ON public.activity_logs;
CREATE POLICY "Users can insert their own activity logs" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own activity logs" ON public.activity_logs;
CREATE POLICY "Users can update their own activity logs" ON public.activity_logs
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.activity_logs;
CREATE POLICY "Users can view their own activity logs" ON public.activity_logs
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own goal adjustments" ON public.goal_adjustments;
CREATE POLICY "Users can update own goal adjustments" ON public.goal_adjustments
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.goals g JOIN public.plants p ON p.id = g.plant_id
            WHERE g.id = goal_adjustments.goal_id AND p.user_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can view own goal adjustments" ON public.goal_adjustments;
CREATE POLICY "Users can view own goal adjustments" ON public.goal_adjustments
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.goals g JOIN public.plants p ON p.id = g.plant_id
            WHERE g.id = goal_adjustments.goal_id AND p.user_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can create own goal logs" ON public.goal_logs;
CREATE POLICY "Users can create own goal logs" ON public.goal_logs
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own goal logs" ON public.goal_logs;
CREATE POLICY "Users can view own goal logs" ON public.goal_logs
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own goals" ON public.goals;
CREATE POLICY "Users can create own goals" ON public.goals
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.plants WHERE plants.id = goals.plant_id AND plants.user_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;
CREATE POLICY "Users can delete own goals" ON public.goals
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.plants WHERE plants.id = goals.plant_id AND plants.user_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
CREATE POLICY "Users can update own goals" ON public.goals
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.plants WHERE plants.id = goals.plant_id AND plants.user_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can view own goals" ON public.goals;
CREATE POLICY "Users can view own goals" ON public.goals
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.plants WHERE plants.id = goals.plant_id AND plants.user_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can create own identities" ON public.identities;
CREATE POLICY "Users can create own identities" ON public.identities
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own identities" ON public.identities;
CREATE POLICY "Users can delete own identities" ON public.identities
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own identities" ON public.identities;
CREATE POLICY "Users can update own identities" ON public.identities
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own identities" ON public.identities;
CREATE POLICY "Users can view own identities" ON public.identities
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own mood logs" ON public.mood_logs;
CREATE POLICY "Users can delete own mood logs" ON public.mood_logs
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own mood logs" ON public.mood_logs;
CREATE POLICY "Users can insert own mood logs" ON public.mood_logs
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own mood logs" ON public.mood_logs;
CREATE POLICY "Users can update own mood logs" ON public.mood_logs
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own mood logs" ON public.mood_logs;
CREATE POLICY "Users can view own mood logs" ON public.mood_logs
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own plants" ON public.plants;
CREATE POLICY "Users can create own plants" ON public.plants
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own plants" ON public.plants;
CREATE POLICY "Users can delete own plants" ON public.plants
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own plants" ON public.plants;
CREATE POLICY "Users can update own plants" ON public.plants
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own plants" ON public.plants;
CREATE POLICY "Users can view own plants" ON public.plants
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert their own reflections" ON public.reflections;
CREATE POLICY "Users can insert their own reflections" ON public.reflections
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own reflections" ON public.reflections;
CREATE POLICY "Users can update their own reflections" ON public.reflections
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own reflections" ON public.reflections;
CREATE POLICY "Users can view their own reflections" ON public.reflections
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own rest days" ON public.rest_days;
CREATE POLICY "Users can delete their own rest days" ON public.rest_days
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own rest days" ON public.rest_days;
CREATE POLICY "Users can insert their own rest days" ON public.rest_days
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own rest days" ON public.rest_days;
CREATE POLICY "Users can view their own rest days" ON public.rest_days
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;
CREATE POLICY "Users can insert own achievements" ON public.user_achievements
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- FK indexes (unindexed FKs = seq scans on cascade/join)
CREATE INDEX IF NOT EXISTS idx_activity_logs_season_id ON public.activity_logs(season_id);
CREATE INDEX IF NOT EXISTS idx_goal_logs_plant_id ON public.goal_logs(plant_id);
CREATE INDEX IF NOT EXISTS idx_goal_logs_user_id ON public.goal_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_placed_decorations_decoration_type_id ON public.placed_decorations(decoration_type_id);
CREATE INDEX IF NOT EXISTS idx_plants_plant_type_id ON public.plants(plant_type_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_material_id ON public.recipe_ingredients(material_id);
CREATE INDEX IF NOT EXISTS idx_recipes_decoration_type_id ON public.recipes(decoration_type_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_from_tier ON public.subscription_events(from_tier);
CREATE INDEX IF NOT EXISTS idx_subscription_events_to_tier ON public.subscription_events(to_tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier_id ON public.subscriptions(tier_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_decoration_type_id ON public.user_inventory(decoration_type_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_material_id ON public.user_inventory(material_id);
;
