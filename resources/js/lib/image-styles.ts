export const IMAGE_STYLES = [
    {
        value: 'illustration',
        label: 'Illustration',
        description: 'Clean, modern illustrations',
    },
    {
        value: 'stock_photo',
        label: 'Stock Photo',
        description: 'Real people, lifestyle photography',
    },
    {
        value: 'editorial',
        label: 'Editorial',
        description: 'Candid, magazine-quality photos',
    },
    {
        value: 'cinematic',
        label: 'Cinematic',
        description: 'Dramatic, movie-like visuals',
    },
    {
        value: 'sketch',
        label: 'Sketch',
        description: 'Hand-drawn pencil style',
    },
    {
        value: 'watercolor',
        label: 'Watercolor',
        description: 'Artistic watercolor effect',
    },
    {
        value: 'realistic',
        label: 'Realistic',
        description: 'High-quality photo look',
    },
    {
        value: 'brand_text',
        label: 'Brand Style',
        description: 'Corporate, brand-focused',
    },
] as const;

export type ImageStyleValue = (typeof IMAGE_STYLES)[number]['value'];
