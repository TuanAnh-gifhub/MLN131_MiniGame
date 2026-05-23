package com.antidev.minigame_be.questionset;

import com.antidev.minigame_be.questionset.dto.QuestionSetDetailView;
import com.antidev.minigame_be.questionset.dto.QuestionSetRequest;
import com.antidev.minigame_be.questionset.dto.QuestionSetSummaryView;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/question-sets")
@RequiredArgsConstructor
public class QuestionSetController {

    private final QuestionSetService questionSetService;

    /** GET /api/v1/admin/question-sets — list all saved sets (summary only). */
    @GetMapping
    public List<QuestionSetSummaryView> listAll() {
        return questionSetService.listAll();
    }

    /** GET /api/v1/admin/question-sets/{id} — full detail with questions. */
    @GetMapping("/{id}")
    public QuestionSetDetailView getOne(@PathVariable UUID id) {
        return questionSetService.getById(id);
    }

    /** POST /api/v1/admin/question-sets — save a new question set. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public QuestionSetDetailView create(@Valid @RequestBody QuestionSetRequest request) {
        return questionSetService.create(request);
    }

    /** DELETE /api/v1/admin/question-sets/{id} — remove a saved set. */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        questionSetService.delete(id);
    }
}
