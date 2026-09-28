ALTER TABLE competitions
  ADD COLUMN deleted_at datetime(3) NULL DEFAULT NULL,
  ADD INDEX idx_competitions_deleted_at (deleted_at);
