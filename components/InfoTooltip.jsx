"use client";

import { createPortal } from 'react-dom';
import { useState } from 'react';

export default function InfoTooltip({ info, iconOnly, text = "More info", fromTop = false }) {
    const [isHovered, setIsHovered] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseEnter = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const tooltipWidth = 300;
        const tooltipHeight = 80;
        const padding = 10;

        let x = rect.right;
        let y = fromTop ? rect.top - tooltipHeight : rect.bottom + 5;

        if (x + tooltipWidth > window.innerWidth) {
            x = rect.left - tooltipWidth;
        }
        if (x < padding) {
            x = padding;
        }

        if (fromTop && y < padding) {
            y = rect.bottom + 5;
        } else if (!fromTop && y + tooltipHeight > window.innerHeight) {
            y = rect.top - tooltipHeight - 5;
        }

        if (y < padding) y = padding;
        if (y + tooltipHeight > window.innerHeight - padding) {
            y = window.innerHeight - tooltipHeight - padding;
        }

        setPosition({ x, y });
        setIsHovered(true);
    };

    return (
        <div className="flex justify-end">
            <div
                className="text-md inline-flex items-center justify-center ml-auto cursor-pointer hover:opacity-70 transition-opacity"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="inline-flex items-center justify-center w-4 h-4 bg-gray-500 rounded-full mr-1">
                    <span className="text-white text-xs font-bold">i</span>
                </div>
                {!iconOnly && (<span className="font-semibold text-gray-500 text-xs">{text}</span>)}
            </div>

            {isHovered && createPortal(
                <div
                    className="fixed px-4 py-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-50 min-w-48 max-w-lg md:max-w-xl whitespace-normal break-words pointer-events-none"
                    style={{
                        left: position.x,
                        top: position.y
                    }}
                >
                    {info}
                </div>,
                document.body
            )}
        </div>
    )
}