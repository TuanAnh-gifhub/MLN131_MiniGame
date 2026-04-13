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

    private final GameSessionRepository gameSessionRepository;
    private final PlayerRepository playerRepository;
    private final RoomRepository roomRepository;
    private final QuestionRepository questionRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void handleClientEvent(String roomCodeRaw, GameInboundMessage message) {
        String roomCode = roomCodeRaw.toUpperCase(Locale.ROOT);
        GameSession session = getActiveSession(roomCode);
        List<Player> players = playerRepository.findByRoomCodeOrderByJoinedAtAsc(roomCode);
        Player actor = findActor(players, message.actor());

        if (!actor.getId().equals(session.getCurrentTurnPlayerId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Not your turn");
        }

        switch (message.eventType()) {
            case GUESS_LETTER -> handleGuessLetterEvent(session, players, actor, message.payload());
            case GUESS_ANSWER -> handleGuessAnswer(session, players, actor, message.payload());
            default -> throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported event for game engine");
        }
    }

    @Transactional
    public void rotateTurnByTimeout(GameSession session, List<Player> players, Instant now) {
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
            sendGameUpdate(session, "WRONG_LETTER", now);
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

        sendGameUpdate(session, "CORRECT_LETTER", now);
    }

    private void handleGuessAnswer(GameSession session, List<Player> players, Player actor, String payload) {
        String guess = payload == null ? "" : payload.trim().toUpperCase(Locale.ROOT);
        if (guess.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Answer guess cannot be blank");
        }

        Instant now = Instant.now();
        String expected = normalizeAnswer(session.getCurrentAnswer());
        if (!normalizeAnswer(guess).equals(expected)) {
            advanceTurn(session, players, now, "WRONG_ANSWER");
            sendGameUpdate(session, "WRONG_ANSWER", now);
            return;
        }

        finishRound(session, actor, now, "BINGO");
    }

    private void finishRound(GameSession session, Player winner, Instant now, String reason) {
        winner.setScore(winner.getScore() + ROUND_WIN_BONUS);
        playerRepository.save(winner);

        session.setMaskedAnswer(session.getCurrentAnswer());
        session.setCurrentSpinScore(null);
        session.setSpinRequired(true);
        session.setLastTurnAt(now);

        sendRoundEnd(session, winner, reason, now);

        if (session.getCurrentRound() >= session.getTotalRounds()) {
            endGame(session, now, winner);
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

        if (roll == -1) {
            actor.setScore(0);
            playerRepository.save(actor);
            advanceTurn(session, players, now, "BANKRUPT");
            sendGameUpdate(session, "BANKRUPT", now);
            return;
        }

        if (roll == 0) {
            advanceTurn(session, players, now, "LOSE_TURN");
            sendGameUpdate(session, "LOSE_TURN", now);
            return;
        }

        session.setCurrentSpinScore(roll);
        session.setSpinRequired(false);
        session.setLastTurnAt(now);
        sendGameUpdate(session, "SPIN_OK", now);
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
    }

    private void endGame(GameSession session, Instant now, Player winner) {
        session.setStatus(GameSessionStatus.ENDED);
        session.setEndedAt(now);

        Room room = session.getRoom();
        room.setStatus(RoomStatus.FINISHED);
        roomRepository.save(room);

        messagingTemplate.convertAndSend(
            "/topic/rooms/" + room.getCode(),
            new GameOutboundMessage(
                GameEventType.GAME_END,
                room.getCode(),
                "system",
                Map.of(
                    "reason", "FINAL_ROUND_COMPLETED",
                    "winnerId", winner.getId(),
                    "winnerNickname", winner.getNickname(),
                    "currentRound", session.getCurrentRound(),
                    "totalRounds", session.getTotalRounds()
                ),
                now
            )
        );
    }

    private GameSession getActiveSession(String roomCode) {
        return gameSessionRepository.findFirstByRoomCodeAndStatusOrderByStartedAtDesc(roomCode, GameSessionStatus.IN_PROGRESS)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No active game session in room"));
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
                    "timeoutSeconds", 10,
                    "reason", reason,
                    "currentRound", session.getCurrentRound(),
                    "totalRounds", session.getTotalRounds()
                ),
                now
            )
        );
    }

    private void sendGameUpdate(GameSession session, String reason, Instant now) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("reason", reason);
        payload.put("alphabet", ALPHABET);
        payload.put("currentRound", session.getCurrentRound());
        payload.put("totalRounds", session.getTotalRounds());
        payload.put("currentTurnPlayerId", session.getCurrentTurnPlayerId());
        payload.put("spinRequired", session.isSpinRequired());

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
        messagingTemplate.convertAndSend(
            "/topic/rooms/" + session.getRoom().getCode(),
            new GameOutboundMessage(
                GameEventType.ROUND_END,
                session.getRoom().getCode(),
                "system",
                Map.of(
                    "reason", reason,
                    "winnerId", winner.getId(),
                    "winnerNickname", winner.getNickname(),
                    "answer", session.getCurrentAnswer(),
                    "currentRound", session.getCurrentRound(),
                    "totalRounds", session.getTotalRounds()
                ),
                now
            )
        );
    }
}


