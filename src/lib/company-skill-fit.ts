import { getAiMode } from "@/lib/api";
import { buildSkillsFitMessages, extractJson } from "@/lib/ai/prompts";
import { generateWithFallback } from "@/lib/ai/providers";
import { listingJobDescription } from "@/lib/listing-job-text";
import {
  getPrimaryResumeForUser,
  resumeHasContent,
} from "@/lib/primary-resume";
import { prisma } from "@/lib/prisma";
import { parseTechStackJson } from "@/lib/upwork-db";
import { skillFitAnalysisSchema } from "@/types/job-application";

export async function runSkillFitForListing(
  userId: string,
  listingId: string,
  companyName: string,
) {
  const row = await prisma.companyJobListing.findFirst({
    where: { id: listingId, userId },
  });
  if (!row) {
    throw new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const jobDescription = listingJobDescription({
    title: row.title,
    descriptionSnippet: row.descriptionSnippet,
    techStack: parseTechStackJson(row.techStackJson),
    locationText: row.locationText,
    companyName,
  });

  if (jobDescription.trim().length < 30) {
    throw new Response(JSON.stringify({ error: "Listing has too little text" }), {
      status: 400,
    });
  }

  const { resume, source } = await getPrimaryResumeForUser(userId);
  if (!resumeHasContent(resume)) {
    throw new Response(
      JSON.stringify({
        error:
          source.kind === "master-profile"
            ? "No primary resume snapshot found."
            : "Primary resume has no content.",
      }),
      { status: 400 },
    );
  }

  const mode = await getAiMode(userId);
  const result = await generateWithFallback(
    mode,
    buildSkillsFitMessages({ resume, jobDescription }),
  );
  const analysis = skillFitAnalysisSchema.parse(extractJson(result.text));

  await prisma.companyJobListing.update({
    where: { id: listingId },
    data: {
      skillFitScore: Math.round(analysis.score),
      skillFitJson: JSON.stringify(analysis),
      skillFitAt: new Date(),
    },
  });

  return { analysis, source, result, mode };
}