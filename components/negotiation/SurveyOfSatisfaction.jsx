import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function SurveyOfSatisfaction({
  formData,
  handleInputChange,
  requiresSVI,
  finished,
  handleSurveySubmit,
  comment,
  setComment,
  timeLeft,
}) {

  // console.log("formdata", formData)
  return (
    <div className="h-full overflow-y-auto max-h-full p-2 px-4">
      <h2 className="text-xl font-semibold my-4 mb-8 text-center">
        Post-Negotiation Survey
      </h2>
      {formData?.length > 0 && formData.map((input) => (
        <div key={input.fieldName} className="mb-8">
          <div className="mb-4">
            <label className="block text-gray-800 mb-1">
              {input.label}
            </label>
            <Select
              onValueChange={(value) =>
                handleInputChange(input.fieldName, value)
              }
              disabled={!timeLeft}
              value={input.value}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose on scale of 1 to 7">
                  {input.value}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="1" value="1">
                  1 - {input.minDesc}
                </SelectItem>
                <SelectItem key="2" value="2">
                  2
                </SelectItem>
                <SelectItem key="3" value="3">
                  3
                </SelectItem>
                <SelectItem key="4" value="4">
                  4
                </SelectItem>
                <SelectItem key="5" value="5">
                  5
                </SelectItem>
                <SelectItem key="6" value="6">
                  6
                </SelectItem>
                <SelectItem key="7" value="7">
                  7 - {input.maxDesc}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
      <div className="mb-6">
        <label className="block text-gray-800 mb-2">
          Comment
        </label>
        <div className="border-2 rounded-lg border-gray-100">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className={`w-full p-2 ${timeLeft ? "resize-y" : "resize-none"} disabled:cursor-not-allowed disabled:opacity-50`}
            disabled={!timeLeft}
          />
        </div>
      </div>
      {timeLeft && (
        <Button onClick={handleSurveySubmit} variant="default">
          Submit Survey
        </Button>
      )}
    </div>
  );
} 