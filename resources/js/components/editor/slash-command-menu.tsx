import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { IMAGE_STYLES } from '@/lib/image-styles';
import { cn } from '@/lib/utils';
import { type Editor } from '@tiptap/react';
import {
    Heading1,
    Heading2,
    Heading3,
    ImageIcon,
    List,
    ListOrdered,
    Loader2,
    Quote,
    Sparkles,
    Table,
} from 'lucide-react';
import {
    type ComponentType,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    type SlashCommandState,
    slashCommandPluginKey,
} from './slash-command-extension';

interface SlashCommand {
    id: string;
    label: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
    keywords: string[];
    action?: (editor: Editor) => void;
}

const COMMANDS: SlashCommand[] = [
    {
        id: 'image',
        label: 'AI Image',
        description: 'Generate an image with AI',
        icon: ImageIcon,
        keywords: ['image', 'picture', 'photo', 'generate', 'ai'],
    },
    {
        id: 'heading1',
        label: 'Heading 1',
        description: 'Large section heading',
        icon: Heading1,
        keywords: ['h1', 'heading', 'title'],
        action: (editor) =>
            editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
        id: 'heading2',
        label: 'Heading 2',
        description: 'Medium section heading',
        icon: Heading2,
        keywords: ['h2', 'heading', 'subtitle'],
        action: (editor) =>
            editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
        id: 'heading3',
        label: 'Heading 3',
        description: 'Small section heading',
        icon: Heading3,
        keywords: ['h3', 'heading'],
        action: (editor) =>
            editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
        id: 'bulletList',
        label: 'Bullet List',
        description: 'Unordered list',
        icon: List,
        keywords: ['list', 'bullet', 'unordered', 'ul'],
        action: (editor) =>
            editor.chain().focus().toggleBulletList().run(),
    },
    {
        id: 'orderedList',
        label: 'Numbered List',
        description: 'Ordered list',
        icon: ListOrdered,
        keywords: ['list', 'number', 'ordered', 'ol'],
        action: (editor) =>
            editor.chain().focus().toggleOrderedList().run(),
    },
    {
        id: 'blockquote',
        label: 'Quote',
        description: 'Block quotation',
        icon: Quote,
        keywords: ['quote', 'blockquote', 'cite'],
        action: (editor) =>
            editor.chain().focus().toggleBlockquote().run(),
    },
    {
        id: 'table',
        label: 'Table',
        description: 'Insert a table',
        icon: Table,
        keywords: ['table', 'grid'],
        action: (editor) =>
            editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run(),
    },
];

interface SlashCommandMenuProps {
    editor: Editor;
    onGenerateImage?: (options: {
        style: string;
        prompt: string;
    }) => Promise<string | null>;
}

export function SlashCommandMenu({
    editor,
    onGenerateImage,
}: SlashCommandMenuProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showImageForm, setShowImageForm] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiStyle, setAiStyle] = useState('illustration');
    const [isGenerating, setIsGenerating] = useState(false);
    const [position, setPosition] = useState<{
        top: number;
        left: number;
    } | null>(null);
    const [pluginState, setPluginState] = useState<SlashCommandState>({
        active: false,
        query: '',
        range: null,
    });
    const menuRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sync ProseMirror plugin state into React state on every transaction
    useEffect(() => {
        const handleTransaction = () => {
            const state =
                slashCommandPluginKey.getState(editor.state) ?? null;
            if (state) {
                setPluginState((prev) => {
                    if (
                        prev.active !== state.active ||
                        prev.query !== state.query ||
                        prev.range?.from !== state.range?.from ||
                        prev.range?.to !== state.range?.to
                    ) {
                        return state;
                    }
                    return prev;
                });
            }
        };
        editor.on('transaction', handleTransaction);
        return () => {
            editor.off('transaction', handleTransaction);
        };
    }, [editor]);

    const isActive = pluginState.active;
    const query = pluginState.query;
    const range = pluginState.range;

    // Filter commands by query
    const filteredCommands = COMMANDS.filter((cmd) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (
            cmd.label.toLowerCase().includes(q) ||
            cmd.keywords.some((k) => k.includes(q))
        );
    });

    // Close the slash command menu
    const closeMenu = useCallback(() => {
        const tr = editor.state.tr.setMeta(slashCommandPluginKey, {
            active: false,
            query: '',
            range: null,
        });
        editor.view.dispatch(tr);
        setShowImageForm(false);
        setAiPrompt('');
        setSelectedIndex(0);
    }, [editor]);

    // Delete the slash command text from the editor
    // Read range from plugin state at execution time to avoid stale closures
    const deleteSlashText = useCallback(() => {
        const currentState = slashCommandPluginKey.getState(editor.state);
        if (currentState?.range) {
            editor
                .chain()
                .focus()
                .deleteRange({
                    from: currentState.range.from,
                    to: currentState.range.to,
                })
                .run();
        }
    }, [editor]);

    // Execute a command
    const executeCommand = useCallback(
        (cmd: SlashCommand) => {
            if (cmd.id === 'image') {
                setShowImageForm(true);
                // Focus textarea after transition
                setTimeout(() => textareaRef.current?.focus(), 50);
                return;
            }
            deleteSlashText();
            closeMenu();
            cmd.action?.(editor);
        },
        [editor, deleteSlashText, closeMenu],
    );

    // Generate image
    const generateImage = useCallback(async () => {
        if (!onGenerateImage || !aiPrompt.trim()) return;

        setIsGenerating(true);
        try {
            // Delete the slash command text first
            deleteSlashText();

            const url = await onGenerateImage({
                style: aiStyle,
                prompt: aiPrompt,
            });

            if (url) {
                editor
                    .chain()
                    .focus()
                    .setImage({ src: url, alt: aiPrompt })
                    .run();
            }
        } finally {
            setIsGenerating(false);
            setAiPrompt('');
            setAiStyle('illustration');
            closeMenu();
        }
    }, [
        onGenerateImage,
        aiPrompt,
        aiStyle,
        editor,
        deleteSlashText,
        closeMenu,
    ]);

    // Update position when slash command is active
    useEffect(() => {
        if (isActive && range) {
            try {
                const coords = editor.view.coordsAtPos(range.from);
                const containerRect = (
                    editor.view.dom.closest('[data-slash-command-container]') ??
                    editor.view.dom.parentElement
                )?.getBoundingClientRect();
                if (containerRect) {
                    setPosition({
                        top: coords.bottom - containerRect.top + 4,
                        left: coords.left - containerRect.left,
                    });
                }
            } catch {
                // Position calculation may fail during rapid edits
            }
        } else {
            setPosition(null);
            setShowImageForm(false);
            setSelectedIndex(0);
        }
    }, [isActive, range, editor]);

    // Handle keyboard events from the extension
    useEffect(() => {
        const handleKeydown = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (!detail?.key) return;

            if (showImageForm) {
                if (detail.key === 'Escape') {
                    if (isGenerating) return;
                    setShowImageForm(false);
                    editor.commands.focus();
                }
                return;
            }

            if (detail.key === 'ArrowUp') {
                setSelectedIndex((prev) =>
                    prev <= 0 ? filteredCommands.length - 1 : prev - 1,
                );
            } else if (detail.key === 'ArrowDown') {
                setSelectedIndex((prev) =>
                    prev >= filteredCommands.length - 1 ? 0 : prev + 1,
                );
            } else if (detail.key === 'Enter') {
                if (filteredCommands[selectedIndex]) {
                    executeCommand(filteredCommands[selectedIndex]);
                }
            } else if (detail.key === 'Escape') {
                closeMenu();
                editor.commands.focus();
            }
        };

        window.addEventListener('slash-command-keydown', handleKeydown);
        return () =>
            window.removeEventListener(
                'slash-command-keydown',
                handleKeydown,
            );
    }, [
        showImageForm,
        filteredCommands,
        selectedIndex,
        executeCommand,
        closeMenu,
        editor,
        isGenerating,
    ]);

    // Reset selected index when filtered commands change
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Close on click outside
    useEffect(() => {
        if (!isActive) return;
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            // Click is inside the menu itself
            if (menuRef.current && menuRef.current.contains(target)) {
                return;
            }

            // Click is inside a Radix UI portal (e.g., Select dropdown)
            if (target.closest?.('[data-radix-popper-content-wrapper]')) {
                return;
            }

            closeMenu();
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isActive, closeMenu]);

    if (!isActive || !position) return null;

    return (
        <div
            ref={menuRef}
            className="absolute z-50 w-72 overflow-hidden rounded-lg border bg-popover shadow-lg"
            style={{ top: position.top, left: position.left }}
        >
            {showImageForm ? (
                <div className="space-y-3 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Generate AI Image
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs">Style</Label>
                        <Select value={aiStyle} onValueChange={setAiStyle}>
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Select style" />
                            </SelectTrigger>
                            <SelectContent>
                                {IMAGE_STYLES.map((style) => (
                                    <SelectItem
                                        key={style.value}
                                        value={style.value}
                                    >
                                        {style.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs">Description</Label>
                        <Textarea
                            ref={textareaRef}
                            placeholder="Describe the image you want..."
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    generateImage();
                                }
                                if (e.key === 'Escape') {
                                    e.preventDefault();
                                    setShowImageForm(false);
                                    editor.commands.focus();
                                }
                                // Stop propagation so editor doesn't handle these
                                e.stopPropagation();
                            }}
                            rows={2}
                            className="text-xs"
                        />
                    </div>
                    <Button
                        className="w-full"
                        size="sm"
                        onClick={generateImage}
                        disabled={isGenerating || !aiPrompt.trim()}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-3 w-3" />
                                Generate
                            </>
                        )}
                    </Button>
                </div>
            ) : (
                <div
                    className="max-h-64 overflow-y-auto p-1"
                    role="listbox"
                    aria-label="Editor commands"
                >
                    {filteredCommands.length === 0 ? (
                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                            No matching commands
                        </div>
                    ) : (
                        filteredCommands.map((cmd, index) => (
                            <button
                                key={cmd.id}
                                type="button"
                                role="option"
                                aria-selected={index === selectedIndex}
                                className={cn(
                                    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                                    index === selectedIndex
                                        ? 'bg-accent text-accent-foreground'
                                        : 'hover:bg-accent/50',
                                )}
                                onClick={() => executeCommand(cmd)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background">
                                    <cmd.icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-medium">
                                        {cmd.label}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {cmd.description}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
