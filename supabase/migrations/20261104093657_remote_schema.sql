SET local check_function_bodies = off;

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "service_role";

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "anon";

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "authenticated";

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "service_role";

CREATE TABLE "public"."categories" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"       text                     NOT NULL,
  "icon"       text,
  "parent_id"  uuid,
  "sort_order" integer                  DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "categories_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."categories"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."conversation_participants" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "conversation_id" uuid                     NOT NULL,
  "user_id"         uuid                     NOT NULL,
  "created_at"      timestamp with time zone DEFAULT now(),
  CONSTRAINT "conversation_participants_conversation_id_user_id_key" UNIQUE (conversation_id, user_id),
  CONSTRAINT "conversation_participants_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."conversation_participants"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."conversations" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "conversations_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."conversations"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."listing_photos" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "listing_id" uuid                     NOT NULL,
  "photo_url"  text                     NOT NULL,
  "sort_order" integer                  DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "listing_photos_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."listing_photos"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."listings" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "seller_id"     uuid                     NOT NULL,
  "category_id"   uuid,
  "title"         text                     NOT NULL,
  "description"   text,
  "condition"     text,
  "price"         numeric(10,2),
  "status"        text                     DEFAULT 'active'::text,
  "location"      text,
  "is_negotiable" boolean                  DEFAULT false,
  "is_available"  boolean                  DEFAULT true,
  "view_count"    integer                  DEFAULT 0,
  "created_at"    timestamp with time zone DEFAULT now(),
  "updated_at"    timestamp with time zone DEFAULT now(),
  "sold_at"       timestamp with time zone,
  "search_vector" tsvector                 GENERATED ALWAYS AS (to_tsvector('english'::regconfig, ((COALESCE(title, ''::text) || ' '::text) || COALESCE(description, ''::text))))
    STORED,
  CONSTRAINT "listings_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."listings"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."messages" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "conversation_id" uuid                     NOT NULL,
  "sender_id"       uuid                     NOT NULL,
  "content"         text                     NOT NULL,
  "created_at"      timestamp with time zone DEFAULT now(),
  "is_read"         boolean                  DEFAULT false,
  CONSTRAINT "messages_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."messages"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "user_id"    uuid                     NOT NULL,
  "username"   text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (user_id),
  CONSTRAINT "profiles_username_check" CHECK ((username ~* '^[a-z0-9_]{3,24}$'::text))
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."profiles" FROM "anon";

CREATE TABLE "public"."reports" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "reporter_id" uuid                     NOT NULL,
  "listing_id"  uuid,
  "review_id"   uuid,
  "reason"      text                     NOT NULL,
  "description" text,
  "status"      text                     DEFAULT 'open'::text,
  "created_at"  timestamp with time zone DEFAULT now(),
  "updated_at"  timestamp with time zone DEFAULT now(),
  CONSTRAINT "reports_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."reports"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."reviews" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "reviewer_id" uuid                     NOT NULL,
  "reviewee_id" uuid                     NOT NULL,
  "rating"      integer                  NOT NULL,
  "comment"     text,
  "created_at"  timestamp with time zone DEFAULT now(),
  CONSTRAINT "reviews_pkey" PRIMARY KEY (id),
  CONSTRAINT "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5)))
);

ALTER TABLE "public"."reviews"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."saved_items" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid                     NOT NULL,
  "listing_id" uuid                     NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "saved_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "saved_items_user_id_listing_id_key" UNIQUE (user_id, listing_id)
);

ALTER TABLE "public"."saved_items"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."student_verifications" (
  "user_id"             uuid                     NOT NULL,
  "graduation_year"     smallint                 NOT NULL,
  "college"             text                     NOT NULL,
  "student_path"        text                     NOT NULL,
  "campus"              text,
  "nuin_entry_year"     smallint,
  "nuin_location"       text,
  "enrollment_status"   text                     GENERATED ALWAYS AS (
CASE
    WHEN
      ((student_path = 'campus'::text) AND (campus = ANY (ARRAY['Arlington, VA'::text, 'Boston, MA'::text, 'Burlington, MA'::text, 'Charlotte, NC'::text, 'London, UK'::text,
      'Miami, FL'::text,
      'Nahant, MA'::text,
      'New York City, NY'::text,
      'Oakland, CA'::text, 'Portland, ME'::text, 'Seattle, WA'::text, 'Silicon Valley, CA'::text, 'Toronto, ON'::text, 'Vancouver, BC'::text]))) THEN 'plausible'::text
    WHEN
      ((student_path = 'nuin'::text) AND (nuin_entry_year = 2026) AND (nuin_location = ANY (ARRAY['Czech Republic'::text, 'Germany'::text, 'Greece'::text, 'Ireland'::text,
      'Italy'::text, 'Northern Ireland'::text, 'Scotland'::text, 'Spain'::text]))) THEN 'plausible'::text
    WHEN ((student_path = 'london_scholars'::text) AND (campus = 'London, UK'::text)) THEN 'plausible'::text
    WHEN ((student_path = 'nyc_scholars'::text) AND (campus = 'New York City, NY'::text)) THEN 'plausible'::text
    WHEN ((student_path = 'nu_immerse'::text) AND (campus = 'Boston, MA'::text)) THEN 'plausible'::text
    WHEN ((student_path = 'foundation_year'::text) AND (campus = 'Boston, MA'::text)) THEN 'plausible'::text
    ELSE 'needs_review'::text
END) STORED,
  "verification_method" text                     NOT NULL DEFAULT 'northeastern_email'::text,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "student_verifications_graduation_year_check" CHECK (((graduation_year >= 2026) AND (graduation_year <= 2036))),
  CONSTRAINT "student_verifications_pkey" PRIMARY KEY (user_id),
  CONSTRAINT "student_verifications_student_path_check"
    CHECK ((student_path = ANY (ARRAY['campus'::text, 'nuin'::text, 'london_scholars'::text, 'nyc_scholars'::text, 'nu_immerse'::text, 'foundation_year'::text])))
);

ALTER TABLE "public"."student_verifications"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."student_verifications" FROM "anon";

CREATE TABLE "public"."transactions" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "listing_id"   uuid,
  "buyer_id"     uuid,
  "seller_id"    uuid,
  "price"        numeric(10,2),
  "status"       text                     DEFAULT 'pending'::text,
  "created_at"   timestamp with time zone DEFAULT now(),
  "completed_at" timestamp with time zone,
  CONSTRAINT "transactions_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."transactions"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.username_available (
  candidate text
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$

  select
    candidate is not null

    and candidate ~* '^[a-z0-9_]{3,24}$'

    and not exists (
      select 1
      from public.profiles
      where lower(username) = lower(candidate)
    );

$function$;

REVOKE ALL ON FUNCTION "public"."username_available"(text) FROM PUBLIC, "service_role";

ALTER TABLE "public"."categories"
  ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;

ALTER TABLE "public"."conversation_participants"
  ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."conversation_participants"
  ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;

ALTER TABLE "public"."listings"
  ADD CONSTRAINT "listings_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

ALTER TABLE "public"."listing_photos"
  ADD CONSTRAINT "listing_photos_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

ALTER TABLE "public"."listings"
  ADD CONSTRAINT "listings_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."messages"
  ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;

ALTER TABLE "public"."messages"
  ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."reports"
  ADD CONSTRAINT "reports_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

ALTER TABLE "public"."reports"
  ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."reports"
  ADD CONSTRAINT "reports_review_id_fkey" FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;

ALTER TABLE "public"."reviews"
  ADD CONSTRAINT "reviews_reviewee_id_fkey" FOREIGN KEY (reviewee_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."reviews"
  ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY (reviewer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."saved_items"
  ADD CONSTRAINT "saved_items_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

ALTER TABLE "public"."saved_items"
  ADD CONSTRAINT "saved_items_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."saved_items"
  ADD CONSTRAINT "saved_items_user_listing_unique" UNIQUE (user_id, listing_id);

ALTER TABLE "public"."student_verifications"
  ADD CONSTRAINT "student_verifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."transactions"
  ADD CONSTRAINT "transactions_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."transactions"
  ADD CONSTRAINT "transactions_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE SET NULL;

ALTER TABLE "public"."transactions"
  ADD CONSTRAINT "transactions_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_listings_category ON public.listings USING btree (category_id);

CREATE INDEX idx_listings_condition ON public.listings USING btree (condition);

CREATE INDEX idx_listings_created_at ON public.listings USING btree (created_at DESC);

CREATE INDEX idx_listings_price ON public.listings USING btree (price);

CREATE INDEX idx_listings_search_vector ON public.listings USING gin (search_vector);

CREATE INDEX idx_listings_status ON public.listings USING btree (status);

CREATE INDEX idx_listings_visible ON public.listings USING btree (status, is_available)
  WHERE ((status = 'active'::text) AND (is_available = true));

CREATE INDEX idx_saved_items_listing ON public.saved_items USING btree (listing_id);

CREATE INDEX idx_saved_items_user ON public.saved_items USING btree (user_id);

CREATE UNIQUE INDEX profiles_username_lower_unique ON public.profiles USING btree (lower(username));

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "users can read own profile" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() = user_id));

CREATE POLICY "users can update own profile" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can remove their own saved items" ON "public"."saved_items"
  FOR DELETE
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can save items for themselves" ON "public"."saved_items"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can view their own saved items" ON "public"."saved_items"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "users can create own verification" ON "public"."student_verifications"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "users can read own verification" ON "public"."student_verifications"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() = user_id));

CREATE POLICY "users can update own verification" ON "public"."student_verifications"
  FOR UPDATE
  TO "authenticated"
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

GRANT EXECUTE ON FUNCTION "public"."username_available"(text) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."username_available"(text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."username_available"(text) TO "postgres";

REVOKE ALL ON TABLE "public"."categories" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."categories" TO "anon";

REVOKE ALL ON TABLE "public"."categories" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."categories" TO "authenticated";

REVOKE ALL ON TABLE "public"."categories" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."categories" TO "postgres";

REVOKE ALL ON TABLE "public"."categories" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."categories" TO "service_role";

REVOKE ALL ON TABLE "public"."conversation_participants" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."conversation_participants" TO "anon";

REVOKE ALL ON TABLE "public"."conversation_participants" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."conversation_participants" TO "authenticated";

REVOKE ALL ON TABLE "public"."conversation_participants" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."conversation_participants" TO "postgres";

REVOKE ALL ON TABLE "public"."conversation_participants" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."conversation_participants" TO "service_role";

REVOKE ALL ON TABLE "public"."conversations" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."conversations" TO "anon";

REVOKE ALL ON TABLE "public"."conversations" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."conversations" TO "authenticated";

REVOKE ALL ON TABLE "public"."conversations" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."conversations" TO "postgres";

REVOKE ALL ON TABLE "public"."conversations" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."conversations" TO "service_role";

REVOKE ALL ON TABLE "public"."listing_photos" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."listing_photos" TO "anon";

REVOKE ALL ON TABLE "public"."listing_photos" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."listing_photos" TO "authenticated";

REVOKE ALL ON TABLE "public"."listing_photos" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."listing_photos" TO "postgres";

REVOKE ALL ON TABLE "public"."listing_photos" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."listing_photos" TO "service_role";

REVOKE ALL ON TABLE "public"."listings" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."listings" TO "anon";

REVOKE ALL ON TABLE "public"."listings" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."listings" TO "authenticated";

REVOKE ALL ON TABLE "public"."listings" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."listings" TO "postgres";

REVOKE ALL ON TABLE "public"."listings" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."listings" TO "service_role";

REVOKE ALL ON TABLE "public"."messages" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."messages" TO "anon";

REVOKE ALL ON TABLE "public"."messages" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."messages" TO "authenticated";

REVOKE ALL ON TABLE "public"."messages" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."messages" TO "postgres";

REVOKE ALL ON TABLE "public"."messages" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."messages" TO "service_role";

REVOKE ALL ON TABLE "public"."profiles" FROM "authenticated";

GRANT SELECT, UPDATE ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";

REVOKE ALL ON TABLE "public"."profiles" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."profiles" TO "service_role";

REVOKE ALL ON TABLE "public"."reports" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."reports" TO "anon";

REVOKE ALL ON TABLE "public"."reports" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."reports" TO "authenticated";

REVOKE ALL ON TABLE "public"."reports" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reports" TO "postgres";

REVOKE ALL ON TABLE "public"."reports" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."reports" TO "service_role";

REVOKE ALL ON TABLE "public"."reviews" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."reviews" TO "anon";

REVOKE ALL ON TABLE "public"."reviews" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."reviews" TO "authenticated";

REVOKE ALL ON TABLE "public"."reviews" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reviews" TO "postgres";

REVOKE ALL ON TABLE "public"."reviews" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."reviews" TO "service_role";

REVOKE ALL ON TABLE "public"."saved_items" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."saved_items" TO "anon";

REVOKE ALL ON TABLE "public"."saved_items" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."saved_items" TO "authenticated";

REVOKE ALL ON TABLE "public"."saved_items" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."saved_items" TO "postgres";

REVOKE ALL ON TABLE "public"."saved_items" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."saved_items" TO "service_role";

REVOKE ALL ON TABLE "public"."student_verifications" FROM "authenticated";

GRANT INSERT, SELECT, UPDATE ON TABLE "public"."student_verifications" TO "authenticated";

REVOKE ALL ON TABLE "public"."student_verifications" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."student_verifications" TO "postgres";

REVOKE ALL ON TABLE "public"."student_verifications" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."student_verifications" TO "service_role";

REVOKE ALL ON TABLE "public"."transactions" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."transactions" TO "anon";

REVOKE ALL ON TABLE "public"."transactions" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."transactions" TO "authenticated";

REVOKE ALL ON TABLE "public"."transactions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."transactions" TO "postgres";

REVOKE ALL ON TABLE "public"."transactions" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."transactions" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "service_role";
