"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X, Upload, Loader2, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listEventCoverUploads, uploadEventCover, deleteEventCover } from "@/actions/events";
import { showErrorToast, showSuccessToast } from "@/components/toast";

const PRELOADED_COVERS = Array.from({ length: 10 }, (_, index) => `/event-covers/${index + 1}.jpg`);

export default function EventCoverPicker({
    isOpen,
    onClose,
    onSelect,
    selectedValue,
    currentPreview,
}) {
    const [uploads, setUploads] = useState([]);
    const [loadingUploads, setLoadingUploads] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [localSelection, setLocalSelection] = useState(selectedValue || null);

    useEffect(() => {
        setLocalSelection(selectedValue || null);
        setFilePreview(currentPreview || null);
    }, [selectedValue, currentPreview, isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const fetchUploads = async () => {
            setLoadingUploads(true);
            try {
                const result = await listEventCoverUploads();
                if (result?.success && Array.isArray(result.uploads)) {
                    setUploads(result.uploads);
                }
            } catch (error) {
                console.error("Error loading event cover uploads:", error);
                showErrorToast("Could not load your uploaded covers.");
            } finally {
                setLoadingUploads(false);
            }
        };

        fetchUploads();
    }, [isOpen]);

    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showErrorToast("Cover image must be smaller than 5MB.");
            return;
        }

        if (!file.type.startsWith("image/")) {
            showErrorToast("Only image files are supported.");
            return;
        }

        setSelectedFile(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            setFilePreview(e.target?.result ?? null);
        };
        reader.readAsDataURL(file);
    };

    const resetFileSelection = () => {
        setSelectedFile(null);
        setFilePreview(currentPreview || null);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            showErrorToast("Select an image to upload.");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("image", selectedFile);

            const result = await uploadEventCover(formData);
            if (result?.success) {
                const newUpload = {
                    storagePath: result.storagePath,
                    downloadUrl: result.downloadUrl,
                    uploadedAt: result.uploadedAt,
                };
                setUploads((prev) => [newUpload, ...prev.filter((item) => item.storagePath !== newUpload.storagePath)]);
                showSuccessToast("Cover uploaded.");
                onSelect({ value: result.storagePath, previewUrl: result.downloadUrl });
                setSelectedFile(null);
                setFilePreview(null);
            }
        } catch (error) {
            console.error("Error uploading cover:", error);
            showErrorToast(error?.message || "Failed to upload cover.");
        } finally {
            setUploading(false);
        }
    };

    const selectCover = (value, previewUrl) => {
        setLocalSelection(value);
        onSelect({ value, previewUrl });
        onClose();
    };

    const coverOptions = useMemo(() => {
        return PRELOADED_COVERS.map((src) => ({ value: src, previewUrl: src, type: "preloaded" }));
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-800">Choose event cover image</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="grid gap-6 overflow-y-auto px-4 py-4 md:grid-cols-[2fr_1fr]">
                    <div className="space-y-2">
                        <section>
                            <header className="mb-3 flex items-center justify-between">
                                {loadingUploads && (
                                    <div className="flex items-center gap-2 text-md text-slate-600">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Loading your images
                                    </div>
                                )}
                            </header>
                            {uploads.length > 0 && (
                                <>
                                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                        {uploads.map((item) => {
                                            const isSelected = localSelection === item.storagePath;
                                            return (
                                                <button
                                                    key={item.storagePath}
                                                    type="button"
                                                    onClick={() => selectCover(item.storagePath, item.downloadUrl)}
                                                    className={`group relative overflow-hidden rounded-2xl border transition-all ${isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200 hover:border-blue-300"}
                                            `}
                                                >
                                                    <div className="relative h-28 w-full">
                                                        <Image
                                                            src={item.downloadUrl}
                                                            alt="Uploaded event cover"
                                                            fill
                                                            className="object-cover"
                                                            sizes="(max-width: 1024px) 50vw, 25vw"
                                                            unoptimized
                                                        />
                                                    </div>
                                                    {!isSelected && (
                                                        <div
                                                            role="button"
                                                            aria-label="Delete"
                                                            title="Delete"
                                                            className="absolute bottom-2 right-2 z-10 rounded-full bg-red-600 p-1.5 text-white shadow hover:bg-red-700 focus:outline-none"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (!confirm("Delete cover image?")) return;
                                                                (async () => {
                                                                    try {
                                                                        const res = await deleteEventCover(item.storagePath);
                                                                        if (res?.success) {
                                                                            setUploads((prev) => prev.filter((u) => u.storagePath !== item.storagePath));
                                                                            showSuccessToast("Image deleted.");
                                                                        } else {
                                                                            throw new Error(res?.error || "Failed to delete");
                                                                        }
                                                                    } catch (err) {
                                                                        console.error("Error deleting cover:", err);
                                                                        showErrorToast(err?.message || "Failed to delete cover.");
                                                                    }
                                                                })();
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" strokeWidth={3} />
                                                        </div>
                                                    )}
                                                    {isSelected && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-blue-600/25 text-white">
                                                            <Check className="h-6 w-6" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <hr className="my-4 border-gray-400" />
                                </>
                            )}
                        </section>
                        <section>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                {coverOptions.map((option) => {
                                    const isSelected = localSelection === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => selectCover(option.value, option.previewUrl)}
                                            className={`group relative overflow-hidden rounded-2xl border transition-all ${isSelected ? "border-blue-600 ring-4 ring-blue-400" : "border-slate-200 hover:border-blue-400"
                                                }`}
                                        >
                                            <div className="relative h-28 w-full">
                                                <Image
                                                    src={option.previewUrl}
                                                    alt="Event cover option"
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 1024px) 50vw, 25vw"
                                                    unoptimized
                                                />
                                            </div>
                                            {isSelected && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-blue-600/25 text-white">
                                                    <Check className="h-6 w-6" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Upload new image</h3>
                        {!selectedFile && (
                            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-center transition hover:border-blue-400">
                                <Upload className="h-6 w-6 text-slate-400" />
                                <div className="text-sm font-medium text-slate-600">Click to upload</div>
                                <div className="text-xs text-slate-400">JPG, PNG, GIF, WEBP (max 5MB)</div>
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                            </label>
                        )}

                        {selectedFile && (
                            <div className="space-y-3">
                                {filePreview && (
                                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                                        <div className="relative h-40 w-full">
                                            <Image
                                                src={filePreview}
                                                alt="Selected cover preview"
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 100vw, 400px"
                                                unoptimized
                                            />
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">{selectedFile.name}</p>
                                    <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1" onClick={resetFileSelection} disabled={uploading}>
                                        Reset
                                    </Button>
                                    <Button className="flex-1" onClick={handleUpload} disabled={uploading}>
                                        {uploading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" /> Uploading
                                            </span>
                                        ) : (
                                            "Upload"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}