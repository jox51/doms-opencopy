import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { useEffect, useRef } from 'react';
import {
    Sparkles,
    Calendar,
    Image,
    Link2,
    BarChart3,
    Rocket,
    Check,
    ArrowRight,
} from 'lucide-react';

const features = [
    {
        icon: Sparkles,
        title: 'AI-Powered Writing',
        description:
            'Generate SEO-optimized articles using OpenAI, Claude, or Ollama. Bring your own API key — no monthly fees.',
        colSpan: 'lg:col-span-2',
    },
    {
        icon: Calendar,
        title: 'Content Planner',
        description:
            'Plan and schedule your content weeks in advance. Drag-and-drop calendar makes content planning effortless.',
        colSpan: '',
    },
    {
        icon: Image,
        title: 'Auto-Generated Images',
        description:
            'AI creates featured images and inline visuals. Infographics, diagrams, and illustrations — all generated automatically.',
        colSpan: '',
    },
    {
        icon: Link2,
        title: 'Smart Internal Linking',
        description:
            'Build your internal link database. AI naturally weaves relevant links into your content for better SEO.',
        colSpan: 'lg:col-span-2',
    },
    {
        icon: BarChart3,
        title: 'SEO Scoring',
        description:
            'Real-time SEO analysis with actionable recommendations. Optimize keywords, readability, and structure.',
        colSpan: '',
    },
    {
        icon: Rocket,
        title: 'Auto-Publishing',
        description:
            'Schedule articles to publish automatically. WordPress integration coming soon, webhooks for any CMS.',
        colSpan: '',
    },
];

const steps = [
    {
        number: '01',
        title: 'Add Your Keywords',
        description:
            'Import your target keywords or let AI suggest topics based on your niche.',
    },
    {
        number: '02',
        title: 'Schedule Content',
        description:
            'Drag keywords to your content calendar. Set publication dates that work for you.',
    },
    {
        number: '03',
        title: 'Generate & Publish',
        description:
            'AI writes SEO-optimized articles. Review, edit, and publish with one click.',
    },
];

function useScrollReveal() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 },
        );

        const children = el.querySelectorAll('.reveal-on-scroll');
        children.forEach((child) => observer.observe(child));

        return () => observer.disconnect();
    }, []);

    return ref;
}

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;
    const scrollRef = useScrollReveal();

    return (
        <>
            <Head title="AI-Powered SEO Content Generation">
                <meta
                    name="description"
                    content="DomsWriter — Self-hosted, open source AI content generation. Create SEO-optimized articles using OpenAI, Claude, or Ollama. Bring your own API key."
                />
            </Head>

            <div
                ref={scrollRef}
                className="min-h-screen bg-[#F8F7FF] dark:bg-[#0B0A1A]"
            >
                {/* Skip to content */}
                <a
                    href="#features"
                    className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:top-4 focus:left-4 focus:rounded-md focus:bg-[#6366F1] focus:px-4 focus:py-2 focus:text-white"
                >
                    Skip to content
                </a>

                {/* Navigation */}
                <nav className="fixed top-0 z-50 w-full border-b border-white/20 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-[#0B0A1A]/80">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
                        <Link href="/" className="flex items-center gap-2.5">
                            <AppLogoIcon className="size-9" />
                            <span className="font-serif text-xl font-bold text-[#1E1B4B] dark:text-[#E8E5FF]">
                                DomsWriter
                            </span>
                        </Link>

                        <div className="flex items-center gap-3">
                            {auth.user ? (
                                <Button asChild>
                                    <Link href={dashboard()}>
                                        Dashboard
                                        <ArrowRight className="ml-1 size-4" />
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <Button variant="ghost" asChild className="text-[#1E1B4B] hover:bg-[#6366F1]/10 dark:text-[#E8E5FF] dark:hover:bg-[#6366F1]/20">
                                        <Link href={login()}>Log in</Link>
                                    </Button>
                                    {canRegister && (
                                        <Button asChild className="bg-gradient-to-r from-[#6366F1] to-[#00AAFF] text-white shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.6)]">
                                            <Link href={register()}>
                                                Get Started
                                                <ArrowRight className="ml-1 size-4" />
                                            </Link>
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="relative overflow-hidden pt-32 pb-20 lg:pt-44 lg:pb-32">
                    {/* Aurora gradient blobs */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="aurora-blob-1 absolute -top-1/4 -left-1/4 size-[600px] rounded-full bg-[#6366F1]/20 blur-[80px] lg:size-[900px] lg:blur-[120px]" />
                        <div className="aurora-blob-2 absolute top-1/4 -right-1/4 size-[500px] rounded-full bg-[#00AAFF]/20 blur-[80px] lg:size-[800px] lg:blur-[120px]" />
                        <div className="aurora-blob-3 absolute -bottom-1/4 left-1/3 size-[400px] rounded-full bg-[#F59E0B]/15 blur-[80px] lg:size-[700px] lg:blur-[120px]" />
                    </div>

                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="mx-auto max-w-4xl text-center">
                            {/* Frosted glass badge */}
                            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-5 py-2.5 text-sm shadow-lg backdrop-blur-xl dark:border-white/15 dark:bg-white/10">
                                <span className="flex size-2 animate-pulse rounded-full bg-emerald-400" />
                                <span className="text-[#1E1B4B] dark:text-[#E8E5FF]">
                                    Open Source & Self-Hosted
                                </span>
                            </div>

                            {/* Headline */}
                            <h1 className="mb-6 text-5xl font-bold tracking-tight text-[#1E1B4B] sm:text-6xl lg:text-7xl dark:text-[#E8E5FF]">
                                AI Content Generation
                                <span className="gradient-shimmer-text mt-2 block bg-gradient-to-r from-[#6366F1] via-[#00AAFF] to-[#F59E0B] bg-clip-text font-serif italic text-transparent">
                                    Without the Monthly Fees
                                </span>
                            </h1>

                            {/* Subheadline */}
                            <p className="mx-auto mb-10 max-w-2xl text-lg text-[#64608A] sm:text-xl dark:text-[#9B95C4]">
                                Self-hosted SEO content platform. Generate optimized articles using OpenAI, Claude, or Ollama.
                                Bring your own API key — pay only for what you use.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                                {auth.user ? (
                                    <Button
                                        size="lg"
                                        asChild
                                        className="h-12 bg-gradient-to-r from-[#6366F1] to-[#00AAFF] px-8 text-base text-white shadow-[0_0_30px_-5px_rgba(99,102,241,0.5)] transition-shadow hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.7)]"
                                    >
                                        <Link href={dashboard()}>
                                            Go to Dashboard
                                            <ArrowRight className="ml-1 size-5" />
                                        </Link>
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            size="lg"
                                            asChild
                                            className="h-12 bg-gradient-to-r from-[#6366F1] to-[#00AAFF] px-8 text-base text-white shadow-[0_0_30px_-5px_rgba(99,102,241,0.5)] transition-shadow hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.7)]"
                                        >
                                            <Link href={register()}>
                                                Start Free
                                                <ArrowRight className="ml-1 size-5" />
                                            </Link>
                                        </Button>
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            asChild
                                            className="h-12 border-[#6366F1]/30 bg-white/30 px-8 text-base text-[#1E1B4B] backdrop-blur-sm hover:bg-white/50 dark:border-white/20 dark:bg-white/10 dark:text-[#E8E5FF] dark:hover:bg-white/20"
                                        >
                                            <a
                                                href="https://github.com/qloudanton/opencopy"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <svg
                                                    className="mr-1 size-5"
                                                    viewBox="0 0 24 24"
                                                    fill="currentColor"
                                                >
                                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                                </svg>
                                                View on GitHub
                                            </a>
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* Trust indicators — frosted glass bar */}
                            <div className="mx-auto mt-12 inline-flex flex-wrap items-center justify-center gap-x-8 gap-y-4 rounded-2xl border border-white/30 bg-white/20 px-8 py-4 text-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                                <div className="flex items-center gap-2">
                                    <Check className="size-4 text-emerald-400" />
                                    <span className="text-[#1E1B4B] dark:text-[#E8E5FF]">
                                        No subscription required
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="size-4 text-emerald-400" />
                                    <span className="text-[#1E1B4B] dark:text-[#E8E5FF]">
                                        Your data, your server
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="size-4 text-emerald-400" />
                                    <span className="text-[#1E1B4B] dark:text-[#E8E5FF]">
                                        Works with any AI provider
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section — Bento Grid + Glass Cards */}
                <section id="features" className="relative py-20 lg:py-32">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="reveal-on-scroll mb-16 text-center">
                            <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#1E1B4B] sm:text-4xl lg:text-5xl dark:text-[#E8E5FF]">
                                Everything you need for content at scale
                            </h2>
                            <p className="mx-auto max-w-2xl text-lg text-[#64608A] dark:text-[#9B95C4]">
                                From keyword research to auto-publishing, DomsWriter handles your entire content workflow.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature, index) => (
                                <div
                                    key={feature.title}
                                    className={`reveal-on-scroll group rounded-3xl border border-white/30 bg-white/60 p-8 shadow-sm backdrop-blur-xl transition-all duration-300 hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)] dark:border-white/10 dark:bg-[#1E1B3A]/60 dark:hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.2)] ${feature.colSpan}`}
                                    style={{
                                        transitionDelay: `${index * 80}ms`,
                                    }}
                                >
                                    <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6366F1]/15 to-[#00AAFF]/15 transition-transform duration-300 group-hover:scale-110">
                                        <feature.icon className="size-6 text-[#6366F1] dark:text-[#818CF8]" />
                                    </div>
                                    <h3 className="mb-2 text-lg font-semibold text-[#1E1B4B] dark:text-[#E8E5FF]">
                                        {feature.title}
                                    </h3>
                                    <p className="leading-relaxed text-[#64608A] dark:text-[#9B95C4]">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How It Works Section — Timeline Cards */}
                <section className="relative py-20 lg:py-32">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="reveal-on-scroll mb-16 text-center">
                            <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#1E1B4B] sm:text-4xl lg:text-5xl dark:text-[#E8E5FF]">
                                Three steps to content automation
                            </h2>
                            <p className="mx-auto max-w-2xl text-lg text-[#64608A] dark:text-[#9B95C4]">
                                Set it up once, generate content forever.
                            </p>
                        </div>

                        <div className="relative">
                            {/* Connecting gradient line (desktop only) */}
                            <div className="absolute top-[52px] right-[16.66%] left-[16.66%] hidden h-px bg-gradient-to-r from-[#6366F1] via-[#00AAFF] to-[#F59E0B] lg:block" />

                            <div className="grid gap-8 lg:grid-cols-3">
                                {steps.map((step, index) => (
                                    <div
                                        key={step.number}
                                        className="reveal-on-scroll relative flex flex-col items-center text-center"
                                        style={{
                                            transitionDelay: `${index * 150}ms`,
                                        }}
                                    >
                                        {/* Step number badge */}
                                        <div className="relative z-10 mb-6 flex size-[104px] items-center justify-center rounded-3xl border border-white/30 bg-white/60 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-[#1E1B3A]/60">
                                            <span className="bg-gradient-to-r from-[#6366F1] to-[#00AAFF] bg-clip-text font-mono text-3xl font-bold text-transparent">
                                                {step.number}
                                            </span>
                                        </div>

                                        <h3 className="mb-3 text-xl font-semibold text-[#1E1B4B] dark:text-[#E8E5FF]">
                                            {step.title}
                                        </h3>
                                        <p className="max-w-sm leading-relaxed text-[#64608A] dark:text-[#9B95C4]">
                                            {step.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section — Full-bleed Aurora Band */}
                <section className="relative overflow-hidden py-20 lg:py-32">
                    {/* Aurora blobs in CTA */}
                    <div className="pointer-events-none absolute inset-0">
                        <div className="aurora-blob-1 absolute -top-1/2 -left-1/4 size-[500px] rounded-full bg-[#6366F1]/25 blur-[80px] lg:size-[700px] lg:blur-[120px]" />
                        <div className="aurora-blob-2 absolute -right-1/4 -bottom-1/2 size-[500px] rounded-full bg-[#00AAFF]/20 blur-[80px] lg:size-[700px] lg:blur-[120px]" />
                    </div>

                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="reveal-on-scroll overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1E1B4B] to-[#0B0A1A] px-8 py-16 text-center sm:px-16 lg:py-24">
                            {/* Inner decorative blobs */}
                            <div className="pointer-events-none absolute inset-0">
                                <div className="absolute top-0 left-1/4 size-64 rounded-full bg-[#6366F1]/20 blur-3xl" />
                                <div className="absolute right-1/4 bottom-0 size-64 rounded-full bg-[#F59E0B]/20 blur-3xl" />
                            </div>

                            <div className="relative">
                                <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                                    Ready to automate your content?
                                </h2>
                                <p className="mx-auto mb-8 max-w-xl text-lg text-[#9B95C4]">
                                    Join developers and content creators who use DomsWriter to generate
                                    SEO-optimized content without the overhead of expensive subscriptions.
                                </p>
                                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                                    {auth.user ? (
                                        <Button
                                            size="lg"
                                            asChild
                                            className="pulse-glow-btn h-12 rounded-full bg-[#F59E0B] px-8 text-base font-semibold text-[#1E1B4B] hover:bg-[#FBBF24]"
                                        >
                                            <Link href={dashboard()}>
                                                Open Dashboard
                                                <ArrowRight className="ml-1 size-5" />
                                            </Link>
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                size="lg"
                                                asChild
                                                className="pulse-glow-btn h-12 rounded-full bg-[#F59E0B] px-8 text-base font-semibold text-[#1E1B4B] hover:bg-[#FBBF24]"
                                            >
                                                <Link href={register()}>
                                                    Get Started Free
                                                    <ArrowRight className="ml-1 size-5" />
                                                </Link>
                                            </Button>
                                            <Button
                                                size="lg"
                                                asChild
                                                className="h-12 rounded-full border border-white/20 bg-transparent px-8 text-base text-white hover:bg-white/10"
                                            >
                                                <a
                                                    href="https://github.com/qloudanton/opencopy"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <svg
                                                        className="mr-1 size-5 text-[#F59E0B]"
                                                        viewBox="0 0 24 24"
                                                        fill="currentColor"
                                                    >
                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                    </svg>
                                                    Star on GitHub
                                                </a>
                                            </Button>
                                        </>
                                    )}
                                </div>
                                <p className="mt-6 text-sm text-[#9B95C4]/70">
                                    Free forever. Self-hosted. No credit card required.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-white/10 py-12">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                            <div className="flex items-center gap-2.5">
                                <AppLogoIcon className="size-8" />
                                <span className="font-serif text-lg font-bold text-[#1E1B4B] dark:text-[#E8E5FF]">
                                    DomsWriter
                                </span>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-[#64608A] dark:text-[#9B95C4]">
                                <a
                                    href="https://github.com/qloudanton/opencopy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="transition-colors hover:text-[#1E1B4B] dark:hover:text-[#E8E5FF]"
                                >
                                    GitHub
                                </a>
                                <span>Open Source under MIT License</span>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
