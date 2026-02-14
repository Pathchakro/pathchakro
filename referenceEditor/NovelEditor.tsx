"use client";

import {
    EditorRoot,
    EditorContent,
    type JSONContent,
    EditorCommand,
    EditorCommandItem,
    EditorCommandEmpty,
    EditorCommandList,
    handleCommandNavigation,
    handleImagePaste,
    handleImageDrop,
    EditorBubble,
} from "novel";
import { useState, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { defaultExtensions } from "./extensions";
import { slashCommand, suggestionItems } from "./slash-command";
import { onUpload } from "./image-upload";
import { toast } from "sonner";

import { Separator } from "@/components/ui/separator";


import { NodeSelector } from "./selectors/node-selector";
import { LinkSelector } from "./selectors/link-selector";
import { MathSelector } from "./selectors/math-selector";
import { TextButtons } from "./selectors/text-buttons";
import { ColorSelector } from "./selectors/color-selector";

interface NovelEditorProps {
    initialValue?: JSONContent;
    onChange?: (content: JSONContent) => void;
    readOnly?: boolean;
}

const extensions = [...defaultExtensions, slashCommand];

export default function NovelEditor({ initialValue, onChange, readOnly = false }: NovelEditorProps) {
    const [openNode, setOpenNode] = useState(false);
    const [openColor, setOpenColor] = useState(false);
    const [openLink, setOpenLink] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const debouncedUpdates = useDebouncedCallback(async (editor) => {
        const json = editor.getJSON();
        onChange?.(JSON.stringify(json) as any);
    }, 500);

    if (!isMounted) {
        return null; // Prevent SSR issues
    }

    if (readOnly) {
        return (
            <div className="relative w-full border-none bg-background text-foreground">
                <EditorRoot>
                    <EditorContent
                        initialContent={initialValue}
                        extensions={extensions as any}
                        editable={false}
                        immediatelyRender={false}
                        className="min-h-[200px] w-full"
                        editorProps={{
                            attributes: {
                                class: "prose prose-lg dark:prose-invert prose-headings:font-title font-sans leading-normal focus:outline-none max-w-full text-[16px]",
                            },
                        }}
                    >
                    </EditorContent>
                </EditorRoot>
            </div>
        );
    }

    return (
        <div className="relative w-full border rounded-lg bg-background text-foreground">
            <EditorRoot>
                <EditorContent
                    initialContent={initialValue}
                    extensions={extensions as any}
                    immediatelyRender={false}
                    className="min-h-[200px] max-h-[500px] overflow-y-auto sm:min-h-[300px] w-full"
                    editorProps={{
                        handleDOMEvents: {
                            keydown: (_view, event) => handleCommandNavigation(event),
                        },
                        handlePaste: (view, event) => {
                            if (event.clipboardData && event.clipboardData.files.length > 0) {
                                const file = event.clipboardData.files[0];
                                if (file.type.startsWith("image/")) {
                                    event.preventDefault(); // Prevent default paste behavior
                                    const alt = file.name.split(".")[0]; // Use filename as alt text

                                    // Upload the image
                                    onUpload(file)
                                        .then((url) => {
                                            if (typeof url === "string") {
                                                const { schema } = view.state;
                                                const node = schema.nodes.image.create({ src: url, alt, title: alt });
                                                const transaction = view.state.tr.insert(view.state.selection.from, node);
                                                view.dispatch(transaction);
                                            }
                                        })
                                        .catch((error) => {
                                            toast.error(error.message || "Failed to upload image");
                                        });
                                    return true; // Handled
                                }
                            }
                            return false; // Not handled
                        },
                        handleDrop: (view, event, _slice, moved) => {
                            if (!moved && event.dataTransfer && event.dataTransfer.files.length > 0) {
                                const file = event.dataTransfer.files[0];
                                if (file.type.startsWith("image/")) {
                                    event.preventDefault();
                                    const alt = file.name.split(".")[0]; // Use filename as alt text

                                    const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });

                                    // Upload the image
                                    onUpload(file)
                                        .then((url) => {
                                            if (typeof url === "string") {
                                                const { schema } = view.state;
                                                const node = schema.nodes.image.create({ src: url, alt, title: alt });
                                                const transaction = view.state.tr.insert(coordinates?.pos ?? view.state.selection.from, node);
                                                view.dispatch(transaction);
                                            }
                                        })
                                        .catch((error) => {
                                            toast.error(error.message || "Failed to upload image");
                                        });
                                    return true; // Handled
                                }
                            }
                            return false; // Not handled
                        },
                        attributes: {
                            class: "prose prose-lg dark:prose-invert prose-headings:font-title font-sans leading-normal focus:outline-none max-w-full text-[16px]",
                        },
                    }}
                    onUpdate={({ editor }) => {
                        debouncedUpdates(editor);
                    }}
                >
                    <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                        <EditorCommandEmpty className="px-2 text-muted-foreground">No results</EditorCommandEmpty>
                        <EditorCommandList>
                            {suggestionItems.map((item) => (
                                <EditorCommandItem
                                    value={item.title}
                                    onCommand={(val) => item.command?.(val)}
                                    className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
                                    key={item.title}
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <p className="font-medium">{item.title}</p>
                                        <p className="text-xs text-muted-foreground">{item.description}</p>
                                    </div>
                                </EditorCommandItem>
                            ))}
                        </EditorCommandList>
                    </EditorCommand>

                    <EditorBubble
                        tippyOptions={{
                            placement: "top",
                        }}
                        className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
                    >
                        <Separator orientation="vertical" />
                        <NodeSelector open={openNode} onOpenChange={setOpenNode} />
                        <Separator orientation="vertical" />

                        <LinkSelector open={openLink} onOpenChange={setOpenLink} />
                        <Separator orientation="vertical" />
                        <MathSelector />
                        <Separator orientation="vertical" />
                        <TextButtons />
                        <Separator orientation="vertical" />
                        <ColorSelector open={openColor} onOpenChange={setOpenColor} />
                    </EditorBubble>
                </EditorContent>
            </EditorRoot>
        </div>
    );
}
