CREATE TABLE question_sets (
    id           UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    name         NVARCHAR(100)    NOT NULL,
    created_at   DATETIME2        NOT NULL
);
CREATE INDEX idx_question_sets_created ON question_sets(created_at DESC);

CREATE TABLE question_set_items (
    id              UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    question_set_id UNIQUEIDENTIFIER NOT NULL,
    category        NVARCHAR(100)    NOT NULL,
    clue            NVARCHAR(300)    NOT NULL,
    answer          NVARCHAR(200)    NOT NULL,
    order_index     INT              NOT NULL DEFAULT 0,
    CONSTRAINT fk_qsi_set FOREIGN KEY (question_set_id)
        REFERENCES question_sets(id) ON DELETE CASCADE
);
CREATE INDEX idx_qsi_set_id ON question_set_items(question_set_id);
