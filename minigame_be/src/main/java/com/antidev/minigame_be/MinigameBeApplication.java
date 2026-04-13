package com.antidev.minigame_be;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MinigameBeApplication {

	public static void main(String[] args) {
		SpringApplication.run(MinigameBeApplication.class, args);
	}

}
