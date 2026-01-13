"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listStages, deleteStage, saveStage } from "@/actions/journey";
import { listResources, deleteResource } from "@/actions/resources";
import { getTags } from "@/actions/tags";
import ResourceUpload from "@/components/ResourceUpload";
import AdminJourneyProgress from "@/components/AdminJourneyProgress";
import StageEditor from "@/components/StageEditor";
import ResourceView from "@/components/ResourceView";
import { useLoading } from "@/contexts/LoadingContext";
import { Eye, Pencil, Trash2, ArrowUp, ArrowDown, Plus } from "lucide-react";

export default function Page() {
  const [stages, setStages] = useState([]);
  const [resources, setResources] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [allTags, setAllTags] = useState([]);
  const [showStageEditor, setShowStageEditor] = useState(false);
  const [editStage, setEditStage] = useState(null);
  const [previewStage, setPreviewStage] = useState(null);
  const [editResource, setEditResource] = useState(null);
  const { showLoading, hideLoading } = useLoading();

  const load = async () => {
    showLoading();
    try {
      const [stages, resources, allTheTags] = await Promise.all([
        listStages("default"),
        listResources(),
        getTags("stage")
      ])
      setStages((stages || []).sort((a, b) => (a.order || 0) - (b.order || 0)));
      setResources(resources);
      setAllTags(allTheTags || []);
    } finally {
      hideLoading();
    }
  };

  useEffect(() => { load(); }, []);


  const removeStage = async (id) => {
    if (!confirm("Delete this stage?")) return;
    showLoading();
    try {
      await deleteStage(id);
      await load();
    } catch (e) {
      alert(e.message || "Failed to delete stage");
    } finally {
      hideLoading();
    }
  };

  const removeResource = async (id) => {
    if (!confirm("Delete this resource?")) return;
    showLoading();
    try {
      await deleteResource(id);
      await load();
    } catch (e) {
      alert(e.message || "Failed to delete resource");
    } finally {
      hideLoading();
    }
  };

  const moveStage = async (index, direction) => {
    const newStages = [...stages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newStages.length) return;
    [newStages[index], newStages[targetIndex]] = [newStages[targetIndex], newStages[index]];
    newStages.forEach((s, i) => { s.order = i; });
    setStages(newStages);
    showLoading();
    try {
      await Promise.all(newStages.map(s => saveStage(s)));
    } catch (e) {
      alert(e.message || "Failed to reorder stages");
      await load();
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-white via-pale-blue/30 to-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <Card className="bg-white/80 backdrop-blur-sm border-pale-gray shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Learning Journey Stages</CardTitle>
            <Button onClick={() => { setEditStage(null); setShowStageEditor(true); }} className="bg-vivid-blue text-white">
              <Plus size={4} />
              Add Stage
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {stages.map((s, idx) => (
                <div key={s.id} className="p-4 rounded-xl border border-pale-gray bg-white/90 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold flex items-center gap-2">
                      <span className="truncate max-w-[48ch]">{s.title || '(no title)'} </span>
                      <span className="text-xs text-gray-500">#{s.order || 0}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">Level {(s.proficiencyLevel || 0)} · {s.free ? 'Free' : 'Paid'}</div>
                    {s.description && (
                      <div className="text-sm text-gray-700 mt-1 line-clamp-2">{s.description}</div>
                    )}
                    {(s.tags || []).length && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(s.tags || []).map(tag => {
                          const tagName = (allTags.find(t => t.value === tag)?.name || tag);
                          return (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{tagName}</span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="icon" onClick={() => moveStage(idx, 'up')} disabled={idx === 0}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => moveStage(idx, 'down')} disabled={idx === stages.length - 1}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setPreviewStage(s)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button variant="secondary" onClick={() => { setEditStage(s); setShowStageEditor(true); }}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="destructive" onClick={() => removeStage(s.id)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              {!stages.length && (
                <div className="text-sm text-gray-600">No stages yet.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <AdminJourneyProgress />

      </div>

      {
        showUpload && (
          <ResourceUpload initialResource={editResource} onSaved={() => { setShowUpload(false); setEditResource(null); load(); }} onClose={() => { setShowUpload(false); setEditResource(null); }} />
        )
      }

      {
        showStageEditor && (
          <StageEditor initialStage={editStage || { journey: 'default', title: '', description: '', tags: [], proficiencyLevel: 0, free: true, resource: '', suppResource: '' }} resources={resources} allTags={allTags} onClose={() => { setShowStageEditor(false); setEditStage(null); }} onSaved={() => { setShowStageEditor(false); setEditStage(null); load(); }} onCreateResource={() => { setShowUpload(true); }} onDeleteResource={removeResource} onEditResource={(r) => { setEditResource(r); setShowUpload(true); }} />
        )
      }

      {
        previewStage && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 rounded-2xl border border-gray-200/50 shadow-2xl w-full max-w-3xl p-6 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold">{previewStage.title || '(Stage)'}</div>
                <button onClick={() => setPreviewStage(null)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <div className="overflow-y-auto flex-1">
                <div className="space-y-6">
                  <div>
                    <div className="text-sm font-semibold mb-2">Main resource</div>
                    <ResourceView resource={resources.find(r => r.id === previewStage.resource)} stageId={previewStage.id} readOnly />
                  </div>
                  {previewStage.suppResource && (
                    <div>
                      <div className="text-sm font-semibold mb-2">Supplemental resource</div>
                      <ResourceView resource={resources.find(r => r.id === previewStage.suppResource)} stageId={previewStage.id} readOnly />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}

