-- Redpill Database Initialization Script
-- This script sets up the initial database schema and sample data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE deal_status AS ENUM (
    'planned', 'meeting', 'research', 'deal', 'track', 'passed', 'closed'
);

CREATE TYPE investment_stage AS ENUM (
    'pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'series_d_plus', 'pre_tge', 'post_tge'
);

CREATE TYPE company_sector AS ENUM (
    'defi', 'infrastructure', 'layer1', 'layer2', 'gaming', 'nfts', 'tools', 
    'privacy', 'trading', 'lending', 'derivatives', 'oracles', 'dao', 'metaverse', 'ai', 'other'
);

CREATE TYPE user_role AS ENUM (
    'admin', 'partner', 'principal', 'associate', 'analyst', 'observer'
);

CREATE TYPE message_role AS ENUM (
    'user', 'assistant', 'system'
);

CREATE TYPE portfolio_status AS ENUM (
    'active', 'exited', 'written_off', 'acquired', 'ipo', 'tge'
);

CREATE TYPE document_type AS ENUM (
    'pitch_deck', 'whitepaper', 'financial_model', 'legal_doc', 'research_report', 'term_sheet', 'other'
);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Sample data insert functions will be created by the application
-- This ensures proper foreign key relationships

-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_company_id ON deals(company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_sector ON companies(sector);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_deal_id ON conversations(deal_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_portfolio_companies_status ON portfolio_companies(status);

-- Create a function to generate sample data
CREATE OR REPLACE FUNCTION create_sample_data()
RETURNS void AS $$
DECLARE
    user_id uuid;
    company_id uuid;
    deal_id uuid;
BEGIN
    -- Insert sample user
    INSERT INTO users (id, email, full_name, role, hashed_password, created_at, updated_at)
    VALUES (
        uuid_generate_v4(),
        'demo@redpill.vc',
        'Demo User',
        'partner',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lwxu8Qo0r1y3P6VV6', -- password: demo123
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    RETURNING id INTO user_id;

    -- Insert sample companies
    INSERT INTO companies (id, name, description, sector, website, token_symbol, created_at, updated_at)
    VALUES 
        (uuid_generate_v4(), 'LayerZero', 'Omnichain interoperability protocol', 'infrastructure', 'https://layerzero.network', 'LZ', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (uuid_generate_v4(), 'Polygon', 'Ethereum scaling solution', 'layer2', 'https://polygon.technology', 'MATIC', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (uuid_generate_v4(), 'Celestia', 'Modular blockchain network', 'infrastructure', 'https://celestia.org', 'TIA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

    RAISE NOTICE 'Sample data created successfully';
END;
$$ LANGUAGE plpgsql;