"use client";

import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Settings, Type, Minus, Plus, Sun, Moon, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReaderSettingsProps {
    fontSize: number;
    setFontSize: (size: number) => void;
    fontFamily: string;
    setFontFamily: (font: string) => void;
    theme: string;
    setTheme: (theme: string) => void;
}

export function ReaderSettings({
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    theme,
    setTheme
}: ReaderSettingsProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Reader Settings</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none text-sm text-muted-foreground">Font Size</h4>
                        <div className="flex items-center justify-between border rounded-md p-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                                disabled={fontSize <= 12}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium w-12 text-center">{fontSize}px</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                                disabled={fontSize >= 32}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-medium leading-none text-sm text-muted-foreground">Font Family</h4>
                        <div className="flex gap-2">
                            {['Sans', 'Serif', 'Mono'].map((font) => (
                                <Button
                                    key={font}
                                    variant={fontFamily === font ? "default" : "outline"}
                                    size="sm"
                                    className={cn("flex-1",
                                        font === 'Serif' && "font-serif",
                                        font === 'Mono' && "font-mono",
                                        font === 'Sans' && "font-sans"
                                    )}
                                    onClick={() => setFontFamily(font)}
                                >
                                    {font}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-medium leading-none text-sm text-muted-foreground">Theme</h4>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className={cn(
                                    "flex-1 gap-2",
                                    theme === 'light' && "ring-2 ring-primary border-primary bg-white text-black hover:bg-gray-50"
                                )}
                                onClick={() => setTheme('light')}
                            >
                                <Sun className="h-4 w-4" />
                                Light
                            </Button>
                            <Button
                                variant="outline"
                                className={cn(
                                    "flex-1 gap-2 bg-[#f4ecd8] text-[#5b4636] hover:bg-[#e9e0c9] border-[#dcccb3]",
                                    theme === 'sepia' && "ring-2 ring-[#5b4636] border-[#5b4636]"
                                )}
                                onClick={() => setTheme('sepia')}
                            >
                                <Coffee className="h-4 w-4" />
                                Sepia
                            </Button>
                            <Button
                                variant="outline"
                                className={cn(
                                    "flex-1 gap-2 bg-slate-950 text-slate-50 hover:bg-slate-900 border-slate-800",
                                    theme === 'dark' && "ring-2 ring-slate-50 border-slate-50"
                                )}
                                onClick={() => setTheme('dark')}
                            >
                                <Moon className="h-4 w-4" />
                                Dark
                            </Button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
