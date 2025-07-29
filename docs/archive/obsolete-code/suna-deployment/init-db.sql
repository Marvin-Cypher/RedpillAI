-- Suna Database Schema for VC Integration

-- Core Suna tables
CREATE TABLE IF NOT EXISTS threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT now(),
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES threads(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    metadata JSONB
);

-- VC-specific extensions
CREATE SCHEMA IF NOT EXISTS vc_crm;

CREATE TABLE IF NOT EXISTS vc_crm.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'sourced',
    round TEXT,
    valuation DECIMAL,
    suna_thread_id UUID REFERENCES threads(id),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vc_crm.research_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES vc_crm.projects(id),
    suna_thread_id UUID REFERENCES threads(id),
    query TEXT NOT NULL,
    results JSONB,
    confidence DECIMAL,
    created_at TIMESTAMP DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_threads_metadata ON threads USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_projects_status ON vc_crm.projects(status);
CREATE INDEX IF NOT EXISTS idx_research_sessions_project_id ON vc_crm.research_sessions(project_id);

-- Insert demo data
INSERT INTO vc_crm.projects (name, description, status, round) VALUES
('LayerZero', 'Omnichain interoperability protocol', 'due_diligence', 'Series B'),
('Celestia', 'Modular blockchain network', 'portfolio', 'Series A'),
('Polygon', 'Ethereum scaling solution', 'portfolio', 'Series C')
ON CONFLICT DO NOTHING;
