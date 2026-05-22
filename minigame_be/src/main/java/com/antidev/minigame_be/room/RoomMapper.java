package com.antidev.minigame_be.room;

import com.antidev.minigame_be.domain.Player;
import com.antidev.minigame_be.room.dto.PlayerView;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface RoomMapper {
    PlayerView toPlayerView(Player player);
}


