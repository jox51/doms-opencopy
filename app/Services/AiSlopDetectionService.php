<?php

namespace App\Services;

use App\Models\Article;

class AiSlopDetectionService
{
    protected Article $article;

    protected string $content;

    protected string $plainText;

    protected int $wordCount;

    /**
     * @var array<string>
     */
    protected array $sentences;

    /**
     * @var array<string>
     */
    protected array $paragraphs;

    /**
     * AI-overused single words (50-700x more common in AI text).
     *
     * @var array<string>
     */
    protected const FLAGGED_WORDS = [
        'delve', 'tapestry', 'multifaceted', 'navigate', 'landscape',
        'leverage', 'crucial', 'pivotal', 'foster', 'comprehensive',
        'robust', 'streamline', 'harness', 'spearhead', 'cutting-edge',
        'paradigm', 'synergy', 'holistic', 'nuanced', 'intricate',
        'underscore', 'encompass', 'embark', 'elevate', 'resonate',
        'captivate', 'testament', 'beacon', 'cornerstone', 'linchpin',
        'reimagine', 'unwavering', 'demystify', 'juxtaposition',
        'meticulous', 'bespoke', 'myriad', 'plethora', 'paramount',
        'indispensable', 'burgeoning', 'commendable', 'noteworthy',
        'groundbreaking', 'transformative', 'unparalleled', 'unprecedented',
        'underpinning', 'intricacies', 'overarching', 'interplay',
    ];

    /**
     * AI-overused phrases.
     *
     * @var array<string>
     */
    protected const FLAGGED_PHRASES = [
        "it's worth noting",
        'in the realm of',
        'at the end of the day',
        "in today's world",
        "in today's fast-paced",
        "in today's digital",
        "let's dive in",
        "let's delve into",
        'it is important to note',
        'in this comprehensive guide',
        'without further ado',
        'in the ever-evolving',
        'stands as a testament',
        'serves as a cornerstone',
        'plays a pivotal role',
        'shed light on',
        'the landscape of',
        'paves the way',
        'game-changing',
        'game changer',
        'a deep dive',
        'navigating the complexities',
        'unlock the full potential',
        'take your .+ to the next level',
        'whether you\'re a .+ or a',
        'in an era where',
        'the world of',
        'when it comes to',
    ];

    /**
     * Puffery / hyperbolic terms.
     *
     * @var array<string>
     */
    protected const PUFFERY_WORDS = [
        'revolutionize', 'game-changing', 'game changer', 'transform',
        'skyrocket', 'supercharge', 'turbocharge', 'unleash',
        'unlock', 'empower', 'amplify', 'maximize',
        'unmatched', 'unparalleled', 'unrivaled', 'best-in-class',
        'world-class', 'state-of-the-art', 'next-generation',
        'mission-critical', 'industry-leading', 'bleeding-edge',
    ];

    /**
     * Generic transition words overused by AI.
     *
     * @var array<string>
     */
    protected const GENERIC_TRANSITIONS = [
        'furthermore', 'moreover', 'additionally', 'consequently',
        'nevertheless', 'in addition', 'as a result', 'on the other hand',
        'in contrast', 'similarly', 'likewise', 'in conclusion',
        'to summarize', 'overall', 'ultimately', 'indeed',
        'notably', 'significantly', 'essentially', 'fundamentally',
    ];

    /**
     * Vague attribution phrases (no source cited).
     *
     * @var array<string>
     */
    protected const VAGUE_ATTRIBUTIONS = [
        'studies show', 'research shows', 'research indicates',
        'experts say', 'experts agree', 'experts recommend',
        'according to experts', 'according to research',
        'statistics show', 'data suggests', 'evidence suggests',
        'it has been shown', 'it is widely known',
        'it is well established', 'many experts believe',
    ];

    /**
     * Calculate AI slop score for an article.
     *
     * @return array{score: int, breakdown: array<string, array{score: int, max: int, details: array<string, mixed>}>}
     */
    public function calculate(Article $article): array
    {
        $this->article = $article;
        $this->content = $article->content_markdown ?: $article->content;
        $this->plainText = strip_tags($this->content);
        $this->wordCount = str_word_count($this->plainText);
        $this->sentences = $this->extractSentences($this->plainText);
        $this->paragraphs = $this->extractParagraphs($this->plainText);

        // Require minimum 200 words for reliable analysis
        if ($this->wordCount < 200) {
            return [
                'score' => 0,
                'breakdown' => $this->emptyBreakdown(),
            ];
        }

        $breakdown = [
            'technical_artifacts' => $this->scoreTechnicalArtifacts(),
            'vocabulary_patterns' => $this->scoreVocabularyPatterns(),
            'structural_analysis' => $this->scoreStructuralAnalysis(),
            'content_patterns' => $this->scoreContentPatterns(),
            'citation_verification' => $this->scoreCitationVerification(),
            'formatting_analysis' => $this->scoreFormattingAnalysis(),
            'stylometric' => $this->scoreStylometric(),
            'coherence' => $this->scoreCoherence(),
            'template_patterns' => $this->scoreTemplatePatterns(),
        ];

        // Confidence adjustment based on corroborating signals
        $breakdown['confidence_adjustment'] = $this->scoreConfidenceAdjustment($breakdown);

        $totalScore = array_sum(array_column($breakdown, 'score'));
        $maxScore = array_sum(array_column($breakdown, 'max'));

        $normalizedScore = $maxScore > 0 ? (int) round(($totalScore / $maxScore) * 100) : 0;
        $normalizedScore = min(100, max(0, $normalizedScore));

        return [
            'score' => $normalizedScore,
            'breakdown' => $breakdown,
        ];
    }

    /**
     * Calculate and save the AI slop score to the article.
     */
    public function calculateAndSave(Article $article): int
    {
        $result = $this->calculate($article);

        $article->update([
            'ai_slop_score' => $result['score'],
            'generation_metadata' => array_merge(
                $article->generation_metadata ?? [],
                ['ai_slop_breakdown' => $result['breakdown']]
            ),
        ]);

        return $result['score'];
    }

    /**
     * Layer 1: Technical Artifact Scan (max 10 points).
     *
     * @return array{score: int, max: int, details: array<string, mixed>}
     */
    protected function scoreTechnicalArtifacts(): array
    {
        $score = 0;
        $details = ['found_artifacts' => []];

        $artifacts = [
            'turn0search' => '/turn\d+search/i',
            'oaicite' => '/oaicite/i',
            'utm_chatgpt' => '/utm_source=chatgpt/i',
            'openai_ref' => '/\[.*?\]\(.*?openai\.com.*?\)/i',
            'chatgpt_ref' => '/as an ai language model|as a large language model/i',
            'model_disclaimer' => '/i (don\'t|cannot|can\'t) (access|browse|search) the internet/i',
        ];

        foreach ($artifacts as $name => $pattern) {
            if (preg_match($pattern, $this->content)) {
                $details['found_artifacts'][] = $name;
                $score += 5;
            }
        }

        return ['score' => min($score, 10), 'max' => 10, 'details' => $details];
    }

    /**
     * Layer 2: Vocabulary Pattern Matching (max 20 points).
     *
     * @return array{score: int, max: int, details: array<string, mixed>}
     */
    protected function scoreVocabularyPatterns(): array
    {
        $contentLower = strtolower($this->plainText);
        $flaggedWords = [];
        $totalMatches = 0;

        // Check single words
        foreach (self::FLAGGED_WORDS as $word) {
            $pattern = '/\b' . preg_quote($word, '/') . '\b/i';
            $count = preg_match_all($pattern, $contentLower);
            if ($count > 0) {
                $flaggedWords[$word] = $count;
                $totalMatches += $count;
            }
        }

        // Check phrases
        $flaggedPhrases = [];
        foreach (self::FLAGGED_PHRASES as $phrase) {
            $pattern = '/' . $phrase . '/i';
            $count = preg_match_all($pattern, $contentLower);
            if ($count > 0) {
                $flaggedPhrases[$phrase] = $count;
                $totalMatches += $count;
            }
        }

        // Calculate density (flagged terms per 100 words)
        $density = $this->wordCount > 0 ? ($totalMatches / $this->wordCount) * 100 : 0;

        // Score: 0-2% density = low, 2-5% = moderate, 5%+ = high
        $score = match (true) {
            $density >= 5.0 => 20,
            $density >= 3.0 => 15,
            $density >= 2.0 => 10,
            $density >= 1.0 => 5,
            $density >= 0.5 => 2,
            default => 0,
        };

        return [
            'score' => $score,
            'max' => 20,
            'details' => [
                'flagged_words' => $flaggedWords,
                'flagged_phrases' => $flaggedPhrases,
                'total_matches' => $totalMatches,
                'density' => round($density, 2),
            ],
        ];
    }

    /**
     * Layer 3: Structural Analysis (max 15 points).
     *
     * @return array{score: int, max: int, details: array<string, mixed>}
     */
    protected function scoreStructuralAnalysis(): array
    {
        $score = 0;
        $details = [];

        // Sentence length uniformity (coefficient of variation)
        $sentenceLengths = array_map(fn ($s) => str_word_count($s), $this->sentences);
        $sentenceLengths = array_filter($sentenceLengths, fn ($len) => $len > 0);

        if (count($sentenceLengths) >= 5) {
            $mean = array_sum($sentenceLengths) / count($sentenceLengths);
            $variance = 0;
            foreach ($sentenceLengths as $len) {
                $variance += ($len - $mean) ** 2;
            }
            $variance /= count($sentenceLengths);
            $stdDev = sqrt($variance);
            $cv = $mean > 0 ? ($stdDev / $mean) * 100 : 0;

            $details['sentence_length_cv'] = round($cv, 1);
            $details['avg_sentence_length'] = round($mean, 1);

            // AI text typically has CV < 30% (very uniform)
            // Natural writing has CV > 40%
            if ($cv < 20) {
                $score += 8;
            } elseif ($cv < 30) {
                $score += 5;
            } elseif ($cv < 35) {
                $score += 2;
            }
        }

        // Repetitive sentence starters
        $starters = [];
        foreach ($this->sentences as $sentence) {
            $words = preg_split('/\s+/', trim($sentence));
            if (count($words) >= 2) {
                $starter = strtolower($words[0] . ' ' . $words[1]);
                $starters[$starter] = ($starters[$starter] ?? 0) + 1;
            }
        }

        $repetitiveStarters = array_filter($starters, fn ($count) => $count >= 3);
        $details['repetitive_starters'] = count($repetitiveStarters);
        $details['top_starters'] = array_slice(
            array_keys(array_filter($starters, fn ($c) => $c >= 2)),
            0,
            5
        );

        if (count($repetitiveStarters) >= 3) {
            $score += 5;
        } elseif (count($repetitiveStarters) >= 2) {
            $score += 3;
        } elseif (count($repetitiveStarters) >= 1) {
            $score += 1;
        }

        // Paragraph length uniformity
        $paragraphLengths = array_map(fn ($p) => str_word_count($p), $this->paragraphs);
        $paragraphLengths = array_filter($paragraphLengths, fn ($len) => $len > 10);

        if (count($paragraphLengths) >= 4) {
            $mean = array_sum($paragraphLengths) / count($paragraphLengths);
            $variance = 0;
            foreach ($paragraphLengths as $len) {
                $variance += ($len - $mean) ** 2;
            }
            $variance /= count($paragraphLengths);
            $paraCV = $mean > 0 ? (sqrt($variance) / $mean) * 100 : 0;

            $details['paragraph_length_cv'] = round($paraCV, 1);

            if ($paraCV < 20) {
                $score += 2;
            } elseif ($paraCV < 30) {
                $score += 1;
            }
        }

        return ['score' => min($score, 15), 'max' => 15, 'details' => $details];
    }

    /**
     * Layer 4: Content Pattern Analysis (max 15 points).
     *
     * @return array{score: int, max: int, details: array<string, mixed>}
     */
    protected function scoreContentPatterns(): array
    {
        $score = 0;
        $contentLower = strtolower($this->plainText);
        $details = [];

        // Puffery / hyperbolic language
        $pufferyCount = 0;
        $foundPuffery = [];
        foreach (self::PUFFERY_WORDS as $word) {
            $pattern = '/\b' . preg_quote($word, '/') . '\b/i';
            $count = preg_match_all($pattern, $contentLower);
            if ($count > 0) {
                $foundPuffery[$word] = $count;
                $pufferyCount += $count;
            }
        }
        $details['puffery_count'] = $pufferyCount;
        $details['puffery_words'] = $foundPuffery;

        if ($pufferyCount >= 8) {
            $score += 5;
        } elseif ($pufferyCount >= 4) {
            $score += 3;
        } elseif ($pufferyCount >= 2) {
            $score += 1;
        }

        // Formulaic intro patterns
        $formulaicIntros = [
            '/^in today\'s (fast-paced|digital|modern|ever-changing|competitive)/im',
            '/^in (an|the) (era|age|world) (where|of)/im',
            '/^(when it comes to|whether you\'re)/im',
            '/^have you ever wondered/im',
            '/^are you looking for/im',
        ];
        $formulaicIntroCount = 0;
        foreach ($formulaicIntros as $pattern) {
            if (preg_match($pattern, $this->plainText)) {
                $formulaicIntroCount++;
            }
        }
        $details['formulaic_intros'] = $formulaicIntroCount;
        if ($formulaicIntroCount > 0) {
            $score += min($formulaicIntroCount * 2, 4);
        }

        // Formulaic conclusions
        $formulaicConclusions = [
            '/^in conclusion\b/im',
            '/^to (sum up|summarize|wrap up)\b/im',
            '/^(as we\'ve (seen|discussed|explored))\b/im',
        ];
        $formulaicConclusionCount = 0;
        foreach ($formulaicConclusions as $pattern) {
            if (preg_match($pattern, $this->plainText)) {
                $formulaicConclusionCount++;
            }
        }
        $details['formulaic_conclusions'] = $formulaicConclusionCount;
        if ($formulaicConclusionCount > 0) {
            $score += 2;
        }

        // Excessive hedging
        $hedgingPhrases = [
            'it\'s important to note',
            'it is important to note',
            'it\'s worth mentioning',
            'it should be noted',
            'it goes without saying',
            'needless to say',
        ];
        $hedgingCount = 0;
        foreach ($hedgingPhrases as $phrase) {
            $hedgingCount += substr_count($contentLower, $phrase);
        }
        $details['hedging_count'] = $hedgingCount;
        if ($hedgingCount >= 3) {
            $score += 4;
        } elseif ($hedgingCount >= 2) {
            $score += 2;
        } elseif ($hedgingCount >= 1) {
            $score += 1;
        }

        return ['score' => min($score, 15), 'max' => 15, 'details' => $details];
    }

    /**
     * Layer 5: Citation Verification (max 5 points).
     *
     * @return array{score: int, max: int, details: array<string, mixed>}
     */
    protected function scoreCitationVerification(): array
    {
        $score = 0;
        $contentLower = strtolower($this->plainText);
        $details = [];

        // Vague attributions without specific sources
        $vagueCount = 0;
        $foundVague = [];
        foreach (self::VAGUE_ATTRIBUTIONS as $phrase) {
            $count = substr_count($contentLower, $phrase);
            if ($count > 0) {
                $foundVague[$phrase] = $count;
                $vagueCount += $count;
            }
        }
        $details['vague_attributions'] = $foundVague;
        $details['vague_count'] = $vagueCount;

        if ($vagueCount >= 4) {
            $score += 4;
        } elseif ($vagueCount >= 2) {
            $score += 2;
        } elseif ($vagueCount >= 1) {
            $score += 1;
        }

        // Fabricated-looking statistics (numbers cited without source)
        $statsWithoutSource = preg_match_all(
            '/\b\d{1,3}(\.\d+)?%\s+(of\s+)?(people|users|businesses|companies|organizations|professionals|consumers|marketers)/i',
            $this->plainText
        );
        $details['unsourced_stats'] = $statsWithoutSource;
        if ($statsWithoutSource >= 2) {
            $score += 1;
        }

        return ['score' => min($score, 5), 'max' => 5, 'details' => $details];
    }

    /**
     * Layer 6: Formatting Analysis (max 10 points).
     *
     * @return array{score: int, max: int, details: array<string, mixed>}
     */
    protected function scoreFormattingAnalysis(): array
    {
        $score = 0;
        $details = [];

        // Title Case overuse in headings
        preg_match_all('/^#{1,6}\s+(.+)$/m', $this->content, $headingMatches);
        $headings = $headingMatches[1] ?? [];
        $titleCaseCount = 0;
        foreach ($headings as $heading) {
            $words = preg_split('/\s+/', trim($heading));
            if (count($words) >= 3) {
                $capitalizedWords = array_filter($words, fn ($w) => preg_match('/^[A-Z]/', $w));
                $ratio = count($capitalizedWords) / count($words);
                if ($ratio >= 0.8) {
                    $titleCaseCount++;
                }
            }
        }
        $details['title_case_headings'] = $titleCaseCount;
        $details['total_headings'] = count($headings);

        if (count($headings) > 0) {
            $titleCaseRatio = $titleCaseCount / count($headings);
            if ($titleCaseRatio >= 0.8) {
                $score += 3;
            } elseif ($titleCaseRatio >= 0.5) {
                $score += 1;
            }
        }

        // Excessive bold text
        $boldCount = preg_match_all('/\*\*[^*]+\*\*/', $this->content);
        $boldDensity = $this->wordCount > 0 ? ($boldCount / ($this->wordCount / 100)) : 0;
        $details['bold_count'] = $boldCount;
        $details['bold_density'] = round($boldDensity, 2);

        if ($boldDensity >= 5) {
            $score += 3;
        } elseif ($boldDensity >= 3) {
            $score += 2;
        } elseif ($boldDensity >= 2) {
            $score += 1;
        }

        // Emoji in content (formal contexts)
        $emojiCount = preg_match_all('/[\x{1F600}-\x{1F64F}\x{1F300}-\x{1F5FF}\x{1F680}-\x{1F6FF}\x{1F1E0}-\x{1F1FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]/u', $this->content);
        $details['emoji_count'] = $emojiCount;

        // Only flag if many emojis (some projects enable emojis intentionally)
        if ($emojiCount >= 10) {
            $score += 2;
        } elseif ($emojiCount >= 5) {
            $score += 1;
        }

        // Uniform heading pattern (e.g., all headings follow "How to X" or "X: Y" pattern)
        if (count($headings) >= 4) {
            $patterns = [];
            foreach ($headings as $heading) {
                if (preg_match('/^(how to|what is|why|the|top \d+|best|\d+)\s/i', $heading, $m)) {
                    $patterns[strtolower($m[1])] = ($patterns[strtolower($m[1])] ?? 0) + 1;
                }
            }
            $maxRepeat = count($patterns) > 0 ? max($patterns) : 0;
            $details['heading_pattern_repeats'] = $maxRepeat;

            if ($maxRepeat >= 4) {
                $score += 2;
            } elseif ($maxRepeat >= 3) {
                $score += 1;
            }
        }

        return ['score' => min($score, 10), 'max' => 10, 'details' => $details];
    }

    /**
     * Layer 7: Stylometric Observation (max 10 points).
     *
     * @return array{score: int, max: int, details: array<string, mixed>}
     */
    protected function scoreStylometric(): array
    {
        $score = 0;
        $contentLower = strtolower($this->plainText);
        $details = [];

        // Pronoun analysis
        $pronounPatterns = [
            'first_person' => '/\b(i|me|my|mine|myself)\b/i',
            'second_person' => '/\b(you|your|yours|yourself)\b/i',
            'first_plural' => '/\b(we|us|our|ours|ourselves)\b/i',
        ];

        $pronounCounts = [];
        foreach ($pronounPatterns as $type => $pattern) {
            $count = preg_match_all($pattern, $this->plainText);
            $pronounCounts[$type] = $count;
        }
        $details['pronouns'] = $pronounCounts;

        $totalPronouns = array_sum($pronounCounts);
        $pronounDensity = $this->wordCount > 0 ? ($totalPronouns / $this->wordCount) * 100 : 0;
        $details['pronoun_density'] = round($pronounDensity, 2);

        // AI text tends to be impersonal (very low first/second person usage)
        if ($pronounDensity < 0.5) {
            $score += 4;
        } elseif ($pronounDensity < 1.0) {
            $score += 2;
        }

        // Overuse of "we" without "I" (corporate AI voice)
        if ($pronounCounts['first_plural'] > 5 && $pronounCounts['first_person'] === 0) {
            $score += 2;
            $details['corporate_voice'] = true;
        }

        // Sentence complexity uniformity
        // Check mix of simple (< 10 words) vs complex (> 25 words) sentences
        $simple = 0;
        $complex = 0;
        foreach ($this->sentences as $sentence) {
            $wc = str_word_count($sentence);
            if ($wc > 0 && $wc <= 10) {
                $simple++;
            } elseif ($wc > 25) {
                $complex++;
            }
        }
        $sentenceCount = count($this->sentences);
        $simpleRatio = $sentenceCount > 0 ? $simple / $sentenceCount : 0;
        $complexRatio = $sentenceCount > 0 ? $complex / $sentenceCount : 0;
        $details['simple_sentence_ratio'] = round($simpleRatio, 2);
        $details['complex_sentence_ratio'] = round($complexRatio, 2);

        // Natural writing has a mix; AI tends to be mostly medium-length
        if ($simpleRatio < 0.05 && $complexRatio < 0.05) {
            $score += 4; // Almost all sentences are medium-length
        } elseif ($simpleRatio < 0.1 && $complexRatio < 0.1) {
            $score += 2;
        }

        return ['score' => min($score, 10), 'max' => 10, 'details' => $details];
    }

    /**
     * Layer 8: Coherence Check (max 10 points).
     *
     * @return array{score: int, max: int, details: array<string, mixed>}
     */
    protected function scoreCoherence(): array
    {
        $score = 0;
        $contentLower = strtolower($this->plainText);
        $details = [];

        // Generic transition overuse
        $transitionCount = 0;
        $foundTransitions = [];
        foreach (self::GENERIC_TRANSITIONS as $transition) {
            $pattern = '/\b' . preg_quote($transition, '/') . '\b/i';
            $count = preg_match_all($pattern, $this->plainText);
            if ($count > 0) {
                $foundTransitions[$transition] = $count;
                $transitionCount += $count;
            }
        }
        $details['generic_transitions'] = $foundTransitions;
        $details['transition_count'] = $transitionCount;

        $transitionDensity = $this->wordCount > 0 ? ($transitionCount / $this->wordCount) * 100 : 0;
        $details['transition_density'] = round($transitionDensity, 2);

        if ($transitionDensity >= 2.0) {
            $score += 5;
        } elseif ($transitionDensity >= 1.0) {
            $score += 3;
        } elseif ($transitionDensity >= 0.5) {
            $score += 1;
        }

        // Paragraph-initial transition word usage
        $paraStartTransitions = 0;
        foreach ($this->paragraphs as $para) {
            $firstWord = strtolower(explode(' ', trim($para))[0] ?? '');
            $firstTwoWords = implode(' ', array_slice(explode(' ', strtolower(trim($para))), 0, 2));

            foreach (self::GENERIC_TRANSITIONS as $t) {
                if ($firstWord === $t || $firstTwoWords === $t) {
                    $paraStartTransitions++;
                    break;
                }
            }
        }
        $details['paragraphs_starting_with_transitions'] = $paraStartTransitions;

        if (count($this->paragraphs) > 0) {
            $ratio = $paraStartTransitions / count($this->paragraphs);
            if ($ratio >= 0.4) {
                $score += 5;
            } elseif ($ratio >= 0.25) {
                $score += 3;
            } elseif ($ratio >= 0.15) {
                $score += 1;
            }
        }

        return ['score' => min($score, 10), 'max' => 10, 'details' => $details];
    }

    /**
     * Layer 10: Template Pattern Analysis (max 15 points).
     *
     * Detects document-level structural patterns characteristic of
     * AI-generated content templates, even when vocabulary markers
     * are absent.
     *
     * @return array{score: int, max: int, details: array<string, mixed>}
     */
    protected function scoreTemplatePatterns(): array
    {
        $score = 0;
        $details = [];

        // Sub-check A: FAQ section pattern (max 3 pts)
        $faqScore = 0;
        $hasFaqHeading = preg_match(
            '/^#{1,3}\s+(?:Frequently Asked Questions|FAQ)\s*$/mi',
            $this->content
        );

        if ($hasFaqHeading) {
            preg_match(
                '/^#{1,3}\s+(?:Frequently Asked Questions|FAQ)\s*$(.+)/msi',
                $this->content,
                $faqContent
            );

            $faqQuestionCount = 0;
            if (! empty($faqContent[1])) {
                $faqQuestionCount = preg_match_all(
                    '/^#{2,4}\s+.+\?\s*$/m',
                    $faqContent[1]
                );
            }

            $details['faq_heading_found'] = true;
            $details['faq_question_count'] = $faqQuestionCount;

            if ($faqQuestionCount >= 5) {
                $faqScore = 3;
            } elseif ($faqQuestionCount >= 3) {
                $faqScore = 2;
            }
        } else {
            $details['faq_heading_found'] = false;
            $details['faq_question_count'] = 0;
        }
        $score += $faqScore;

        // Sub-check B: AI image placeholder descriptions (max 4 pts)
        $placeholderMatches = [];

        // Lines starting with image-type descriptors followed by descriptive text
        preg_match_all(
            '/^(?:Featured image|Illustration|Infographic|Image|Photo|Diagram|Screenshot|Visual|Graphic|Banner|Hero image)(?:\s*[:—\-]\s*|\s+(?:of|showing|depicting|illustrating|with))\s*.{20,}/mi',
            $this->content,
            $m1
        );
        if (! empty($m1[0])) {
            $placeholderMatches = array_merge($placeholderMatches, $m1[0]);
        }

        // Adjective + visual noun pattern
        preg_match_all(
            '/^(?:Simple|Detailed|Clean|Colorful|Annotated|Side-by-side|Split-screen|Screenshot-style|Promotional-style)\s+(?:[\w-]+\s+){0,4}(?:chart|graph|meter|diagram|infographic|illustration|table|timeline|flowchart|comparison|screenshot|mockup|wireframe|graphic)\b.{10,}/mi',
            $this->content,
            $m2
        );
        if (! empty($m2[0])) {
            $placeholderMatches = array_merge($placeholderMatches, $m2[0]);
        }

        // Alt-text style descriptions in brackets without markdown link URLs
        preg_match_all(
            '/\[(?:Image|Photo|Illustration|Infographic|Diagram|Screenshot)\s+(?:of|showing|depicting)\s+[^\]]{15,}\](?!\()/i',
            $this->content,
            $m3
        );
        if (! empty($m3[0])) {
            $placeholderMatches = array_merge($placeholderMatches, $m3[0]);
        }

        $imagePlaceholderCount = count($placeholderMatches);
        $details['image_placeholder_count'] = $imagePlaceholderCount;
        $details['image_placeholders'] = array_slice($placeholderMatches, 0, 5);

        $imagePlaceholderScore = match (true) {
            $imagePlaceholderCount >= 3 => 4,
            $imagePlaceholderCount >= 2 => 3,
            $imagePlaceholderCount >= 1 => 2,
            default => 0,
        };
        $score += $imagePlaceholderScore;

        // Sub-check C: Callout/admonition patterns (max 2 pts)
        $calloutPatterns = [
            'key_takeaway' => '/^(?:\*\*)?Key Takeaway(?:\*\*)?[:\s]/mi',
            'pro_tip' => '/^(?:\*\*)?Pro Tip(?:\*\*)?[:\s]/mi',
            'quick_tip' => '/^(?:\*\*)?Quick Tip(?:\*\*)?[:\s]/mi',
            'did_you_know' => '/^(?:\*\*)?Did You Know(?:\*\*)?[:\?]/mi',
            'bottom_line' => '/^(?:\*\*)?(?:The )?Bottom Line(?:\*\*)?[:\s]/mi',
            'expert_tip' => '/^(?:\*\*)?Expert Tip(?:\*\*)?[:\s]/mi',
            'action_item' => '/^(?:\*\*)?Action (?:Item|Step)(?:\*\*)?[:\s]/mi',
            'remember' => '/^(?:\*\*)?Remember(?:\*\*)?[:\s]/mi',
        ];

        $calloutCount = 0;
        $foundCallouts = [];
        foreach ($calloutPatterns as $name => $pattern) {
            $count = preg_match_all($pattern, $this->content);
            if ($count > 0) {
                $foundCallouts[$name] = $count;
                $calloutCount += $count;
            }
        }

        $details['callout_types'] = $foundCallouts;
        $details['callout_total_count'] = $calloutCount;
        $distinctCalloutTypes = count($foundCallouts);

        $calloutScore = 0;
        if ($distinctCalloutTypes >= 3 || $calloutCount >= 4) {
            $calloutScore = 2;
        } elseif ($distinctCalloutTypes >= 2 || $calloutCount >= 3) {
            $calloutScore = 1;
        }
        $score += $calloutScore;

        // Sub-check D: Rigid section template (max 3 pts)
        // Micro-pattern: intro → bullets → explain repeating across H2 sections
        preg_match_all('/^##\s+.+$/m', $this->content, $h2Matches, PREG_OFFSET_CAPTURE);
        $sectionTexts = [];

        if (count($h2Matches[0]) >= 3) {
            for ($i = 0; $i < count($h2Matches[0]); $i++) {
                $start = $h2Matches[0][$i][1];
                $end = isset($h2Matches[0][$i + 1])
                    ? $h2Matches[0][$i + 1][1]
                    : strlen($this->content);
                $sectionTexts[] = substr($this->content, $start, $end - $start);
            }
        }

        $bulletSandwichCount = 0;
        foreach ($sectionTexts as $section) {
            $body = preg_replace('/^##.+\n/', '', $section);
            $body = trim($body);

            if (empty($body)) {
                continue;
            }

            $blocks = preg_split('/\n\s*\n/', $body);
            $blocks = array_values(array_filter($blocks, fn ($b) => strlen(trim($b)) > 10));

            if (count($blocks) >= 3) {
                $hasLeadParagraph = ! preg_match('/^\s*[-*\d]/', $blocks[0]);
                $hasListMiddle = false;

                for ($j = 1; $j < count($blocks) - 1; $j++) {
                    if (preg_match('/^\s*[-*\d]+[.)]\s/m', $blocks[$j])) {
                        $hasListMiddle = true;
                        break;
                    }
                }

                $lastBlock = $blocks[count($blocks) - 1];
                $hasTrailingParagraph = ! preg_match('/^\s*[-*\d]/', $lastBlock);

                if ($hasLeadParagraph && $hasListMiddle && $hasTrailingParagraph) {
                    $bulletSandwichCount++;
                }
            }
        }

        $details['sections_with_bullet_sandwich'] = $bulletSandwichCount;
        $details['total_h2_sections'] = count($sectionTexts);

        $templateScore = 0;
        if (count($sectionTexts) >= 3) {
            $ratio = $bulletSandwichCount / count($sectionTexts);
            $details['bullet_sandwich_ratio'] = round($ratio, 2);

            if ($ratio >= 0.7 && count($sectionTexts) >= 4) {
                $templateScore += 2;
            } elseif ($ratio >= 0.5 && count($sectionTexts) >= 3) {
                $templateScore += 1;
            }
        }

        // Macro-pattern: CTA + FAQ + Conclusion all present
        $hasCta = (bool) preg_match(
            '/^#{1,3}\s+(?:Where\s+\w+\s+(?:Fits|Comes In|Helps|Steps In)|How\s+\w+\s+(?:Can Help|Makes It|Simplifies)|Why\s+(?:Choose|Use|Try)\s+\w+|(?:Get|Getting)\s+Started\s+(?:With|Using)\s+\w+)/mi',
            $this->content
        );
        $hasConclusion = (bool) preg_match(
            '/^#{1,3}\s+(?:Conclusion|Final Thoughts|Wrapping Up|Summary|Key Takeaways|Your Next Steps)\s*$/mi',
            $this->content
        );

        $details['has_cta_section'] = $hasCta;
        $details['has_conclusion_section'] = $hasConclusion;

        $macroPatternCount = ($hasCta ? 1 : 0) + ($hasFaqHeading ? 1 : 0) + ($hasConclusion ? 1 : 0);
        if ($macroPatternCount >= 3) {
            $templateScore += 1;
        }
        $score += $templateScore;

        // Sub-check E: Listicle headers with meta-annotations (max 2 pts)
        preg_match_all('/^#{1,6}\s+(.+)$/m', $this->content, $allHeadings);
        $headings = $allHeadings[1] ?? [];

        $metaAnnotatedHeadings = [];
        foreach ($headings as $heading) {
            if (preg_match('/\((?:\d+\s*(?:minutes?|mins?|hours?|hrs?|seconds?|secs?|steps?|ways?)|beginner|intermediate|advanced|easy|moderate|hard|quick|free|paid|optional|recommended|updated|new)\)\s*$/i', $heading)) {
                $metaAnnotatedHeadings[] = $heading;
            }
        }

        $details['meta_annotated_headings'] = $metaAnnotatedHeadings;
        $details['meta_annotated_count'] = count($metaAnnotatedHeadings);

        $metaHeaderScore = 0;
        if (count($metaAnnotatedHeadings) >= 4) {
            $metaHeaderScore = 2;
        } elseif (count($metaAnnotatedHeadings) >= 3) {
            $metaHeaderScore = 1;
        }
        $score += $metaHeaderScore;

        // Sub-check F: Soft-sell CTA heading (max 1 pt)
        $ctaPatterns = [
            '/^#{1,3}\s+Where\s+\w+\s+(?:Fits|Comes In|Helps|Steps In)\b/mi',
            '/^#{1,3}\s+How\s+\w+\s+(?:Can Help|Makes It|Simplifies|Streamlines)\b/mi',
            '/^#{1,3}\s+Why\s+(?:Choose|Use|Try|Consider)\s+\w+/mi',
            '/^#{1,3}\s+(?:Get|Getting)\s+Started\s+(?:With|Using)\s+\w+/mi',
        ];

        $ctaHeadingsFound = [];
        foreach ($ctaPatterns as $pattern) {
            if (preg_match($pattern, $this->content, $m)) {
                $ctaHeadingsFound[] = trim($m[0]);
            }
        }

        $details['cta_headings'] = $ctaHeadingsFound;
        $ctaScore = count($ctaHeadingsFound) >= 1 ? 1 : 0;
        $score += $ctaScore;

        return ['score' => min($score, 15), 'max' => 15, 'details' => $details];
    }

    /**
     * Layer 9: Confidence Adjustment (max 5 points).
     *
     * Only adds points when 3+ layers independently flag issues,
     * confirming corroborating signals.
     *
     * @param  array<string, array{score: int, max: int, details: array<string, mixed>}>  $breakdown
     * @return array{score: int, max: int, details: array<string, mixed>}
     */
    protected function scoreConfidenceAdjustment(array $breakdown): array
    {
        $corroboratingLayers = 0;

        foreach ($breakdown as $layer) {
            // Layer flags if score is >= 50% of its max
            if ($layer['max'] > 0 && ($layer['score'] / $layer['max']) >= 0.5) {
                $corroboratingLayers++;
            }
        }

        $score = 0;
        if ($corroboratingLayers >= 5) {
            $score = 5;
        } elseif ($corroboratingLayers >= 3) {
            $score = 3;
        }

        return [
            'score' => $score,
            'max' => 5,
            'details' => [
                'corroborating_layers' => $corroboratingLayers,
            ],
        ];
    }

    /**
     * Extract sentences from plain text.
     *
     * @return array<string>
     */
    protected function extractSentences(string $text): array
    {
        // Split on sentence-ending punctuation followed by whitespace or end of string
        $sentences = preg_split('/(?<=[.!?])\s+/', $text, -1, PREG_SPLIT_NO_EMPTY);

        return $sentences ?: [];
    }

    /**
     * Extract paragraphs from plain text.
     *
     * @return array<string>
     */
    protected function extractParagraphs(string $text): array
    {
        $paragraphs = preg_split('/\n\s*\n/', $text, -1, PREG_SPLIT_NO_EMPTY);

        return array_values(array_filter(
            $paragraphs ?: [],
            fn ($p) => str_word_count(trim($p)) >= 5
        ));
    }

    /**
     * Return empty breakdown for content below minimum threshold.
     *
     * @return array<string, array{score: int, max: int, details: array<string, mixed>}>
     */
    protected function emptyBreakdown(): array
    {
        $layers = [
            'technical_artifacts', 'vocabulary_patterns', 'structural_analysis',
            'content_patterns', 'citation_verification', 'formatting_analysis',
            'stylometric', 'coherence', 'template_patterns', 'confidence_adjustment',
        ];

        $maxPoints = [10, 20, 15, 15, 5, 10, 10, 10, 15, 5];

        $breakdown = [];
        foreach ($layers as $i => $layer) {
            $breakdown[$layer] = ['score' => 0, 'max' => $maxPoints[$i], 'details' => ['insufficient_content' => true]];
        }

        return $breakdown;
    }
}
