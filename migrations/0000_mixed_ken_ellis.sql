CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"message" text NOT NULL,
	"response" text NOT NULL,
	"ingredients" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"meal_plan_id" integer NOT NULL,
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
--> statement-breakpoint
CREATE TABLE "daily_meal_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
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
--> statement-breakpoint
CREATE TABLE "onboarding_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
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
	"water_intake" text,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" text NOT NULL,
	"symptoms_severity" jsonb,
	"menstrual_phase" text NOT NULL,
	"overall_wellbeing" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_metrics" (
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
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"firebase_uid" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"profile_picture" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid")
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_feedback" ADD CONSTRAINT "daily_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_feedback" ADD CONSTRAINT "daily_feedback_meal_plan_id_daily_meal_plans_id_fk" FOREIGN KEY ("meal_plan_id") REFERENCES "public"."daily_meal_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_meal_plans" ADD CONSTRAINT "daily_meal_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_data" ADD CONSTRAINT "onboarding_data_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_tracking" ADD CONSTRAINT "progress_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;