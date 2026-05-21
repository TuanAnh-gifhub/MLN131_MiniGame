package com.antidev.minigame_be.room;

import com.antidev.minigame_be.room.dto.AdminCreateRoomRequest;
import com.antidev.minigame_be.room.dto.RoomView;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/rooms")
@RequiredArgsConstructor
public class AdminRoomController {

    private final RoomService roomService;

    @PostMapping
    public RoomView createRoomWithQuestions(@Valid @RequestBody AdminCreateRoomRequest request) {
        return roomService.createRoomWithQuestions(request);
    }
}

