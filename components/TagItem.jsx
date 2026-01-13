"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useState } from "react";
// import Link from "next/link";

export default function TagItem({ tag, onRemove, onToggle, variant = "default", active = false }) {
    // console.log("TagItem", tag, variant, onRemove);
    //"default |outline | secondary | destructive"
    const [isActive, setIsActive] = useState(active);

    const handleToggle = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (onToggle) {
            const newActiveState = !isActive;
            setIsActive(newActiveState);
            onToggle(tag, newActiveState);
        }
    }
    return (
        <div className="relative inline-block my-1">
            <Badge 
                className="mx-1 font-bold px-4 py-2 cursor-pointer" 
                variant={onToggle ? (isActive ? "default" : "outline") : variant}
                onClick={onToggle ? handleToggle : null}
            >
                {tag.name || tag}
                {onRemove && (
                    <Button
                        type="button"
                        variant="ghost"
                        className="ml-1 bg-transparent hover:bg-transparent h-4 w-4 px-0 py-0 ml-1 mr-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(tag);
                        }}
                    >
                        <X className="h-2 w-2 text-red-500" strokeWidth={4} />
                    </Button>
                )}
            </Badge>
        </div>
    );
}
