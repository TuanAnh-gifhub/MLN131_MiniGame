package com.antidev.minigame_be.room;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;

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
            .andExpect(jsonPath("$.players.length()").value(1));
    }
}

