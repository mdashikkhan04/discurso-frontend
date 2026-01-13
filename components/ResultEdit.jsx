"use client";

import { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InfoTooltip from "@/components/InfoTooltip";

export default function ResultEdit({ orgResult, cases, dealParams, onUpdate, onDelete, sviForm, aiRound }) {
  const allDealParams = Object.keys(dealParams).reduce((acc, param) => {
    acc[param] = "";
    return acc;
  }, {});

  const [result, setResult] = useState(() => ({
    ...orgResult,
    agreement: { ...allDealParams, ...orgResult.agreement },
    madeDeal: orgResult.madeDeal !== undefined ? orgResult.madeDeal : true,
    final: orgResult.final !== undefined ? orgResult.final : true,
  }));

  return (
    <div className="">
      <Accordion className="mx-2" type="single" collapsible>
        <AccordionItem value={`${result.team}-${result.round}-props`}>
          <AccordionTrigger>Properties</AccordionTrigger>
          <AccordionContent className="ml-2" >
            <div className="mb-4">
              <label className="text-gray-700 mb-2">Reached agreement:</label>
              <Select
                value={result.madeDeal.toString()}
                onValueChange={(newValue) => {
                  setResult((prev) => {
                    return { ...prev, madeDeal: newValue === "true" };
                  })
                }}
              >
                <SelectTrigger className="w-1/2">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mb-4">
              <label className="text-gray-700 mb-2">Agreement is final:</label>
              <Select
                value={result.final.toString()}
                onValueChange={(newValue) => {
                  setResult((prev) => {
                    return { ...prev, final: newValue === "true" };
                  })
                }}
              >
                <SelectTrigger className="w-1/2">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value={`${result.team}-${result.round}-agreement`}>
          <AccordionTrigger>Agreement</AccordionTrigger>
          <AccordionContent className="ml-4" >
            {Object.keys(result.agreement).map(key => {
              return (
                <div key={`${result.team}-${result.round}-agr-${key}`} className="mb-4">
                  <label className="text-gray-700 mb-2">{cases[result.caseId].params[key].name}:</label>
                  <Input
                    type={cases[result.caseId].params[key].dataType == "number" ? "number" : "text"}
                    value={result.agreement[key]}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setResult((prev) => {
                        return { ...prev, agreement: { ...prev.agreement, [key]: newValue } };
                      })
                    }}
                    className="w-1/2"
                  />
                </div>
              )
            })}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value={`${result.team}-${result.round}-survey`}>
          <AccordionTrigger>Survey</AccordionTrigger>
          <AccordionContent className="ml-4" >
            {/* {Object.keys(result.survey).map(key => { */}
            {Object.keys(sviForm).map(key => {
              return (
                <div key={`${result.team}-${result.round}-surv-${key}`} className="mb-4">
                  {sviForm?.[key]?.label ? (
                    <div className="flex items-center mb-2">
                      <label className="text-gray-700 mr-2">"{sviForm[key].label}":</label>
                      <InfoTooltip iconOnly={true} info={sviForm[key].tip} />
                    </div>
                  ) : (
                    <label className="text-gray-700 mb-2">{key}:</label>
                  )
                  }
                  <Input
                    type="number"
                    min="1"
                    max="7"
                    value={result.survey[key] || ""}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value);
                      setResult((prev) => {
                        return { ...prev, survey: { ...prev.survey, [key]: newValue } };
                      })
                    }}
                    className="w-1/2"
                  />
                </div>
              )
            })}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      {
        result.comment && (
          <div className="ml-4 my-2" >
            <label className="text-gray-700 mb-2">Comment:</label>
            <p>{result.comment}</p>
          </div>
        )
      }
      <div className="ml-4 my-4 space-y-2">
        <Button variant="default" className="mr-2" onClick={() => onUpdate(result)}>Update results for <span className="font-semibold">{aiRound ? "" : "Team"} {result.team}</span> in <span className="font-semibold">round {result.round}</span></Button>
        <Button variant="destructive" onClick={() => onDelete(result, result.round, result.index)}>Re-open negotiation for <span className="font-semibold">{aiRound ? "" : "Team"} {result.team}</span> in <span className="font-semibold">round {result.round}</span></Button>
      </div>
    </div >
  );
}
