-- Run this in your Neon database console to set up the tables

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#8B9D83',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Words table
CREATE TABLE IF NOT EXISTS words (
    id SERIAL PRIMARY KEY,
    german VARCHAR(500) NOT NULL,
    english VARCHAR(500) NOT NULL,
    category INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users/profiles table (for photos)
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    photo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default profiles
INSERT INTO profiles (name) VALUES ('netti'), ('billy')
ON CONFLICT (name) DO NOTHING;

-- Insert some default categories
INSERT INTO categories (name, color) VALUES
    ('Alltag', '#8B9D83'),
    ('Gefuhle', '#AE8E8E'),
    ('Natur', '#385036'),
    ('Essen', '#8B7355')
ON CONFLICT (name) DO NOTHING;

-- Create index for faster search
CREATE INDEX IF NOT EXISTS idx_words_german ON words(german);
CREATE INDEX IF NOT EXISTS idx_words_english ON words(english);
