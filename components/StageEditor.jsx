"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TagItem from "@/components/TagItem";
import TagAdder from "@/components/TagAdder";
import { saveStage } from "@/actions/journey";
import { deleteTag } from "@/actions/tags";
import { useLoading } from "@/contexts/LoadingContext";
import { Trash2, Pencil, Plus } from "lucide-react";

export default function StageEditor({ initialStage, resources, allTags, onClose, onSaved, onCreateResource, onDeleteResource, onEditResource }) {
  const base = initialStage || {
    id: undefined,
    journey: "default",
    title: "",
    description: "",
    tags: [],
    proficiencyLevel: 0,
    free: true,
    resource: "",
    suppResource: "",
  };

  const [draft, setDraft] = useState(base);
  const [creatingTag, setCreatingTag] = useState(false);
  const [localTags, setLocalTags] = useState(allTags || []);

  const { showLoading, hideLoading } = useLoading();
  const [saving, setSaving] = useState(false);
  const [resQuery, setResQuery] = useState("");

  const deleteStageTag = async (tag) => {
    if (!tag?.id) return;
    if (!confirm(`Delete tag "${tag.name}" from platform?`)) return;
    try {
      showLoading();
      await deleteTag(tag.id);
      setDraft(prev => ({ ...prev, tags: (prev.tags || []).filter(v => v !== tag.value) }));
    } catch (e) {
      console.error(e);
      alert("Failed to delete tag");
    } finally {
      hideLoading();
    }
  };

  const save = async () => {
    if (!draft.title?.trim()) {
      alert("Stage title is required");
      return;
    }
    if (!draft.resource) {
      alert("Main resource is required");
      return;
    }
    setSaving(true);
    showLoading();
    try {
      const cleaned = { ...draft, tags: (draft.tags || []).filter(Boolean), journey: draft.journey || "default" };
      await saveStage(cleaned);
      if (typeof onSaved === "function") onSaved(cleaned);
      if (onClose) onClose();
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to save stage");
    } finally {
      setSaving(false);
      hideLoading();
    }
  };

  const filteredResources = (resources || []).filter(r => {
    const q = resQuery.toLowerCase();
    return !q || (r.title||'').toLowerCase().includes(q) || (r.type||'').toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-5xl p-4 sm:p-6 max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-start mb-4 flex-shrink-0">
          <h3 className="text-lg sm:text-xl font-semibold">{draft?.id ? "Edit Stage" : "Add Stage"}</h3>
        </div>

        <div className="overflow-y-auto flex-1 pr-1 sm:pr-2 space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <Input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="Stage title" className="text-sm bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea rows={3} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} placeholder="Stage description" className="text-sm bg-white" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Proficiency Level</label>
              <Input type="number" value={draft.proficiencyLevel} onChange={e => setDraft({ ...draft, proficiencyLevel: parseInt(e.target.value||'0',10) })} className="text-sm bg-white" />
            </div>
            <div className="flex items-end gap-2">
              <label className="text-sm flex items-center">
                <input type="checkbox" className="mr-2" checked={draft.free} onChange={e => setDraft({ ...draft, free: e.target.checked })} />
                Free
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Stage Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(localTags || []).map((tag) => (
                <TagItem
                  key={tag.id}
                  tag={tag}
                  onToggle={(t, active) => {
                    setDraft(prev => ({
                      ...prev,
                      tags: active
                        ? Array.from(new Set([...(prev.tags||[]), t.value]))
                        : (prev.tags||[]).filter(v => v !== t.value)
                    }));
                  }}
                  onRemove={deleteStageTag}
                  active={(draft.tags||[]).includes(tag.value)}
                />
              ))}
            </div>
            <Button variant="secondary" size="sm" onClick={() => setCreatingTag(true)}>Create new Tag</Button>
          </div>

          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
              <label className="block text-sm font-medium">Main Resource *</label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <Input value={resQuery} onChange={e=>setResQuery(e.target.value)} placeholder="Filter resources..." className="h-8 w-full sm:w-40 text-sm bg-white" />
                <Button variant="outline" size="sm" onClick={onCreateResource} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-1" />
                  Create New
                </Button>
              </div>
            </div>
            <div className="max-h-60 overflow-auto space-y-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
              {filteredResources.map(r => (
                <div key={r.id} className={`flex items-center gap-2 p-2 border rounded-lg bg-white ${draft.resource === r.id ? 'border-vivid-blue ring-2 ring-blue-100' : 'border-gray-200'}`}>
                  <input type="radio" name="mainResource" checked={draft.resource === r.id} onChange={() => setDraft({ ...draft, resource: r.id })} className="flex-shrink-0" />
                  <div className="flex-1 text-xs sm:text-sm truncate min-w-0">
                    <span className="font-medium">{r.title || '(no title)'}</span> <span className="text-gray-500">[{r.type}]</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => onEditResource(r)} className="h-8 w-8 flex-shrink-0">
                    <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => onDeleteResource(r.id)} className="h-8 w-8 flex-shrink-0">
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <hr className="mb-2 border-2"/>
            <label className="block text-sm font-medium mb-2">Supplemental Resource (optional)</label>
            <div className="max-h-60 overflow-auto space-y-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
              <div className={`flex items-center gap-2 p-2 border rounded-lg bg-white ${!draft.suppResource ? 'border-vivid-blue ring-2 ring-blue-100' : 'border-gray-200'}`}>
                <input type="radio" name="suppResource" checked={!draft.suppResource} onChange={() => setDraft({ ...draft, suppResource: '' })} className="flex-shrink-0" />
                <div className="flex-1 text-xs sm:text-sm">None</div>
              </div>
              {filteredResources.map(r => (
                <div key={r.id} className={`flex items-center gap-2 p-2 border rounded-lg bg-white ${draft.suppResource === r.id ? 'border-vivid-blue ring-2 ring-blue-100' : 'border-gray-200'}`}>
                  <input type="radio" name="suppResource" checked={draft.suppResource === r.id} onChange={() => setDraft({ ...draft, suppResource: r.id })} className="flex-shrink-0" />
                  <div className="flex-1 text-xs sm:text-sm truncate min-w-0">
                    <span className="font-medium">{r.title || '(no title)'}</span> <span className="text-gray-500">[{r.type}]</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => onEditResource(r)} className="h-8 w-8 flex-shrink-0">
                    <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => onDeleteResource(r.id)} className="h-8 w-8 flex-shrink-0">
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 border-t pt-3 sm:pt-4 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="rounded-full w-full sm:w-auto">Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-vivid-blue hover:bg-deep-blue text-white rounded-full w-full sm:w-auto">{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>

      {creatingTag && (
        <TagAdder defaultType="stage" hideTypeSelector={true} onClose={() => setCreatingTag(false)} onCreated={(newTag) => {
          setLocalTags(prev => [...prev, newTag]);
          setDraft(prev => ({ ...prev, tags: Array.from(new Set([...(prev.tags||[]), newTag.value])) }));
        }} />
      )}
    </div>
  );
}

