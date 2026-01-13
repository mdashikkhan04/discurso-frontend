"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function CaseItem({ acase, onSelect, allTags }) {
    return (
        <>
            <Card className="bg-white border shadow-lg rounded-lg mx-2 my-4 p-1">
                <CardHeader>
                    <CardTitle className="">{acase.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    {acase.author && (
                        <>
                            <h3 className="text-gray-600 font-semibold">{acase.author}</h3>
                            <h2 className="mt-2"><span className="font-semibold">{acase.aName} {acase.ai === "a" ? (<span className="text-blue-700">(AI)</span>) : ""}</span> and <span className="font-semibold">{acase.bName} {acase.ai === "b" ? (<span className="text-blue-700">(AI)</span>) : ""}</span></h2>
                            <h3 className="text-gray-500 italic">({acase.scorable ? "Scorable" : "Non-scorable"})</h3>
                            <p className="mt-2">{acase.summary}</p>
                            <p className="mt-2"><span className="font-semibold">Parameters:</span> <span className="text-gray-600">{acase.params.map(param => param.name).join(", ")}</span></p>
                            <p className="mt-2 text-gray-800 italic">{(acase.tags || []).map(tag => (allTags.find(t => t.value === tag)?.name || tag)).join(", ")}</p>
                            {(acase.languages?.length || 0) > 1 && (
                                <p className="mt-2"><span className="font-semibold">Languages:</span><span className="text-gray-700 italic">{acase.languages.join(", ")}</span></p>
                            )}
                        </>
                    )}
                    {onSelect && (
                        <Button
                            className="mt-4"
                            onClick={() => {
                                onSelect(acase);
                            }}>Select</Button>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
