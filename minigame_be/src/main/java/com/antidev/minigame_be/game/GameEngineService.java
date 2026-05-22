package com.antidev.minigame_be.game;

import com.antidev.minigame_be.common.ApiException;
import com.antidev.minigame_be.domain.GameSession;
import com.antidev.minigame_be.domain.GameSessionStatus;
import com.antidev.minigame_be.domain.Player;
import com.antidev.minigame_be.domain.Question;
import com.antidev.minigame_be.domain.Room;
import com.antidev.minigame_be.domain.RoomStatus;
import com.antidev.minigame_be.repository.GameSessionRepository;
import com.antidev.minigame_be.repository.PlayerRepository;
import com.antidev.minigame_be.repository.QuestionRepository;
import com.antidev.minigame_be.repository.RoomRepository;
import com.antidev.minigame_be.websocket.GameEventType;
import com.antidev.minigame_be.websocket.dto.GameInboundMessage;
import com.antidev.minigame_be.websocket.dto.GameOutboundMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class GameEngineService {

    private static final String ALPHABET = "ABCDEFGHIKLMNOPQRSTUVXY";
    private static final int ROUND_WIN_BONUS = 1000;
    private static final int TURN_TIMEOUT_SECONDS = 60;

    private final GameSessionRepository gameSessionRepository;
    private final PlayerRepository playerRepository;
    private final RoomRepository roomRepository;
    private final QuestionRepository questionRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void handleClientEvent(String roomCodeRaw, GameInboundMessage message) {
        String roomCode = roomCodeRaw.toUpperCase(Locale.ROOT);
        GameSession session = getManagedSession(roomCode);
        if (session.getStatus() == GameSessionStatus.PAUSED) {
            throw new ApiException(HttpStatus.CONFLICT, "Game is paused");
        }
        List<Player> players = playerRepository.findByRoomCodeOrderByJoinedAtAsc(roomCode);
        Player actor = findActor(players, message.actor());

        switch (message.eventType()) {
            case RING_BELL -> handleRingBell(session, actor);
            case GUESS_ANSWER -> handleGuessAnswer(session, players, actor, message.payload());
            case GUESS_LETTER -> {
                if (!actor.getId().equals(session.getCurrentTurnPlayerId())) {
                    throw new ApiException(HttpStatus.CONFLICT, "Not your turn");
                }
                handleGuessLetterEvent(session, players, actor, message.payload());
            }
            default -> throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported event for game engine");
        }
    }

    @Transactional
    public void rotateTurnByTimeout(GameSession session, List<Player> players, Instant now) {
        if (session.getStatus() != GameSessionStatus.IN_PROGRESS) {
            return;
        }
        if (players.isEmpty()) {
            return;
        }

        Player next = nextPlayer(players, session.getCurrentTurnPlayerId());
        session.setCurrentTurnPlayerId(next.getId());
        session.setSpinRequired(true);
        session.setCurrentSpinScore(null);
        session.setLastTurnAt(now);

        sendTurnChange(session, next.getId(), "TURN_TIMEOUT", now);
        sendGameUpdate(session, "TURN_TIMEOUT", now);
    }

    @Transactional
    public void initializeFirstRound(GameSession session) {
        initializeRound(session, 1);
    }

    private void handleGuessLetterEvent(GameSession session, List<Player> players, Player actor, String payload) {
        if (session.getActiveBellPlayerId() != null) {
            throw new ApiException(HttpStatus.CONFLICT, "Another player is answering by bell");
        }

        String normalized = payload == null ? "" : payload.trim().toUpperCase(Locale.ROOT);

        if (normalized.startsWith("SPIN")) {
            handleSpin(session, players, actor);
            return;
        }

        if (session.isSpinRequired() || session.getCurrentSpinScore() == null || session.getCurrentSpinScore() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You must spin before guessing a letter");
        }

        if (normalized.length() != 1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Letter guess must be exactly one character");
        }

        char letter = normalized.charAt(0);
        if (ALPHABET.indexOf(letter) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Letter is not in the game alphabet");
        }

        Set<Character> used = readUsedLetters(session.getUsedLetters());
        if (used.contains(letter)) {
            throw new ApiException(HttpStatus.CONFLICT, "Letter already used");
        }
        used.add(letter);
        session.setUsedLetters(serializeUsedLetters(used));

        int occurrences = countOccurrences(session.getCurrentAnswer(), letter);
        Instant now = Instant.now();

        if (occurrences <= 0) {
            advanceTurn(session, players, now, "WRONG_LETTER");
            sendGameUpdate(session, "WRONG_LETTER", now, actor.getNickname());
            return;
        }

        actor.setScore(actor.getScore() + (session.getCurrentSpinScore() * occurrences));
        playerRepository.save(actor);

        String nextMasked = revealAll(session.getCurrentAnswer(), session.getMaskedAnswer(), letter);
        session.setMaskedAnswer(nextMasked);
        session.setCurrentSpinScore(null);
        session.setSpinRequired(true);
        session.setLastTurnAt(now);

        if (isSolved(nextMasked)) {
            finishRound(session, actor, now, "SOLVED_ALL_LETTERS");
            return;
        }

        sendGameUpdate(session, "CORRECT_LETTER", now, actor.getNickname());
    }

    private void handleGuessAnswer(GameSession session, List<Player> players, Player actor, String payload) {
        if (session.getActiveBellPlayerId() == null || !session.getActiveBellPlayerId().equals(actor.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "You must ring the bell before guessing the full answer");
        }

        String guess = payload == null ? "" : payload.trim().toUpperCase(Locale.ROOT);
        if (guess.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Answer guess cannot be blank");
        }

        Instant now = Instant.now();
        String expected = normalizeAnswer(session.getCurrentAnswer());
        if (!normalizeAnswer(guess).equals(expected)) {
            actor.setScore(0);
            playerRepository.save(actor);
            session.setActiveBellPlayerId(null);
            session.setLastTurnAt(now);
            sendGameUpdate(session, "WRONG_ANSWER_RESET_SCORE", now, actor.getNickname());
            return;
        }

        finishRound(session, actor, now, "BINGO");
    }

    private void handleRingBell(GameSession session, Player actor) {
        Instant now = Instant.now();
        if (session.getActiveBellPlayerId() != null) {
            throw new ApiException(HttpStatus.CONFLICT, "Another player is already ringing the bell");
        }

        Set<UUID> usedPlayers = readBellUsedPlayerIds(session.getBellUsedPlayerIds());
        if (usedPlayers.contains(actor.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "You already used bell for this question");
        }

        usedPlayers.add(actor.getId());
        session.setBellUsedPlayerIds(serializeBellUsedPlayerIds(usedPlayers));
        session.setActiveBellPlayerId(actor.getId());
        session.setLastTurnAt(now);

        messagingTemplate.convertAndSend(
            "/topic/rooms/" + session.getRoom().getCode(),
            new GameOutboundMessage(
                GameEventType.RING_BELL,
                session.getRoom().getCode(),
                actor.getNickname(),
                Map.of(
                    "actorPlayerId", actor.getId(),
                    "currentRound", session.getCurrentRound(),
                    "totalRounds", session.getTotalRounds()
                ),
                now
            )
        );

        sendGameUpdate(session, "BELL_LOCKED", now, actor.getNickname());
    }

    private void finishRound(GameSession session, Player winner, Instant now, String reason) {
        winner.setScore(winner.getScore() + ROUND_WIN_BONUS);
        playerRepository.save(winner);

        session.setMaskedAnswer(session.getCurrentAnswer());
        session.setCurrentSpinScore(null);
        session.setSpinRequired(true);
        session.setActiveBellPlayerId(null);
        session.setBellUsedPlayerIds("");
        session.setLastTurnAt(now);

        sendRoundEnd(session, winner, reason, now);

        if (session.getCurrentRound() >= session.getTotalRounds()) {
            endGame(session, now, winner, "FINAL_ROUND_COMPLETED");
            return;
        }

        int nextRound = session.getCurrentRound() + 1;
        initializeRound(session, nextRound);
        session.setCurrentTurnPlayerId(winner.getId());
        session.setLastTurnAt(now);
        sendTurnChange(session, winner.getId(), "NEXT_ROUND", now);
        sendGameUpdate(session, "ROUND_STARTED", now);
    }

    private void handleSpin(GameSession session, List<Player> players, Player actor) {
        if (!session.isSpinRequired()) {
            throw new ApiException(HttpStatus.CONFLICT, "You already spun in this turn");
        }

        int roll = spinWheel();
        Instant now = Instant.now();

        session.setCurrentSpinScore(roll);
        sendGameUpdate(session, "SPIN_RESULT", now);

        if (roll == -1) {
            actor.setScore(0);
            playerRepository.save(actor);
            advanceTurn(session, players, now, "BANKRUPT");
            sendGameUpdate(session, "BANKRUPT", now, actor.getNickname());
            return;
        }

        if (roll == 0) {
            advanceTurn(session, players, now, "LOSE_TURN");
            sendGameUpdate(session, "LOSE_TURN", now, actor.getNickname());
            return;
        }

        session.setSpinRequired(false);
        session.setLastTurnAt(now);
        sendGameUpdate(session, "SPIN_OK", now, actor.getNickname());
    }

    private void advanceTurn(GameSession session, List<Player> players, Instant now, String reason) {
        Player next = nextPlayer(players, session.getCurrentTurnPlayerId());
        session.setCurrentTurnPlayerId(next.getId());
        session.setCurrentSpinScore(null);
        session.setSpinRequired(true);
        session.setLastTurnAt(now);
        sendTurnChange(session, next.getId(), reason, now);
    }

    private void initializeRound(GameSession session, int roundNumber) {
        Question question = randomQuestion(session.getRoom().getCode());
        String answer = question.getAnswer().trim().toUpperCase(Locale.ROOT);
        session.setCurrentRound(roundNumber);
        session.setCurrentClue(question.getClue());
        session.setCurrentAnswer(answer);
        session.setMaskedAnswer(mask(answer));
        session.setUsedLetters("");
        session.setCurrentSpinScore(null);
        session.setSpinRequired(true);
        session.setActiveBellPlayerId(null);
        session.setBellUsedPlayerIds("");
    }

    private void endGame(GameSession session, Instant now, Player winner, String reason) {
        session.setStatus(GameSessionStatus.ENDED);
        session.setEndedAt(now);

        Room room = session.getRoom();
        room.setStatus(RoomStatus.FINISHED);
        roomRepository.save(room);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("reason", reason);
        payload.put("currentRound", session.getCurrentRound());
        payload.put("totalRounds", session.getTotalRounds());
        if (winner != null) {
            payload.put("winnerId", winner.getId());
            payload.put("winnerNickname", winner.getNickname());
        }

        messagingTemplate.convertAndSend(
            "/topic/rooms/" + room.getCode(),
            new GameOutboundMessage(
                GameEventType.GAME_END,
                room.getCode(),
                "system",
                payload,
                now
            )
        );
    }

    private GameSession getActiveSession(String roomCode) {
        return gameSessionRepository.findFirstByRoomCodeAndStatusOrderByStartedAtDesc(roomCode, GameSessionStatus.IN_PROGRESS)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No active game session in room"));
    }

    private GameSession getManagedSession(String roomCode) {
        return gameSessionRepository.findFirstByRoomCodeAndStatusInOrderByStartedAtDesc(
                roomCode,
                List.of(GameSessionStatus.IN_PROGRESS, GameSessionStatus.PAUSED)
            )
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No active game session in room"));
    }

    private Player selectTopScorer(List<Player> players) {
        if (players.isEmpty()) {
            return null;
        }
        Player best = players.get(0);
        for (int i = 1; i < players.size(); i++) {
            Player candidate = players.get(i);
            if (candidate.getScore() > best.getScore()) {
                best = candidate;
            }
        }
        return best;
    }

    private UUID resolveNextTurnPlayerId(List<Player> players, UUID currentPlayerId) {
        if (players.isEmpty()) {
            return null;
        }
        if (currentPlayerId == null) {
            return players.get(0).getId();
        }
        boolean exists = players.stream().anyMatch(player -> player.getId().equals(currentPlayerId));
        if (!exists) {
            return players.get(0).getId();
        }
        return nextPlayer(players, currentPlayerId).getId();
    }

    private void sendAdminEvent(GameEventType eventType, String roomCode, Map<String, Object> payload, Instant now) {
        messagingTemplate.convertAndSend(
            "/topic/rooms/" + roomCode,
            new GameOutboundMessage(
                eventType,
                roomCode,
                "admin",
                payload,
                now
            )
        );
    }

    private Player findActor(List<Player> players, String actorNickname) {
        return players.stream()
            .filter(p -> p.getNickname().equalsIgnoreCase(actorNickname))
            .findFirst()
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Actor not found in room"));
    }

    private Player nextPlayer(List<Player> players, UUID currentPlayerId) {
        int index = 0;
        for (int i = 0; i < players.size(); i++) {
            if (players.get(i).getId().equals(currentPlayerId)) {
                index = i;
                break;
            }
        }
        return players.get((index + 1) % players.size());
    }

    private int spinWheel() {
        int[] outcomes = {100, 200, 300, 400, 500, 600, 700, 800, 0, -1};
        return outcomes[ThreadLocalRandom.current().nextInt(outcomes.length)];
    }

    private Question randomQuestion(String roomCode) {
        List<Question> active = questionRepository.findByActiveTrueAndRoomCode(roomCode);
        if (active.isEmpty()) {
            active = questionRepository.findByActiveTrueAndRoomCodeIsNull();
        }
        if (active.isEmpty()) {
            Question fallback = new Question();
            fallback.setCategory("default");
            fallback.setClue("Ten mot loai dong vat");
            fallback.setAnswer("CON MEO");
            fallback.setActive(true);
            return fallback;
        }
        return active.get(ThreadLocalRandom.current().nextInt(active.size()));
    }

    private Set<Character> readUsedLetters(String usedLetters) {
        Set<Character> result = new LinkedHashSet<>();
        if (usedLetters == null || usedLetters.isBlank()) {
            return result;
        }

        String[] parts = usedLetters.split(",");
        for (String part : parts) {
            String value = part.trim().toUpperCase(Locale.ROOT);
            if (value.length() == 1) {
                result.add(value.charAt(0));
            }
        }
        return result;
    }

    private String serializeUsedLetters(Set<Character> used) {
        List<String> values = new ArrayList<>();
        for (Character value : used) {
            values.add(String.valueOf(value));
        }
        return String.join(",", values);
    }

    private Set<UUID> readBellUsedPlayerIds(String rawValue) {
        Set<UUID> result = new LinkedHashSet<>();
        if (rawValue == null || rawValue.isBlank()) {
            return result;
        }

        String[] parts = rawValue.split(",");
        for (String part : parts) {
            String value = part.trim();
            if (value.isBlank()) {
                continue;
            }
            try {
                result.add(UUID.fromString(value));
            } catch (IllegalArgumentException ignored) {
                // Ignore malformed legacy values instead of breaking active games.
            }
        }
        return result;
    }

    private String serializeBellUsedPlayerIds(Set<UUID> usedPlayers) {
        List<String> values = new ArrayList<>();
        for (UUID playerId : usedPlayers) {
            values.add(playerId.toString());
        }
        return String.join(",", values);
    }

    private int countOccurrences(String answer, char letter) {
        int count = 0;
        for (int i = 0; i < answer.length(); i++) {
            if (answer.charAt(i) == letter) {
                count++;
            }
        }
        return count;
    }

    private String revealAll(String answer, String masked, char letter) {
        StringBuilder builder = new StringBuilder(masked);
        for (int i = 0; i < answer.length(); i++) {
            if (answer.charAt(i) == letter) {
                builder.setCharAt(i, letter);
            }
        }
        return builder.toString();
    }

    private boolean isSolved(String masked) {
        return masked.indexOf('_') < 0;
    }

    private String normalizeAnswer(String value) {
        return value.trim().replaceAll("\\s+", " ").toUpperCase(Locale.ROOT);
    }

    private String mask(String answer) {
        StringBuilder builder = new StringBuilder(answer.length());
        for (int i = 0; i < answer.length(); i++) {
            char c = answer.charAt(i);
            builder.append(c == ' ' ? ' ' : '_');
        }
        return builder.toString();
    }

    private void sendTurnChange(GameSession session, UUID nextPlayerId, String reason, Instant now) {
        messagingTemplate.convertAndSend(
            "/topic/rooms/" + session.getRoom().getCode(),
            new GameOutboundMessage(
                GameEventType.TURN_CHANGE,
                session.getRoom().getCode(),
                "system",
                Map.of(
                    "nextPlayerId", nextPlayerId,
                    "timeoutSeconds", TURN_TIMEOUT_SECONDS,
                    "reason", reason,
                    "currentRound", session.getCurrentRound(),
                    "totalRounds", session.getTotalRounds()
                ),
                now
            )
        );
    }

    private void sendGameUpdate(GameSession session, String reason, Instant now) {
        sendGameUpdate(session, reason, now, null);
    }

    private void sendGameUpdate(GameSession session, String reason, Instant now, String actorNickname) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("reason", reason);
        payload.put("alphabet", ALPHABET);
        payload.put("currentRound", session.getCurrentRound());
        payload.put("totalRounds", session.getTotalRounds());
        payload.put("currentTurnPlayerId", session.getCurrentTurnPlayerId());
        payload.put("timeoutSeconds", TURN_TIMEOUT_SECONDS);
        payload.put("spinRequired", session.isSpinRequired());
        payload.put("activeBellPlayerId", session.getActiveBellPlayerId());
        payload.put("bellUsedPlayerIds", new ArrayList<>(readBellUsedPlayerIds(session.getBellUsedPlayerIds())));
        if (actorNickname != null && !actorNickname.isBlank()) {
            payload.put("actorNickname", actorNickname);
        }

        if (session.getCurrentClue() != null) {
            payload.put("clue", session.getCurrentClue());
        }
        if (session.getMaskedAnswer() != null) {
            payload.put("maskedAnswer", session.getMaskedAnswer());
        }
        if (session.getUsedLetters() != null) {
            payload.put("usedLetters", session.getUsedLetters());
        }
        if (session.getCurrentSpinScore() != null) {
            payload.put("spinScore", session.getCurrentSpinScore());
        }

        messagingTemplate.convertAndSend(
            "/topic/rooms/" + session.getRoom().getCode(),
            new GameOutboundMessage(
                GameEventType.GAME_UPDATE,
                session.getRoom().getCode(),
                "system",
                payload,
                now
            )
        );
    }

    private void sendRoundEnd(GameSession session, Player winner, String reason, Instant now) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("reason", reason);
        payload.put("answer", session.getCurrentAnswer());
        payload.put("currentRound", session.getCurrentRound());
        payload.put("totalRounds", session.getTotalRounds());
        if (winner != null) {
            payload.put("winnerId", winner.getId());
            payload.put("winnerNickname", winner.getNickname());
        }

        messagingTemplate.convertAndSend(
            "/topic/rooms/" + session.getRoom().getCode(),
            new GameOutboundMessage(
                GameEventType.ROUND_END,
                session.getRoom().getCode(),
                "system",
                payload,
                now
            )
        );
    }

    @Transactional
    public void pauseGame(String roomCodeRaw) {
        String roomCode = roomCodeRaw.toUpperCase(Locale.ROOT);
        GameSession session = getManagedSession(roomCode);
        if (session.getStatus() == GameSessionStatus.PAUSED) {
            return;
        }
        Instant now = Instant.now();
        session.setStatus(GameSessionStatus.PAUSED);
        session.setLastTurnAt(now);
        sendAdminEvent(GameEventType.ADMIN_PAUSE, roomCode, Map.of("reason", "ADMIN_PAUSE"), now);
    }

    @Transactional
    public void resumeGame(String roomCodeRaw) {
        String roomCode = roomCodeRaw.toUpperCase(Locale.ROOT);
        GameSession session = getManagedSession(roomCode);
        if (session.getStatus() != GameSessionStatus.PAUSED) {
            throw new ApiException(HttpStatus.CONFLICT, "Game is not paused");
        }

        Instant now = Instant.now();
        session.setStatus(GameSessionStatus.IN_PROGRESS);
        List<Player> players = playerRepository.findByRoomCodeOrderByJoinedAtAsc(roomCode);
        if (session.getCurrentTurnPlayerId() == null && !players.isEmpty()) {
            session.setCurrentTurnPlayerId(players.get(0).getId());
        }
        session.setLastTurnAt(now);

        if (session.getCurrentTurnPlayerId() != null) {
            sendTurnChange(session, session.getCurrentTurnPlayerId(), "RESUME", now);
        }
        sendAdminEvent(GameEventType.ADMIN_RESUME, roomCode, Map.of("reason", "ADMIN_RESUME"), now);
        sendGameUpdate(session, "RESUME", now);
    }

    @Transactional
    public void adminEndGame(String roomCodeRaw, String reason) {
        String roomCode = roomCodeRaw.toUpperCase(Locale.ROOT);
        GameSession session = getManagedSession(roomCode);
        List<Player> players = playerRepository.findByRoomCodeOrderByJoinedAtAsc(roomCode);
        Player winner = selectTopScorer(players);
        Instant now = Instant.now();
        endGame(session, now, winner, reason);
        sendAdminEvent(GameEventType.ADMIN_END, roomCode, Map.of("reason", reason), now);
    }

    @Transactional
    public void adminSkipQuestion(String roomCodeRaw) {
        String roomCode = roomCodeRaw.toUpperCase(Locale.ROOT);
        GameSession session = getManagedSession(roomCode);
        List<Player> players = playerRepository.findByRoomCodeOrderByJoinedAtAsc(roomCode);
        Instant now = Instant.now();

        sendRoundEnd(session, null, "ADMIN_SKIP_QUESTION", now);
        sendAdminEvent(GameEventType.ADMIN_SKIP_QUESTION, roomCode, Map.of("reason", "ADMIN_SKIP_QUESTION"), now);

        if (session.getCurrentRound() >= session.getTotalRounds()) {
            Player winner = selectTopScorer(players);
            endGame(session, now, winner, "ADMIN_SKIP_QUESTION");
            return;
        }

        int nextRound = session.getCurrentRound() + 1;
        initializeRound(session, nextRound);
        UUID nextPlayerId = resolveNextTurnPlayerId(players, session.getCurrentTurnPlayerId());
        session.setCurrentTurnPlayerId(nextPlayerId);
        session.setLastTurnAt(now);

        if (nextPlayerId != null) {
            sendTurnChange(session, nextPlayerId, "ADMIN_SKIP_QUESTION", now);
        }
        sendGameUpdate(session, "ROUND_STARTED", now);
    }

    @Transactional
    public void adminSkipTurn(String roomCodeRaw, UUID playerId) {
        String roomCode = roomCodeRaw.toUpperCase(Locale.ROOT);
        GameSession session = getManagedSession(roomCode);
        List<Player> players = playerRepository.findByRoomCodeOrderByJoinedAtAsc(roomCode);
        if (players.isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT, "No players in room");
        }

        UUID targetId = playerId != null ? playerId : session.getCurrentTurnPlayerId();
        if (targetId == null) {
            throw new ApiException(HttpStatus.CONFLICT, "No active turn to skip");
        }
        if (!targetId.equals(session.getCurrentTurnPlayerId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Can only skip the current turn");
        }

        Player target = players.stream()
            .filter(player -> player.getId().equals(targetId))
            .findFirst()
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Target player not found"));

        Player next = nextPlayer(players, targetId);
        Instant now = Instant.now();
        session.setCurrentTurnPlayerId(next.getId());
        session.setCurrentSpinScore(null);
        session.setSpinRequired(true);
        session.setLastTurnAt(now);

        sendTurnChange(session, next.getId(), "ADMIN_SKIP_TURN", now);
        sendAdminEvent(GameEventType.ADMIN_SKIP_TURN, roomCode, Map.of(
            "targetPlayerId", targetId,
            "targetNickname", target.getNickname()
        ), now);
        sendGameUpdate(session, "ADMIN_SKIP_TURN", now, target.getNickname());
    }

    @Transactional
    public void adminResetBell(String roomCodeRaw, UUID playerId) {
        String roomCode = roomCodeRaw.toUpperCase(Locale.ROOT);
        GameSession session = getManagedSession(roomCode);
        Set<UUID> usedPlayers = readBellUsedPlayerIds(session.getBellUsedPlayerIds());
        usedPlayers.remove(playerId);
        session.setBellUsedPlayerIds(serializeBellUsedPlayerIds(usedPlayers));
        if (playerId != null && playerId.equals(session.getActiveBellPlayerId())) {
            session.setActiveBellPlayerId(null);
        }

        Instant now = Instant.now();
        session.setLastTurnAt(now);
        sendAdminEvent(GameEventType.ADMIN_RESET_BELL, roomCode, Map.of("targetPlayerId", playerId), now);
        sendGameUpdate(session, "ADMIN_RESET_BELL", now);
    }

    @Transactional
    public void adminKickPlayer(String roomCodeRaw, UUID playerId) {
        String roomCode = roomCodeRaw.toUpperCase(Locale.ROOT);
        List<Player> playersBefore = playerRepository.findByRoomCodeOrderByJoinedAtAsc(roomCode);
        Player target = playersBefore.stream()
            .filter(player -> player.getId().equals(playerId))
            .findFirst()
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Player not found in room"));

        Player nextAfterTarget = playersBefore.size() > 1 ? nextPlayer(playersBefore, target.getId()) : null;
        Room room = target.getRoom();
        playerRepository.delete(target);

        Instant now = Instant.now();
        sendAdminEvent(GameEventType.ADMIN_KICK_PLAYER, roomCode, Map.of(
            "targetPlayerId", playerId,
            "targetNickname", target.getNickname()
        ), now);

        if (room.getStatus() != RoomStatus.PLAYING) {
            return;
        }

        GameSession session = getManagedSession(roomCode);
        List<Player> playersAfter = playerRepository.findByRoomCodeOrderByJoinedAtAsc(roomCode);
        Set<UUID> usedPlayers = readBellUsedPlayerIds(session.getBellUsedPlayerIds());
        usedPlayers.remove(playerId);
        session.setBellUsedPlayerIds(serializeBellUsedPlayerIds(usedPlayers));
        UUID activeBellPlayerId = session.getActiveBellPlayerId();
        if (activeBellPlayerId != null) {
            boolean activeBellStillPresent = playersAfter.stream().anyMatch(player -> player.getId().equals(activeBellPlayerId));
            if (!activeBellStillPresent || playerId.equals(activeBellPlayerId)) {
                session.setActiveBellPlayerId(null);
            }
        }

        if (playersAfter.size() < 2) {
            Player winner = selectTopScorer(playersAfter);
            endGame(session, now, winner, "ADMIN_END_NOT_ENOUGH_PLAYERS");
            return;
        }

        if (playerId.equals(session.getCurrentTurnPlayerId())) {
            UUID nextPlayerId = nextAfterTarget != null ? nextAfterTarget.getId() : playersAfter.get(0).getId();
            session.setCurrentTurnPlayerId(nextPlayerId);
            session.setCurrentSpinScore(null);
            session.setSpinRequired(true);
            session.setLastTurnAt(now);
            sendTurnChange(session, nextPlayerId, "ADMIN_KICK_PLAYER", now);
        }
    }
}
