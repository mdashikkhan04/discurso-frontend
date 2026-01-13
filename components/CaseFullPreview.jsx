"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, User, Variable, FileText, Target } from "lucide-react";
import "@/public/case.css";
import { getCaseByIdForPreview } from "@/actions/cases";
import { useUser } from "@/contexts/UserContext";

export default function CaseFullPreview({ caseId, onClose }) {
    const [caseData, setCaseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useUser();

    useEffect(() => {
        const fetchCase = async () => {
            if (!caseId || !user) return;

            try {
                setLoading(true);
                const data = await getCaseByIdForPreview(caseId);
                setCaseData(data);
            } catch (err) {
                console.error("Error fetching case:", err);
                setError("Failed to load case data");
            } finally {
                setLoading(false);
            }
        };

        fetchCase();
    }, [caseId, user]);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-8 shadow-2xl">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-gray-700">Loading case...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !caseData) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
                    <div className="text-center">
                        <div className="text-red-600 mb-4">
                            <FileText size={48} className="mx-auto" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Case</h3>
                        <p className="text-gray-600 mb-4">{error || "Case not found"}</p>
                        <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-700">
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-7xl h-[95vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Target size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{caseData.title}</h2>
                            <p className="text-blue-100 text-sm">
                                {caseData.owner ? "" : "by"} {caseData.author}
                            </p>
                            {caseData.languages?.length > 1 && (
                                <p className="text-gray-200 text-sm italic">Languages: {caseData.languages.join(", ")}</p>
                            )}
                        </div>
                    </div>
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20 rounded-full border border-2 border-white"
                    >
                        <X size={36} strokeWidth={4} />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {caseData.generalInstruct && caseData.generalInstruct.trim() && (
                        <Card className="p-6 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-100 rounded-xl">
                                    <FileText size={20} className="text-purple-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-purple-800">General Instructions</h3>
                            </div>
                            <div
                                dir="auto"
                                className="prose prose-sm max-w-none text-gray-700"
                                dangerouslySetInnerHTML={{ __html: caseData.generalInstruct }}
                            />
                        </Card>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="h-fit border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                            <div className="bg-blue-400 text-white p-4 flex items-center gap-3 rounded-t-md">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        {caseData.aName || 'Side A'}
                                    </h3>
                                    <p className="text-blue-100 text-sm">Role Instructions</p>
                                </div>
                            </div>
                            <div className="p-6">
                                    {caseData.aInstruct ? (
                                        <div
                                            dir="auto"
                                            className="prose prose-sm max-w-none text-gray-700"
                                            dangerouslySetInnerHTML={{ __html: caseData.aInstruct }}
                                        />
                                    ) : (
                                    <p className="text-gray-500 italic">No specific instructions for this side.</p>
                                )}
                            </div>
                        </Card>

                        <Card className="h-fit border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                            <div className="bg-green-400 text-white p-4 flex items-center gap-3 rounded-t-md">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        {caseData.bName || 'Side B'}
                                    </h3>
                                    <p className="text-green-100 text-sm">Role Instructions</p>
                                </div>
                            </div>
                            <div className="p-6">
                                        {caseData.bInstruct ? (
                                            <div
                                                dir="auto"
                                                className="prose prose-sm max-w-none text-gray-700"
                                                dangerouslySetInnerHTML={{ __html: caseData.bInstruct }}
                                            />
                                        ) : (
                                    <p className="text-gray-500 italic">No specific instructions for this side.</p>
                                )}
                            </div>
                        </Card>
                    </div>

                    {caseData.params && caseData.params?.length && (
                        <Card className="p-6 border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-gray-100 rounded-xl">
                                    <Variable size={20} className="text-gray-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800">Parameters</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {caseData.params.map((param, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
                                        <h4 className="font-medium text-gray-800 mb-2">{param.name}</h4>
                                        <div className="space-y-1">
                                            <div className="text-sm text-gray-600">
                                                <span className="font-medium">{param.id} • {param.dataType}</span>
                                                {param.dataType === "list" ? (
                                                    <>
                                                        <br />
                                                        <span className="">Values: </span>
                                                        <span className="text-gray-500">{param.listItems.split("<>").join(" • ")}</span>
                                                    </>
                                                ) : (<></>)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                    )}
                </div>
            </div>
        </div>
    );
}
