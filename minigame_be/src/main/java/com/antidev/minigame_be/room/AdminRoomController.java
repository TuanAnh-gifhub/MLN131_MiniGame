package com.antidev.minigame_be.room;

import com.antidev.minigame_be.room.dto.AdminCreateRoomRequest;
import com.antidev.minigame_be.room.dto.RoomView;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/rooms")
@RequiredArgsConstructor
public class AdminRoomController {

    private final RoomService roomService;

    @PostMapping
    public RoomView createRoomWithQuestions(@Valid @RequestBody AdminCreateRoomRequest request) {
        return roomService.createRoomWithQuestions(request);
    }

    @PostMapping("/{roomCode}/pause")
    public RoomView pauseGame(@PathVariable String roomCode) {
        return roomService.pauseGame(roomCode);
    }

    @PostMapping("/{roomCode}/resume")
    public RoomView resumeGame(@PathVariable String roomCode) {
        return roomService.resumeGame(roomCode);
    }

    @PostMapping("/{roomCode}/end")
    public RoomView endGame(@PathVariable String roomCode) {
        return roomService.endGameEarly(roomCode);
    }

    @PostMapping("/{roomCode}/skip-question")
    public RoomView skipQuestion(@PathVariable String roomCode) {
        return roomService.skipQuestion(roomCode);
    }

    @PostMapping("/{roomCode}/skip-turn")
    public RoomView skipTurn(@PathVariable String roomCode, @RequestParam(required = false) UUID playerId) {
        return roomService.skipTurn(roomCode, playerId);
    }

    @PostMapping("/{roomCode}/reset-bell/{playerId}")
    public RoomView resetBell(@PathVariable String roomCode, @PathVariable UUID playerId) {
        return roomService.resetBell(roomCode, playerId);
    }

    @DeleteMapping("/{roomCode}/players/{playerId}")
    public RoomView kickPlayer(@PathVariable String roomCode, @PathVariable UUID playerId) {
        return roomService.kickPlayer(roomCode, playerId);
    }
}
