<?php

namespace App\Services;

use App\Models\AiProvider;
use App\Models\Article;
use Prism\Prism\Prism;

class ArticleImprovementService
{
    public function __construct(
        protected Prism $prism
    ) {}

    /**
     * Apply an AI-powered improvement to the article.
     *
     * @return array{field: string, value: string, message: string}
     */
    public function improve(Article $article, string $improvementType, AiProvider $aiProvider): array
    {
        $providerConfig = $this->buildProviderConfig($aiProvider);
        $keyword = $article->keyword?->keyword ?? '';

        return match ($improvementType) {
            'add_keyword_to_title' => $this->improveTitle($article, $keyword, $aiProvider, $providerConfig),
            'add_keyword_to_meta' => $this->improveMeta($article, $keyword, $aiProvider, $providerConfig),
            'add_faq_section' => $this->addFaqSection($article, $keyword, $aiProvider, $providerConfig),
            'add_table' => $this->addTable($article, $keyword, $aiProvider, $providerConfig),
            'add_h2_headings' => $this->addH2Headings($article, $keyword, $aiProvider, $providerConfig),
            'add_lists' => $this->addLists($article, $keyword, $aiProvider, $providerConfig),
            'optimize_title_length' => $this->optimizeTitleLength($article, $keyword, $aiProvider, $providerConfig),
            'optimize_meta_length' => $this->optimizeMetaLength($article, $keyword, $aiProvider, $providerConfig),
            'add_keyword_to_h2' => $this->addKeywordToH2($article, $keyword, $aiProvider, $providerConfig),
            'add_keyword_to_intro' => $this->addKeywordToIntro($article, $keyword, $aiProvider, $providerConfig),
            'humanize_vocabulary' => $this->humanizeVocabulary($article, $aiProvider, $providerConfig),
            'vary_sentence_structure' => $this->varySentenceStructure($article, $aiProvider, $providerConfig),
            'remove_puffery' => $this->removePuffery($article, $aiProvider, $providerConfig),
            'add_personal_voice' => $this->addPersonalVoice($article, $aiProvider, $providerConfig),
            'clean_artifacts' => $this->cleanArtifacts($article),
            'improve_transitions' => $this->improveTransitions($article, $aiProvider, $providerConfig),
            'restructure_template' => $this->restructureTemplate($article, $aiProvider, $providerConfig),
            default => throw new \InvalidArgumentException("Unknown improvement type: {$improvementType}"),
        };
    }

    /**
     * @return array<string, mixed>
     */
    protected function buildProviderConfig(AiProvider $aiProvider): array
    {
        $config = [];

        if ($aiProvider->api_key) {
            $config['api_key'] = $aiProvider->api_key;
        }

        if ($aiProvider->base_url) {
            $config['url'] = $aiProvider->base_url;
        }

        return $config;
    }

    /**
     * @param  array<string, mixed>  $providerConfig
     * @return array{field: string, value: string, message: string}
     */
    protected function improveTitle(Article $article, string $keyword, AiProvider $aiProvider, array $providerConfig): array
    {
        $prompt = <<<PROMPT
Rewrite this article title to naturally include the keyword "{$keyword}".

Current title: {$article->title}

Rules:
- Keep it between 50-60 characters
- Make it compelling and click-worthy
- Include the keyword naturally (variations like plurals are OK)
- Do not use em dashes
- Return ONLY the new title, nothing else
PROMPT;

        $newTitle = $this->callAi($aiProvider, $providerConfig, $prompt);

        return [
            'field' => 'title',
            'value' => trim($newTitle),
            'message' => 'Title updated to include keyword',
        ];
    }

    /**
     * @param  array<string, mixed>  $providerConfig
     * @return array{field: string, value: string, message: string}
     */
    protected function improveMeta(Article $article, string $keyword, AiProvider $aiProvider, array $providerConfig): array
    {
        $currentMeta = $article->meta_description ?? '';
        $prompt = <<<PROMPT
Write a compelling meta description for this article that includes the keyword "{$keyword}".

Article title: {$article->title}
Current meta description: {$currentMeta}

Rules:
- Keep it between 150-160 characters exactly
- Include the keyword naturally
- Make it compelling to encourage clicks
- Summarize what the reader will learn
- Do not use em dashes
- Return ONLY the meta description, nothing else
PROMPT;

        $newMeta = $this->callAi($aiProvider, $providerConfig, $prompt);

        return [
            'field' => 'meta_description',
            'value' => trim($newMeta),
            'message' => 'Meta description updated to include keyword',
        ];
    }

    /**
     * @param  array<string, mixed>  $providerConfig
     * @return array{field: string, value: string, message: string}
     */
    protected function addFaqSection(Article $article, string $keyword, AiProvider $aiProvider, array $providerConfig): array
    {
        $content = $article->content_markdown ?: $article->content;
        $prompt = <<<PROMPT
Generate a "Frequently Asked Questions" section for this article about "{$keyword}".

Article title: {$article->title}

Rules:
- Create 4-5 relevant questions and answers
- Questions should be what real people would ask
- Answers should be concise but helpful (2-3 sentences)
- Include the keyword naturally in at least one question
- Format as markdown with ## FAQ as the heading
- Use ### for each question
- Do not use em dashes
- Return ONLY the FAQ section in markdown format
PROMPT;

        $faqSection = $this->callAi($aiProvider, $providerConfig, $prompt);

        $newContent = trim($content)."\n\n".trim($faqSection);

        return [
            'field' => 'content',
            'value' => $newContent,
            'message' => 'FAQ section added to content',
        ];
    }

    /**
     * @param  array<string, mixed>  $providerConfig
     * @return array{field: string, value: string, message: string}
     */
    protected function addTable(Article $article, string $keyword, AiProvider $aiProvider, array $providerConfig): array
    {
        $content = $article->content_markdown ?: $article->content;
        $prompt = <<<PROMPT
Generate a useful comparison or data table for this article about "{$keyword}".

Article title: {$article->title}

Rules:
- Create a markdown table with 3-5 columns and 4-6 rows
- Make it informative and relevant to the topic
- Include a brief introduction sentence before the table
- Include a ## heading for the table section
- Do not use em dashes
- Return ONLY the table section (heading + intro + table) in markdown format
PROMPT;

        $tableSection = $this->callAi($aiProvider, $providerConfig, $prompt);

        $newContent = $this->insertBeforeConclusion($content, trim($tableSection));

        return [
            'field' => 'content',
            'value' => $newContent,
            'message' => 'Comparison table added to content',
        ];
    }

    /**
     * @param  array<string, mixed>  $providerConfig
     * @return array{field: string, value: string, message: string}
     */
    protected function addH2Headings(Article $article, string $keyword, AiProvider $aiProvider, array $providerConfig): array
    {
        $content = $article->content_markdown ?: $article->content;

        preg_match_all('/^##\s+(.+)$/m', $content, $matches);
        $existingH2s = implode(', ', $matches[1] ?? []);
        $neededCount = max(1, 3 - count($matches[0]));

        $prompt = <<<PROMPT
Generate {$neededCount} new H2 section(s) with content for this article about "{$keyword}".

Article title: {$article->title}
Existing H2 headings: {$existingH2s}

Rules:
- Create {$neededCount} new section(s) with ## headings
- Each section should have 2-3 paragraphs of useful content
- Make headings different from existing ones
- Include the keyword naturally in at least one heading
- Do not use em dashes
- Return ONLY the new sections in markdown format
PROMPT;

        $newSections = $this->callAi($aiProvider, $providerConfig, $prompt);

        $newContent = $this->insertBeforeFaq($content, trim($newSections));

        return [
            'field' => 'content',
            'value' => $newContent,
            'message' => "{$neededCount} new section(s) added to content",
        ];
    }

    /**
     * @param  array<string, mixed>  $providerConfig
     * @return array{field: string, value: string, message: string}
     */
    protected function addLists(Article $article, string $keyword, AiProvider $aiProvider, array $providerConfig): array
    {
        $content = $article->content_markdown ?: $article->content;
        $prompt = <<<PROMPT
Generate a useful bulleted list section for this article about "{$keyword}".

Article title: {$article->title}

Rules:
- Create a section with a ## heading
- Include 5-8 bullet points with helpful information
- Each bullet should be a complete, useful point
- Do not use em dashes
- Return ONLY the list section in markdown format
PROMPT;

        $listSection = $this->callAi($aiProvider, $providerConfig, $prompt);

        $newContent = $this->insertBeforeConclusion($content, trim($listSection));

        return [
            'field' => 'content',
            'value' => $newContent,
            'message' => 'Bullet list section added to content',
        ];
    }

    /**
     * @param  array<string, mixed>  $providerConfig
     * @return array{field: string, value: string, message: string}
     */
    protected function optimizeTitleLength(Article $article, string $keyword, AiProvider $aiProvider, array $providerConfig): array
    {
        $currentLength = mb_strlen($article->title);
        $action = $currentLength < 50 ? 'longer' : 'shorter';

        $prompt = <<<PROMPT
Rewrite this title to be {$action} (aim for 50-60 characters).

Current title ({$currentLength} chars): {$article->title}
Keyword: {$keyword}

Rules:
- Keep the same meaning and intent
- Target 50-60 characters
- Include the keyword if possible
- Do not use em dashes
- Return ONLY the new title, nothing else
PROMPT;

        $newTitle = $this->callAi($aiProvider, $providerConfig, $prompt);

        return [
            'field' => 'title',
            'value' => trim($newTitle),
            'message' => 'Title optimized to ideal length',
        ];
    }

    /**
     * @param  array<string, mixed>  $providerConfig
     * @return array{field: string, value: string, message: string}
     */
    protected function optimizeMetaLength(Article $article, string $keyword, AiProvider $aiProvider, array $providerConfig): array
    {
        $currentMeta = $article->meta_description ?? '';
        $currentLength = mb_strlen($currentMeta);
        $action = $currentLength < 150 ? 'expand' : 'shorten';

        $prompt = <<<PROMPT
Rewrite this meta description to be {$action} (aim for 150-160 characters).

Article title: {$article->title}
Current meta ({$currentLength} chars): {$currentMeta}
Keyword: {$keyword}

Rules:
- Keep the same meaning and intent
- Target 150-160 characters exactly
- Include the keyword naturally
- Do not use em dashes
- Return ONLY the meta description, nothing else
PROMPT;

        $newMeta = $this->callAi($aiProvider, $providerConfig, $prompt);

        return [
            'field' => 'meta_description',
            'value' => trim($newMeta),
            'message' => 'Meta description optimized to ideal length',
        ];
    }

    /**
     * @param  array<string, mixed>  $providerConfig
     * @return array{field: string, value: string, message: string}
     */
    protected function addKeywordToH2(Article $article, string $keyword, AiProvider $aiProvider, array $providerConfig): array
    {
        $content = $article->content_markdown ?: $article->content;

        preg_match_all('/^(##\s+)(.+)$/m', $content, $matches, PREG_SET_ORDER);

        $prompt = <<<PROMPT
Rewrite one of these H2 headings to naturally include the keyword "{$keyword}".

Current H2 headings:
{$this->formatH2List($matches)}

Rules:
- Choose the most appropriate heading to modify
- Keep the same meaning and intent
- Include the keyword naturally (variations are OK)
- Do not use em dashes
- Return in format: OLD_HEADING|||NEW_HEADING
PROMPT;

        $response = $this->callAi($aiProvider, $providerConfig, $prompt);

        $parts = explode('|||', $response);
        if (count($parts) === 2) {
            $oldHeading = trim($parts[0]);
            $newHeading = trim($parts[1]);
            $content = str_replace("## {$oldHeading}", "## {$newHeading}", $content);
        }

        return [
            'field' => 'content',
            'value' => $content,
            'message' => 'H2 heading updated to include keyword',
        ];
    }

    /**
     * @param  array<string, mixed>  $providerConfig
     * @return array{field: string, value: string, message: string}
     */
    protected function addKeywordToIntro(Article $article, string $keyword, AiProvider $aiProvider, array $providerConfig): array
    {
        $content = $article->content_markdown ?: $article->content;

        $words = preg_split('/\s+/', $content);
        if ($words === false) {
            $words = [];
        }
        $first150 = implode(' ', array_slice($words, 0, 150));

        $prompt = <<<PROMPT
Rewrite the introduction of this article to include the keyword "{$keyword}" within the first 150 words.

Current introduction:
{$first150}

Rules:
- Keep the same tone and style
- Include the keyword naturally in the first 2-3 sentences
- Make it engaging and informative
- Do not use em dashes
- Return ONLY the rewritten introduction (same approximate length)
PROMPT;

        $newIntro = $this->callAi($aiProvider, $providerConfig, $prompt);

        $remainingWords = array_slice($words, 150);
        $newContent = trim($newIntro).' '.implode(' ', $remainingWords);

        return [
            'field' => 'content',
            'value' => $newContent,
            'message' => 'Introduction updated to include keyword',
        ];
    }

    /**
     * Replace AI-overused vocabulary with natural alternatives.
     *
     * @param  array<string, mixed>  $providerConfig
     * @return array{field: string, value: string, message: string}
     */
    protected function humanizeVocabulary(Article $article, AiProvider $aiProvider, array $providerConfig): array
    {
        $content = $article->content_markdown ?: $article->content;

        $prompt = <<<PROMPT
Rewrite this article to replace AI-sounding vocabulary with natural, human alternatives.

Target words to replace (if present): delve, tapestry, multifaceted, navigate, landscape, leverage, crucial, pivotal, foster, comprehensive, robust, streamline, harness, spearhead, paradigm, synergy, holistic, nuanced, intricate, elevate, resonate, captivate, testament, beacon, cornerstone, reimagine, unwavering, demystify, paramount, indispensable, groundbreaking, transformative, unparalleled, unprecedented.

Target phrases to replace (if present): "it's worth noting", "in the realm of", "in today's world", "let's dive in", "let's delve into", "in the ever-evolving", "stands as a testament", "plays a pivotal role", "navigating the complexities", "unlock the full potential".

Rules:
- Replace flagged words/phrases with simpler, more natural alternatives
- Keep the same meaning and information
- Maintain the article's tone and structure
- Do NOT change headings, links, or formatting
- Do NOT add or remove content, only replace vocabulary
- Return the COMPLETE article content
PROMPT;

        $newContent = $this->callAi($aiProvider, $providerConfig, $prompt."\n\nArticle content:\n".$content);

        return [
            'field' => 'content',
            'value' => trim($newContent),
            'message' => 'AI vocabulary replaced with natural alternatives',
        ];
    }

    /**
     * Vary sentence structure for more natural rhythm.
     *
     * @param  array<string, mixed>  $providerConfig
     * @return array{field: string, value: string, message: string}
     */
    protected function varySentenceStructure(Article $article, AiProvider $aiProvider, array $providerConfig): array
    {
        $content = $article->content_markdown ?: $article->content;

        $prompt = <<<PROMPT
Rewrite this article to have more varied sentence structure and rhythm.

Problems to fix:
- Sentences that are all similar length (12-18 words)
- Paragraphs that start the same way repeatedly
- Monotonous rhythm from uniform sentence patterns

What to do:
- Mix short punchy sentences (5-8 words) with longer complex ones (20-30 words)
- Vary paragraph openings (don't start multiple paragraphs the same way)
- Add occasional sentence fragments for emphasis
- Use questions, exclamations, and varied punctuation naturally
- Keep all information, headings, links, and formatting intact
- Return the COMPLETE article content
PROMPT;

        $newContent = $this->callAi($aiProvider, $providerConfig, $prompt."\n\nArticle content:\n".$content);

        return [
            'field' => 'content',
            'value' => trim($newContent),
            'message' => 'Sentence structure varied for natural rhythm',
        ];
    }

    /**
     * Remove hyperbolic puffery language.
     *
     * @param  array<string, mixed>  $providerConfig
     * @return array{field: string, value: string, message: string}
     */
    protected function removePuffery(Article $article, AiProvider $aiProvider, array $providerConfig): array
    {
        $content = $article->content_markdown ?: $article->content;

        $prompt = <<<PROMPT
Rewrite this article to remove hyperbolic, puffery language and replace it with concrete, specific claims.

Words/phrases to fix: revolutionize, game-changing, game changer, supercharge, turbocharge, unleash, unlock, empower, amplify, maximize, unmatched, unparalleled, unrivaled, best-in-class, world-class, state-of-the-art, next-generation, mission-critical, industry-leading, bleeding-edge, skyrocket.

Rules:
- Replace vague superlatives with specific, measurable claims where possible
- Instead of "revolutionize your workflow", say something like "cut your processing time in half"
- Instead of "game-changing results", describe the actual results
- If no specific claim is possible, just use simpler language ("helpful" instead of "game-changing")
- Keep all headings, links, formatting, and structure intact
- Return the COMPLETE article content
PROMPT;

        $newContent = $this->callAi($aiProvider, $providerConfig, $prompt."\n\nArticle content:\n".$content);

        return [
            'field' => 'content',
            'value' => trim($newContent),
            'message' => 'Puffery language replaced with concrete claims',
        ];
    }

    /**
     * Add personal voice and perspective.
     *
     * @param  array<string, mixed>  $providerConfig
     * @return array{field: string, value: string, message: string}
     */
    protected function addPersonalVoice(Article $article, AiProvider $aiProvider, array $providerConfig): array
    {
        $content = $article->content_markdown ?: $article->content;

        $prompt = <<<PROMPT
Rewrite this article to sound more personal and human. The current text reads too impersonal and corporate.

What to add:
- First-person perspective where appropriate ("I've found that...", "In my experience...")
- Conversational asides and observations
- Occasional informal language and contractions
- Brief anecdotes or "from what I've seen" type insights
- Direct address to the reader ("you" instead of "one" or passive voice)

Rules:
- Don't overdo it, aim for 3-5 personal touches throughout
- Keep the article's expertise and authority intact
- Maintain all headings, links, formatting, and structure
- Don't make up specific personal stories, keep it general ("I've noticed...", "what works well is...")
- Return the COMPLETE article content
PROMPT;

        $newContent = $this->callAi($aiProvider, $providerConfig, $prompt."\n\nArticle content:\n".$content);

        return [
            'field' => 'content',
            'value' => trim($newContent),
            'message' => 'Personal voice and perspective added',
        ];
    }

    /**
     * Clean technical AI artifacts (no AI call needed).
     *
     * @return array{field: string, value: string, message: string}
     */
    protected function cleanArtifacts(Article $article): array
    {
        $content = $article->content_markdown ?: $article->content;

        // Remove ChatGPT-specific markers
        $content = preg_replace('/turn\d+search\d*/i', '', $content);
        $content = preg_replace('/\[oaicite:[^\]]*\]/i', '', $content);
        $content = preg_replace('/utm_source=chatgpt[^\s)"]*/i', '', $content);

        // Remove AI self-references
        $content = preg_replace('/\bAs an AI (language )?model\b[^.]*\./i', '', $content);
        $content = preg_replace('/\bAs a large language model\b[^.]*\./i', '', $content);
        $content = preg_replace('/\bI (don\'t|cannot|can\'t) (access|browse|search) the internet\b[^.]*\./i', '', $content);

        // Clean up double spaces and blank lines left by removals
        $content = preg_replace('/  +/', ' ', $content);
        $content = preg_replace('/\n{3,}/', "\n\n", $content);

        return [
            'field' => 'content',
            'value' => trim($content),
            'message' => 'Technical AI artifacts cleaned',
        ];
    }

    /**
     * Replace generic transitions with topic-specific connections.
     *
     * @param  array<string, mixed>  $providerConfig
     * @return array{field: string, value: string, message: string}
     */
    protected function improveTransitions(Article $article, AiProvider $aiProvider, array $providerConfig): array
    {
        $content = $article->content_markdown ?: $article->content;

        $prompt = <<<PROMPT
Rewrite this article to replace generic, AI-sounding transitions with natural, topic-specific connections.

Generic transitions to replace: Furthermore, Moreover, Additionally, Consequently, Nevertheless, In addition, As a result, On the other hand, In contrast, Similarly, Likewise, In conclusion, To summarize, Overall, Ultimately, Indeed, Notably, Significantly, Essentially, Fundamentally.

What to do instead:
- Connect ideas through the topic itself ("This pricing model also affects...", "The same principle applies when...")
- Use cause-and-effect naturally ("Because X, you'll want to...", "This matters because...")
- Reference previous points concretely ("Building on the setup process above...")
- Sometimes just start a new thought without a transition at all
- Keep all headings, links, formatting, and content intact
- Return the COMPLETE article content
PROMPT;

        $newContent = $this->callAi($aiProvider, $providerConfig, $prompt."\n\nArticle content:\n".$content);

        return [
            'field' => 'content',
            'value' => trim($newContent),
            'message' => 'Generic transitions replaced with natural connections',
        ];
    }

    /**
     * Restructure AI template patterns into more natural article structure.
     *
     * @param  array<string, mixed>  $providerConfig
     * @return array{field: string, value: string, message: string}
     */
    protected function restructureTemplate(Article $article, AiProvider $aiProvider, array $providerConfig): array
    {
        $content = $article->content_markdown ?: $article->content;

        $prompt = <<<PROMPT
Rewrite this article to remove common AI-generated template patterns while keeping all the information intact.

Specific patterns to fix:
- Remove or rewrite the FAQ section at the end. Integrate the most useful Q&A answers into the main body of the article instead.
- Remove image placeholder descriptions (lines that read like "Featured image of..." or "Infographic showing..." or "Screenshot-style mockup of..."). These are AI-generated image prompts, not real content.
- Remove formulaic callout labels like "Key Takeaway:", "Pro Tip:", "Quick Tip:", "Expert Tip:". Integrate those insights naturally into the surrounding paragraphs.
- Break up the rigid section template where every section follows "intro paragraph → bullet list → concluding paragraph". Vary the structure: some sections can be all prose, some can lead with a list, some can end with a question.
- Rewrite any soft-sell CTA sections (like "Where [Brand] Fits...") to sound less like a templated product placement.

Rules:
- Keep ALL factual information and advice from the original
- Maintain headings, links, and markdown formatting
- The article should feel like it was written by one person with a consistent voice, not assembled from a template
- Return the COMPLETE article content
PROMPT;

        $newContent = $this->callAi($aiProvider, $providerConfig, $prompt."\n\nArticle content:\n".$content);

        return [
            'field' => 'content',
            'value' => trim($newContent),
            'message' => 'AI template patterns restructured for natural flow',
        ];
    }

    /**
     * @param  array<string, mixed>  $providerConfig
     */
    protected function callAi(AiProvider $aiProvider, array $providerConfig, string $prompt): string
    {
        $response = $this->prism->text()
            ->using($aiProvider->provider, $aiProvider->model, $providerConfig)
            ->withClientOptions(['timeout' => 60])
            ->withMaxTokens(2000)
            ->withSystemPrompt('You are an SEO expert helping to optimize article content. Be concise and follow instructions exactly.')
            ->withPrompt($prompt)
            ->asText();

        return $response->text;
    }

    protected function insertBeforeConclusion(string $content, string $newSection): string
    {
        $patterns = [
            '/^(##\s+(?:Final Thoughts|Wrapping Up|Summary|Key Takeaways).*)/mi',
            '/^(##\s+FAQ.*)/mi',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $content, $matches, \PREG_OFFSET_CAPTURE)) {
                $position = $matches[0][1];

                return substr($content, 0, $position)."\n\n".$newSection."\n\n".substr($content, $position);
            }
        }

        return $content."\n\n".$newSection;
    }

    protected function insertBeforeFaq(string $content, string $newSection): string
    {
        if (preg_match('/^(##\s+(?:FAQ|Frequently Asked Questions).*)/mi', $content, $matches, \PREG_OFFSET_CAPTURE)) {
            $position = $matches[0][1];

            return substr($content, 0, $position)."\n\n".$newSection."\n\n".substr($content, $position);
        }

        return $this->insertBeforeConclusion($content, $newSection);
    }

    /**
     * @param  array<array<string>>  $matches
     */
    protected function formatH2List(array $matches): string
    {
        $list = [];
        foreach ($matches as $match) {
            $list[] = '- '.$match[2];
        }

        return implode("\n", $list);
    }
}
