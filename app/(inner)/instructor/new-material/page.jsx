"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { useLoading } from "@/contexts/LoadingContext";
import { fetcher } from "@/lib/fetcher";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { uploadResourceFile } from "@/lib/client/storage";
import { showSuccessToast, showErrorToast } from "@/components/toast";

export default function NewMaterialPage() {
  const [formData, setFormData] = useState({
    title: "",
    desc: "",
    content: "",
    files: [],
  });
  const router = useRouter();
  const { user } = useUser();
  const { showLoading, hideLoading } = useLoading();

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        files: Array.from(e.target.files), // Convert FileList to an array
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, desc, content, files } = formData;
    const userId = user.uid;

    showLoading();
    // Upload the files
    try {
      let resFiles;
      if (files.length > 0) {
        resFiles = await Promise.all(
          files.map((file) => uploadResourceFile(file, userId))
        );
        console.debug("resFiles", resFiles);
      }
      const resource = {
        title,
        desc,
        content,
        files: resFiles,
        userId,
        author: user.displayName
          ? `${user.displayName} (${user.email})`
          : user.email,
      };
      console.debug("resource", resource);
      const response = await fetcher.post(`/api/data/resources/null`, {
        data: resource, // Send the form data to the API
      }, user);

      if (response.ok) {
        showSuccessToast("Material saved");
        router.replace("/instructor"); //TODO redirect to the INSTURCTOR DASHBOARD
      } else {
        console.error("Failed to save material:", response.error);
        showErrorToast("Failed to save material");
      }
    } catch (error) {
      console.error("File upload failed:", error);
    }

    hideLoading();
  };

  return (
    <div className="flex flex-col min-h-screen p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Submit Material</h1>
      </header>

      <form
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-10 mb-8"
        onSubmit={handleSubmit}
      >
        <div className="space-y-2">
          <label htmlFor="title" className="font-medium text-gray-700">
            Name of the Material:
          </label>
          <Input
            id="title"
            type="text"
            placeholder="Enter the material name"
            value={formData.title}
            onChange={handleInputChange}
          />
        </div>

        <div className="col-span-full">
          <label htmlFor="desc" className="font-medium text-gray-700">
            Short Description:
          </label>
          <Textarea
            id="desc"
            placeholder="Enter a short description of the material"
            value={formData.desc}
            onChange={handleInputChange}
            rows={3}
          />
        </div>

        <div className="col-span-full">
          <label htmlFor="content" className="font-medium text-gray-700">
            Content:
          </label>
          <Textarea
            id="content"
            placeholder="Enter the detailed content of the material"
            value={formData.content}
            onChange={handleInputChange}
            rows={6}
          />
        </div>

        <div className="col-span-full">
          <label htmlFor="file" className="font-medium text-gray-700">
            Select Material Files:
          </label>
          <input
            id="file"
            type="file"
            multiple
            className="mt-2 block"
            onChange={handleFileChange}
          />
        </div>

        <div className="col-span-full flex justify-center mt-8">
          <Button
            type="submit"
            variant="default"
            className="flex items-center justify-center gap-2"
          >
            Submit Material
          </Button>
        </div>
      </form>
    </div>
  );
}
