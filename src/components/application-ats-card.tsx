"use client";

import { UpworkAtsCard, type AtsAnalysis } from "@/components/upwork-ats-card";

type Props = {
  applicationId: string;
  initialScore?: number | null;
  initialAnalysis?: AtsAnalysis | null;
  onScored?: (score: number, analysis: AtsAnalysis) => void;
};

export function ApplicationAtsCard({
  applicationId,
  initialScore = null,
  initialAnalysis = null,
  onScored,
}: Props) {
  return (
    <UpworkAtsCard
      leadId={applicationId}
      atsPostUrl={`/api/applications/${applicationId}/ats`}
      title="Resume ATS vs job"
      initialScore={initialScore}
      initialAnalysis={initialAnalysis}
      onScored={onScored}
    />
  );
}