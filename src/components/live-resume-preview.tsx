"use client";

import { memo, useDeferredValue } from "react";
import { ResumePreview } from "@/components/resume-preview";
import { useResumeStore } from "@/store/resume-store";

function LiveResumePreviewInner() {
  const resume = useResumeStore((s) => s.resume);
  const deferredResume = useDeferredValue(resume);

  return <ResumePreview resume={deferredResume} />;
}

export const LiveResumePreview = memo(LiveResumePreviewInner);
