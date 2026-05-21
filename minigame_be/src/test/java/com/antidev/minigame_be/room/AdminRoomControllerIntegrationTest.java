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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

@SpringBootTest
@ActiveProfiles("test")
class AdminRoomControllerIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @BeforeEach
    void setup() {
        mockMvc = webAppContextSetup(context).build();
    }

    @Test
    void createAdminRoomWithQuestionsShouldWork() throws Exception {
        mockMvc.perform(post("/api/v1/admin/rooms")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "hostNickname": "admin_1",
                      "roomCode": "ROOM99",
                      "questions": [
                        {
                          "category": "animal",
                          "clue": "Con vat keu meo meo",
                          "answer": "CON MEO"
                        },
                        {
                          "category": "place",
                          "clue": "Thu do cua Viet Nam",
                          "answer": "HA NOI"
                        }
                      ]
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value("ROOM99"))
            .andExpect(jsonPath("$.status").value("WAITING"))
            .andExpect(jsonPath("$.players.length()").value(0));
    }

    @Test
    void adminRoomShouldStartAfterTwoPlayersJoin() throws Exception {
        MvcResult created = mockMvc.perform(post("/api/v1/admin/rooms")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "hostNickname": "admin_2",
                      "roomCode": "OBS100",
                      "questions": [
                        {
                          "category": "general",
                          "clue": "Thu do cua Nhat Ban",
                          "answer": "TOKYO"
                        }
                      ]
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.players.length()").value(0))
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
            .andExpect(jsonPath("$.players.length()").value(1));

        mockMvc.perform(post("/api/v1/rooms/{roomCode}/join", roomCode)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "nickname": "guest_2"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.players.length()").value(2));

        mockMvc.perform(post("/api/v1/rooms/{roomCode}/start", roomCode))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PLAYING"));
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

