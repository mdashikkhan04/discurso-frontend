"use client";

import { Loader2 } from "lucide-react"; // Ensure lucide-react is installed
import React from "react";

const LoadingOverlay = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <Loader2 className="animate-spin text-white w-12 h-12" />
    </div>
  );
};

export default LoadingOverlay;
