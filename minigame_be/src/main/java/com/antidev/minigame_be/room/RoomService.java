package com.antidev.minigame_be.room;

import com.antidev.minigame_be.common.ApiException;
import com.antidev.minigame_be.domain.GameSession;
import com.antidev.minigame_be.domain.GameSessionStatus;
import com.antidev.minigame_be.domain.Player;
import com.antidev.minigame_be.domain.Question;
import com.antidev.minigame_be.domain.Room;
import com.antidev.minigame_be.domain.RoomStatus;
import com.antidev.minigame_be.game.GameEngineService;
import com.antidev.minigame_be.repository.GameSessionRepository;
import com.antidev.minigame_be.repository.PlayerRepository;
import com.antidev.minigame_be.repository.QuestionRepository;
import com.antidev.minigame_be.repository.RoomRepository;
import com.antidev.minigame_be.room.dto.AdminCreateRoomRequest;
import com.antidev.minigame_be.room.dto.AdminQuestionRequest;
import com.antidev.minigame_be.room.dto.PlayerView;
import com.antidev.minigame_be.room.dto.RoomView;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final PlayerRepository playerRepository;
    private final GameSessionRepository gameSessionRepository;
    private final QuestionRepository questionRepository;
    private final RoomMapper roomMapper;
    private final GameEngineService gameEngineService;

    @Transactional
    public RoomView createRoom(String hostNickname) {
        Room room = createRoomInternal(hostNickname, null, true);
        return getRoom(room.getCode());
    }

    @Transactional
    public RoomView createRoomWithQuestions(AdminCreateRoomRequest request) {
        String hostNickname = request != null ? request.hostNickname() : null;
        String roomCode = request != null ? request.roomCode() : null;
        List<AdminQuestionRequest> questions = request != null && request.questions() != null
            ? request.questions()
            : Collections.emptyList();

        Room room = createRoomInternal(hostNickname, roomCode, false);

        for (AdminQuestionRequest item : questions) {
            if (item == null) {
                continue;
            }

            Question question = new Question();
            question.setCategory(normalizeText(item.category(), "general", 100));
            question.setClue(normalizeText(item.clue(), "...", 300));
            question.setAnswer(normalizeText(item.answer(), "?", 200).toUpperCase(Locale.ROOT));
            question.setRoomCode(room.getCode());
            question.setActive(true);
            questionRepository.save(question);
        }

        return getRoom(room.getCode());
    }

    @Transactional
    public RoomView joinRoom(String roomCode, String nickname) {
        Room room = roomRepository.findByCode(roomCode.toUpperCase(Locale.ROOT))
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Room not found"));

        if (room.getStatus() != RoomStatus.WAITING) {
            throw new ApiException(HttpStatus.CONFLICT, "Room already started");
        }

        playerRepository.findByRoomCodeAndNicknameIgnoreCase(room.getCode(), nickname)
            .ifPresent(existing -> {
                throw new ApiException(HttpStatus.CONFLICT, "Nickname already exists in room");
            });

        Player player = new Player();
        player.setRoom(room);
        player.setNickname(nickname.trim());
        player.setHost(false);
        player.setConnected(true);
        player.setJoinedAt(Instant.now());
        playerRepository.save(player);

        return getRoom(roomCode);
    }

    @Transactional(readOnly = true)
    public RoomView getRoom(String roomCode) {
        Room room = roomRepository.findByCode(roomCode.toUpperCase(Locale.ROOT))
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Room not found"));

        List<PlayerView> players = playerRepository.findByRoomCodeOrderByJoinedAtAsc(room.getCode()).stream()
            .map(roomMapper::toPlayerView)
            .collect(Collectors.toList());

        GameSession latest = gameSessionRepository.findFirstByRoomCodeOrderByStartedAtDesc(room.getCode()).orElse(null);

        return new RoomView(
            room.getId(),
            room.getCode(),
            room.getHostNickname(),
            room.getStatus(),
            players,
            latest != null ? latest.getCurrentTurnPlayerId() : null,
            latest != null ? latest.getCurrentRound() : null,
            latest != null ? latest.getTotalRounds() : null,
            latest != null ? latest.getCurrentClue() : null,
            latest != null ? latest.getMaskedAnswer() : null,
            latest != null ? latest.getUsedLetters() : null,
            latest != null ? latest.getLastTurnAt() : null
        );
    }

    @Transactional
    public RoomView startGame(String roomCode) {
        Room room = roomRepository.findByCode(roomCode.toUpperCase(Locale.ROOT))
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Room not found"));

        if (room.getStatus() != RoomStatus.WAITING) {
            throw new ApiException(HttpStatus.CONFLICT, "Game already started");
        }

        List<Player> players = playerRepository.findByRoomCodeOrderByJoinedAtAsc(room.getCode());
        if (players.size() < 2) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "At least 2 players are required");
        }

        room.setStatus(RoomStatus.PLAYING);
        roomRepository.save(room);

        Player randomStarter = players.get(ThreadLocalRandom.current().nextInt(players.size()));

        GameSession session = new GameSession();
        session.setRoom(room);
        session.setStatus(GameSessionStatus.IN_PROGRESS);
        session.setStartedAt(Instant.now());
        session.setLastTurnAt(Instant.now());
        session.setCurrentTurnPlayerId(randomStarter.getId());

        int roomQuestionCount = questionRepository.findByActiveTrueAndRoomCode(room.getCode()).size();
        if (roomQuestionCount > 0) {
            session.setTotalRounds(roomQuestionCount);
        }

        gameEngineService.initializeFirstRound(session);
        gameSessionRepository.save(session);

        return getRoom(roomCode);
    }

    private String generateRoomCode() {
        for (int i = 0; i < 10; i++) {
            String candidate = randomCode();
            if (roomRepository.findByCode(candidate).isEmpty()) {
                return candidate;
            }
        }
        throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Cannot allocate room code");
    }

    private Room createRoomInternal(String hostNickname, String preferredCodeRaw, boolean createHostPlayer) {
        String normalizedHostNickname = normalizeText(hostNickname, "admin", 30);

        Room room = new Room();
        room.setCode(resolveRoomCode(preferredCodeRaw));
        room.setHostNickname(normalizedHostNickname);
        room.setStatus(RoomStatus.WAITING);
        room = roomRepository.save(room);

        if (createHostPlayer) {
            Player host = new Player();
            host.setRoom(room);
            host.setNickname(normalizedHostNickname);
            host.setHost(true);
            host.setConnected(true);
            host.setJoinedAt(Instant.now());
            playerRepository.save(host);
        }

        return room;
    }

    private String resolveRoomCode(String preferredCodeRaw) {
        if (preferredCodeRaw == null || preferredCodeRaw.isBlank()) {
            return generateRoomCode();
        }

        String preferredCode = normalizeText(preferredCodeRaw, "", 12).toUpperCase(Locale.ROOT);
        if (preferredCode.isBlank()) {
            return generateRoomCode();
        }
        if (roomRepository.findByCode(preferredCode).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Room code already exists");
        }
        return preferredCode;
    }

    private String normalizeText(String value, String fallback, int maxLength) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isBlank()) {
            normalized = fallback;
        }
        if (normalized.length() > maxLength) {
            normalized = normalized.substring(0, maxLength);
        }
        return normalized;
    }

    private String randomCode() {
        String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder builder = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            builder.append(alphabet.charAt(ThreadLocalRandom.current().nextInt(alphabet.length())));
        }
        return builder.toString();
    }
}



