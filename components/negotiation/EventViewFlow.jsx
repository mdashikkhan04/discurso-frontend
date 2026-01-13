"use client";

import React, { useState } from "react";
import { useRouter, useParams, useSearchParams, usePathname } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";

export default function EventViewFlow({ disabled = false, onlyCurrentPage = disabled, placingClassName = "", hideFeedback = false }) {
    const [currentPage, setCurrentPage] = useState(/** @type {"negotiation" | "agreement" | "feedback" }*/null);
    const [format, setFormat] = useState(/** @type {"full" | "compact"}*/"full");
    const router = useRouter();
    const { eventId, roundId } = useParams();
    const searchParams = useSearchParams()
    const pathName = usePathname()
    const onlyAgreement = searchParams.get('onlyAgreement')

    useEffect(() => {
        if (pathName.includes("feedback")) {
            setCurrentPage("feedback");
        } else if (onlyAgreement === "true") {
            setCurrentPage("agreement");
        } else {
            setCurrentPage("negotiation");
        }
    }, [pathName, searchParams, onlyAgreement]);

    useEffect(() => {
        const handleResize = () => {
            setFormat(window.innerWidth < 500 ? "compact" : "full");
        };
        handleResize();

        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, [setFormat]);

    function goNext() {
        if (disabled) return;
        if (currentPage === "negotiation") {
            setCurrentPage("agreement");
            router.push(`/negotiator/events/${eventId}/${roundId}?onlyAgreement=true`);
        } else if (currentPage === "agreement") {
            if (hideFeedback) {
                setCurrentPage("negotiation");
                router.push(`/negotiator/events/${eventId}/${roundId}`);
                return;
            }
            setCurrentPage("feedback");
            router.push(`/negotiator/events/${eventId}/${roundId}/feedback`);
        } else if (currentPage === "feedback") {
            setCurrentPage("negotiation");
            router.push(`/negotiator/events/${eventId}/${roundId}`);
        }
    }

    function goPrevious() {
        if (disabled) return;
        if (currentPage === "feedback") {
            setCurrentPage("agreement");
            router.push(`/negotiator/events/${eventId}/${roundId}?onlyAgreement=true`);
        } else if (currentPage === "agreement") {
            setCurrentPage("negotiation");
            router.push(`/negotiator/events/${eventId}/${roundId}`);
        } else if (currentPage === "negotiation") {
            if (hideFeedback) {
                setCurrentPage("agreement");
                router.push(`/negotiator/events/${eventId}/${roundId}?onlyAgreement=true`);
                return;
            }
            setCurrentPage("feedback");
            router.push(`/negotiator/events/${eventId}/${roundId}/feedback`);
        }
    }

    return format === "full" ? onlyCurrentPage ? <div className={`${placingClassName
        } flex items-center md:justify-end justify-center`}>
        <div className={`px-4 py-1 rounded-full drop-shadow-lg bg-gradient-to-b from-vivid-blue to-deep-blue text-white border-2 border-soft-gray font-bold`}>
            <p className="text-lg w-full text-center">
                {currentPage === "negotiation" ? "Negotiation" : currentPage === "agreement" ? "Agreement" : "Feedback"}
            </p>
        </div>
    </div> : <div className={`${placingClassName} flex items-center sm:justify-end justify-center sm:mt-0 mt-4 relative`}>
        <p className="absolute text-white text-sm font-semibold right-2 -top-6 text-center w-full sm:w-fit">
            Click to Move Through Steps
        </p>
        <div title="Main negotiation view"
            onClick={
                !disabled && currentPage !== "negotiation" ? () => {
                    router.push(`/negotiator/events/${eventId}/${roundId}`);
                    setCurrentPage("negotiation");
                } : undefined
            } className={`px-4 py-1 rounded-full drop-shadow-lg ${currentPage !== "negotiation" && !disabled && "cursor-pointer"} ${currentPage === "negotiation" ? "bg-gradient-to-b from-vivid-blue to-deep-blue text-white border-2 border-soft-gray font-bold" : "bg-white text-darker-gray font-medium hover:bg-gray-200 transition-colors"}`}>
            <p className="text-lg w-full text-center">
                Negotiation
            </p>
        </div>

        <div className="w-4 h-0.5 bg-white flex-shrink-0"></div>
        <div
            title="Agreement view"
            onClick={
                !disabled && currentPage !== "agreement" ? () => {
                    router.push(`/negotiator/events/${eventId}/${roundId}?onlyAgreement=true`);
                    setCurrentPage("agreement");
                } : undefined
            } className={`px-4 py-1 rounded-full drop-shadow-lg ${currentPage !== "agreement" && !disabled && "cursor-pointer"} ${currentPage === "agreement" ? "bg-gradient-to-b from-vivid-blue to-deep-blue text-white border-2 border-soft-gray font-bold" : "bg-white text-darker-gray font-medium hover:bg-gray-200 transition-colors"}`}>
            <p className="text-lg w-full text-center">
                Agreement
            </p>
        </div>
        {!hideFeedback && <>
            <div className="w-4 h-0.5 bg-white flex-shrink-0"></div>
            <div title="Feedback"
                onClick={
                    !disabled && currentPage !== "feedback" ? () => {
                        router.push(`/negotiator/events/${eventId}/${roundId}/feedback`)
                        setCurrentPage("feedback");
                    } : undefined
                } className={`px-4 py-1 rounded-full drop-shadow-lg ${currentPage !== "feedback" && !disabled && "cursor-pointer"} ${currentPage === "feedback" ? "bg-gradient-to-b from-vivid-blue to-deep-blue text-white border-2 border-soft-gray font-bold" : "bg-white text-darker-gray font-medium hover:bg-gray-200 transition-colors"}`}>
                <p className="text-lg w-full text-center">
                    Feedback
                </p>
            </div>
        </>}
    </div> : <div className={`${placingClassName} flex items-center gap-2 justify-center`}>
        {!disabled && !onlyCurrentPage && <ArrowLeft className="cursor-pointer text-white w-8 h-8" onClick={goPrevious} />}
        <p className="text-lg w-full text-center text-dark-gray bg-white rounded-full py-1 font-medium">
            {currentPage === "negotiation" ? "Negotiation" : currentPage === "agreement" ? "Agreement" : "Feedback"}
        </p>
        {!disabled && !onlyCurrentPage && <ArrowRight className="cursor-pointer w-8 h-8 text-white" onClick={goNext} />}
    </div>;
}