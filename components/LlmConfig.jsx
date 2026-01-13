"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, } from "@/components/ui/select";
import { useState, useEffect } from "react";

export default function LlmConfig({ initConfig, onChange, disabled = false, expanded = false }) {
    const defaultConfig = {
        model: "OPENAI=gpt-4.1-mini",
        temperature: 0.7,
        maxTokens: 10240,
        reasoningEffort: "high",
        verbosity: "medium"
    }
    const [params, setParams] = useState(Object.keys(initConfig || {}).length ? { ...defaultConfig, ...initConfig } : defaultConfig);

    const MODELS = [
        { value: "OPENAI=gpt-5-nano", label: "gpt-5-nano", maxOutputTokens: 128000 },
        { value: "OPENAI=gpt-5-mini", label: "gpt-5-mini", maxOutputTokens: 128000 },
        { value: "OPENAI=gpt-5", label: "gpt-5", maxOutputTokens: 128000 },
        { value: "OPENAI=o4-mini", label: "o4-mini", maxOutputTokens: 100000 },
        { value: "OPENAI=o3-mini", label: "o3-mini", maxOutputTokens: 100000 },
        { value: "OPENAI=gpt-4.1-nano", label: "gpt-4.1-nano", maxOutputTokens: 32768 },
        { value: "OPENAI=gpt-4.1-mini", label: "gpt-4.1-mini", maxOutputTokens: 32768 },
        { value: "OPENAI=gpt-4.1", label: "gpt-4.1", maxOutputTokens: 32768 },
        { value: "OPENAI=gpt-4o", label: "4o", maxOutputTokens: 16384 },
        { value: "OPENAI=gpt-4o-mini", label: "4o-mini", maxOutputTokens: 16384 },
        { value: "GOOGLE=gemini-2.5-pro", label: "Gemini 2.5 Pro", maxOutputTokens: 65536 },
        { value: "GOOGLE=gemini-2.5-flash", label: "Gemini 2.5 Flash", maxOutputTokens: 65536 },
        { value: "GOOGLE=gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite", maxOutputTokens: 65536 },
        { value: "GOOGLE=gemini-2.0-flash", label: "Gemini 2.0 Flash", maxOutputTokens: 8192 },
        { value: "XAI=grok-4-fast", label: "Grok 4 Fast", maxOutputTokens: 102400 },
        { value: "XAI=grok-4-fast-non-reasoning", label: "Grok 4 Fast Non-reasoning", maxOutputTokens: 102400 }
    ]

    useEffect(() => {
        setParams(initConfig);
    }, [initConfig]);

    const setParam = (key, value) => {
        const newParams = { ...params, [key]: value };
        setParams(newParams);
        if (onChange) onChange(newParams);
    }

    const isGpt5 = params.model.includes("gpt-5");
    const isReasoningModel = isGpt5 || params.model.includes("o3") || params.model.includes("o4");
    const supportsTemperature = !isReasoningModel && !params.model.includes("grok");// || params.model.includes("gpt-5");
    const outputTokensLimit = MODELS.find(mdl => mdl.value === params.model)?.maxOutputTokens || 4096;
    return (
        <div className="mb-2 grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            <div className="mb-2">
                <Label className="text-blue-700 text-md block mb-1" htmlFor="model">Model:</Label>
                <Select value={params.model} onValueChange={(value) => setParam('model', value)} disabled={disabled}>
                    <SelectTrigger id="model">
                        <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                        {MODELS.map(model => (
                            <SelectItem key={model.value} value={model.value}>
                                {expanded ? model.label.replace(" (high)", "") : model.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {supportsTemperature && (
                <div className="mb-2">
                    <Label className="text-blue-700 text-md block mb-1" htmlFor="temperature">Temperature:</Label>
                    <Input
                        id="temperature"
                        type="number"
                        value={params.temperature}
                        onChange={(e) => setParam('temperature', parseFloat(e.target.value))}
                        min={0}
                        max={1}
                        step={0.01}
                        disabled={disabled}
                    />
                </div>
            )}
            <div className="mb-2">
                <Label className="text-blue-700 text-md block mb-1" htmlFor="maxTokens">{`Max Tokens (<=${outputTokensLimit}):`}</Label>
                <Input
                    className={params.maxTokens > outputTokensLimit ? "border-2 border-red-500" : ""}
                    id="maxTokens"
                    type="number"
                    value={params.maxTokens}
                    onChange={(e) => setParam('maxTokens', parseInt(e.target.value))}
                    min={1}
                    max={outputTokensLimit}
                    step={1}
                    disabled={disabled}
                />
            </div>
            {expanded && (
                <>
                    {isReasoningModel && (
                        <div className="mb-2">
                            <Label className="text-blue-700 text-md block mb-1" htmlFor="reasoning">Reasoning effort:</Label>
                            <Select value={params.reasoningEffort} onValueChange={(value) => setParam('reasoningEffort', value)} disabled={disabled}>
                                <SelectTrigger id="reasoning">
                                    <SelectValue placeholder="Select reasoning effort" />
                                </SelectTrigger>
                                <SelectContent>
                                    {["high", "medium", "low", ...(isGpt5 ? ["minimal"] : [])].map(val => (
                                        <SelectItem key={val} value={val}>
                                            {val}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {isGpt5 && (
                        <div className="mb-2">
                            <Label className="text-blue-700 text-md block mb-1" htmlFor="verbosity">Verbosity level:</Label>
                            <Select value={params.verbosity} onValueChange={(value) => setParam('verbosity', value)} disabled={disabled}>
                                <SelectTrigger id="verbosity">
                                    <SelectValue placeholder="Select verbosity level" />
                                </SelectTrigger>
                                <SelectContent>
                                    {["high", "medium", "low"].map(val => (
                                        <SelectItem key={val} value={val}>
                                            {val}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
