-- Migration: Add personality and profile fields to users table
-- Run this if you have an existing database

-- Big Five Personality Traits
ALTER TABLE users ADD COLUMN openness TEXT;
ALTER TABLE users ADD COLUMN conscientiousness TEXT;
ALTER TABLE users ADD COLUMN extraversion TEXT;
ALTER TABLE users ADD COLUMN agreeableness TEXT;
ALTER TABLE users ADD COLUMN neuroticism TEXT;

-- Other personality/profile fields
ALTER TABLE users ADD COLUMN siblings TEXT;
ALTER TABLE users ADD COLUMN mbti TEXT;
ALTER TABLE users ADD COLUMN caliper_profile TEXT;

