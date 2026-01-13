"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState } from "react";
import { showSuccessToast, showErrorToast } from "@/components/toast";
import { useLoading } from "@/contexts/LoadingContext";
import { saveTag } from "@/actions/tags";

export default function TagAdder({ onClose, onCreated, defaultType = "case", hideTypeSelector = false }) {
    const [tagData, setTagData] = useState({ name: "", value: "", type: defaultType });
    const { showLoading, hideLoading } = useLoading();

    const handleSave = async (e) => {
        if (!tagData.name) {
            showErrorToast("Missing tag name");
            return;
        }
        if (!tagData.value) {
            showErrorToast("Missing tag value");
            return;
        }
        if (!tagData.type.length) {
            showErrorToast("Missing tag type");
            return;
        }
        showLoading();
        try {
            const newTag = await saveTag(tagData.name, tagData.value, tagData.type);
            hideLoading();
            showSuccessToast("Tag added successfully");
            setTagData({ name: "", value: "", type: defaultType });
            if (onCreated) {
                onCreated(newTag);
                onClose();
            }
        } catch (error) {
            hideLoading();
            console.error("Error saving tag:", error);
            showErrorToast("Error saving tag");
        }
    };

    return (

        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-md  shadow-lg">
                <div className="mb-2">
                    <Label htmlFor="tagName">Name</Label>
                    <Input
                        id="tagName"
                        type="text"
                        placeholder="Tag name"
                        value={tagData.name}
                        onChange={(e) => {
                            const newName = e.target.value;
                            setTagData(prevData => ({ ...prevData, name: newName, value: newName.toLowerCase().replace(/\s+/g, "_") }));
                        }}
                    />
                </div>
                <p className="text-gray-500 text-xs mb-4"><span className="font-semibold">Value: </span>{tagData.value}</p>

                {!hideTypeSelector && (
                  <div className="mb-4">
                      <label className="">Type:</label>
                      <Select
                          onValueChange={(value) => setTagData(prevData => ({ ...prevData, type: value }))}
                          defaultValue={tagData.type || defaultType}
                      >
                          <SelectTrigger className="w-full md:w-64">
                              <SelectValue placeholder="Select tag type" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem key="case" value="case">
                                  Case
                              </SelectItem>
                              <SelectItem key="stage" value="stage">
                                  Stage
                              </SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                )}

                <div className="flex justify-end">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="mr-2"
                    >
                        Close
                    </Button>
                    <Button
                        variant="default"
                        onClick={handleSave}
                    >
                        Save Tag
                    </Button>
                </div>

            </div>
        </div>
    );
}
