"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import InfoTooltip from "@/components/InfoTooltip";

export default function ParamsAI({ initParams, onChange, disabled, subtleFont: subtle }) {
    const [params, setParams] = useState(Object.keys(initParams || {}).length ? initParams : {
        hardOnPeople: 1,
        hardOnProblem: 5,
        processDrive: 1,
        concessionsDist: 5,
        ethics: 5
    });
    
    useEffect(() => {
        if (initParams && Object.keys(initParams).length) {
            setParams(initParams);
        }
    }, [initParams]);

    const setParam = (key, value) => {
        const newParams = { ...params, [key]: value };
        setParams(newParams);
        if (onChange) onChange(newParams);
    }

    const labelStyle = subtle ? "text-black text-xs block mb-1" : "text-blue-700 text-md block mb-1 mr-2";

    return (
        <div className="mb-2">
            <div className="mb-2">
                <div className="flex items-center justify-start">
                    <Label className={labelStyle} htmlFor="hardOnPeople">Hard on people:</Label>
                    {!subtle && (
                        <InfoTooltip iconOnly={true} info="At minimum, the AI is warm and empathetic; at maximum, openly aggressive and dismissive." fromTop={true} />
                    )}
                </div>
                <Slider
                    id="hardOnPeople"
                    value={[params.hardOnPeople]}
                    onValueChange={(value) => setParam('hardOnPeople', value[0])}
                    min={1}
                    max={5}
                    step={1}
                    disabled={disabled}
                />
            </div>
            <div className="mb-2">
                <div className="flex items-center justify-start">
                    <Label className={labelStyle} htmlFor="hardOnProblem">Hard on problem:</Label>
                    {!subtle && (
                        <InfoTooltip iconOnly={true} info="At minimum, the AI prioritizes an easy agreement over its own gains. At maximum, it insists on a principled outcome based on objective standards." fromTop={true} />
                    )}
                </div>
                <Slider
                    id="hardOnProblem"
                    value={[params.hardOnProblem]}
                    onValueChange={(value) => setParam('hardOnProblem', value[0])}
                    min={1}
                    max={5}
                    step={1}
                    disabled={disabled}
                />
            </div>

            <div className="mb-2">
                <div className="flex items-center justify-start">
                    <Label className={labelStyle} htmlFor="processDrive">Process drive:</Label>
                    {!subtle && (
                        <InfoTooltip iconOnly={true} info="At minimum, the AI follows the other side’s lead; at maximum, it drives each phase assertively." fromTop={true} />
                    )}
                </div>
                <Slider
                    id="processDrive"
                    value={[params.processDrive]}
                    onValueChange={(value) => setParam('processDrive', value[0])}
                    min={1}
                    max={5}
                    step={1}
                    disabled={disabled}
                />
            </div>

            <div className="mb-2">
                <div className="flex items-center justify-start">
                    <Label className={labelStyle} htmlFor="concessionsDist">Distribution of concessions:</Label>
                    {!subtle && (
                        <InfoTooltip iconOnly={true} info="At minimum, the AI concedes early and often; at maximum, it delays and minimizes concessions unless forced." fromTop={true} />
                    )}
                </div>
                <Slider
                    id="concessionsDist"
                    value={[params.concessionsDist]}
                    onValueChange={(value) => setParam('concessionsDist', value[0])}
                    min={1}
                    max={5}
                    step={1}
                    disabled={disabled}
                />
            </div>

            <div className="mb-2">
                <div className="flex items-center justify-start">
                    <Label className={labelStyle} htmlFor="ethics">Ethicality:</Label>
                    {!subtle && (
                        <InfoTooltip iconOnly={true} info="At minimum, the AI uses bluffs and manipulative tactics to get a better deal. At maximum, it is fully honest and fair." fromTop={true} />
                    )}
                </div>
                <Slider
                    id="ethics"
                    value={[params.ethics]}
                    onValueChange={(value) => setParam('ethics', value[0])}
                    min={1}
                    max={5}
                    step={1}
                    disabled={disabled}
                />
            </div>

        </div>
    );
}
