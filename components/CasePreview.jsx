"use client";

import { Button } from "@/components/ui/button";
import "@/public/case.css";

export default function CasePreview({ htmlValue, onClose }) {
    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-md w-4/5 md:w-1/2 h-[95vh] flex flex-col shadow-lg overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="p-2 md:p-4">
                        <p dir="auto" className="text-gray-800 mb-4 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: htmlValue }} />
                    </div>
                </div>
                <div className="sticky bottom-0 bg-white z-10 flex justify-end mt-1 py-1 px-2 md:px-4">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="ml-2"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}
