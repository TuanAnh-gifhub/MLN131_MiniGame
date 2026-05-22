ALTER TABLE game_sessions ADD total_rounds INT NOT NULL CONSTRAINT df_game_sessions_total_rounds DEFAULT 3;
ALTER TABLE game_sessions ADD current_round INT NOT NULL CONSTRAINT df_game_sessions_current_round DEFAULT 1;
ALTER TABLE game_sessions ADD current_clue VARCHAR(300) NULL;
ALTER TABLE game_sessions ADD current_answer VARCHAR(200) NULL;
ALTER TABLE game_sessions ADD masked_answer VARCHAR(200) NULL;
ALTER TABLE game_sessions ADD used_letters VARCHAR(80) NULL;
ALTER TABLE game_sessions ADD current_spin_score INT NULL;
ALTER TABLE game_sessions ADD spin_required BIT NOT NULL CONSTRAINT df_game_sessions_spin_required DEFAULT 1;

IF NOT EXISTS (SELECT 1 FROM questions)
BEGIN
    INSERT INTO questions (id, category, clue, answer, active) VALUES
    (NEWID(), 'animal', 'Ten mot loai dong vat', 'CON MEO', 1),
    (NEWID(), 'food', 'Mon an pho bien buoi sang Viet Nam', 'PHO BO', 1),
    (NEWID(), 'object', 'Vat dung de xem gio', 'DONG HO', 1),
    (NEWID(), 'place', 'Thu do cua Viet Nam', 'HA NOI', 1),
    (NEWID(), 'nature', 'Hanh tinh chung ta dang song', 'TRAI DAT', 1);
END

