package com.antidev.minigame_be.room;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.context.WebApplicationContext;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

@SpringBootTest
@ActiveProfiles("test")
class RoomControllerIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @BeforeEach
    void setup() {
        mockMvc = webAppContextSetup(context).build();
    }

    @Test
    void createJoinStartFlowShouldWork() throws Exception {
        MvcResult created = mockMvc.perform(post("/api/v1/rooms")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "hostNickname": "host_1"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").isString())
            .andExpect(jsonPath("$.status").value("WAITING"))
            .andExpect(jsonPath("$.players.length()").value(1))
            .andReturn();

        String roomCode = extractJsonField(created.getResponse().getContentAsString(), "code");

        mockMvc.perform(post("/api/v1/rooms/{roomCode}/join", roomCode)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "nickname": "guest_1"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.players.length()").value(2));

        mockMvc.perform(post("/api/v1/rooms/{roomCode}/start", roomCode))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PLAYING"));

        mockMvc.perform(get("/api/v1/rooms/{roomCode}", roomCode))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(roomCode))
            .andExpect(jsonPath("$.players.length()").value(2));
    }

    private String extractJsonField(String json, String fieldName) {
        Pattern pattern = Pattern.compile("\\\"" + fieldName + "\\\":\\\"([^\\\"]+)\\\"");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            return matcher.group(1);
        }
        throw new IllegalStateException("Field not found in JSON: " + fieldName);
    }
}




