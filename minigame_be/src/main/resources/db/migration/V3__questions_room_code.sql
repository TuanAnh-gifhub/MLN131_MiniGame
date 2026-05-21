ALTER TABLE questions ADD room_code VARCHAR(12) NULL;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'idx_questions_room_code'
      AND object_id = OBJECT_ID('questions')
)
BEGIN
    CREATE INDEX idx_questions_room_code ON questions(room_code);
END

