package com.antidev.minigame_be.room;

import com.antidev.minigame_be.room.dto.CreateRoomRequest;
import com.antidev.minigame_be.room.dto.JoinRoomRequest;
import com.antidev.minigame_be.room.dto.RoomView;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    public RoomView createRoom(@Valid @RequestBody CreateRoomRequest request) {
        return roomService.createRoom(request.hostNickname());
    }

    @PostMapping("/{roomCode}/join")
    public RoomView joinRoom(@PathVariable String roomCode, @Valid @RequestBody JoinRoomRequest request) {
        return roomService.joinRoom(roomCode, request.nickname());
    }

    @GetMapping("/{roomCode}")
    public RoomView getRoom(@PathVariable String roomCode) {
        return roomService.getRoom(roomCode);
    }

    @PostMapping("/{roomCode}/start")
    public RoomView startGame(@PathVariable String roomCode) {
        return roomService.startGame(roomCode);
    }
}

