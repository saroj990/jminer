import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return session.user.id;
}

export async function ensureProfile(userId: string) {
  const existing = await prisma.profile.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.profile.create({ data: { userId } });
}

export async function getAiMode(userId: string) {
  const prefs = await prisma.userPreferences.findUnique({ where: { userId } });
  if (prefs?.aiMode === "local" || prefs?.aiMode === "online") return prefs.aiMode;
  return (process.env.AI_DEFAULT_MODE === "local" ? "local" : "online") as
    | "online"
    | "local";
}

export const profileInclude = {
  experiences: { orderBy: { sortOrder: "asc" as const } },
  education: { orderBy: { sortOrder: "asc" as const } },
  projects: { orderBy: { sortOrder: "asc" as const } },
  skills: { orderBy: { sortOrder: "asc" as const } },
  certifications: { orderBy: { sortOrder: "asc" as const } },
  awards: { orderBy: { sortOrder: "asc" as const } },
  publications: { orderBy: { sortOrder: "asc" as const } },
  languages: { orderBy: { sortOrder: "asc" as const } },
  interests: { orderBy: { sortOrder: "asc" as const } },
};
