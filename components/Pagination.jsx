import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="h-9 w-9 p-0 rounded-lg border-pale-gray hover:border-vivid-blue hover:text-vivid-blue disabled:opacity-50"
      >
        <ChevronsLeft size={16} />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-9 w-9 p-0 rounded-lg border-pale-gray hover:border-vivid-blue hover:text-vivid-blue disabled:opacity-50"
      >
        <ChevronLeft size={16} />
      </Button>

      {pageNumbers.map((page, idx) => (
        page === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className={`h-9 w-9 p-0 rounded-lg font-medium ${
              currentPage === page
                ? "bg-vivid-blue text-white hover:bg-deep-blue"
                : "border-pale-gray hover:border-vivid-blue hover:text-vivid-blue"
            }`}
          >
            {page}
          </Button>
        )
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-9 w-9 p-0 rounded-lg border-pale-gray hover:border-vivid-blue hover:text-vivid-blue disabled:opacity-50"
      >
        <ChevronRight size={16} />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="h-9 w-9 p-0 rounded-lg border-pale-gray hover:border-vivid-blue hover:text-vivid-blue disabled:opacity-50"
      >
        <ChevronsRight size={16} />
      </Button>
    </div>
  );
}

