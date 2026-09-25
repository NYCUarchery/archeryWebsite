ALTER TABLE eliminations ADD COLUMN bracket_seed_count bigint NULL DEFAULT NULL;
ALTER TABLE match_results ADD COLUMN target char(1) NULL;
ALTER TABLE match_results ADD CONSTRAINT match_results_target_allowed CHECK (CAST(target AS BINARY) IN ('A', 'B') OR target IS NULL);
ALTER TABLE match_results DROP FOREIGN KEY fk_match_results_player_set;
ALTER TABLE match_results ADD CONSTRAINT fk_match_results_player_set FOREIGN KEY (player_set_id) REFERENCES player_sets (id) ON DELETE SET NULL;
ALTER TABLE match_results DROP COLUMN total_points;
