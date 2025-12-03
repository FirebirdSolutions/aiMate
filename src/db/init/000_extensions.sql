-- PostgreSQL Extensions for aiMate
-- This runs automatically when the container starts

-- Vector similarity search (for RAG embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- Trigram search (for fuzzy text matching)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
