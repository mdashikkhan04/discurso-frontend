"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import InfoTooltip from "@/components/InfoTooltip";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import { showSuccessToast, showErrorToast } from "@/components/toast";
import { useLoading } from "@/contexts/LoadingContext";
import { useUser } from "@/contexts/UserContext";
import { testFunc } from "@/lib/scoreFuncUtil";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "@/public/prism.css";
import { Slider } from "@/components/ui/slider"
import { getTags, deleteTag } from "@/actions/tags";
import { getTranslation } from "@/actions/ai";
import TagAdder from "@/components/TagAdder";
import TagItem from "@/components/TagItem";
import ParamsAI from "@/components/ParamsAI";
import CasePreview from "@/components/CasePreview";
import { X, Sparkles, Star } from "lucide-react";
import { makeCaseFormula } from "@/actions/cases";

import RichTextEditor from "@/components/RichTextEditor";

const LANGUAGE_LABELS = {
  en: "English",
  de: "German",
  es: "Spanish",
  pl: "Polish",
  dk: "Danish",
  cn: "Chinese",
  hi: "Hindi",
  fr: "French",
  ru: "Russian",
  he: "Hebrew",
};

export default function CaseForm({ formData, setFormData }) {
  const [isScoreFormulaAValid, setIsAScoreFormulaAValid] = useState(true);
  const [isScoreFormulaBValid, setIsBScoreFormulaBValid] = useState(true);
  const [scoreFormulaAError, setScoreFormulaAError] = useState("");
  const [scoreFormulaBError, setScoreFormulaBError] = useState("");
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();
  const { user } = useUser();
  const [tags, setTags] = useState([]);
  const [creatingTag, setCreatingTag] = useState(false);
  const [hasInstructChanged, setHasInstructChanged] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [generatingFormulaA, setGeneratingFormulaA] = useState(false);
  const [generatingFormulaB, setGeneratingFormulaB] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState("en");

  useEffect(() => {
    if (!formData) return;

    if (!formData.defaultLang) {
      setFormData((prev) => {
        if (!prev || prev.defaultLang) return prev;
        return { ...prev, defaultLang: "en" };
      });
    }

    if (!formData.gender) {
      setFormData((prev) => {
        if (!prev || prev.gender) return prev;
        return { ...prev, gender: "female" };
      });
    }
  }, [formData, setFormData]);

  const defaultLanguage = formData?.defaultLang || "en";

  useEffect(() => {
    setFormData((prev) => {
      if (!prev) return prev;

      const existingInstructions = prev.instructions || {};
      const languages = new Set(Object.keys(existingInstructions));
      languages.add("en");

      let instructionsChanged = !prev.instructions;
      const normalizedInstructions = {};

      languages.forEach((lang) => {
        const current = existingInstructions[lang] || {};
        const englishFallback = {
          general: prev.generalInstruct ?? "",
          partyA: prev.aInstruct ?? "",
          partyB: prev.bInstruct ?? "",
        };

        const normalized = {
          general: current.general ?? current.generalInstruct ?? (lang === "en" ? englishFallback.general : ""),
          partyA: current.partyA ?? current.aInstruct ?? (lang === "en" ? englishFallback.partyA : ""),
          partyB: current.partyB ?? current.bInstruct ?? (lang === "en" ? englishFallback.partyB : ""),
        };

        normalizedInstructions[lang] = normalized;

        if (
          !existingInstructions[lang] ||
          current.general !== normalized.general ||
          current.partyA !== normalized.partyA ||
          current.partyB !== normalized.partyB ||
          "generalInstruct" in current ||
          "aInstruct" in current ||
          "bInstruct" in current
        ) {
          instructionsChanged = true;
        }
      });

      const nextGeneral = normalizedInstructions.en?.general ?? "";
      const nextPartyA = normalizedInstructions.en?.partyA ?? "";
      const nextPartyB = normalizedInstructions.en?.partyB ?? "";

      const topLevelChanged =
        (prev.generalInstruct ?? "") !== nextGeneral ||
        (prev.aInstruct ?? "") !== nextPartyA ||
        (prev.bInstruct ?? "") !== nextPartyB;

      if (!instructionsChanged && !topLevelChanged) {
        return prev;
      }

      return {
        ...prev,
        instructions: normalizedInstructions,
        generalInstruct: nextGeneral,
        aInstruct: nextPartyA,
        bInstruct: nextPartyB,
      };
    });
  }, [setFormData]);

  useEffect(() => {
    const english = formData.instructions?.en;
    if (!english) return;

    setFormData((prev) => {
      if (!prev.instructions?.en) return prev;

      const updates = {};
      const nextGeneral = english.general ?? "";
      const nextPartyA = english.partyA ?? "";
      const nextPartyB = english.partyB ?? "";

      if ((prev.generalInstruct ?? "") !== nextGeneral) {
        updates.generalInstruct = nextGeneral;
      }
      if ((prev.aInstruct ?? "") !== nextPartyA) {
        updates.aInstruct = nextPartyA;
      }
      if ((prev.bInstruct ?? "") !== nextPartyB) {
        updates.bInstruct = nextPartyB;
      }

      if (!Object.keys(updates).length) return prev;

      return { ...prev, ...updates };
    });
  }, [
    formData.instructions?.en?.general,
    formData.instructions?.en?.partyA,
    formData.instructions?.en?.partyB,
    setFormData,
  ]);

  useEffect(() => {
    const available = [...Object.keys(formData.instructions || {})];
    if (!available.includes("en")) {
      available.unshift("en");
    }

    if (!available.includes(defaultLanguage)) {
      available.unshift(defaultLanguage);
    }

    if (!available.length) return;

    if (!available.includes(activeLanguage)) {
      setActiveLanguage(available[0]);
    }
  }, [formData.instructions, activeLanguage, defaultLanguage]);

  const getLanguageLabel = (code) => LANGUAGE_LABELS[code] || code.toUpperCase();

  const getInstructionsForLang = (lang) => {
    const langInstructions = formData.instructions?.[lang];
    if (langInstructions) {
      return {
        general: langInstructions.general ?? langInstructions.generalInstruct ?? "",
        partyA: langInstructions.partyA ?? langInstructions.aInstruct ?? "",
        partyB: langInstructions.partyB ?? langInstructions.bInstruct ?? "",
      };
    }

    if (lang === "en") {
      return {
        general: formData.generalInstruct ?? "",
        partyA: formData.aInstruct ?? "",
        partyB: formData.bInstruct ?? "",
      };
    }

    return {
      general: "",
      partyA: "",
      partyB: "",
    };
  };

  const handleInstructionChange = (lang, field, value) => {
    setFormData((prev) => {
      const existingInstructions = prev.instructions || {};
      const langInstructions = existingInstructions[lang] || {};
      const normalizedLang = {
        general: langInstructions.general ?? langInstructions.generalInstruct ?? "",
        partyA: langInstructions.partyA ?? langInstructions.aInstruct ?? "",
        partyB: langInstructions.partyB ?? langInstructions.bInstruct ?? "",
      };
      const updatedLangInstructions = {
        ...normalizedLang,
        [field]: value,
      };
      const updatedInstructions = {
        ...existingInstructions,
        [lang]: updatedLangInstructions,
      };
      const nextState = {
        ...prev,
        instructions: updatedInstructions,
      };

      if (lang === "en") {
        if (field === "general") nextState.generalInstruct = value;
        if (field === "partyA") nextState.aInstruct = value;
        if (field === "partyB") nextState.bInstruct = value;
      }

      return nextState;
    });

    if (lang === "en") {
      setHasInstructChanged(true);
    }
  };

  const addLanguage = async (code) => {
    if (!code) return;

    if (formData.instructions?.[code]) {
      setActiveLanguage(code);
      return;
    }

    const english = getInstructionsForLang("en");
    const fieldsToTranslate = [
      ["general", english.general],
      ["partyA", english.partyA],
      ["partyB", english.partyB],
    ].filter(([, value]) => value && value.trim());

    setFormData((prev) => {
      const existingInstructions = prev.instructions || {};
      if (existingInstructions[code]) {
        return prev;
      }

      return {
        ...prev,
        instructions: {
          ...existingInstructions,
          [code]: {
            general: "",
            partyA: "",
            partyB: "",
          },
        },
      };
    });

    setActiveLanguage(code);

    if (!fieldsToTranslate.length) {
      return;
    }

    showLoading();

    try {
      const translations = await Promise.all(
        fieldsToTranslate.map(([field, originalContent]) =>
          getTranslation(code, originalContent).then((translated) => [field, translated])
        )
      );

      setFormData((prev) => {
        const existingInstructions = prev.instructions || {};
        const current = existingInstructions[code] || {};
        const normalized = {
          general: current.general ?? current.generalInstruct ?? "",
          partyA: current.partyA ?? current.aInstruct ?? "",
          partyB: current.partyB ?? current.bInstruct ?? "",
        };

        const nextLang = { ...normalized };
        translations.forEach(([field, translated]) => {
          nextLang[field] = translated ?? "";
        });

        return {
          ...prev,
          instructions: {
            ...existingInstructions,
            [code]: nextLang,
          },
        };
      });
    } catch (error) {
      console.error("Error translating instructions:", error);
      showErrorToast("Failed to translate instructions");
    } finally {
      hideLoading();
    }
  };

  const instructionLanguages = Array.from(
    new Set([defaultLanguage, "en", ...Object.keys(formData.instructions || {})])
  ).filter(Boolean);

  instructionLanguages.sort((a, b) => {
    if (a === defaultLanguage) return -1;
    if (b === defaultLanguage) return 1;
    if (a === "en") return -1;
    if (b === "en") return 1;
    return getLanguageLabel(a).localeCompare(getLanguageLabel(b));
  });

  const addableLanguages = Object.keys(LANGUAGE_LABELS).filter(
    (code) => !instructionLanguages.includes(code)
  );

  const removeLanguage = (code) => {
    if (code === defaultLanguage) return;

    const fallbackLanguage =
      instructionLanguages.find((lang) => lang !== code) || "en";

    setActiveLanguage((current) =>
      current === code ? fallbackLanguage : current
    );

    setFormData((prev) => {
      if (!prev?.instructions?.[code]) {
        return prev;
      }

      const { [code]: _removed, ...remaining } = prev.instructions;

      return {
        ...prev,
        instructions: remaining,
      };
    });
  };

  const setDefaultLanguage = (code) => {
    if (code === defaultLanguage) return;

    setFormData((prev) => {
      if (!prev) return prev;
      return { ...prev, defaultLang: code };
    });
    setActiveLanguage(code);
  };

  const generateFormula = async (side) => {
    const english = formData.instructions?.en || {
      general: "",
      partyA: "",
      partyB: "",
    };
    const partyField = side === "a" ? "partyA" : "partyB";
    const general = english.general ?? "";
    const party = english[partyField] ?? "";

    if (!party.trim() || !formData.params?.length) {
      showErrorToast("Please fill in party instructions, and parameters first");
      return;
    }

    const isGeneratingA = side === 'a';
    if (isGeneratingA) {
      setGeneratingFormulaA(true);
    } else {
      setGeneratingFormulaB(true);
    }

    try {
      const instruction = `${general}\n\n${party}`;
      const sCurrentFormula = formData[`scoreFormula${side.toUpperCase()}`]?.trim() || null;
      const formula = await makeCaseFormula(instruction, formData.params, user?.uid, sCurrentFormula);

      if (formula) {
        handleInputChange(null, `scoreFormula${side.toUpperCase()}`, formula);
        showSuccessToast(`Formula generated for Party ${side.toUpperCase()}`);
      } else {
        showErrorToast("Failed to generate formula");
      }
    } catch (error) {
      console.error("Error generating formula:", error);
      showErrorToast("Error generating formula");
    } finally {
      if (isGeneratingA) {
        setGeneratingFormulaA(false);
      } else {
        setGeneratingFormulaB(false);
      }
    }
  };

  const testFormula = (e) => {
    if (e) e.preventDefault();
    const isFormulaAValid = testFunc(
      formData.scoreFormulaA,
      formData.params,
      setScoreFormulaAError
    );
    const isFormulaBValid = testFunc(
      formData.scoreFormulaB,
      formData.params,
      setScoreFormulaBError
    );
    setIsAScoreFormulaAValid(isFormulaAValid);
    setIsBScoreFormulaBValid(isFormulaBValid);
    return { isFormulaAValid, isFormulaBValid };
  };

  useEffect(() => {
    if (!user || tags?.length) return;
    const getAndSetTags = async () => {
      setTags(await getTags("case"));
    };
    getAndSetTags();
  }, [user]);

  useEffect(() => {
    if (!user || !formData) return;
    if (!formData.scoreFormulaA) formData.scoreFormulaA = "";
    if (!formData.scoreFormulaB) formData.scoreFormulaB = "";
    testFormula();
  }, [user]);

  const handleInputChange = (e, field, val) => {
    if (field.includes("nstruct")) setHasInstructChanged(true);
    let newValue = val;
    if (!val && e && e.target) {
      const { value, checked } = e.target;
      newValue = ["agreeMatch", "scorable", "isDraft"].includes(field) ? checked : value;
    } else if (!val && e) {
      newValue = ["ai", "aiParams"].includes(field) ? e : newValue;
    }
    setFormData((prev) => ({ ...prev, [field]: newValue }));
  };

  const addTag = (tag) => {
    if (!tag || !tag.length) return;
    setFormData((prev) => {
      return { ...prev, tags: [...(prev.tags || []), tag] };
    });
  };

  const removeTag = tag => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== (tag.value || tag)),
    }));
  }

  const deleteTheTag = async (tag) => {
    if (confirm(`Permanently delete tag "${tag.name}" from platform?`) != true) return;
    showLoading();
    setFormData((prev) => {
      if (prev?.tags) {
        return {
          ...prev,
          tags: prev.tags.filter((t) => t !== tag.value),
        }
      }
      return {
        ...prev,
        tags: [],
      }
    });
    await deleteTag(tag.id);
    setTags((prev) => prev.filter((t) => t.id !== tag.id));
    hideLoading();
    showSuccessToast(`Tag "${tag.name}" deleted`);
  }

  const createNewTag = (e) => {
    e.preventDefault();
    setCreatingTag(true);
  };

  const stopCreatingTag = () => {
    setCreatingTag(false);
  };

  const onNewTagCreated = (newTag) => {
    setCreatingTag(false);
    setTags((prev) => [...prev, newTag]);
    addTag(newTag.value);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.isDraft) {
      if (!formData.title) {
        showErrorToast("Missing case title");
        return;
      }

      if (!formData.params || !formData.params.length) {
        showErrorToast("Missing parameters");
        return;
      }

      if (!formData.relationRatio) {
        showErrorToast("Missing relational weight");
        return;
      }

      const { isFormulaAValid, isFormulaBValid } = testFormula();

      if ((!isFormulaAValid || !isFormulaBValid) && formData.scorable) {
        showErrorToast("Invalid score formula");
        return;
      }
    }

    for (let param of formData.params) {
      if (param.dataType === "list") {
        param.listItems = param.listItems
          .split("<>")
          .map((item) => item.trim())
          .join("<>");
      }
    }

    showLoading();

    try {
      const response = await fetcher.post(
        `/api/data/cases/${formData.id}`,
        {
          data: formData,
          updateInterest: hasInstructChanged,
        },
        user
      );

      if (response.ok) {
        if (response.result.data && !formData.id) setFormData((prev) => ({ ...prev, id: response.result.data }));
        showSuccessToast("Case saved");
        // router.back();
      } else {
        console.error("Failed to save case:", response.error);
        showErrorToast("Failed to save case");
      }
    } catch (error) {
      console.error("Error during save:", error);
      showErrorToast("Error during save");
    }
    hideLoading();
  };

  const handleDelete = async () => {
    if (!formData.id) return;

    if (confirm(`Delete case ${formData.title} ?`) != true) {
      return;
    }

    showLoading();
    try {
      const response = await fetcher.delete(
        `/api/data/cases/${formData.id}`,
        user
      );

      if (response.ok) {
        showSuccessToast("Case deleted");
        router.back();
      } else {
        console.error("Failed to delete case:", response.error);
        showErrorToast("Failed to delete case");
      }
    } catch (error) {
      console.error("Error during delete:", error);
      showErrorToast("Error during delete");
    }
    hideLoading();
  };

  const addParam = () => {
    const newParam = {
      id: "",
      name: "",
      dataType: "number",
      topLimit: "",
      bottomLimit: "",
      listItems: "",
    };
    setFormData((prev) => ({
      ...prev,
      params: [...prev.params, newParam],
    }));
  };

  const deleteParam = (index) => {
    setFormData((prev) => {
      const updatedParams = prev.params.filter((_, i) => i !== index);
      return { ...prev, params: updatedParams };
    });
  };

  const updateParam = (index, field, value) => {
    setFormData((prev) => {
      const updatedParams = [...prev.params];
      updatedParams[index] = { ...updatedParams[index], [field]: value };
      return { ...prev, params: updatedParams };
    });
  };

  return (
    <div className="flex flex-col min-h-screen p-6 ">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {formData.id ? "Edit Case" : "Create New Case"}
        </h1>
        <p className="text-gray-700">
          Fill out the details below to{" "}
          {formData.id ? "edit a " : "create a new "} negotiation case.
        </p>
      </header>

      <section>
        <Card className="bg-white border shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle>Case Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              {/* Case Name */}
              <div className="space-y-1">
                <label
                  htmlFor="title"
                  className="text-sm font-medium text-black"
                >
                  Case Title
                </label>
                <Input
                  id="title"
                  placeholder="Case name"
                  value={formData.title}
                  onChange={(e) => handleInputChange(e, "title")}
                />
              </div>

              {/* Case Author / Avatar Gender */}
              <div className="grid gap-4 sm:grid-cols-[1.2fr,0.8fr]">
                <div className="space-y-1">
                  <label
                    htmlFor="author"
                    className="text-sm font-medium text-black"
                  >
                    Case Author
                  </label>
                  <Input
                    id="author"
                    placeholder="Case author"
                    value={formData.author}
                    onChange={(e) => handleInputChange(e, "author")}
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="gender"
                    className="text-sm font-medium text-black"
                  >
                    Avatar Gender
                  </label>
                  <Select
                    id="gender"
                    value={formData.gender || "female"}
                    onValueChange={(value) => handleInputChange(null, "gender", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Case Owner */}
              {formData.owner && (
                <div className="space-y-1">
                  <label
                    htmlFor="owner"
                    className="text-sm font-medium text-black"
                  >
                    Case Generated By
                  </label>
                  <Input
                    id="owner"
                    placeholder="Case owner"
                    value={formData.owner}
                    disabled={true}
                  />
                </div>
              )}

              {/* Case Summary */}
              <div className="space-y-1">
                <label
                  htmlFor="summary"
                  className="text-sm font-medium text-black"
                >
                  Case Summary
                </label>
                <Textarea
                  id="summary"
                  placeholder="Short summary of this case"
                  value={formData.summary}
                  onChange={(e) => handleInputChange(e, "summary")}
                />
              </div>

              {/* Case Tags */}
              <div className="space-y-1">
                <label
                  htmlFor="tags"
                  className="text-sm font-medium text-black"
                >
                  Case Tags
                </label>
                <div>
                  <div id="tags" className="mt-2">
                    {tags.map((tag, index) => (
                      <TagItem
                        key={index}
                        tag={tag}
                        onToggle={(t, active) => {
                          if (active) {
                            addTag(t.value);
                          } else {
                            removeTag(t);
                          }
                        }}
                        onRemove={deleteTheTag}
                        active={formData.tags?.includes(tag.value)}
                      />
                    ))}
                  </div>
                  <div className="mt-2">
                    <Button variant="secondary" onClick={createNewTag}>Create new Tag</Button>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-4 rounded-lg border border-slate-200 bg-background p-2 shadow-sm">

                <Tabs value={activeLanguage} onValueChange={setActiveLanguage} className="w-full">
                  <div className="flex flex-row items-center justify-start">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      {addableLanguages.length ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="outline" size="sm">
                              Add language
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {addableLanguages.map((code) => (
                              <DropdownMenuItem key={code} onSelect={() => addLanguage(code)}>
                                {getLanguageLabel(code)}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button type="button" variant="outline" size="sm" disabled>
                          All languages added
                        </Button>
                      )}
                    </div>
                    <TabsList className="flex flex-wrap items-center justify-start gap-2 rounded-md bg-muted/40 ml-2 p-1">
                      {instructionLanguages.map((lang) => (
                        <div key={lang} className="flex items-center gap-1">
                          <TabsTrigger
                            value={lang}
                            className="rounded-md px-3 py-2 text-sm font-medium shadow-sm transition-colors data-[state=active]:bg-white data-[state=active]:text-blue-600"
                          >
                            {lang === defaultLanguage
                              ? `${getLanguageLabel(lang)} (Default)`
                              : getLanguageLabel(lang)}
                          </TabsTrigger>
                          {lang !== defaultLanguage && (
                            <>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  removeLanguage(lang);
                                }}
                                className="inline-flex items-center justify-center rounded-full p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                                aria-label={`Remove ${getLanguageLabel(lang)} instructions`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setDefaultLanguage(lang);
                                }}
                                className="inline-flex items-center justify-center rounded-full p-1 text-green-600 transition-colors hover:bg-green-50 hover:text-green-700"
                                aria-label={`Set ${getLanguageLabel(lang)} as default`}
                              >
                                <Star className="h-3.5 w-3.5" fill="currentColor" />
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </TabsList>
                  </div>

                  {instructionLanguages.map((lang) => {
                    const instructions = getInstructionsForLang(lang);
                    return (
                      <TabsContent key={lang} value={lang} className="mt-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-black">General Instructions</p>
                          <div className="rounded-lg border border-gray-200">
                            <RichTextEditor
                              content={instructions.general}
                              onChange={(content) => handleInstructionChange(lang, "general", content)}
                              onPreview={setPreviewHtml}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-1 mt-4">
                          <label
                            htmlFor="aName"
                            className="text-sm font-medium text-black"
                          >
                            Party A Name
                          </label>
                          <Input
                            id="aName"
                            placeholder="Name of Party A"
                            value={formData.aName}
                            onChange={(e) => handleInputChange(e, "aName")}
                          />
                        </div>

                        <div className="space-y-1 mt-4">
                          <p className="text-sm font-medium text-black">Party A Instructions</p>
                          <div className="rounded-lg border border-gray-200">
                            <RichTextEditor
                              content={instructions.partyA}
                              onChange={(content) => handleInstructionChange(lang, "partyA", content)}
                              onPreview={setPreviewHtml}
                            />
                          </div>
                        </div>

                      <div className="space-y-1 mt-4">
                        <label
                          htmlFor="bName"
                          className="text-sm font-medium text-black"
                        >
                          Party B Name
                        </label>
                        <Input
                          id="bName"
                          placeholder="Name of Party B"
                          value={formData.bName}
                          onChange={(e) => handleInputChange(e, "bName")}
                        />
                      </div>

                        <div className="space-y-1 mt-4">
                          <p className="text-sm font-medium text-black">Party B Instructions</p>
                          <div className="rounded-lg border border-gray-200">
                            <RichTextEditor
                              content={instructions.partyB}
                              onChange={(content) => handleInstructionChange(lang, "partyB", content)}
                              onPreview={setPreviewHtml}
                            />
                          </div>
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </div>

              {/* Available to AI */}
              <div className="space-x-2 my-2">
                <label
                  htmlFor="availableToAI"
                  className="text-sm font-medium text-black"
                >
                  AI will negotiate as
                </label>
                <Select
                  id="availableToAI"
                  value={formData.ai}
                  onValueChange={(e) => handleInputChange(e, "ai")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="AI Side" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="n">Not available to AI</SelectItem>
                    <SelectItem value="a">Party A</SelectItem>
                    <SelectItem value="b">Party B</SelectItem>
                  </SelectContent>
                </Select>
                {formData.ai !== "n" && (
                  <div className="my-2">
                    <ParamsAI initParams={formData.aiParams} onChange={(params) => handleInputChange(params, "aiParams")} subtleFont={true} />
                  </div>
                )}
              </div>

              {/* Agreement Match Checkbox */}
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="agreeMatch"
                  className="text-sm font-medium text-black mr-2"
                >
                  Agreements must match
                </label>
                <input
                  type="checkbox"
                  id="agreeMatch"
                  checked={formData.agreeMatch || false}
                  onChange={(e) => handleInputChange(e, "agreeMatch")}
                  className="h-5 w-5 mr-2 align-middle"
                />
              </div>

              {/* Result weights inputs */}

              <div className="flex flex-col  items-start space-x-2">
                <label
                  htmlFor="relationRatio"
                  className="text-sm font-medium text-black mb-4"
                >
                  Weight of the relational outcome
                </label>
                <Slider
                  id="relationRatio"
                  value={formData.relationRatio}
                  max={100}
                  step={1}
                  onValueChange={(value) => handleInputChange(null, "relationRatio", value)}
                />
                <p className="text-sm text-gray-500 mt-2">{formData.relationRatio}%</p>
              </div>

              {/* Parameters */}
              <div>
                <h4 className="font-medium text-black mb-2">Parameters</h4>
                <div className="space-y-4">
                  {formData.params.map((param, index) => (
                    <div
                      key={index}
                      className="space-y-2 border p-4 rounded-md"
                    >
                      <Input
                        placeholder="Param ID"
                        value={param.id}
                        onChange={(e) =>
                          updateParam(index, "id", e.target.value)
                        }
                      />
                      <Input
                        placeholder="Param Name"
                        value={param.name}
                        onChange={(e) =>
                          updateParam(index, "name", e.target.value)
                        }
                      />
                      <Select
                        value={param.dataType}
                        onValueChange={(value) =>
                          updateParam(index, "dataType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Data Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="list">List</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                        </SelectContent>
                      </Select>
                      {/* Additional Inputs Based on Data Type */}
                      {param.dataType === "number" && (
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Bottom Limit"
                            type="number"
                            value={param.bottomLimit}
                            onChange={(e) =>
                              updateParam(index, "bottomLimit", e.target.value)
                            }
                          />
                          <Input
                            placeholder="Top Limit"
                            type="number"
                            value={param.topLimit}
                            onChange={(e) =>
                              updateParam(index, "topLimit", e.target.value)
                            }
                          />
                        </div>
                      )}
                      {param.dataType === "list" && (
                        <Input
                          placeholder="List of values, seperated with <>, e.g. Yes<>No<>Maybe"
                          value={param.listItems}
                          onChange={(e) =>
                            updateParam(index, "listItems", e.target.value)
                          }
                        />
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => deleteParam(index)}
                      >
                        Delete Parameter
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="default"
                  onClick={addParam}
                  className="mt-4"
                >
                  Add Parameter
                </Button>
              </div>



              {/* Scorable Checkbox */}
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="scorable"
                  className="text-sm font-medium text-black mr-2"
                >
                  Is the case scoreable?
                </label>
                <input
                  type="checkbox"
                  id="scorable"
                  checked={formData.scorable || false}
                  onChange={(e) => handleInputChange(e, "scorable")}
                  className="h-5 w-5 mr-2 align-middle"
                />
              </div>

              {formData.scorable && (
                <div>
                  {/* Score Formulas */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="scoreFormulaA"
                        className="text-sm font-medium text-black"
                      >
                        Score Formula for Party A
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => generateFormula('a')}
                        disabled={generatingFormulaA}
                        className="flex items-center gap-2"
                      >
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        {generatingFormulaA ? "Generating..." : "Generate"}
                      </Button>
                    </div>
                    <div
                      className={`border-2 rounded-lg ${isScoreFormulaAValid ? "border-green-600" : "border-red-600"
                        } p-2`}
                    >
                      <Editor
                        value={formData.scoreFormulaA ? formData.scoreFormulaA : ""}
                        onValueChange={(formula) =>
                          handleInputChange(null, "scoreFormulaA", formula)
                        }
                        highlight={(code) => highlight(code, languages.js)}
                        padding={10}
                        style={{
                          fontFamily: '"Fira code", "Fira Mono", monospace',
                          fontSize: 14,
                        }}
                        placeholder="return <param_id_1> / ( <param_id_1> + <param_id_2> * 2 );"
                      />
                    </div>
                    {!isScoreFormulaAValid && (
                      <p className="text-red-500 text-sm">{scoreFormulaAError}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="scoreFormulaB"
                        className="text-sm font-medium text-black"
                      >
                        Score Formula for Party B
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => generateFormula('b')}
                        disabled={generatingFormulaB}
                        className="flex items-center gap-2"
                      >
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        {generatingFormulaB ? "Generating..." : "Generate"}
                      </Button>
                    </div>
                    <div
                      className={`border-2 rounded-lg ${isScoreFormulaBValid ? "border-green-600" : "border-red-600"
                        } p-2`}
                    >
                      <Editor
                        value={formData.scoreFormulaB ? formData.scoreFormulaB : ""}
                        onValueChange={(formula) =>
                          handleInputChange(null, "scoreFormulaB", formula)
                        }
                        highlight={(code) => highlight(code, languages.js)}
                        padding={10}
                        style={{
                          fontFamily: '"Fira code", "Fira Mono", monospace',
                          fontSize: 14,
                        }}
                        placeholder="return <time> * ( <money> + 2 );"
                      />
                    </div>
                    {!isScoreFormulaBValid && (
                      <p className="text-red-500 text-sm">{scoreFormulaBError}</p>
                    )}


                    <Button variant="secondary" onClick={testFormula}>
                      Test formulas
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center flex-wrap gap-3">
                <Button type="submit" variant="default">
                  Save Case
                </Button>

                {formData.id && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    Delete Case
                  </Button>
                )}

                <Switch
                  className="ml-2"
                  id="draft-mode"
                  checked={!!formData.isDraft}
                  onCheckedChange={(value) => setFormData((prev) => ({ ...prev, isDraft: value }))}
                />
                <Label htmlFor="draft-mode" className="text-blue-700 font-semibold">
                  Draft Mode
                </Label>
                <InfoTooltip fromTop={true} iconOnly={true} info="Draft mode excludes case from listing in case searches and selections." />
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
      {creatingTag && (
        <TagAdder
          onClose={stopCreatingTag}
          onCreated={onNewTagCreated}
        // tags={tags}
        />
      )}
      {previewHtml && (
        <CasePreview htmlValue={previewHtml} onClose={() => setPreviewHtml(null)} />
      )}
    </div>
  );
}
