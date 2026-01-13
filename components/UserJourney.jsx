"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getJourneyProgress } from "@/actions/profile";

export default function UserJourney() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const r = await getJourneyProgress();
        if (!ignore) setData(r);
      } catch (_) {}
    };
    load();
    return () => { ignore = true };
  }, []);

  if (!data) return null;

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-pale-gray shadow-lg">
      <CardHeader>
        <CardTitle>My Journey {data.journey ? `(${data.journey})` : ''}</CardTitle>
      </CardHeader>
      <CardContent>
        {!data.details?.length && (
          <div className="text-sm text-gray-600">No completed stages yet for the active journey.</div>
        )}
        {!!data.details?.length && (
          <ol className="list-disc pl-6 space-y-1">
            {data.details.map(d => (
              <li key={d.stageId} className="text-sm text-gray-700">
                <span className="font-medium">{d.title}</span>
                <span className="text-gray-500"> - {d.completedAt ? new Date(d.completedAt).toLocaleString() : '-'}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

