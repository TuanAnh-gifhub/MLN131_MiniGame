package com.antidev.minigame_be.websocket;

import com.antidev.minigame_be.game.GameEngineService;
import com.antidev.minigame_be.websocket.dto.GameInboundMessage;
import com.antidev.minigame_be.websocket.dto.GameOutboundMessage;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.Instant;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class GameSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final GameEngineService gameEngineService;

    @MessageMapping("/rooms/{roomCode}/event")
    public void handleEvent(@DestinationVariable String roomCode, @Valid GameInboundMessage message) {
        if (message.eventType() == GameEventType.GUESS_LETTER
            || message.eventType() == GameEventType.GUESS_ANSWER
            || message.eventType() == GameEventType.RING_BELL) {
            gameEngineService.handleClientEvent(roomCode, message);
            return;
        }

        GameOutboundMessage outbound = new GameOutboundMessage(
            message.eventType(),
            roomCode,
            message.actor(),
            Map.of("content", message.payload()),
            Instant.now()
        );

        messagingTemplate.convertAndSend("/topic/rooms/" + roomCode, outbound);
    }
}

