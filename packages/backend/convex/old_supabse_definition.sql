
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "pgsodium";
COMMENT ON SCHEMA "public" IS 'standard public schema';
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
CREATE TYPE "public"."overlay_type" AS ENUM (
    'chat',
    'emoji-wall'
);

ALTER TYPE "public"."overlay_type" OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."handle_delete_user"("user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  -- Delete only the user's row from the public.users table
  DELETE FROM public.users WHERE id = $1;
  
  -- Return success
  RETURN;
END;
$_$;

ALTER FUNCTION "public"."handle_delete_user"("user_id" "uuid") OWNER TO "postgres";

COMMENT ON FUNCTION "public"."handle_delete_user"("user_id" "uuid") IS 'Deletes user record from public.users when auth user is deleted';
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  begin
    insert into public.users (id, full_name, avatar_url)
    values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    return new;
  end;
$$;

ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";
SET default_tablespace = '';
SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."overlays" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "channel" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "type" "public"."overlay_type" DEFAULT 'chat'::"public"."overlay_type" NOT NULL
);

ALTER TABLE "public"."overlays" OWNER TO "postgres";

COMMENT ON TABLE "public"."overlays" IS 'Unified table for all overlay types (chat, emoji-wall, etc.)';
COMMENT ON COLUMN "public"."overlays"."settings" IS 'JSON settings specific to each overlay type';
COMMENT ON COLUMN "public"."overlays"."channel" IS 'Twitch channel name for the overlay';
COMMENT ON COLUMN "public"."overlays"."type" IS 'Type of overlay: chat or emoji-wall (enum type)';
CREATE TABLE IF NOT EXISTS "public"."provider" (
    "id_user" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "twitch_token" "text" NOT NULL,
    "twitch_refresh_token" "text" NOT NULL
);

ALTER TABLE "public"."provider" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text",
    "stripe_id" "text",
    "price_id" "text",
    "stripe_price_id" "text",
    "currency" "text",
    "interval" "text",
    "status" "text",
    "current_period_start" bigint,
    "current_period_end" bigint,
    "cancel_at_period_end" boolean,
    "amount" bigint,
    "started_at" bigint,
    "ends_at" bigint,
    "ended_at" bigint,
    "canceled_at" bigint,
    "customer_cancellation_reason" "text",
    "customer_cancellation_comment" "text",
    "metadata" "jsonb",
    "custom_field_data" "jsonb",
    "customer_id" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE "public"."subscriptions" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "avatar_url" "text",
    "user_id" "text",
    "subscription" "text",
    "credits" "text",
    "image" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone,
    "email" "text",
    "name" "text",
    "full_name" "text"
);

ALTER TABLE "public"."users" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."webhook_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "type" "text" NOT NULL,
    "stripe_event_id" "text",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "modified_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE "public"."webhook_events" OWNER TO "postgres";

ALTER TABLE ONLY "public"."overlays"
    ADD CONSTRAINT "overlays_pkey" PRIMARY KEY ("id");
    ALTER TABLE ONLY "public"."provider"
    ADD CONSTRAINT "providers_pkey" PRIMARY KEY ("id_user");
    ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");
    ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_stripe_id_key" UNIQUE ("stripe_id");
    ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
    ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_user_id_key" UNIQUE ("user_id");
    ALTER TABLE ONLY "public"."webhook_events"
    ADD CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id");
    CREATE INDEX "idx_overlays_channel" ON "public"."overlays" USING "btree" ("channel");
    CREATE INDEX "idx_overlays_user_id" ON "public"."overlays" USING "btree" ("user_id");
    CREATE INDEX "subscriptions_stripe_id_idx" ON "public"."subscriptions" USING "btree" ("stripe_id");
    CREATE INDEX "subscriptions_user_id_idx" ON "public"."subscriptions" USING "btree" ("user_id");
    CREATE INDEX "webhook_events_event_type_idx" ON "public"."webhook_events" USING "btree" ("event_type");
    CREATE INDEX "webhook_events_stripe_event_id_idx" ON "public"."webhook_events" USING "btree" ("stripe_event_id");
    CREATE INDEX "webhook_events_type_idx" ON "public"."webhook_events" USING "btree" ("type");
    CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."overlays" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();
    ALTER TABLE ONLY "public"."overlays"
    ADD CONSTRAINT "overlays_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    ALTER TABLE ONLY "public"."provider"
    ADD CONSTRAINT "providers_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;
    ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id");
    CREATE POLICY "All users can read overlays" ON "public"."overlays" FOR SELECT USING (true);
    CREATE POLICY "Enable all for users based on id_user" ON "public"."provider" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id_user")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id_user"));
    CREATE POLICY "Enable delete for users based on user_id" ON "public"."users" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));
    CREATE POLICY "Service role can manage webhook events" ON "public"."webhook_events" TO "service_role" USING (true);
    CREATE POLICY "Users can delete their own overlays" ON "public"."overlays" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));
    CREATE POLICY "Users can insert their own overlays" ON "public"."overlays" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));
    CREATE POLICY "Users can update their own overlays" ON "public"."overlays" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
    CREATE POLICY "Users can view own subscriptions" ON "public"."subscriptions" FOR SELECT USING ((("auth"."uid"())::"text" = "user_id"));
    ALTER TABLE "public"."overlays" ENABLE ROW LEVEL SECURITY;
    
ALTER TABLE "public"."provider" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."webhook_events" ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";
ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."overlays";
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_delete_user"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."handle_delete_user"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_delete_user"("user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";
GRANT ALL ON TABLE "public"."overlays" TO "anon";
GRANT ALL ON TABLE "public"."overlays" TO "authenticated";
GRANT ALL ON TABLE "public"."overlays" TO "service_role";
GRANT ALL ON TABLE "public"."provider" TO "anon";
GRANT ALL ON TABLE "public"."provider" TO "authenticated";
GRANT ALL ON TABLE "public"."provider" TO "service_role";
GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";
GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";
GRANT ALL ON TABLE "public"."webhook_events" TO "anon";
GRANT ALL ON TABLE "public"."webhook_events" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_events" TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";
drop extension if exists "pg_net";
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

