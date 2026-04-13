CREATE TABLE users (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    active BIT NOT NULL DEFAULT 1
);

CREATE TABLE rooms (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    code VARCHAR(12) NOT NULL UNIQUE,
    host_nickname VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at DATETIME2 NOT NULL
);
CREATE INDEX idx_rooms_status ON rooms(status);

CREATE TABLE players (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    room_id UNIQUEIDENTIFIER NOT NULL,
    nickname VARCHAR(30) NOT NULL,
    score INT NOT NULL DEFAULT 0,
    is_host BIT NOT NULL DEFAULT 0,
    ready BIT NOT NULL DEFAULT 0,
    connected BIT NOT NULL DEFAULT 1,
    joined_at DATETIME2 NOT NULL,
    CONSTRAINT fk_players_room FOREIGN KEY (room_id) REFERENCES rooms(id),
    CONSTRAINT uq_players_room_nickname UNIQUE (room_id, nickname)
);
CREATE INDEX idx_players_room_id ON players(room_id);

CREATE TABLE game_sessions (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    room_id UNIQUEIDENTIFIER NOT NULL,
    status VARCHAR(20) NOT NULL,
    current_turn_player_id UNIQUEIDENTIFIER NULL,
    started_at DATETIME2 NULL,
    last_turn_at DATETIME2 NULL,
    ended_at DATETIME2 NULL,
    CONSTRAINT fk_game_sessions_room FOREIGN KEY (room_id) REFERENCES rooms(id)
);
CREATE INDEX idx_game_sessions_room_id ON game_sessions(room_id);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);

CREATE TABLE questions (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    clue VARCHAR(300) NOT NULL,
    answer VARCHAR(200) NOT NULL,
    active BIT NOT NULL DEFAULT 1
);
CREATE INDEX idx_questions_category ON questions(category);

CREATE TABLE leaderboard (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    game_session_id UNIQUEIDENTIFIER NOT NULL,
    room_id UNIQUEIDENTIFIER NOT NULL,
    player_id UNIQUEIDENTIFIER NOT NULL,
    score INT NOT NULL,
    rank_position INT NOT NULL,
    CONSTRAINT fk_leaderboard_session FOREIGN KEY (game_session_id) REFERENCES game_sessions(id),
    CONSTRAINT fk_leaderboard_room FOREIGN KEY (room_id) REFERENCES rooms(id),
    CONSTRAINT fk_leaderboard_player FOREIGN KEY (player_id) REFERENCES players(id)
);
CREATE INDEX idx_leaderboard_session_id ON leaderboard(game_session_id);
CREATE INDEX idx_leaderboard_room_rank ON leaderboard(room_id, rank_position);

