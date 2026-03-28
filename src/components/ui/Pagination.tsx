import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const renderPageButtons = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push('ellipsis-start');
            }

            // Show current page and neighbors
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('ellipsis-end');
            }

            // Always show last page
            if (!pages.includes(totalPages)) pages.push(totalPages);
        }

        return pages.map((page, index) => {
            if (typeof page === 'string') {
                return (
                    <span key={page} className="px-2 text-muted-foreground font-bold select-none">
                        ...
                    </span>
                );
            }

            return (
                <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => onPageChange(page)}
                    className={`h-9 w-9 transition-all ${currentPage === page ? 'shadow-md scale-105' : 'hover:bg-muted'}`}
                >
                    {page}
                </Button>
            );
        });
    };

    return (
        <div className="flex items-center justify-center gap-2 pt-6">
            <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="h-9 w-9 shadow-sm"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1.5">
                {renderPageButtons()}
            </div>

            <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="h-9 w-9 shadow-sm"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
