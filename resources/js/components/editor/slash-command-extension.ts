import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const slashCommandPluginKey = new PluginKey('slashCommand');

export interface SlashCommandState {
    active: boolean;
    query: string;
    range: { from: number; to: number } | null;
}

export const SlashCommand = Extension.create({
    name: 'slashCommand',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: slashCommandPluginKey,
                state: {
                    init(): SlashCommandState {
                        return { active: false, query: '', range: null };
                    },
                    apply(tr, prev): SlashCommandState {
                        const meta = tr.getMeta(slashCommandPluginKey);
                        if (meta) {
                            return meta;
                        }

                        // If document changed, recheck for slash command
                        if (!tr.docChanged && !tr.selectionSet) {
                            return prev;
                        }

                        const { selection } = tr;
                        const { $from } = selection;

                        // Only trigger in textblocks (paragraphs, headings, etc.)
                        if (!$from.parent.isTextblock) {
                            return { active: false, query: '', range: null };
                        }

                        const textBefore = $from.parent.textContent.slice(
                            0,
                            $from.parentOffset,
                        );

                        // Match / at start of line or after any non-word character
                        // (space, punctuation, brackets, etc.) but not inside words like "and/or"
                        const match = textBefore.match(
                            /(?:^|[^\w])\/([\w]*)$/,
                        );

                        if (match) {
                            const query = match[1] || '';
                            const slashStart =
                                $from.pos -
                                $from.parentOffset +
                                textBefore.lastIndexOf('/');

                            return {
                                active: true,
                                query,
                                range: {
                                    from: slashStart,
                                    to: $from.pos,
                                },
                            };
                        }

                        return { active: false, query: '', range: null };
                    },
                },
                props: {
                    handleKeyDown(view, event) {
                        const state =
                            slashCommandPluginKey.getState(view.state);
                        if (!state?.active) return false;

                        // Let the React component handle these keys via its own event listener
                        if (
                            event.key === 'ArrowUp' ||
                            event.key === 'ArrowDown' ||
                            event.key === 'Enter' ||
                            event.key === 'Escape'
                        ) {
                            // Dispatch a custom event for the menu component
                            const customEvent = new CustomEvent(
                                'slash-command-keydown',
                                {
                                    detail: { key: event.key },
                                },
                            );
                            window.dispatchEvent(customEvent);
                            return true;
                        }

                        return false;
                    },
                },
            }),
        ];
    },
});
