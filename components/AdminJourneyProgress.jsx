"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";
import { listJourneyUsersProgress } from "@/actions/profile";

export default function AdminJourneyProgress() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState({});

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const r = await listJourneyUsersProgress();
        if (!ignore) setRows(r || []);
      } catch (_) {}
    };
    load();
    return () => { ignore = true };
  }, []);

  const toggle = (id) => setOpen(o => ({ ...o, [id]: !o[id] }));

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-pale-gray shadow-lg">
      <CardHeader>
        <CardTitle>Learner Progress</CardTitle>
      </CardHeader>
      <CardContent>
        {!rows.length && (
          <div className="text-sm text-gray-600">No learners have started the journey yet.</div>
        )}
        {!!rows.length && (
          <div className="divide-y">
            {rows.map(p => (
              <div key={p.userId} className="py-2">
                <div className="flex items-center justify-between">
                  <button onClick={() => toggle(p.userId)} className="flex items-center gap-2 text-left">
                    {open[p.userId] ? <ChevronDown size={16}/> : <ChevronRight size={16}/>} 
                    <div>
                      <div className="font-medium">{p.nickname} <span className="text-xs text-gray-500">{p.profile_id}</span></div>
                      <div className="text-xs text-gray-600">Completed: {p.completedCount} · Modules done: {p.modulesDone}</div>
                    </div>
                  </button>
                  <div className="text-xs text-gray-500">{p.lastCompletedAt ? new Date(p.lastCompletedAt).toLocaleString() : '-'}</div>
                </div>
                {open[p.userId] && (
                  <div className="mt-3 ml-6">
                    {!p.details?.length && (
                      <div className="text-xs text-gray-500">No per-stage timestamps yet.</div>
                    )}
                    {!!p.details?.length && (
                      <ol className="list-disc pl-5 space-y-1">
                        {p.details.map(d => (
                          <li key={`${p.userId}:${d.stageId}`} className="text-xs text-gray-700">
                            <span className="font-medium">{d.title}</span>
                            <span className="text-gray-500"> — {d.completedAt ? new Date(d.completedAt).toLocaleString() : '-'}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

