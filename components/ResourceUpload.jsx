"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createResource, uploadResourceFileAction, updateResource } from "@/actions/resources";
import { getCaseByIdForPreview } from "@/actions/cases";
import CaseSearch from "@/components/CaseSearch";
import ParamsAI from "@/components/ParamsAI";
import CasePreview from "@/components/CasePreview";
import { useLoading } from "@/contexts/LoadingContext";
import RichTextEditor from "@/components/RichTextEditor";

export default function ResourceUpload({ initialResource, onSaved, onClose }) {
  const isEdit = !!initialResource?.id;
  const [kind, setKind] = useState(initialResource?.type || "text");
  const [text, setText] = useState(initialResource?.text || "");
  const [quizQuestions, setQuizQuestions] = useState(
    initialResource?.quiz?.questions || [{ q: "Example question?", answers: ["A", "B", "C"], correct: 0 }]
  );
  const [title, setTitle] = useState(initialResource?.title || "");
  const [selectedCase, setSelectedCase] = useState(initialResource?.caseId ? { id: initialResource.caseId } : null);
  const [side, setSide] = useState(initialResource?.side || "a");
  const [aiParams, setAiParams] = useState(initialResource?.aiParams || {});
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchingCase, setSearchingCase] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(null);

  const { showLoading, hideLoading } = useLoading();

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        setFileError(`File size (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum allowed size of 50 MB`);
        setFile(null);
      } else {
        setFileError(null);
        setFile(selectedFile);
      }
    } else {
      setFileError(null);
      setFile(null);
    }
  };

  useEffect(() => {
    if (initialResource) {
      setKind(initialResource.type || "text");
      setText(initialResource.text || "");
      setQuizQuestions(initialResource.quiz?.questions || [{ q: "", answers: ["", ""], correct: 0 }]);
      setTitle(initialResource.title || "");
      setSelectedCase(initialResource.caseId ? { id: initialResource.caseId } : null);
      setSide(initialResource.side || "a");
      setAiParams(initialResource.aiParams || {});
    }
  }, [initialResource]);

  // Load full case when editing a negotiation resource so side labels show correctly
  useEffect(() => {
    const loadCase = async () => {
      if (isEdit && kind === 'negotiation' && initialResource?.caseId && (!selectedCase?.title)) {
        try {
          showLoading();
          const acase = await getCaseByIdForPreview(initialResource.caseId);
          setSelectedCase(acase || { id: initialResource.caseId });
        } catch (_) {}
        hideLoading();
      }
    };
    loadCase();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, kind, initialResource?.caseId]);


  const save = async () => {
    if (!title.trim()) { alert('Title is required'); return; }
    setSaving(true);
    showLoading();
    try {
      let res;
      if (kind === 'text') {
        const payload = { type: 'text', text, title };
        if (isEdit) {
          await updateResource(initialResource.id, payload);
          res = { id: initialResource.id, ...payload };
        } else {
          const id = await createResource(payload);
          res = { id, ...payload };
        }
      } else if (kind === 'quiz') {
        const normalized = (quizQuestions || []).map((q) => ({
          q: String(q.q || '').trim(),
          answers: (q.answers || []).map(a => String(a || '').trim()).filter(a => a.length),
          correct: Number.isInteger(q.correct) ? q.correct : 0,
        })).filter(q => q.q && q.answers.length >= 2 && q.correct >= 0 && q.correct < q.answers.length);
        if (!normalized.length) throw new Error('Please add at least one valid question with 2+ answers.');
        const quiz = { questions: normalized };
        const payload = { type: 'quiz', quiz, title };
        if (isEdit) {
          await updateResource(initialResource.id, payload);
          res = { id: initialResource.id, ...payload };
        } else {
          const id = await createResource(payload);
          res = { id, ...payload };
        }
      } else if (kind === 'negotiation') {
        if (!selectedCase?.id) throw new Error('Select a case');
        const defaultParams = {
          hardOnPeople: 1,
          hardOnProblem: 5,
          processDrive: 1,
          concessionsDist: 5,
          ethics: 5
        };
        const params = (aiParams && Object.keys(aiParams).length > 0) ? aiParams : defaultParams;
        const payload = { type: 'negotiation', title: title, caseId: selectedCase.id, side, aiParams: params };
        if (isEdit) {
          await updateResource(initialResource.id, payload);
          res = { id: initialResource.id, ...payload };
        } else {
          const id = await createResource(payload);
          res = { id, ...payload };
        }
      } else if ((kind === 'video' || kind === 'audio') && (file || isEdit)) {
        if (isEdit && !file) {
          const payload = { title };
          await updateResource(initialResource.id, payload);
          res = { id: initialResource.id, type: kind, title, originalName: initialResource.originalName };
        } else if (file) {
          const fd = new FormData();
          fd.set('kind', kind);
          fd.set('file', file);
          fd.set('title', title || '');
          if (isEdit) fd.set('id', initialResource.id);
          res = await uploadResourceFileAction(fd);
        }
      } else {
        throw new Error('Provide required fields for selected type');
      }
      if (res && typeof onSaved === 'function') onSaved(res);
      if (onClose) onClose();
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to save resource');
    } finally {
      setSaving(false);
      hideLoading();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-2 sm:p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-4xl p-4 sm:p-6 max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="text-lg sm:text-xl font-semibold">{isEdit ? 'Edit Resource' : 'Add Resource'}</h3>
        </div>

        <div className="overflow-y-auto flex-1 pr-1 sm:pr-2">
          <div className="grid gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select value={kind} onChange={e => setKind(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 bg-white text-sm" disabled={isEdit}>
                <option value="text">Text</option>
                <option value="quiz">Quiz</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="negotiation">Negotiation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Resource title" className="text-sm bg-white" />
            </div>

            {kind === 'text' && (
              <div>
                <label className="block text-sm font-medium mb-1">Article Text</label>
                <div className="rounded-lg border border-gray-200">
                  <RichTextEditor content={text} onChange={setText} onPreview={setPreviewHtml} />
                </div>
              </div>
            )}

            {kind === 'quiz' && (
              <div className="space-y-3">
                <label className="block text-sm font-medium">Quiz Builder</label>
                {quizQuestions.map((q, qi) => (
                  <div key={qi} className="border border-gray-300 rounded-lg p-3 bg-white">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2">
                      <span className="text-sm font-semibold flex-shrink-0">Q{qi + 1}.</span>
                      <Input value={q.q} onChange={e => {
                        const nq = [...quizQuestions];
                        nq[qi] = { ...nq[qi], q: e.target.value };
                        setQuizQuestions(nq);
                      }} placeholder="Write the question..." className="flex-1 text-sm bg-white" />
                      <Button variant="destructive" size="sm" onClick={() => {
                        const nq = quizQuestions.filter((_, i) => i !== qi);
                        setQuizQuestions(nq.length ? nq : [{ q: "", answers: ["", ""], correct: 0 }]);
                      }} className="w-full sm:w-auto">Remove</Button>
                    </div>
                    <div className="space-y-2">
                      {(q.answers || []).map((ans, ai) => (
                        <div key={ai} className="flex items-center gap-2">
                          <input type="radio" name={`correct-${qi}`} checked={q.correct === ai} onChange={() => {
                            const nq = [...quizQuestions];
                            nq[qi] = { ...nq[qi], correct: ai };
                            setQuizQuestions(nq);
                          }} className="flex-shrink-0" />
                          <Input value={ans} onChange={e => {
                            const nq = [...quizQuestions];
                            const arr = [...(nq[qi].answers || [])];
                            arr[ai] = e.target.value;
                            nq[qi] = { ...nq[qi], answers: arr };
                            setQuizQuestions(nq);
                          }} placeholder={`Answer ${ai + 1}`} className="flex-1 text-sm bg-white" />
                          <Button variant="outline" size="sm" onClick={() => {
                            const nq = [...quizQuestions];
                            const arr = [...(nq[qi].answers || [])].filter((_, i) => i !== ai);
                            if (nq[qi].correct === ai) nq[qi].correct = 0;
                            nq[qi] = { ...nq[qi], answers: arr.length ? arr : [""] };
                            setQuizQuestions(nq);
                          }} className="flex-shrink-0">Delete</Button>
                        </div>
                      ))}
                      <Button variant="secondary" size="sm" onClick={() => {
                        const nq = [...quizQuestions];
                        const arr = [...(nq[qi].answers || [])];
                        arr.push("");
                        nq[qi] = { ...nq[qi], answers: arr };
                        setQuizQuestions(nq);
                      }}>Add Answer</Button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setQuizQuestions(prev => ([...prev, { q: "", answers: ["", ""], correct: 0 }]))}>Add Question</Button>
                </div>
                <p className="text-xs text-gray-500">Mark the correct answer with the radio button.</p>
              </div>
            )}

            {(kind === 'video' || kind === 'audio') && (
              <div>
                <label className="block text-sm font-medium mb-1">Upload File</label>
                <Input
                  type="file"
                  accept={kind === 'video' ? 'video/*' : 'audio/*'}
                  onChange={handleFileChange}
                  className="bg-white"
                />
                {fileError && (
                  <p className="text-red-600 text-sm mt-1 font-medium">{fileError}</p>
                )}
                {file && !fileError && (
                  <p className="text-green-600 text-sm mt-1">
                    ✓ {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>
            )}

            {kind === 'negotiation' && (
              <div className="grid gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Case</label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Input value={selectedCase?.title || ""} readOnly placeholder="Select a case..." className="flex-1 text-sm bg-white" />
                    <Button variant="outline" onClick={() => setSearchingCase(true)} className="w-full sm:w-auto">Select</Button>
                  </div>
                </div>
                <div className="grid gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">User Side</label>
                    <select value={side} onChange={e => setSide(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 bg-white text-sm">
                      <option value="a">{selectedCase?.aName || 'A'}</option>
                      <option value="b">{selectedCase?.bName || 'B'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">AI Parameters</label>
                    <div className="border border-gray-300 rounded-lg p-2 bg-white">
                      <ParamsAI initParams={aiParams} onChange={setAiParams} subtleFont={true} />
                    </div>
                  </div>
                </div>
                {searchingCase && (
                  <CaseSearch onClose={() => setSearchingCase(false)} onCaseSelected={(acase) => setSelectedCase(acase)} />
                )}
              </div>
            )}

          </div>
        </div>

        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 border-t pt-3 sm:pt-4 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="rounded-full w-full sm:w-auto">Cancel</Button>
          <Button
            onClick={save}
            disabled={saving || fileError}
            className="bg-vivid-blue hover:bg-deep-blue text-white rounded-full w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
      {previewHtml && (
        <CasePreview htmlValue={previewHtml} onClose={() => setPreviewHtml(null)} />
      )}
    </div>
  );
}
