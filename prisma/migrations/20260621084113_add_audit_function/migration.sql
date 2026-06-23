-- Migration: make audit_logs append-only at the database level.
--
-- Rationale: Prisma/NestJS-level discipline (only ever calling .create())
-- is not a guarantee — a future bug, a raw query, or direct DB access
-- could UPDATE or DELETE a row. For a compliance audit trail, the
-- guarantee needs to live in the database, not in application code.
--
-- This trigger rejects any UPDATE or DELETE on audit_logs unconditionally.
-- If you ever need to "correct" a bad entry, the correct pattern is to
-- insert a new compensating row referencing the original (e.g. via
-- metadata: { "correctsRecordId": "<id of the wrong row>" }), never to
-- edit history in place.

CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only: % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_no_update ON audit_logs;
CREATE TRIGGER audit_logs_no_update
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_mutation();

DROP TRIGGER IF EXISTS audit_logs_no_delete ON audit_logs;
CREATE TRIGGER audit_logs_no_delete
  BEFORE DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_mutation();