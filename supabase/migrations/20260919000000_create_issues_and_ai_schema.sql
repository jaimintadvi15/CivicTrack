-- Supabase Migration: Urban Fix Civic Intelligence Schema
-- Adds the core issues table with AI classification, duplicate tracking, priority scoring, and department auto-assignment.

-- 1. Enable UUID generator if not already available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create the primary issues table
CREATE TABLE IF NOT EXISTS public.issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(32) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category VARCHAR(64) NOT NULL DEFAULT 'unclassified',
    custom_category VARCHAR(128),
    severity VARCHAR(32) NOT NULL DEFAULT 'medium', -- low | medium | high | critical
    status VARCHAR(32) NOT NULL DEFAULT 'Submitted', -- Submitted | Acknowledged | In Progress | Resolved
    
    -- AI Agent Intelligence Fields
    ai_summary TEXT,
    priority_score INTEGER NOT NULL DEFAULT 20, -- Computed priority score (0 - 100)
    assigned_department VARCHAR(128) NOT NULL DEFAULT 'General Municipal Administration',
    is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
    duplicate_of UUID REFERENCES public.issues(id) ON DELETE SET NULL,
    report_count INTEGER NOT NULL DEFAULT 1,
    
    -- Location & Geospatial Data
    address TEXT NOT NULL,
    ward VARCHAR(128),
    city VARCHAR(64) DEFAULT 'Bengaluru',
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    
    -- Photos & Media
    photo_url TEXT,
    photos TEXT[] DEFAULT ARRAY[]::TEXT[],
    after_photo_url TEXT,
    voice_note_url TEXT,
    voice_note_transcription TEXT,
    
    -- Reporter Contact & Attribution
    reporter_id TEXT,
    reporter_name TEXT,
    reporter_phone TEXT,
    include_reporter_contact BOOLEAN DEFAULT TRUE,
    
    -- Worker Dispatch & Resolution
    assigned_worker_id TEXT,
    assigned_worker_name TEXT,
    assigned_at TIMESTAMPTZ,
    target_resolution_hours INTEGER DEFAULT 24,
    resolution_remarks TEXT,
    resolved_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Add Indexes for High-Performance Queries
CREATE INDEX IF NOT EXISTS idx_issues_priority_score ON public.issues (priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues (status);
CREATE INDEX IF NOT EXISTS idx_issues_category ON public.issues (category);
CREATE INDEX IF NOT EXISTS idx_issues_lat_lng ON public.issues (lat, lng);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON public.issues (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_duplicate_of ON public.issues (duplicate_of);

-- 4. Geospatial Helper: Find open nearby issues within radius in meters
-- Uses the Haversine formula (Earth radius = 6,371,000 meters)
CREATE OR REPLACE FUNCTION public.find_nearby_open_issues(
    p_category TEXT,
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_radius_meters DOUBLE PRECISION DEFAULT 100,
    p_days_limit INT DEFAULT 14
)
RETURNS TABLE (
    id UUID,
    ticket_number VARCHAR,
    title TEXT,
    description TEXT,
    category VARCHAR,
    severity VARCHAR,
    status VARCHAR,
    photo_url TEXT,
    address TEXT,
    ward VARCHAR,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    report_count INT,
    priority_score INT,
    created_at TIMESTAMPTZ,
    distance_meters DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        i.id,
        i.ticket_number,
        i.title,
        i.description,
        i.category,
        i.severity,
        i.status,
        i.photo_url,
        i.address,
        i.ward,
        i.lat,
        i.lng,
        i.report_count,
        i.priority_score,
        i.created_at,
        ROUND(
            (6371000 * acos(
                LEAST(1.0, GREATEST(-1.0,
                    cos(radians(p_lat)) * cos(radians(i.lat)) *
                    cos(radians(i.lng) - radians(p_lng)) +
                    sin(radians(p_lat)) * sin(radians(i.lat))
                ))
            ))::numeric, 1
        )::DOUBLE PRECISION AS distance_meters
    FROM public.issues i
    WHERE i.status != 'Resolved'
      AND (
          p_category IS NULL 
          OR LOWER(i.category) = LOWER(p_category)
          OR (LOWER(p_category) IN ('pothole', 'road_damage', 'road damage') AND LOWER(i.category) IN ('pothole', 'road_damage', 'road damage'))
      )
      AND i.created_at >= now() - (p_days_limit || ' days')::INTERVAL
      AND (
          6371000 * acos(
              LEAST(1.0, GREATEST(-1.0,
                  cos(radians(p_lat)) * cos(radians(i.lat)) *
                  cos(radians(i.lng) - radians(p_lng)) +
                  sin(radians(p_lat)) * sin(radians(i.lat))
              ))
          )
      ) <= p_radius_meters
    ORDER BY distance_meters ASC;
$$;

-- 5. Row Level Security (RLS) Configuration
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Allow public read access to civic listings
CREATE POLICY "Allow public read access to issues"
    ON public.issues
    FOR SELECT
    USING (true);

-- Allow authenticated citizens or anon clients to report issues
CREATE POLICY "Allow citizen report insert"
    ON public.issues
    FOR INSERT
    WITH CHECK (true);

-- Allow updates (e.g. upvoting, status updates, duplicate merging)
CREATE POLICY "Allow updates to issues"
    ON public.issues
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 6. Trigger for updated_at column
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_issues_updated_at ON public.issues;
CREATE TRIGGER trg_issues_updated_at
    BEFORE UPDATE ON public.issues
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
