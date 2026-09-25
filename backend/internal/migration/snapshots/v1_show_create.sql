-- table: competitions
CREATE TABLE `competitions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` longtext,
  `sub_title` longtext,
  `start_time` datetime(3) DEFAULT NULL,
  `end_time` datetime(3) DEFAULT NULL,
  `host_id` bigint unsigned DEFAULT NULL,
  `rounds_num` bigint DEFAULT NULL,
  `unassigned_group_id` bigint unsigned DEFAULT NULL,
  `groups_num` bigint DEFAULT NULL,
  `unassigned_lane_id` bigint unsigned DEFAULT NULL,
  `lanes_num` bigint DEFAULT NULL,
  `current_phase` bigint DEFAULT NULL,
  `qualification_current_end` bigint DEFAULT NULL,
  `qualification_is_active` tinyint(1) DEFAULT NULL,
  `elimination_is_active` tinyint(1) DEFAULT NULL,
  `team_elimination_is_active` tinyint(1) DEFAULT NULL,
  `mixed_elimination_is_active` tinyint(1) DEFAULT NULL,
  `script` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- table: eliminations
CREATE TABLE `eliminations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `group_id` bigint unsigned DEFAULT NULL,
  `current_stage` bigint unsigned DEFAULT NULL,
  `current_end` bigint unsigned DEFAULT NULL,
  `team_size` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- table: groups
CREATE TABLE `groups` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `competition_id` bigint unsigned DEFAULT NULL,
  `group_name` longtext,
  `group_range` longtext,
  `bow_type` longtext,
  `group_index` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_competitions_groups` (`competition_id`),
  CONSTRAINT `fk_competitions_groups` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- table: institutions
CREATE TABLE `institutions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` longtext NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- table: lanes
CREATE TABLE `lanes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `competition_id` bigint unsigned DEFAULT NULL,
  `qualification_id` bigint unsigned DEFAULT NULL,
  `lane_number` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_qualifications_lanes` (`qualification_id`),
  CONSTRAINT `fk_qualifications_lanes` FOREIGN KEY (`qualification_id`) REFERENCES `qualifications` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- table: match_ends
CREATE TABLE `match_ends` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `match_result_id` bigint unsigned DEFAULT NULL,
  `total_score` bigint DEFAULT NULL,
  `is_confirmed` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_match_results_match_ends` (`match_result_id`),
  CONSTRAINT `fk_match_results_match_ends` FOREIGN KEY (`match_result_id`) REFERENCES `match_results` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- table: match_results
CREATE TABLE `match_results` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `match_id` bigint unsigned DEFAULT NULL,
  `player_set_id` bigint unsigned DEFAULT NULL,
  `total_points` bigint DEFAULT NULL,
  `shoot_off_score` bigint DEFAULT NULL,
  `is_winner` tinyint(1) DEFAULT NULL,
  `lane_number` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_match_results_player_set` (`player_set_id`),
  KEY `fk_matches_match_results` (`match_id`),
  CONSTRAINT `fk_match_results_player_set` FOREIGN KEY (`player_set_id`) REFERENCES `player_sets` (`id`),
  CONSTRAINT `fk_matches_match_results` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- table: match_scores
CREATE TABLE `match_scores` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `match_end_id` bigint unsigned DEFAULT NULL,
  `score` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_match_ends_match_scores` (`match_end_id`),
  CONSTRAINT `fk_match_ends_match_scores` FOREIGN KEY (`match_end_id`) REFERENCES `match_ends` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- table: matches
CREATE TABLE `matches` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `stage_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_stages_matchs` (`stage_id`),
  CONSTRAINT `fk_stages_matchs` FOREIGN KEY (`stage_id`) REFERENCES `stages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- table: medals
CREATE TABLE `medals` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `elimination_id` bigint unsigned NOT NULL,
  `type` bigint NOT NULL,
  `player_set_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_eliminations_medals` (`elimination_id`),
  CONSTRAINT `fk_eliminations_medals` FOREIGN KEY (`elimination_id`) REFERENCES `eliminations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- table: participants
CREATE TABLE `participants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `competition_id` bigint unsigned NOT NULL,
  `role` longtext NOT NULL,
  `status` longtext NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_competitions_participants` (`competition_id`),
  CONSTRAINT `fk_competitions_participants` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- table: player_set_match_tables
CREATE TABLE `player_set_match_tables` (
  `player_set_id` bigint unsigned NOT NULL,
  `player_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`player_set_id`,`player_id`),
  KEY `fk_player_set_match_tables_player` (`player_id`),
  CONSTRAINT `fk_player_set_match_tables_player` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`),
  CONSTRAINT `fk_player_set_match_tables_player_set` FOREIGN KEY (`player_set_id`) REFERENCES `player_sets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- table: player_sets
CREATE TABLE `player_sets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `elimination_id` bigint unsigned DEFAULT NULL,
  `total_score` bigint DEFAULT NULL,
  `rank` bigint DEFAULT NULL,
  `set_name` longtext,
  PRIMARY KEY (`id`),
  KEY `fk_eliminations_player_sets` (`elimination_id`),
  CONSTRAINT `fk_eliminations_player_sets` FOREIGN KEY (`elimination_id`) REFERENCES `eliminations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- table: players
CREATE TABLE `players` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `group_id` bigint unsigned DEFAULT NULL,
  `lane_id` bigint unsigned DEFAULT NULL,
  `participant_id` bigint unsigned DEFAULT NULL,
  `name` longtext,
  `total_score` bigint DEFAULT NULL,
  `shoot_off_score` bigint DEFAULT NULL,
  `rank` bigint DEFAULT NULL,
  `order_number` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_lanes_players` (`lane_id`),
  KEY `fk_groups_players` (`group_id`),
  CONSTRAINT `fk_groups_players` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`),
  CONSTRAINT `fk_lanes_players` FOREIGN KEY (`lane_id`) REFERENCES `lanes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- table: qualifications
CREATE TABLE `qualifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `advancing_num` bigint DEFAULT NULL,
  `start_lane_number` bigint DEFAULT NULL,
  `end_lane_number` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- table: round_ends
CREATE TABLE `round_ends` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `round_id` bigint unsigned DEFAULT NULL,
  `is_confirmed` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_rounds_round_ends` (`round_id`),
  CONSTRAINT `fk_rounds_round_ends` FOREIGN KEY (`round_id`) REFERENCES `rounds` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- table: round_scores
CREATE TABLE `round_scores` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `round_end_id` bigint unsigned DEFAULT NULL,
  `score` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_round_ends_round_scores` (`round_end_id`),
  CONSTRAINT `fk_round_ends_round_scores` FOREIGN KEY (`round_end_id`) REFERENCES `round_ends` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- table: rounds
CREATE TABLE `rounds` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `player_id` bigint unsigned DEFAULT NULL,
  `total_score` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_players_rounds` (`player_id`),
  CONSTRAINT `fk_players_rounds` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- table: stages
CREATE TABLE `stages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `elimination_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_eliminations_stages` (`elimination_id`),
  CONSTRAINT `fk_eliminations_stages` FOREIGN KEY (`elimination_id`) REFERENCES `eliminations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- table: users
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role` longtext NOT NULL,
  `user_name` varchar(191) NOT NULL,
  `real_name` longtext,
  `password` longtext NOT NULL,
  `email` varchar(191) NOT NULL,
  `institution_id` bigint unsigned DEFAULT NULL,
  `overview` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uni_users_user_name` (`user_name`),
  UNIQUE KEY `uni_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
