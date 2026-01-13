"use client";

import { useUser } from "@/contexts/UserContext";
import EventEditor from "@/components/EventEditor";
import { useEffect, useState } from "react";

export default function NewEventPage() {
  const { user } = useUser();
  const [instructorId, setInstructorId] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      setInstructorId(user?.uid);
    }
  }, [user]);

  if (instructorId) {
    return (
      <div>
        <EventEditor initInstructorId={instructorId} />
      </div>
    );
  } else {
    return null;
  }
}
