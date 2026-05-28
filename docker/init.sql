-- ============================================================
-- SleepCalm ERP - Inicialização do Banco de Dados PostgreSQL
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Função para busca insensível a acento
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS portuguese_unaccent (COPY = portuguese);
ALTER TEXT SEARCH CONFIGURATION portuguese_unaccent
  ALTER MAPPING FOR hword, hword_part, word
  WITH unaccent, portuguese_stem;

-- Schema inicial
COMMENT ON DATABASE sleepcalm_erp IS 'SleepCalm ERP - Sistema de Gestão de Devoluções v1.0';
