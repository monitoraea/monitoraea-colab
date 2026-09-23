-- Adds the two new CIEA tab help-content buckets to the shared helpbox_type enum
-- (see cms/helpboxes.sql for the original: 'info', 'redes', 'indic').
-- NOTE: run each statement on its own, outside a transaction that also uses
-- the new value (PostgreSQL forbids using an ADD VALUE in the same transaction
-- it was added in).

ALTER TYPE helpbox_type ADD VALUE IF NOT EXISTS 'plano_acao';
ALTER TYPE helpbox_type ADD VALUE IF NOT EXISTS 'plano_monitoramento';
