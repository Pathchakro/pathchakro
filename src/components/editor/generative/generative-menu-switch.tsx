import { EditorBubble, useEditor } from "novel";
import { Fragment, type ReactNode } from "react";

interface GenerativeMenuSwitchProps {
    children: ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}
const GenerativeMenuSwitch = ({ children, open, onOpenChange }: GenerativeMenuSwitchProps) => {
    const { editor } = useEditor();

    if (!editor) return null;

    return (
        <EditorBubble
            tippyOptions={{
                placement: open ? "bottom-start" : "top",
                onHidden: () => {
                    onOpenChange(false);
                },
            }}
            className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
        >
            <Fragment>
                {children}
            </Fragment>
        </EditorBubble>
    );
};

export default GenerativeMenuSwitch;
