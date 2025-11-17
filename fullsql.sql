-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.building_calculator_data (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  building_id uuid,
  farm_data jsonb,
  daily_records jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT building_calculator_data_pkey PRIMARY KEY (id)
);
CREATE TABLE public.buildings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL,
  name text NOT NULL,
  status text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  cycle_number integer,
  cycle_start_date date,
  building_number text,
  dr_no text,
  initial_gram_weight numeric,
  volume_delivered numeric,
  dead_on_arrival numeric,
  capacity integer DEFAULT 0,
  type text DEFAULT 'general'::text,
  CONSTRAINT buildings_pkey PRIMARY KEY (id),
  CONSTRAINT buildings_farm_id_fkey FOREIGN KEY (farm_id) REFERENCES public.farms(id)
);
CREATE TABLE public.calculator_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL,
  session_name text NOT NULL,
  farm_data jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  building_id uuid,
  feed_source_image text,
  doc_image text,
  CONSTRAINT calculator_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT calculator_sessions_farm_id_fkey FOREIGN KEY (farm_id) REFERENCES public.farms(id)
);
CREATE TABLE public.calculator_sessions_backup (
  id uuid,
  farm_id uuid,
  session_name text,
  farm_data jsonb,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  building_id uuid
);
CREATE TABLE public.daily_production_records (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  record_date date NOT NULL,
  building_id uuid,
  product_type text NOT NULL,
  quantity numeric NOT NULL,
  unit text NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_production_records_pkey PRIMARY KEY (id),
  CONSTRAINT daily_production_records_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id)
);
CREATE TABLE public.daily_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL,
  building_id uuid NOT NULL,
  date date NOT NULL,
  age integer NOT NULL,
  daily_feeds numeric DEFAULT 0,
  cumulative_feeds numeric DEFAULT 0,
  feeds_delivery numeric DEFAULT 0,
  remaining_feeds numeric DEFAULT 0,
  daily_mortality integer DEFAULT 0,
  cumulative_mortality integer DEFAULT 0,
  mortality_percent numeric DEFAULT 0,
  ending_heads integer DEFAULT 0,
  alw numeric DEFAULT 0,
  adg numeric DEFAULT 0,
  remarks text DEFAULT ''::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  mortality_image text,
  CONSTRAINT daily_records_pkey PRIMARY KEY (id)
);
CREATE TABLE public.daily_records_backup (
  id uuid,
  farm_id uuid,
  building_id uuid,
  date date,
  age integer,
  daily_feeds numeric,
  cumulative_feeds numeric,
  feeds_delivery numeric,
  remaining_feeds numeric,
  daily_mortality integer,
  cumulative_mortality integer,
  mortality_percent numeric,
  ending_heads integer,
  alw numeric,
  adg numeric,
  remarks text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);
CREATE TABLE public.farms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  owner_id uuid,
  CONSTRAINT farms_pkey PRIMARY KEY (id),
  CONSTRAINT farms_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type = ANY (ARRAY['suggestion'::text, 'bug'::text])),
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
  category text NOT NULL DEFAULT 'General'::text,
  user_email text,
  farm_id uuid,
  device_info text,
  app_version text DEFAULT '1.0.0'::text,
  status text NOT NULL DEFAULT 'new'::text CHECK (status = ANY (ARRAY['new'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text])),
  developer_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  screenshot text,
  CONSTRAINT feedback_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_farm_id_fkey FOREIGN KEY (farm_id) REFERENCES public.farms(id)
);
CREATE TABLE public.harvest_inputs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL,
  farm_id uuid NOT NULL,
  cycle_number integer NOT NULL DEFAULT 1,
  plate_number text NOT NULL,
  buyer_name text NOT NULL,
  total_birds integer NOT NULL CHECK (total_birds > 0),
  total_weight numeric NOT NULL CHECK (total_weight > 0::numeric),
  price_per_kilogram numeric NOT NULL CHECK (price_per_kilogram > 0::numeric),
  documentation_url text,
  harvest_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT harvest_inputs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.harvest_outputs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL,
  farm_id uuid NOT NULL,
  cycle_number integer NOT NULL DEFAULT 1,
  harvest_inputs jsonb NOT NULL DEFAULT '[]'::jsonb,
  final_alw numeric NOT NULL DEFAULT 0,
  total_revenue_per_buyer jsonb NOT NULL DEFAULT '{}'::jsonb,
  grand_total_revenue numeric NOT NULL DEFAULT 0,
  harvest_recovery_percent numeric NOT NULL DEFAULT 0,
  total_mortality integer NOT NULL DEFAULT 0,
  average_mortality_rate numeric NOT NULL DEFAULT 0,
  avg_weight numeric NOT NULL DEFAULT 0,
  adg numeric NOT NULL DEFAULT 0,
  fcr numeric NOT NULL DEFAULT 0,
  gross_income numeric NOT NULL DEFAULT 0,
  net_income numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT harvest_outputs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.participants (
  id integer NOT NULL DEFAULT nextval('participants_id_seq'::regclass),
  farm_id uuid NOT NULL,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  access_tools ARRAY DEFAULT '{}'::text[],
  CONSTRAINT participants_pkey PRIMARY KEY (id),
  CONSTRAINT participants_farm_id_fkey FOREIGN KEY (farm_id) REFERENCES public.farms(id),
  CONSTRAINT participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.performance_calculations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL,
  building_id uuid NOT NULL,
  calculation_type text NOT NULL CHECK (calculation_type = ANY (ARRAY['alw'::text, 'adg'::text, 'fcr'::text])),
  calculation_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_value numeric NOT NULL DEFAULT 0,
  calculation_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT performance_calculations_pkey PRIMARY KEY (id),
  CONSTRAINT performance_calculations_farm_id_fkey FOREIGN KEY (farm_id) REFERENCES public.farms(id),
  CONSTRAINT performance_calculations_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id)
);
CREATE TABLE public.performance_standards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL,
  name text NOT NULL,
  mortality_rate numeric NOT NULL CHECK (mortality_rate >= 0::numeric AND mortality_rate <= 100::numeric),
  fcr numeric NOT NULL CHECK (fcr > 0::numeric),
  avg_weight integer NOT NULL CHECK (avg_weight > 0),
  adg integer NOT NULL CHECK (adg > 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT performance_standards_pkey PRIMARY KEY (id),
  CONSTRAINT performance_standards_farm_id_fkey FOREIGN KEY (farm_id) REFERENCES public.farms(id)
);
CREATE TABLE public.user_verification_status (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  is_verified boolean DEFAULT false,
  verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  email text,
  is_new_user boolean DEFAULT true,
  has_completed_onboarding boolean DEFAULT false,
  onboarding_completed_at timestamp with time zone,
  CONSTRAINT user_verification_status_pkey PRIMARY KEY (id),
  CONSTRAINT user_verification_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);