-- Supabase Migration SQL
-- This migration updates the database schema to match the current application

-- Drop existing tables if they exist (be careful with this in production!)
-- DROP TABLE IF EXISTS "system_metrics" CASCADE;
-- DROP TABLE IF EXISTS "progress_tracking" CASCADE;
-- DROP TABLE IF EXISTS "daily_feedback" CASCADE;
-- DROP TABLE IF EXISTS "daily_meal_plans" CASCADE;
-- DROP TABLE IF EXISTS "chat_messages" CASCADE;
-- DROP TABLE IF EXISTS "onboarding_data" CASCADE;
-- DROP TABLE IF EXISTS "admin_users" CASCADE;
-- DROP TABLE IF EXISTS "users" CASCADE;

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" serial PRIMARY KEY NOT NULL,
    "firebase_uid" text NOT NULL UNIQUE,
    "email" text NOT NULL,
    "name" text NOT NULL,
    "profile_picture" text,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS "admin_users" (
    "id" serial PRIMARY KEY NOT NULL,
    "username" text NOT NULL UNIQUE,
    "password_hash" text NOT NULL,
    "email" text NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create onboarding_data table (updated schema without water_intake and gender)
CREATE TABLE IF NOT EXISTS "onboarding_data" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "age" text NOT NULL,
    "height" text,
    "weight" text,
    "diet" text NOT NULL,
    "symptoms" jsonb NOT NULL,
    "goals" jsonb,
    "lifestyle" jsonb,
    "medical_conditions" jsonb,
    "medications" jsonb,
    "allergies" jsonb,
    "last_period_date" text,
    "cycle_length" text,
    "period_length" text,
    "irregular_periods" boolean DEFAULT false,
    "stress_level" text,
    "sleep_hours" text,
    "exercise_level" text,
    "completed_at" timestamp DEFAULT now() NOT NULL
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS "chat_messages" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "message" text NOT NULL,
    "response" text NOT NULL,
    "ingredients" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create daily_meal_plans table
CREATE TABLE IF NOT EXISTS "daily_meal_plans" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "date" text NOT NULL,
    "menstrual_phase" text NOT NULL,
    "breakfast" jsonb NOT NULL,
    "lunch" jsonb NOT NULL,
    "dinner" jsonb NOT NULL,
    "snacks" jsonb NOT NULL,
    "daily_guidelines" jsonb NOT NULL,
    "shopping_list" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create daily_feedback table
CREATE TABLE IF NOT EXISTS "daily_feedback" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "meal_plan_id" integer NOT NULL REFERENCES "daily_meal_plans"("id") ON DELETE CASCADE,
    "date" text NOT NULL,
    "followed_plan" boolean,
    "enjoyed_meals" jsonb,
    "disliked_meals" jsonb,
    "symptoms_improvement" jsonb,
    "energy_level" integer,
    "digestive_health" integer,
    "mood_rating" integer,
    "feedback" text,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create progress_tracking table
CREATE TABLE IF NOT EXISTS "progress_tracking" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "date" text NOT NULL,
    "symptoms_severity" jsonb,
    "menstrual_phase" text NOT NULL,
    "overall_wellbeing" integer,
    "notes" text,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create system_metrics table
CREATE TABLE IF NOT EXISTS "system_metrics" (
    "id" serial PRIMARY KEY NOT NULL,
    "date" text NOT NULL,
    "total_users" integer NOT NULL,
    "active_users" integer NOT NULL,
    "total_meal_plans" integer NOT NULL,
    "total_chat_messages" integer NOT NULL,
    "avg_user_satisfaction" integer,
    "system_health" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "users_firebase_uid_idx" ON "users"("firebase_uid");
CREATE INDEX IF NOT EXISTS "onboarding_data_user_id_idx" ON "onboarding_data"("user_id");
CREATE INDEX IF NOT EXISTS "chat_messages_user_id_idx" ON "chat_messages"("user_id");
CREATE INDEX IF NOT EXISTS "daily_meal_plans_user_id_date_idx" ON "daily_meal_plans"("user_id", "date");
CREATE INDEX IF NOT EXISTS "daily_feedback_user_id_date_idx" ON "daily_feedback"("user_id", "date");
CREATE INDEX IF NOT EXISTS "progress_tracking_user_id_date_idx" ON "progress_tracking"("user_id", "date");

-- Add Row Level Security (RLS) policies for Supabase
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "onboarding_data" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chat_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "daily_meal_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "daily_feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "progress_tracking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "system_metrics" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON "users"
    FOR SELECT USING (auth.uid()::text = firebase_uid);

CREATE POLICY "Users can update own profile" ON "users"
    FOR UPDATE USING (auth.uid()::text = firebase_uid);

CREATE POLICY "Users can insert own profile" ON "users"
    FOR INSERT WITH CHECK (auth.uid()::text = firebase_uid);

-- Create RLS policies for onboarding_data table
CREATE POLICY "Users can view own onboarding data" ON "onboarding_data"
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE firebase_uid = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own onboarding data" ON "onboarding_data"
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users WHERE firebase_uid = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own onboarding data" ON "onboarding_data"
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE firebase_uid = auth.uid()::text
        )
    );

-- Create RLS policies for chat_messages table
CREATE POLICY "Users can view own chat messages" ON "chat_messages"
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE firebase_uid = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own chat messages" ON "chat_messages"
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE firebase_uid = auth.uid()::text
        )
    );

-- Create RLS policies for daily_meal_plans table
CREATE POLICY "Users can view own meal plans" ON "daily_meal_plans"
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE firebase_uid = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own meal plans" ON "daily_meal_plans"
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE firebase_uid = auth.uid()::text
        )
    );

-- Create RLS policies for daily_feedback table
CREATE POLICY "Users can view own feedback" ON "daily_feedback"
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE firebase_uid = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own feedback" ON "daily_feedback"
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE firebase_uid = auth.uid()::text
        )
    );

-- Create RLS policies for progress_tracking table
CREATE POLICY "Users can view own progress" ON "progress_tracking"
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE firebase_uid = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own progress" ON "progress_tracking"
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE firebase_uid = auth.uid()::text
        )
    );

-- Create RLS policies for admin_users table (admin only)
CREATE POLICY "Admin users can view all admin users" ON "admin_users"
    FOR SELECT USING (auth.role() = 'admin');

-- Create RLS policies for system_metrics table (admin only)
CREATE POLICY "Admin users can view system metrics" ON "system_metrics"
    FOR SELECT USING (auth.role() = 'admin');

CREATE POLICY "Admin users can insert system metrics" ON "system_metrics"
    FOR INSERT WITH CHECK (auth.role() = 'admin');

-- Create functions for common operations
CREATE OR REPLACE FUNCTION get_user_id_by_firebase_uid(firebase_uid_param text)
RETURNS integer AS $$
BEGIN
    RETURN (SELECT id FROM users WHERE firebase_uid = firebase_uid_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user profile with onboarding data
CREATE OR REPLACE FUNCTION get_user_profile(firebase_uid_param text)
RETURNS json AS $$
DECLARE
    user_data json;
    onboarding_data json;
BEGIN
    SELECT json_build_object(
        'id', u.id,
        'name', u.name,
        'email', u.email,
        'profilePicture', u.profile_picture,
        'createdAt', u.created_at
    ) INTO user_data
    FROM users u
    WHERE u.firebase_uid = firebase_uid_param;
    
    SELECT json_build_object(
        'id', o.id,
        'userId', o.user_id,
        'age', o.age,
        'height', o.height,
        'weight', o.weight,
        'diet', o.diet,
        'symptoms', o.symptoms,
        'goals', o.goals,
        'lifestyle', o.lifestyle,
        'medicalConditions', o.medical_conditions,
        'medications', o.medications,
        'allergies', o.allergies,
        'lastPeriodDate', o.last_period_date,
        'cycleLength', o.cycle_length,
        'periodLength', o.period_length,
        'irregularPeriods', o.irregular_periods,
        'stressLevel', o.stress_level,
        'sleepHours', o.sleep_hours,
        'exerciseLevel', o.exercise_level,
        'completedAt', o.completed_at
    ) INTO onboarding_data
    FROM onboarding_data o
    WHERE o.user_id = (SELECT id FROM users WHERE firebase_uid = firebase_uid_param);
    
    RETURN json_build_object(
        'user', user_data,
        'onboarding', onboarding_data
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get chat history
CREATE OR REPLACE FUNCTION get_chat_history(firebase_uid_param text)
RETURNS json AS $$
BEGIN
    RETURN (
        SELECT json_agg(
            json_build_object(
                'id', cm.id,
                'userId', cm.user_id,
                'message', cm.message,
                'response', cm.response,
                'ingredients', cm.ingredients,
                'createdAt', cm.created_at
            )
        )
        FROM chat_messages cm
        JOIN users u ON cm.user_id = u.id
        WHERE u.firebase_uid = firebase_uid_param
        ORDER BY cm.created_at DESC
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample admin user (change credentials as needed)
INSERT INTO "admin_users" ("username", "password_hash", "email") 
VALUES ('admin', '$2b$10$your_hashed_password_here', 'admin@example.com')
ON CONFLICT (username) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated; 