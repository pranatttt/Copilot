-- 1. Enable the pgvector extension for AI similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the main table for Compliance Records
CREATE TABLE IF NOT EXISTS compliance_records (
    id SERIAL PRIMARY KEY,
    
    -- CORE FILTERS (Requirement 2A & Issue 1 Fix)
    country TEXT DEFAULT 'India',
    state_region TEXT, -- Maps to 'Central/Federal/State*'
    category TEXT NOT NULL, -- Maps to 'Category'
    sub_category TEXT, -- Maps to 'Sub Category' (FIX for Issue 1)
    criticality TEXT, -- Maps to 'Critical? *' (FIX for Issue 5)
    
    -- LEGAL IDENTITY (Used for Citations)
    mother_act TEXT,
    statutory_provisions TEXT,
    compliance_header TEXT,
    
    -- THE BRAIN (What the AI reads)
    combined_content TEXT NOT NULL,
    
    -- THE VECTOR (768 dimensions for nomic-embed-text)
    embedding vector(768),

    -- DYNAMIC METADATA (Storage for all other CSV columns)
    metadata JSONB,

    -- SYSTEM TRACKING
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_file TEXT 
);

-- 3. Create the Audit Log Table (Requirement 8D)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id TEXT,
    tenant_id TEXT DEFAULT 'Acme Corp',
    user_query TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    metadata_filters_used JSONB,
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PERFORMANCE INDEXES (Production Speed Optimization)
CREATE INDEX IF NOT EXISTS idx_compliance_country ON compliance_records (country);
CREATE INDEX IF NOT EXISTS idx_compliance_state ON compliance_records (state_region);
CREATE INDEX IF NOT EXISTS idx_compliance_category ON compliance_records (category);
CREATE INDEX IF NOT EXISTS idx_compliance_sub_category ON compliance_records (sub_category);

CREATE INDEX IF NOT EXISTS idx_compliance_vector ON compliance_records 
USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_compliance_metadata ON compliance_records USING GIN (metadata);

-- 5. PERSISTENT CHAT HISTORY (New Production Module)
-- Stores conversation messages linked to a browser session
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL, -- Unique ID stored in browser localStorage
    role TEXT NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    user_query TEXT, -- FIX: Stores the original question to link feedback after reload
    sources JSONB DEFAULT '[]', -- Stores citation cards for reload
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast history retrieval when user reloads the page
CREATE INDEX IF NOT EXISTS idx_chat_session_id ON chat_messages (session_id);

-- 6. FEEDBACK SYSTEM (Phase 3)
CREATE TABLE IF NOT EXISTS chat_feedback (
    id SERIAL PRIMARY KEY,
    session_id TEXT,
    query_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    remark TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_feedback_query ON chat_feedback (query_text);
