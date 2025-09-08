-- ================================================================
-- CHRISTIANKIT POLICIES ONLY
-- Run this AFTER the main migration is successful
-- ================================================================

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles 
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles 
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles 
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User follows policies
CREATE POLICY "Anyone can view follows" ON user_follows 
    FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON user_follows 
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" ON user_follows 
    FOR DELETE USING (auth.uid() = follower_id);

-- Community posts policies
CREATE POLICY "Anyone can view approved posts" ON community_posts 
    FOR SELECT USING (moderation_status = 'approved' AND is_live = true);

CREATE POLICY "Users can create posts" ON community_posts 
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts" ON community_posts 
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts" ON community_posts 
    FOR DELETE USING (auth.uid() = author_id);

-- Post interactions policies
CREATE POLICY "Anyone can view interactions" ON post_interactions 
    FOR SELECT USING (true);

CREATE POLICY "Users can create interactions" ON post_interactions 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interactions" ON post_interactions 
    FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications 
    FOR INSERT WITH CHECK (true);

-- Notification preferences policies
CREATE POLICY "Users can manage own preferences" ON notification_preferences 
    FOR ALL USING (auth.uid() = user_id);

-- Prayer reminders policies
CREATE POLICY "Users can manage own prayer reminders" ON prayer_reminders 
    FOR ALL USING (auth.uid() = user_id);

-- Prayer sessions policies
CREATE POLICY "Users can manage own prayer sessions" ON prayer_sessions 
    FOR ALL USING (auth.uid() = user_id);

-- Prayer notification logs policies
CREATE POLICY "Users can view own notification logs" ON prayer_notification_logs 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM prayer_reminders pr 
            WHERE pr.id = prayer_notification_logs.reminder_id 
            AND pr.user_id = auth.uid()
        )
    );

CREATE POLICY "System can create notification logs" ON prayer_notification_logs 
    FOR INSERT WITH CHECK (true);

-- Push subscriptions policies
CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions 
    FOR ALL USING (auth.uid() = user_id);

-- FCM tokens policies
CREATE POLICY "Users can manage own FCM tokens" ON fcm_tokens 
    FOR ALL USING (auth.uid() = user_id);

-- Game scores policies
CREATE POLICY "Users can view all game scores" ON game_scores 
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own game scores" ON game_scores 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

SELECT 'ChristianKit policies created successfully! 🔒' as message;
