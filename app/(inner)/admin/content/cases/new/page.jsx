"use client";

import { useState } from "react";
import CaseForm from "@/components/CaseForm";

export default function NewCasePage() {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    summary: "",
    generalInstruct: "",
    aName: "",
    aInstruct: "",
    bName: "",
    bInstruct: "",
    instructions: {
      en: {
        general: "",
        partyA: "",
        partyB: "",
      },
    },
    params: [],
    scoreFormulaA: "",
    scoreFormulaB: "",
    ai: "n",
    agreeMatch: true,
    relationWeight: 50,
    scorable: true,
    tags: [],
  });

  return (
    <div>
      <CaseForm formData={formData} setFormData={setFormData} />
    </div>
  );
}
