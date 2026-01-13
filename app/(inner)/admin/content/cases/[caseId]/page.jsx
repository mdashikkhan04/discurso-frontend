"use client";

import { useState, useEffect } from "react";
import CaseForm from "@/components/CaseForm";
import { fetcher } from "@/lib/fetcher";
import { useLoading } from "@/contexts/LoadingContext"; // Import useLoading
import { useUser } from "@/contexts/UserContext";

export default function EditCasePage({ params }) {
  const [formData, setFormData] = useState(null);
  const [caseId, setCaseId] = useState(null);
  const { showLoading, hideLoading } = useLoading();
  const { user } = useUser();

  // Fetch caseId from the async params
  useEffect(() => {
    if (!user) return;
    const getCaseId = async () => {
      const resolvedParams = await params; // Unwrap the promise
      setCaseId(resolvedParams.caseId); // Set the caseId after resolving params
    };

    getCaseId();
  }, [params]); // Re-run if params change

  // Fetch the case data after caseId is set
  useEffect(() => {
    if (!user) return;
    const getCase = async () => {
      if (caseId) {
        showLoading();
        try {
          const response = await fetcher.get(`/api/data/cases/${caseId}`, user);
          if (response.ok) {
            //console.log("Case fetched:", response.result);
            setFormData(response.result.data); // Update formData with fetched case data
          } else {
            console.error("Failed to fetch case:", response.error);
          }
        } catch (error) {
          console.error("Error during fetch:", error);
        }
        hideLoading();
      }
    };

    getCase(); // Fetch case data if caseId is available
  }, [caseId, user]); // Re-run if caseId changes

  // If formData is null, it means the case is still being fetched
  if (!formData) {
    return null;
  }

  return (
    <div>
      <CaseForm formData={formData} setFormData={setFormData} />
    </div>
  );
}
