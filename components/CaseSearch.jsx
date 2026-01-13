"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLoading } from "@/contexts/LoadingContext";
import { getTags } from "@/actions/tags";
import { getCasesBySearch, getAllCases } from "@/actions/cases";
import { useEffect } from "react";
import TagItem from "@/components/TagItem";
import CaseItem from "@/components/CaseItem";
import Pagination from "@/components/Pagination";
import { Search } from "lucide-react";

export default function CaseSearch({ onClose, onCaseSelected, userId }) {
    const [keywords, setKeywords] = useState([]);
    const [keyword, setKeyword] = useState("");
    const [tags, setTags] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [cases, setCases] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);
    const [afterSearch, setAfterSearch] = useState(false);
    const { showLoading, hideLoading } = useLoading();

    const removeKeyword = (keyword) => {
        setKeywords(prev => prev.filter(k => k !== keyword));
    }

    const toggleTag = (tag, active) => {
        if (active) {
            setTags(prev => [...prev, tag]);
        } else {
            setTags(prev => prev.filter(t => t.id !== tag.id));
        }
    }

    const fetchCases = async (page = 1) => {
        showLoading();
        try {
            const result = await getAllCases(userId, page, "", 10);
            setCases(result.cases || []);
            setTotalPages(result.totalPages || 0);
            setTotal(result.total || 0);
            setCurrentPage(result.currentPage || page);
        } catch (error) {
            console.error("Error fetching cases:", error);
            setCases([]);
        } finally {
            hideLoading();
        }
    }

    useEffect(() => {
        if (!allTags.length) {
            const getAndSetAllTags = async () => {
                showLoading();
                const allTheTags = await getTags("case");
                setAllTags(allTheTags);
                hideLoading();
            }
            getAndSetAllTags();
        }
        fetchCases(1);
    }, [])

    useEffect(() => {
        if (!keywords.length && !tags.length && !afterSearch) {
            fetchCases(1);
        }
    }, [keywords, tags])

    const handleSearch = async (page = 1) => {
        const searchKeywords = [...keywords];
        if (keyword) {
            setKeywords(prevData => [keyword.trim(), ...prevData]);
            searchKeywords.push(keyword.trim());
            setKeyword('');
        }
        if (!searchKeywords?.length && !tags?.length) {
            setAfterSearch(false);
            fetchCases(page);
            return;
        }

        showLoading();
        const result = await getCasesBySearch(searchKeywords, tags.map(t => t.value), null, userId, page);
        setCases(result.cases || []);
        setTotalPages(result.totalPages || 0);
        setTotal(result.total || 0);
        setCurrentPage(result.currentPage || page);
        hideLoading();
        setAfterSearch(true);
    }

    const handlePageChange = (page) => {
        setCurrentPage(page);
        if (afterSearch) {
            handleSearch(page);
        } else {
            fetchCases(page);
        }
    }

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-md w-4/5 md:w-3/4 h-[95vh] flex flex-col shadow-lg">

                <div className="flex-1 overflow-y-auto">
                    <div className="p-2 md:p-4">
                        <Input
                            id="keywords"
                            className="mb-1"
                            type="text"
                            placeholder="Title, Author, Keywords..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && keyword.trim()) {
                                    e.preventDefault();
                                    setKeywords(prevData => [keyword.trim(), ...prevData]);
                                    setKeyword('');
                                }
                            }}
                        />
                        <p className="whitespace-pre-wrap text-xs text-gray-500 mb-1">{keyword?.length ? "Press Enter to add" : " "}</p>
                        {keywords.map((keyword, index) => (
                            <TagItem
                                key={index}
                                tag={keyword}
                                onRemove={removeKeyword}
                                variant="default"
                            />
                        ))}
                        {allTags.map((tag, index) => (
                            <TagItem
                                key={index}
                                tag={tag}
                                onToggle={toggleTag}
                            />
                        ))}
                        <div className="mt-1">
                            <Button onClick={() => handleSearch(1)} className="mb-2">
                                <Search className="h-8 w-8 " strokeWidth={4} /><span className="font-semibold">Search Cases</span>
                            </Button>
                        </div>
                        {!cases?.length && afterSearch && (
                            <p className="text-gray-500 mt-4">No cases found. Please refine your search.</p>
                        )}
                        {cases.map((acase) => (
                            <CaseItem
                                key={acase.id}
                                acase={acase}
                                onSelect={() => {
                                    onCaseSelected(acase);
                                    onClose();
                                }}
                                allTags={allTags}
                            />
                        ))}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>
                <div className="sticky bottom-0 bg-white z-10 flex justify-end mt-1 py-1 px-2 md:px-4 border-t">
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
