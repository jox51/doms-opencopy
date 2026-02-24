import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { IMAGE_STYLES } from '@/lib/image-styles';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { ChevronDown, ImageIcon, Loader2, RefreshCw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export interface InlineImage {
    id: number;
    url: string;
    alt_text: string | null;
    style: string;
    width: number | null;
    height: number | null;
}

interface ArticleImagesCardProps {
    images: InlineImage[];
    projectId: number;
    articleId: number;
    csrfToken: string;
    onImageRegenerated: (
        imageId: number,
        newUrl: string,
        newAlt: string,
        style: string,
    ) => void;
}

export function ArticleImagesCard({
    images,
    projectId,
    articleId,
    csrfToken,
    onImageRegenerated,
}: ArticleImagesCardProps) {
    const [isOpen, setIsOpen] = useState(images.length > 0);
    const [regeneratingId, setRegeneratingId] = useState<number | null>(null);
    const [selectedStyles, setSelectedStyles] = useState<
        Record<number, string>
    >(() =>
        Object.fromEntries(
            images.map((img) => [img.id, img.style || 'illustration']),
        ),
    );
    const [recentlyRegenerated, setRecentlyRegenerated] = useState<
        number | null
    >(null);

    const handleStyleChange = useCallback((imageId: number, style: string) => {
        setSelectedStyles((prev) => ({ ...prev, [imageId]: style }));
    }, []);

    const handleRegenerate = useCallback(
        async (image: InlineImage) => {
            const style = selectedStyles[image.id] || image.style;
            const prompt = image.alt_text || 'Generate an image';

            setRegeneratingId(image.id);

            try {
                const response = await axios.post(
                    `/projects/${projectId}/articles/${articleId}/regenerate-inline-image`,
                    { style, prompt },
                    {
                        headers: {
                            'X-CSRF-TOKEN': csrfToken,
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                        },
                    },
                );

                if (response.data.success) {
                    onImageRegenerated(
                        image.id,
                        response.data.url,
                        response.data.alt || prompt,
                        style,
                    );

                    setRecentlyRegenerated(image.id);
                    setTimeout(() => setRecentlyRegenerated(null), 2000);

                    toast.success('Image regenerated successfully');
                } else {
                    toast.error(
                        response.data.error || 'Failed to regenerate image',
                    );
                }
            } catch (error) {
                if (
                    axios.isAxiosError(error) &&
                    error.response?.data?.error
                ) {
                    toast.error(error.response.data.error);
                } else {
                    toast.error('Failed to regenerate image');
                }
            } finally {
                setRegeneratingId(null);
            }
        },
        [
            projectId,
            articleId,
            csrfToken,
            selectedStyles,
            onImageRegenerated,
        ],
    );

    const scrollToImage = useCallback((image: InlineImage) => {
        const editorImages = document.querySelectorAll(
            '.ProseMirror img',
        );
        for (const el of editorImages) {
            const imgEl = el as HTMLImageElement;
            if (
                imgEl.src === image.url ||
                imgEl.getAttribute('data-image-id') === String(image.id)
            ) {
                imgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                imgEl.classList.add('ring-2', 'ring-primary');
                setTimeout(() => {
                    imgEl.classList.remove('ring-2', 'ring-primary');
                }, 2000);
                break;
            }
        }
    }, []);

    if (images.length === 0) {
        return null;
    }

    const getStyleLabel = (value: string) =>
        IMAGE_STYLES.find((s) => s.value === value)?.label || value;

    return (
        <Card>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CardHeader className="pb-3">
                    <CollapsibleTrigger className="flex w-full items-center justify-between [&[data-state=open]>svg]:rotate-180">
                        <div className="text-left">
                            <CardTitle className="text-base">
                                Article Images
                                <Badge
                                    variant="secondary"
                                    className="ml-2 text-xs"
                                >
                                    {images.length}
                                </Badge>
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Manage inline images in your article
                            </CardDescription>
                        </div>
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                    </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                    <CardContent className="space-y-3 pt-0">
                        {images.map((image, index) => (
                            <div
                                key={image.id}
                                className={cn(
                                    'space-y-2 rounded-lg border p-3',
                                    recentlyRegenerated === image.id &&
                                        'ring-2 ring-green-500 transition-all duration-300',
                                )}
                            >
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => scrollToImage(image)}
                                        className="group relative shrink-0 cursor-pointer overflow-hidden rounded-md border"
                                        title="Click to scroll to image in editor"
                                    >
                                        <img
                                            src={image.url}
                                            alt={image.alt_text || ''}
                                            className="h-12 w-18 object-cover transition-opacity group-hover:opacity-80"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                                            <ImageIcon className="h-3 w-3 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                                        </div>
                                    </button>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm text-muted-foreground">
                                            {image.alt_text ||
                                                `Image ${index + 1}`}
                                        </p>
                                        <Badge
                                            variant="outline"
                                            className="mt-1 text-xs"
                                        >
                                            {getStyleLabel(
                                                selectedStyles[image.id] ||
                                                    image.style,
                                            )}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={
                                            selectedStyles[image.id] ||
                                            image.style
                                        }
                                        onValueChange={(value) =>
                                            handleStyleChange(image.id, value)
                                        }
                                        disabled={regeneratingId === image.id}
                                    >
                                        <SelectTrigger className="h-8 flex-1 text-xs">
                                            <SelectValue placeholder="Style" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {IMAGE_STYLES.map((s) => (
                                                <SelectItem
                                                    key={s.value}
                                                    value={s.value}
                                                >
                                                    <span>{s.label}</span>
                                                    <span className="ml-1.5 text-muted-foreground">
                                                        - {s.description}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 shrink-0 px-2.5"
                                        onClick={() =>
                                            handleRegenerate(image)
                                        }
                                        disabled={regeneratingId !== null}
                                    >
                                        {regeneratingId === image.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <RefreshCw className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}
