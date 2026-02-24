import { cn } from '@/lib/utils';
import {
    AlertTriangle,
    BarChart3,
    BookOpen,
    Bot,
    Bug,
    ChevronDown,
    ChevronUp,
    Fingerprint,
    GitMerge,
    LayoutTemplate,
    Link2,
    Loader2,
    ShieldAlert,
    Sparkles,
    Type,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

interface AiSlopBreakdownCategory {
    score: number;
    max: number;
    details: Record<string, unknown>;
}

interface AiSlopBreakdown {
    technical_artifacts: AiSlopBreakdownCategory;
    vocabulary_patterns: AiSlopBreakdownCategory;
    structural_analysis: AiSlopBreakdownCategory;
    content_patterns: AiSlopBreakdownCategory;
    citation_verification: AiSlopBreakdownCategory;
    formatting_analysis: AiSlopBreakdownCategory;
    stylometric: AiSlopBreakdownCategory;
    coherence: AiSlopBreakdownCategory;
    template_patterns: AiSlopBreakdownCategory;
    confidence_adjustment: AiSlopBreakdownCategory;
}

interface AiSlopScoreProps {
    score: number | null;
    breakdown?: AiSlopBreakdown;
    onImprove?: (improvementType: string) => Promise<void>;
    isImproving?: boolean;
}

// Grade system for AI slop scores (inverted - lower = better)
function getSlopGrade(score: number) {
    if (score <= 25)
        return {
            label: 'Minimal',
            description: 'Reads naturally',
            colorClass: 'text-green-600',
            bgClass: 'bg-green-500',
            ringClass: 'stroke-green-500',
        };
    if (score <= 50)
        return {
            label: 'Low',
            description: 'Minor AI patterns detected',
            colorClass: 'text-lime-600',
            bgClass: 'bg-lime-500',
            ringClass: 'stroke-lime-500',
        };
    if (score <= 75)
        return {
            label: 'Moderate',
            description: 'Notable AI patterns',
            colorClass: 'text-orange-500',
            bgClass: 'bg-orange-500',
            ringClass: 'stroke-orange-500',
        };
    return {
        label: 'High',
        description: 'Heavy AI writing detected',
        colorClass: 'text-red-500',
        bgClass: 'bg-red-500',
        ringClass: 'stroke-red-500',
    };
}

// Inverted grade for category bars (lower score = greener)
function getCategoryGrade(score: number, max: number) {
    const percentage = max > 0 ? Math.round((score / max) * 100) : 0;
    if (percentage <= 25)
        return {
            colorClass: 'text-green-600',
            bgClass: 'bg-green-500',
        };
    if (percentage <= 50)
        return {
            colorClass: 'text-lime-600',
            bgClass: 'bg-lime-500',
        };
    if (percentage <= 75)
        return {
            colorClass: 'text-orange-500',
            bgClass: 'bg-orange-500',
        };
    return {
        colorClass: 'text-red-500',
        bgClass: 'bg-red-500',
    };
}

// Circular progress for AI slop (inverted colors)
function AiSlopCircularProgress({
    score,
    size = 110,
}: {
    score: number;
    size?: number;
}) {
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;
    const grade = getSlopGrade(score);

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative" style={{ width: size, height: size }}>
                <svg
                    className="-rotate-90 transform"
                    width={size}
                    height={size}
                >
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                        className="fill-none stroke-muted"
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className={cn(
                            'fill-none transition-all duration-700 ease-out',
                            grade.ringClass,
                        )}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold tracking-tight">
                        {score}
                    </span>
                    <span className="text-sm text-muted-foreground">/100</span>
                </div>
            </div>
            <div className="text-center">
                <span className={cn('text-base font-semibold', grade.colorClass)}>
                    {grade.label}
                </span>
                <p className="text-sm text-muted-foreground">
                    {grade.description}
                </p>
            </div>
        </div>
    );
}

// Category bar with inverted color logic
function AiSlopCategoryBar({
    label,
    score,
    max,
    icon: Icon,
    metrics,
}: {
    label: string;
    score: number;
    max: number;
    icon: React.ComponentType<{ className?: string }>;
    metrics?: string;
}) {
    const percentage = max > 0 ? Math.round((score / max) * 100) : 0;
    const grade = getCategoryGrade(score, max);

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{label}</span>
                </div>
                <span className={cn('font-semibold', grade.colorClass)}>
                    {score}/{max}
                </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                    className={cn(
                        'h-full rounded-full transition-all duration-500',
                        grade.bgClass,
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {metrics && (
                <p className="text-xs text-muted-foreground">{metrics}</p>
            )}
        </div>
    );
}

// Format category metrics for display
function formatSlopMetrics(
    categoryKey: string,
    details: Record<string, unknown>,
): string {
    if (details.insufficient_content) {
        return 'Insufficient content for analysis';
    }

    switch (categoryKey) {
        case 'technical_artifacts': {
            const artifacts = details.found_artifacts as string[];
            return artifacts?.length > 0
                ? `Found: ${artifacts.join(', ')}`
                : 'No artifacts detected';
        }
        case 'vocabulary_patterns': {
            const density = details.density as number;
            const totalMatches = details.total_matches as number;
            const flaggedWords = details.flagged_words as Record<
                string,
                number
            >;
            const topWords = Object.keys(flaggedWords || {}).slice(0, 5);
            const parts = [
                `${totalMatches} matches`,
                `${density?.toFixed(1)}% density`,
            ];
            if (topWords.length > 0) {
                parts.push(topWords.join(', '));
            }
            return parts.join(' · ');
        }
        case 'structural_analysis': {
            const cv = details.sentence_length_cv as number;
            const starters = details.repetitive_starters as number;
            const parts = [];
            if (cv !== undefined)
                parts.push(`CV: ${cv}%${cv < 30 ? ' (uniform)' : ''}`);
            if (starters !== undefined && starters > 0)
                parts.push(`${starters} repetitive starters`);
            return parts.length > 0 ? parts.join(' · ') : 'Good variation';
        }
        case 'content_patterns': {
            const puffery = details.puffery_count as number;
            const intros = details.formulaic_intros as number;
            const hedging = details.hedging_count as number;
            const parts = [];
            if (puffery > 0) parts.push(`${puffery} puffery`);
            if (intros > 0) parts.push(`${intros} formulaic intros`);
            if (hedging > 0) parts.push(`${hedging} hedging phrases`);
            return parts.length > 0 ? parts.join(' · ') : 'Natural patterns';
        }
        case 'citation_verification': {
            const vagueCount = details.vague_count as number;
            const unsourced = details.unsourced_stats as number;
            const parts = [];
            if (vagueCount > 0)
                parts.push(`${vagueCount} vague attributions`);
            if (unsourced > 0) parts.push(`${unsourced} unsourced stats`);
            return parts.length > 0 ? parts.join(' · ') : 'Citations look good';
        }
        case 'formatting_analysis': {
            const titleCase = details.title_case_headings as number;
            const bold = details.bold_count as number;
            const emoji = details.emoji_count as number;
            const parts = [];
            if (titleCase > 0) parts.push(`${titleCase} Title Case headings`);
            if (bold > 5) parts.push(`${bold} bold phrases`);
            if (emoji > 0) parts.push(`${emoji} emojis`);
            return parts.length > 0 ? parts.join(' · ') : 'Formatting natural';
        }
        case 'stylometric': {
            const density = details.pronoun_density as number;
            const corporate = details.corporate_voice as boolean;
            const parts = [];
            if (density !== undefined)
                parts.push(`Pronoun density: ${density}%`);
            if (corporate) parts.push('Corporate voice detected');
            return parts.length > 0 ? parts.join(' · ') : 'Voice sounds natural';
        }
        case 'coherence': {
            const count = details.transition_count as number;
            const density = details.transition_density as number;
            return count > 0
                ? `${count} generic transitions · ${density?.toFixed(1)}% density`
                : 'Transitions sound natural';
        }
        case 'template_patterns': {
            const parts = [];
            const faqCount = details.faq_question_count as number;
            const placeholders = details.image_placeholder_count as number;
            const callouts = details.callout_total_count as number;
            const bulletRatio = details.bullet_sandwich_ratio as number;
            if (faqCount > 0) parts.push(`${faqCount} FAQ questions`);
            if (placeholders > 0)
                parts.push(`${placeholders} image placeholders`);
            if (callouts > 0) parts.push(`${callouts} callout patterns`);
            if (bulletRatio > 0.5)
                parts.push(
                    `${Math.round(bulletRatio * 100)}% uniform sections`,
                );
            return parts.length > 0
                ? parts.join(' · ')
                : 'No template patterns';
        }
        case 'confidence_adjustment': {
            const layers = details.corroborating_layers as number;
            return `${layers} layer${layers !== 1 ? 's' : ''} flagged (3+ needed for confidence boost)`;
        }
        default:
            return '';
    }
}

// Quick fixes for AI slop issues
function AiSlopQuickFixes({
    breakdown,
    onImprove,
    isImproving,
}: {
    breakdown: AiSlopBreakdown;
    onImprove?: (improvementType: string) => Promise<void>;
    isImproving?: boolean;
}) {
    const [improvingType, setImprovingType] = useState<string | null>(null);

    const fixes: Array<{
        label: string;
        points: number;
        category: string;
        improvementType: string;
    }> = [];

    // Only suggest fixes for categories scoring > 50% of their max
    if (
        breakdown.vocabulary_patterns.max > 0 &&
        breakdown.vocabulary_patterns.score / breakdown.vocabulary_patterns.max >
            0.5
    ) {
        fixes.push({
            label: 'Replace AI-sounding vocabulary',
            points: breakdown.vocabulary_patterns.score,
            category: 'vocabulary',
            improvementType: 'humanize_vocabulary',
        });
    }

    if (
        breakdown.structural_analysis.max > 0 &&
        breakdown.structural_analysis.score /
            breakdown.structural_analysis.max >
            0.5
    ) {
        fixes.push({
            label: 'Vary sentence structure',
            points: breakdown.structural_analysis.score,
            category: 'structure',
            improvementType: 'vary_sentence_structure',
        });
    }

    if (
        breakdown.content_patterns.max > 0 &&
        breakdown.content_patterns.score / breakdown.content_patterns.max > 0.5
    ) {
        fixes.push({
            label: 'Remove puffery language',
            points: breakdown.content_patterns.score,
            category: 'content',
            improvementType: 'remove_puffery',
        });
    }

    if (
        breakdown.stylometric.max > 0 &&
        breakdown.stylometric.score / breakdown.stylometric.max > 0.5
    ) {
        fixes.push({
            label: 'Add personal voice',
            points: breakdown.stylometric.score,
            category: 'stylometric',
            improvementType: 'add_personal_voice',
        });
    }

    if (
        breakdown.technical_artifacts.max > 0 &&
        breakdown.technical_artifacts.score /
            breakdown.technical_artifacts.max >
            0.5
    ) {
        fixes.push({
            label: 'Clean AI artifacts',
            points: breakdown.technical_artifacts.score,
            category: 'artifacts',
            improvementType: 'clean_artifacts',
        });
    }

    if (
        breakdown.coherence.max > 0 &&
        breakdown.coherence.score / breakdown.coherence.max > 0.5
    ) {
        fixes.push({
            label: 'Improve transitions',
            points: breakdown.coherence.score,
            category: 'coherence',
            improvementType: 'improve_transitions',
        });
    }

    if (
        breakdown.template_patterns &&
        breakdown.template_patterns.max > 0 &&
        breakdown.template_patterns.score / breakdown.template_patterns.max >
            0.5
    ) {
        fixes.push({
            label: 'Restructure AI template patterns',
            points: breakdown.template_patterns.score,
            category: 'template',
            improvementType: 'restructure_template',
        });
    }

    const handleFix = async (improvementType: string) => {
        if (!onImprove || !improvementType) return;
        setImprovingType(improvementType);
        try {
            await onImprove(improvementType);
        } finally {
            setImprovingType(null);
        }
    };

    if (fixes.length === 0) {
        return (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                <p className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                    <Sparkles className="h-4 w-4" />
                    Content reads naturally!
                </p>
            </div>
        );
    }

    // Sort by severity (highest points first)
    const topFixes = fixes.sort((a, b) => b.points - a.points).slice(0, 5);

    return (
        <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Top Fixes
            </h4>
            <div className="space-y-2">
                {topFixes.map((item, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between gap-2 rounded-lg border bg-card p-3 text-sm"
                    >
                        <span className="flex-1 text-muted-foreground">
                            {item.label}
                        </span>
                        <span className="font-medium text-orange-600">
                            -{item.points} pts
                        </span>
                        {onImprove && item.improvementType && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => handleFix(item.improvementType)}
                                disabled={isImproving || improvingType !== null}
                                title="Fix with AI"
                            >
                                {improvingType === item.improvementType ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Bot className="h-4 w-4" />
                                )}
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Detailed patterns list (collapsible)
function AiSlopPatternDetails({
    breakdown,
}: {
    breakdown: AiSlopBreakdown;
}) {
    const [isOpen, setIsOpen] = useState(false);

    const flaggedWords = Object.entries(
        (breakdown.vocabulary_patterns.details.flagged_words as Record<
            string,
            number
        >) || {},
    );
    const flaggedPhrases = Object.entries(
        (breakdown.vocabulary_patterns.details.flagged_phrases as Record<
            string,
            number
        >) || {},
    );
    const transitions = Object.entries(
        (breakdown.coherence.details.generic_transitions as Record<
            string,
            number
        >) || {},
    );
    const puffery = Object.entries(
        (breakdown.content_patterns.details.puffery_words as Record<
            string,
            number
        >) || {},
    );
    const imagePlaceholders =
        (breakdown.template_patterns?.details.image_placeholders as string[]) ||
        [];
    const calloutTypes = Object.entries(
        (breakdown.template_patterns?.details.callout_types as Record<
            string,
            number
        >) || {},
    );
    const ctaHeadings =
        (breakdown.template_patterns?.details.cta_headings as string[]) || [];
    const faqFound =
        (breakdown.template_patterns?.details.faq_heading_found as boolean) ||
        false;

    const totalPatterns =
        flaggedWords.length +
        flaggedPhrases.length +
        transitions.length +
        puffery.length +
        imagePlaceholders.length +
        calloutTypes.length +
        ctaHeadings.length +
        (faqFound ? 1 : 0);

    if (totalPatterns === 0) return null;

    return (
        <div className="border-t pt-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground"
            >
                <span>Flagged Patterns ({totalPatterns} found)</span>
                {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                ) : (
                    <ChevronDown className="h-4 w-4" />
                )}
            </button>
            {isOpen && (
                <div className="mt-4 space-y-4">
                    {flaggedWords.length > 0 && (
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                                AI Vocabulary
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {flaggedWords.map(([word, count]) => (
                                    <span
                                        key={word}
                                        className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs text-orange-700 ring-1 ring-inset ring-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:ring-orange-800"
                                    >
                                        {word}
                                        {count > 1 && (
                                            <span className="ml-1 font-semibold">
                                                x{count}
                                            </span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {flaggedPhrases.length > 0 && (
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                                AI Phrases
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {flaggedPhrases.map(([phrase, count]) => (
                                    <span
                                        key={phrase}
                                        className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-950 dark:text-red-400 dark:ring-red-800"
                                    >
                                        "{phrase}"
                                        {count > 1 && (
                                            <span className="ml-1 font-semibold">
                                                x{count}
                                            </span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {puffery.length > 0 && (
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                                Puffery
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {puffery.map(([word, count]) => (
                                    <span
                                        key={word}
                                        className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:ring-amber-800"
                                    >
                                        {word}
                                        {count > 1 && (
                                            <span className="ml-1 font-semibold">
                                                x{count}
                                            </span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {transitions.length > 0 && (
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                                Generic Transitions
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {transitions.map(([word, count]) => (
                                    <span
                                        key={word}
                                        className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-800"
                                    >
                                        {word}
                                        {count > 1 && (
                                            <span className="ml-1 font-semibold">
                                                x{count}
                                            </span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {(imagePlaceholders.length > 0 ||
                        calloutTypes.length > 0 ||
                        ctaHeadings.length > 0 ||
                        faqFound) && (
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                                Template Patterns
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {faqFound && (
                                    <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs text-purple-700 ring-1 ring-inset ring-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:ring-purple-800">
                                        FAQ section
                                    </span>
                                )}
                                {imagePlaceholders.map((text, i) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs text-purple-700 ring-1 ring-inset ring-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:ring-purple-800"
                                        title={text}
                                    >
                                        Image placeholder
                                    </span>
                                ))}
                                {calloutTypes.map(([type]) => (
                                    <span
                                        key={type}
                                        className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs text-purple-700 ring-1 ring-inset ring-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:ring-purple-800"
                                    >
                                        {type.replace('_', ' ')}
                                    </span>
                                ))}
                                {ctaHeadings.map((heading, i) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs text-purple-700 ring-1 ring-inset ring-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:ring-purple-800"
                                        title={heading}
                                    >
                                        Soft-sell CTA
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Main AI Slop Score component
export function AiSlopScore({
    score,
    breakdown,
    onImprove,
    isImproving,
}: AiSlopScoreProps) {
    if (score === null) {
        return (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
                No AI slop score available
            </div>
        );
    }

    const categories = [
        {
            key: 'technical_artifacts',
            label: 'Technical Artifacts',
            icon: Bug,
            data: breakdown?.technical_artifacts,
        },
        {
            key: 'vocabulary_patterns',
            label: 'Vocabulary',
            icon: BookOpen,
            data: breakdown?.vocabulary_patterns,
        },
        {
            key: 'structural_analysis',
            label: 'Structure',
            icon: BarChart3,
            data: breakdown?.structural_analysis,
        },
        {
            key: 'content_patterns',
            label: 'Content Patterns',
            icon: AlertTriangle,
            data: breakdown?.content_patterns,
        },
        {
            key: 'citation_verification',
            label: 'Citations',
            icon: Link2,
            data: breakdown?.citation_verification,
        },
        {
            key: 'formatting_analysis',
            label: 'Formatting',
            icon: Type,
            data: breakdown?.formatting_analysis,
        },
        {
            key: 'stylometric',
            label: 'Stylometric',
            icon: Fingerprint,
            data: breakdown?.stylometric,
        },
        {
            key: 'coherence',
            label: 'Coherence',
            icon: GitMerge,
            data: breakdown?.coherence,
        },
        {
            key: 'template_patterns',
            label: 'Template Patterns',
            icon: LayoutTemplate,
            data: breakdown?.template_patterns,
        },
        {
            key: 'confidence_adjustment',
            label: 'Confidence',
            icon: ShieldAlert,
            data: breakdown?.confidence_adjustment,
        },
    ];

    return (
        <div className="space-y-4">
            {/* Circular gauge - centered on top */}
            <div className="flex justify-center">
                <AiSlopCircularProgress score={score} />
            </div>

            {/* Score Breakdown - 2-column responsive grid */}
            <div className="@container">
                <h4 className="mb-3 text-sm font-semibold text-muted-foreground">
                    Score Breakdown
                </h4>
                <div className="grid grid-cols-1 gap-x-4 gap-y-3 @sm:grid-cols-2">
                    {categories.map(
                        ({ key, label, icon, data }) =>
                            data && (
                                <AiSlopCategoryBar
                                    key={key}
                                    label={label}
                                    score={data.score}
                                    max={data.max}
                                    icon={icon}
                                    metrics={formatSlopMetrics(
                                        key,
                                        data.details,
                                    )}
                                />
                            ),
                    )}
                </div>
            </div>

            {/* Quick fixes */}
            {breakdown && (
                <AiSlopQuickFixes
                    breakdown={breakdown}
                    onImprove={onImprove}
                    isImproving={isImproving}
                />
            )}

            {/* Detailed pattern list */}
            {breakdown && <AiSlopPatternDetails breakdown={breakdown} />}
        </div>
    );
}

// Mini score for stat cards
export function AiSlopScoreMini({ score }: { score: number | null }) {
    if (score === null) {
        return <span className="text-2xl font-bold">-</span>;
    }

    const grade = getSlopGrade(score);
    const size = 48;
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex items-center gap-3">
            <div className="relative" style={{ width: size, height: size }}>
                <svg
                    className="-rotate-90 transform"
                    width={size}
                    height={size}
                >
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                        className="fill-none stroke-muted"
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className={cn(
                            'fill-none transition-all duration-500',
                            grade.ringClass,
                        )}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold">{score}</span>
                </div>
            </div>
            <div className="flex flex-col">
                <span className={cn('text-sm font-semibold', grade.colorClass)}>
                    {grade.label}
                </span>
                <span className="text-xs text-muted-foreground">
                    AI Slop
                </span>
            </div>
        </div>
    );
}
