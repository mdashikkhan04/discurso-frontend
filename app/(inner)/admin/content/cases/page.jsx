"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CaseFullPreview from "@/components/CaseFullPreview";
import { useLoading } from "@/contexts/LoadingContext";
import { useUser } from "@/contexts/UserContext";
import { getAllCases } from "@/actions/cases";
import Pagination from "@/components/Pagination";
import {
    Search,
    Plus,
    FileText,
    Bot,
    Edit,
    Sparkles,
    Archive,
    Eye,
    User
} from "lucide-react";

export default function AdminCasesPage() {
    const [search, setSearch] = useState("");
    const [cases, setCases] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);
    const [previewCaseId, setPreviewCaseId] = useState(null);
    const { showLoading, hideLoading } = useLoading();
    const { user } = useUser();

    const fetchCases = async (page = 1, searchTerm = "") => {
        if (!user) return;
        showLoading();
        try {
            const result = await getAllCases(null, page, searchTerm);
            setCases(result.cases || []);
            setTotalPages(result.totalPages || 0);
            setTotal(result.total || 0);
            setCurrentPage(result.currentPage || page);
        } catch (error) {
            console.error("Error fetching cases:", error);
            setCases([]);
            setTotalPages(0);
            setTotal(0);
        } finally {
            hideLoading();
        }
    };

    useEffect(() => {
        if (user) {
            fetchCases(1, "");
        }
    }, [user]);

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearch(value);
    };

    const handleSearchSubmit = () => {
        setCurrentPage(1);
        fetchCases(1, search);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchCases(page, search);
    };

    const filteredCases = cases;
    const groupedCases = {
        draft: filteredCases.filter(c => c.isDraft),
        aiEnabled: filteredCases.filter(c => !c.isDraft && c.ai !== "n"),
        standard: filteredCases.filter(c => !c.isDraft && c.ai === "n")
    };

    const CaseCard = ({ caseItem }) => {
        const isAiEnabled = caseItem.ai !== "n";

        return (
            <Card className={`${isAiEnabled
                ? "bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 hover:border-purple-300"
                : "bg-white border-pale-gray hover:border-vivid-blue/30"
                } shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]`}>
                <CardHeader className="bg-gradient-to-r from-white/50 to-transparent border-b border-pale-gray">
                    <CardTitle className="flex flex-col space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <h3 className="text-xl font-semibold text-darker-gray flex-1">
                                {caseItem.title}
                            </h3>
                            <div className="flex items-center gap-2">
                                {isAiEnabled && (
                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-xs font-medium">
                                        <Bot size={14} />
                                        AI ENABLED
                                    </span>
                                )}
                                {caseItem.isDraft && (
                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                                        <FileText size={14} />
                                        DRAFT
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 text-gray-800">
                                <User size={16} />
                                <span className="text-sm text-gray-600">Author: </span>
                                <span className={`text-sm font-semibold ${caseItem.owner ? "text-blue-600" : ""}`}>{caseItem.author}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {isAiEnabled ? (
                                <div className="flex items-center gap-2 text-blue-600">
                                    <Sparkles size={16} />
                                    <span className="text-sm">Available for AI negotiations</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Archive size={16} />
                                    <span className="text-sm">Standard case</span>
                                </div>
                            )}
                        </div>
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-6">
                    <div className="mb-6">
                        <p className="text-gray-700 leading-relaxed line-clamp-3">
                            {caseItem.summary || "No summary available"}
                        </p>
                    </div>

                    {caseItem.id && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                            <FileText size={14} />
                            <span>Case ID: {caseItem.id}</span>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-pale-gray">
                        <Link href={`/admin/content/cases/${caseItem.id}`}>
                            <Button
                                variant="default"
                                className="h-10 px-4 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                            >
                                <Edit size={16} className="mr-2" />
                                Edit Case
                            </Button>
                        </Link>

                        <Button
                            variant="outline"
                            className="h-10 px-4 rounded-lg font-medium border-pale-gray hover:border-vivid-blue hover:text-vivid-blue transition-all duration-200 hover:scale-105"
                            onClick={() => setPreviewCaseId(caseItem.id)}
                        >
                            <Eye size={16} className="mr-2" />
                            Preview
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const CaseSection = ({ title, cases, icon: Icon, count, description }) => {
        if (cases.length === 0) return null;

        return (
            <div className="mb-12">
                <div className="flex items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-vivid-blue/10 text-vivid-blue">
                            <Icon size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-semibold text-darker-gray">{title}</h2>
                                <span className="px-3 py-1 rounded-full bg-pale-blue text-vivid-blue text-sm font-medium">
                                    {count}
                                </span>
                            </div>
                            {description && (
                                <p className="text-sm text-gray-600 mt-1">{description}</p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="grid gap-6">
                    {cases.map((caseItem, index) => (
                        <CaseCard key={index} caseItem={caseItem} />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-soft-white via-pale-blue/30 to-white p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-12">

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pale-gray shadow-lg p-6 mb-8">
                        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <Input
                                    type="text"
                                    placeholder="Search cases by title, summary, or type 'ai'..."
                                    value={search}
                                    onChange={handleSearch}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                                    className="pl-10 h-12 bg-white border-pale-gray focus:border-vivid-blue focus:ring-vivid-blue/20"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleSearchSubmit}
                                    variant="outline"
                                    className="h-12 px-6 rounded-xl font-medium border-pale-gray hover:border-vivid-blue hover:text-vivid-blue transition-all duration-200"
                                >
                                    <Search size={20} className="mr-2" />
                                    Search
                                </Button>
                                <Link href="/admin/content/cases/new">
                                    <Button
                                        className="bg-vivid-blue hover:bg-deep-blue text-white h-12 px-6 rounded-xl font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg"
                                    >
                                        <Plus size={20} className="mr-2" />
                                        Create Case
                                    </Button>
                                </Link>
                                <Link href="/admin/content/cases/builder">
                                    <Button
                                        variant="outline"
                                        className="h-12 px-6 rounded-xl font-medium border-pale-gray hover:border-purple-400 hover:text-purple-600 transition-all duration-200 hover:scale-105"
                                    >
                                        <Sparkles size={20} className="mr-2" />
                                        AI Case Builder
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-pale-gray">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-vivid-blue">{total}</div>
                                <div className="text-sm text-gray-600">Total Cases</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{groupedCases.aiEnabled.length}</div>
                                <div className="text-sm text-gray-600">AI Enabled</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-600">{groupedCases.standard.length}</div>
                                <div className="text-sm text-gray-600">Standard</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    {Math.round((groupedCases.aiEnabled.length / total) * 100) || 0}%
                                </div>
                                <div className="text-sm text-gray-600">AI Coverage</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <CaseSection
                        title="Draft Cases"
                        cases={groupedCases.draft}
                        icon={FileText}
                        count={groupedCases.draft.length}
                        description="Cases saved as drafts; not visible in searches"
                    />

                    <CaseSection
                        title="AI-Enabled Cases"
                        cases={groupedCases.aiEnabled}
                        icon={Bot}
                        count={groupedCases.aiEnabled.length}
                        description="Cases available for AI-powered negotiations and training"
                    />

                    <CaseSection
                        title="Standard Cases"
                        cases={groupedCases.standard}
                        icon={Archive}
                        count={groupedCases.standard.length}
                        description="Traditional cases for human-to-human negotiations"
                    />
                </div>

                {filteredCases.length === 0 && (
                    <div className="text-center py-12">
                        <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
                        <p className="text-gray-600 mb-6">Try adjusting your search criteria or create a new case.</p>
                    </div>
                )}

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            </div>

            {/* Case Preview Modal */}
            {previewCaseId && (
                <CaseFullPreview
                    caseId={previewCaseId}
                    onClose={() => setPreviewCaseId(null)}
                />
            )}
        </div>
    );
}
