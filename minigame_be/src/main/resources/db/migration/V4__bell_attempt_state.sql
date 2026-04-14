ALTER TABLE game_sessions ADD active_bell_player_id UNIQUEIDENTIFIER NULL;
ALTER TABLE game_sessions ADD bell_used_player_ids VARCHAR(1200) NULL;

