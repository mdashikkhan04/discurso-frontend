"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ResourceView from "@/components/ResourceView";
import UserJourney from "@/components/UserJourney";
import { getRecommendation, markStageCompleted } from "@/actions/journey";
import { getResource } from "@/actions/resources";
import { useUser } from "@/contexts/UserContext";

export default function JourneyLearnPage() {
  const { user } = useUser();
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!user?.uid) return;
      try {
        const list = await getRecommendation();
        const hydrated = await Promise.all((list || []).map(async (s) => {
          let suppDoc = null;
          if (s.suppResource) {
            try { suppDoc = await getResource(s.suppResource); } catch (_) {}
          }
          return { ...s, suppDoc };
        }));
        if (!ignore) setRecs(hydrated);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true };
  }, [user?.uid]);

  const onComplete = async (stageId) => {
    await markStageCompleted(stageId);
    setRecs((prev) => {
      const next = prev.filter(s => s.id !== stageId);
      setSelectedId((curr) => (curr === stageId ? (next[0]?.id || null) : curr));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-white via-pale-blue/30 to-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card className="bg-white/80 backdrop-blur-sm border-pale-gray shadow-lg">
          <CardHeader>
            <CardTitle>Your Learning Journey</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <div className="text-sm text-gray-600">Loading recommendations...</div>}
            {!loading && recs.length === 0 && (
              <div className="text-sm text-gray-600">You're all set for now. Check back soon for more.</div>
            )}

            {!loading && recs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-2">
                  {recs.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedId(s.id)}
                      className={`w-full text-left p-3 rounded-xl border transition ${selectedId === s.id ? 'border-vivid-blue bg-blue-50' : 'border-pale-gray bg-white/90 hover:border-vivid-blue'}`}
                    >
                      <div className="font-medium truncate">{s.title || 'Stage'}</div>
                      <div className="text-xs text-gray-600 truncate">{(s.tags||[]).join(', ') || '—'} • L{(s.proficiencyLevel||0)} {s.free ? '• Free' : '• Paid'}</div>
                    </button>
                  ))}
                </div>
                <div className="md:col-span-2">
                  {!selectedId && <div className="text-sm text-gray-600">Select a stage to start.</div>}
                  {selectedId && (() => {
                    const sel = recs.find(x => x.id === selectedId);
                    if (!sel) return <div className="text-sm text-gray-600">Selection is no longer available.</div>;
                    return (
                      <div className="space-y-4">
                        <div>
                          <div className="text-lg font-semibold">{sel.title || 'Stage'}</div>
                          {sel.description && <div className="text-sm text-gray-700">{sel.description}</div>}
                          <div className="text-xs text-gray-600 mt-1">{(sel.tags||[]).join(', ')} • Level {(sel.proficiencyLevel||0)} {sel.free ? '• Free' : '• Paid'}</div>
                        </div>
                        <ResourceView resource={sel.resourceDoc} stageId={sel.id} onComplete={onComplete} readOnly={sel.free === false} />
                        {sel.suppDoc && (
                          <div className="mt-4">
                            <div className="text-sm font-medium text-gray-700 mb-2">Supplemental</div>
                            <ResourceView resource={sel.suppDoc} stageId={sel.id} onComplete={onComplete} readOnly={sel.free === false} />
                          </div>
                        )}
                        {!sel.free && (
                          <div className="mt-2 text-xs text-gray-500">This stage is locked (Paid). Contact admin to enable access.</div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <UserJourney />

      </div>
    </div>
  );
}

