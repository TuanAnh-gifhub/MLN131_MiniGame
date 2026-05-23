package com.antidev.minigame_be.questionset;

import com.antidev.minigame_be.common.ApiException;
import com.antidev.minigame_be.domain.QuestionSet;
import com.antidev.minigame_be.domain.QuestionSetItem;
import com.antidev.minigame_be.questionset.dto.QuestionSetDetailView;
import com.antidev.minigame_be.questionset.dto.QuestionSetRequest;
import com.antidev.minigame_be.questionset.dto.QuestionSetSummaryView;
import com.antidev.minigame_be.repository.QuestionSetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class QuestionSetService {

    private final QuestionSetRepository questionSetRepository;

    @Transactional(readOnly = true)
    public List<QuestionSetSummaryView> listAll() {
        return questionSetRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(qs -> new QuestionSetSummaryView(
                qs.getId(),
                qs.getName(),
                qs.getItems().size(),
                qs.getCreatedAt()
            ))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public QuestionSetDetailView getById(UUID id) {
        QuestionSet qs = findOrThrow(id);
        return toDetailView(qs);
    }

    @Transactional
    public QuestionSetDetailView create(QuestionSetRequest request) {
        QuestionSet qs = new QuestionSet();
        qs.setName(request.name().trim());

        List<QuestionSetItem> items = IntStream.range(0, request.questions().size())
            .mapToObj(i -> {
                var q = request.questions().get(i);
                QuestionSetItem item = new QuestionSetItem();
                item.setQuestionSet(qs);
                item.setCategory(q.category().trim());
                item.setClue(q.clue().trim());
                item.setAnswer(q.answer().trim().toUpperCase(Locale.ROOT));
                item.setOrderIndex(i);
                return item;
            })
            .collect(Collectors.toList());

        qs.setItems(items);
        questionSetRepository.save(qs);
        return toDetailView(qs);
    }

    @Transactional
    public void delete(UUID id) {
        QuestionSet qs = findOrThrow(id);
        questionSetRepository.delete(qs);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private QuestionSet findOrThrow(UUID id) {
        return questionSetRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Question set not found"));
    }

    private QuestionSetDetailView toDetailView(QuestionSet qs) {
        List<QuestionSetDetailView.QuestionItemView> questions = qs.getItems().stream()
            .map(item -> new QuestionSetDetailView.QuestionItemView(
                item.getCategory(),
                item.getClue(),
                item.getAnswer()
            ))
            .collect(Collectors.toList());

        return new QuestionSetDetailView(
            qs.getId(),
            qs.getName(),
            qs.getCreatedAt(),
            questions
        );
    }
}
