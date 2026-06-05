package com.shadowling.service;

import com.shadowling.dto.word.*;
import com.shadowling.model.UserWord;
import com.shadowling.model.Word;
import com.shadowling.model.WordReviewSession;
import com.shadowling.model.enums.DeckType;
import com.shadowling.repository.UserWordRepository;
import com.shadowling.repository.WordRepository;
import com.shadowling.repository.WordReviewSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WordService {

    private static final int LEECH_THRESHOLD = 4;
    private static final int MAX_SESSION_CARDS = 50;

    private final WordRepository wordRepository;
    private final UserWordRepository userWordRepository;
    private final WordReviewSessionRepository sessionRepository;
    private final Sm2Service sm2Service;
    private final GamificationService gamificationService;

    public List<WordDto> getForLesson(UUID lessonId) {
        return wordRepository.findByLessonId(lessonId)
                .stream()
                .map(this::toWordDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public WordDto save(UUID userId, SaveWordRequest request) {
        Word word = wordRepository.findById(request.getWordId())
                .orElseThrow(() -> new IllegalArgumentException("Word not found"));

        UserWord userWord = userWordRepository.findByUserIdAndWordId(userId, word.getId())
                .orElse(UserWord.builder()
                        .userId(userId)
                        .wordId(word.getId())
                        .build());

        userWord = userWordRepository.save(userWord);
        return toUserWordDto(userWord, word);
    }

    public List<WordDto> getDueToday(UUID userId) {
        return userWordRepository.findByUserIdAndNextReviewAtBefore(userId, LocalDateTime.now())
                .stream()
                .map(uw -> toUserWordDto(uw, uw.getWord()))
                .collect(Collectors.toList());
    }

    @Transactional
    public StartSessionResponse startSession(UUID userId, StartSessionRequest request) {
        WordReviewSession session = WordReviewSession.builder()
                .userId(userId)
                .mode(request.getMode().name())
                .build();
        session = sessionRepository.save(session);

        List<UserWord> userWords = fetchDeckCards(userId, request);

        // Filter suspended, sort: new cards first then by nextReviewAt, limit
        List<UserWord> ordered = userWords.stream()
                .filter(uw -> !uw.isSuspended())
                .sorted(Comparator.comparingInt(UserWord::getRepetitions)
                        .thenComparing(UserWord::getNextReviewAt))
                .limit(MAX_SESSION_CARDS)
                .toList();

        List<WordDto> cards = ordered.stream()
                .map(uw -> toUserWordDto(uw, uw.getWord()))
                .toList();

        session.setTotalCards(cards.size());
        sessionRepository.save(session);

        return StartSessionResponse.builder()
                .sessionId(session.getId())
                .cards(cards)
                .totalCards(cards.size())
                .build();
    }

    @Transactional
    public WordDto review(UUID userId, UUID wordId, ReviewWordRequest request) {
        UserWord userWord = userWordRepository.findByUserIdAndWordId(userId, wordId)
                .orElseThrow(() -> new IllegalArgumentException("Word not in user's list"));

        boolean correct = request.getQuality().value >= 3;

        if (!request.isCramMode()) {
            if (!correct) {
                userWord.setAgainCount(userWord.getAgainCount() + 1);
                if (userWord.getAgainCount() >= LEECH_THRESHOLD) {
                    userWord.setLeech(true);
                }
            }

            Sm2Service.Sm2Result result = sm2Service.calculate(
                    userWord.getEaseFactor(),
                    userWord.getIntervalDays(),
                    userWord.getRepetitions(),
                    request.getQuality().value
            );
            userWord.setEaseFactor(result.easeFactor());
            userWord.setIntervalDays(result.intervalDays());
            userWord.setRepetitions(result.repetitions());
            userWord.setNextReviewAt(LocalDateTime.now().plusDays(result.intervalDays()));
        }

        userWord.setLastReviewedAt(LocalDateTime.now());
        userWord = userWordRepository.save(userWord);

        if (request.getSessionId() != null) {
            sessionRepository.findById(request.getSessionId()).ifPresent(session -> {
                if (correct) {
                    session.setCorrectCount(session.getCorrectCount() + 1);
                } else {
                    session.setAgainCount(session.getAgainCount() + 1);
                }
                sessionRepository.save(session);
            });
        }

        if (!request.isCramMode()) {
            gamificationService.awardXpAndCheck(userId, 5, "word_review");
        }

        return toUserWordDto(userWord, userWord.getWord());
    }

    @Transactional
    public SessionResultDto endSession(UUID userId, UUID sessionId) {
        WordReviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (!session.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Session not found");
        }

        session.setEndedAt(LocalDateTime.now());
        int xp = session.getCorrectCount() * 5;
        session.setXpEarned(xp);
        session = sessionRepository.save(session);

        long duration = Duration.between(session.getStartedAt(), session.getEndedAt()).getSeconds();

        return SessionResultDto.builder()
                .sessionId(session.getId())
                .totalCards(session.getTotalCards())
                .correctCount(session.getCorrectCount())
                .againCount(session.getAgainCount())
                .xpEarned(xp)
                .durationSeconds(duration)
                .build();
    }

    public List<WordDto> getWeakWords(UUID userId, int limit) {
        return userWordRepository.findWeakestWords(userId, PageRequest.of(0, limit))
                .stream()
                .map(uw -> toUserWordDto(uw, uw.getWord()))
                .collect(Collectors.toList());
    }

    public Page<WordDto> list(UUID userId, int page, int size) {
        return userWordRepository.findByUserId(userId, PageRequest.of(page, size))
                .map(uw -> toUserWordDto(uw, uw.getWord()));
    }

    @Transactional
    public int autoSaveForLesson(UUID userId, UUID lessonId) {
        List<Word> lessonWords = wordRepository.findByLessonId(lessonId);
        int saved = 0;
        for (Word word : lessonWords) {
            boolean exists = userWordRepository.findByUserIdAndWordId(userId, word.getId()).isPresent();
            if (!exists) {
                userWordRepository.save(UserWord.builder()
                        .userId(userId)
                        .wordId(word.getId())
                        .build());
                saved++;
            }
        }
        return saved;
    }

    private List<UserWord> fetchDeckCards(UUID userId, StartSessionRequest request) {
        return switch (request.getDeckType()) {
            case TODAY -> userWordRepository.findByUserIdAndNextReviewAtBefore(userId, LocalDateTime.now());
            case ALL -> userWordRepository.findAllByUserId(userId);
            case WEAK -> userWordRepository.findWeakestWords(userId, PageRequest.of(0, MAX_SESSION_CARDS));
            case LESSON -> {
                if (request.getLessonId() == null) yield List.of();
                List<UUID> wordIds = wordRepository.findByLessonId(request.getLessonId())
                        .stream().map(Word::getId).toList();
                yield userWordRepository.findByUserIdAndWordIdIn(userId, wordIds);
            }
        };
    }

    private String determineCardType(int repetitions) {
        if (repetitions == 0) return "MULTIPLE_CHOICE";
        if (repetitions <= 2) return "FILL_IN_BLANK";
        return "CLASSIC_FLIP";
    }

    private WordDto toWordDto(Word w) {
        return WordDto.builder()
                .id(w.getId())
                .text(w.getText())
                .definition(w.getDefinition())
                .pronunciation(w.getPronunciation())
                .audioUrl(w.getAudioUrl())
                .exampleSentence(w.getExampleSentence())
                .build();
    }

    private WordDto toUserWordDto(UserWord uw, Word w) {
        WordDto dto = w != null ? toWordDto(w) : WordDto.builder().id(uw.getWordId()).build();
        dto.setEaseFactor(uw.getEaseFactor());
        dto.setIntervalDays(uw.getIntervalDays());
        dto.setRepetitions(uw.getRepetitions());
        dto.setNextReviewAt(uw.getNextReviewAt());
        dto.setLastReviewedAt(uw.getLastReviewedAt());
        dto.setLeech(uw.isLeech());
        dto.setSuspended(uw.isSuspended());
        dto.setAgainCount(uw.getAgainCount());
        dto.setCardType(determineCardType(uw.getRepetitions()));
        return dto;
    }
}
