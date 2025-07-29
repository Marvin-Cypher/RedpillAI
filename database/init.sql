-- Initialize the PostgreSQL database for Redpill VC CRM

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create initial schema will be handled by SQLModel/Alembic