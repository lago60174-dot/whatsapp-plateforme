-- ============================================================
-- SCHÉMA SQL COMPLET
-- À coller dans l'éditeur SQL de Supabase (SQL Editor)
-- Exécute tout d'un coup
-- ============================================================

-- 1. Activer l'extension pgvector pour la recherche vectorielle
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Table des entreprises clientes
CREATE TABLE companies (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL,
  phone_number_id         TEXT NOT NULL UNIQUE,  -- ID Meta du numéro WhatsApp
  whatsapp_access_token   TEXT NOT NULL,          -- Token Meta (sensible !)
  status                  TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  system_prompt           TEXT NOT NULL DEFAULT 'Tu es un assistant IA professionnel.',
  subscription_expires_at TIMESTAMPTZ,
  monthly_message_count   INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Table des documents PDF
CREATE TABLE documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  file_size   INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Table des chunks de documents (avec embeddings vectoriels)
-- C'est la table centrale du RAG
CREATE TABLE document_chunks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  chunk_index  INTEGER NOT NULL,
  embedding    vector(768),  -- Dimension pour text-embedding-004 de Google
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Table des conversations
CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_phone  TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, customer_phone)
);

-- 6. Table des messages
CREATE TABLE messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content          TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INDEX pour les performances ───────────────────────────

-- Index vectoriel sur les embeddings (IVFFlat = rapide pour la recherche)
-- Créer APRÈS avoir inséré des données (pas avant)
-- CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Index classiques
CREATE INDEX idx_documents_company ON documents(company_id);
CREATE INDEX idx_chunks_company ON document_chunks(company_id);
CREATE INDEX idx_conversations_company ON conversations(company_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_companies_phone ON companies(phone_number_id);

-- ─── FONCTION DE RECHERCHE VECTORIELLE ─────────────────────
-- Cette fonction est appelée depuis lib/rag.ts
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding   vector(768),
  match_company_id  UUID,
  match_count       INTEGER DEFAULT 5,
  match_threshold   FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id          UUID,
  content     TEXT,
  similarity  FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    dc.id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE
    dc.company_id = match_company_id
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ─── TRIGGER pour updated_at automatique ───────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
