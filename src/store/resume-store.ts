"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { normalizeResumeBulletFields } from "@/lib/format";
import {
  createEducation,
  createExperience,
  createPortfolioItem,
  createSkillGroup,
  emptyPersonalInfo,
  sampleResume,
  type Education,
  type PersonalInfo,
  type PortfolioItem,
  type ResumeData,
  type SkillGroup,
  type WorkExperience,
} from "@/types/resume";

type ResumeStore = {
  resume: ResumeData;
  setPersonal: (personal: Partial<PersonalInfo>) => void;
  setSummary: (summary: string) => void;
  addExperience: () => void;
  updateExperience: (id: string, patch: Partial<WorkExperience>) => void;
  removeExperience: (id: string) => void;
  reorderExperiences: (fromIndex: number, toIndex: number) => void;
  addEducation: () => void;
  updateEducation: (id: string, patch: Partial<Education>) => void;
  removeEducation: (id: string) => void;
  addSkillGroup: () => void;
  updateSkillGroup: (id: string, patch: Partial<SkillGroup>) => void;
  removeSkillGroup: (id: string) => void;
  addPortfolio: () => void;
  updatePortfolio: (id: string, patch: Partial<PortfolioItem>) => void;
  removePortfolio: (id: string) => void;
  reorderPortfolio: (fromIndex: number, toIndex: number) => void;
  loadSample: () => void;
  reset: () => void;
  replaceResume: (resume: ResumeData) => void;
};

const blankResume = (): ResumeData => ({
  personal: emptyPersonalInfo(),
  summary: "",
  experiences: [createExperience()],
  education: [createEducation()],
  skills: [createSkillGroup()],
  portfolio: [createPortfolioItem()],
});

/** Avoid writing localStorage on every keystroke (main typing lag source). */
function createDebouncedStorage(debounceMs = 400) {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
  }

  const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

  return {
    getItem: (name: string) => window.localStorage.getItem(name),
    setItem: (name: string, value: string) => {
      const existing = timeouts.get(name);
      if (existing) clearTimeout(existing);
      timeouts.set(
        name,
        setTimeout(() => {
          window.localStorage.setItem(name, value);
          timeouts.delete(name);
        }, debounceMs),
      );
    },
    removeItem: (name: string) => {
      const existing = timeouts.get(name);
      if (existing) clearTimeout(existing);
      timeouts.delete(name);
      window.localStorage.removeItem(name);
    },
  };
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set) => ({
      resume: sampleResume(),
      setPersonal: (personal) =>
        set((state) => ({
          resume: {
            ...state.resume,
            personal: { ...state.resume.personal, ...personal },
          },
        })),
      setSummary: (summary) =>
        set((state) => ({
          resume: { ...state.resume, summary },
        })),
      addExperience: () =>
        set((state) => {
          const hasCurrent = state.resume.experiences.some((item) => item.current);
          const next = createExperience();

          // Latest role: no role is marked current → insert at top as the new current job.
          // Otherwise (adding an older role while one is still current) append at the end.
          if (!hasCurrent) {
            next.current = true;
            return {
              resume: {
                ...state.resume,
                experiences: [next, ...state.resume.experiences],
              },
            };
          }

          return {
            resume: {
              ...state.resume,
              experiences: [...state.resume.experiences, next],
            },
          };
        }),
      updateExperience: (id, patch) =>
        set((state) => ({
          resume: {
            ...state.resume,
            experiences: state.resume.experiences.map((item) =>
              item.id === id ? { ...item, ...patch } : item,
            ),
          },
        })),
      removeExperience: (id) =>
        set((state) => ({
          resume: {
            ...state.resume,
            experiences: state.resume.experiences.filter((item) => item.id !== id),
          },
        })),
      reorderExperiences: (fromIndex, toIndex) =>
        set((state) => {
          if (
            fromIndex === toIndex ||
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= state.resume.experiences.length ||
            toIndex >= state.resume.experiences.length
          ) {
            return state;
          }
          const experiences = [...state.resume.experiences];
          const [moved] = experiences.splice(fromIndex, 1);
          experiences.splice(toIndex, 0, moved);
          return {
            resume: {
              ...state.resume,
              experiences,
            },
          };
        }),
      addEducation: () =>
        set((state) => ({
          resume: {
            ...state.resume,
            education: [...state.resume.education, createEducation()],
          },
        })),
      updateEducation: (id, patch) =>
        set((state) => ({
          resume: {
            ...state.resume,
            education: state.resume.education.map((item) =>
              item.id === id ? { ...item, ...patch } : item,
            ),
          },
        })),
      removeEducation: (id) =>
        set((state) => ({
          resume: {
            ...state.resume,
            education: state.resume.education.filter((item) => item.id !== id),
          },
        })),
      addSkillGroup: () =>
        set((state) => ({
          resume: {
            ...state.resume,
            skills: [...state.resume.skills, createSkillGroup()],
          },
        })),
      updateSkillGroup: (id, patch) =>
        set((state) => ({
          resume: {
            ...state.resume,
            skills: state.resume.skills.map((item) =>
              item.id === id ? { ...item, ...patch } : item,
            ),
          },
        })),
      removeSkillGroup: (id) =>
        set((state) => ({
          resume: {
            ...state.resume,
            skills: state.resume.skills.filter((item) => item.id !== id),
          },
        })),
      addPortfolio: () =>
        set((state) => ({
          resume: {
            ...state.resume,
            portfolio: [...state.resume.portfolio, createPortfolioItem()],
          },
        })),
      updatePortfolio: (id, patch) =>
        set((state) => ({
          resume: {
            ...state.resume,
            portfolio: state.resume.portfolio.map((item) =>
              item.id === id ? { ...item, ...patch } : item,
            ),
          },
        })),
      removePortfolio: (id) =>
        set((state) => ({
          resume: {
            ...state.resume,
            portfolio: state.resume.portfolio.filter((item) => item.id !== id),
          },
        })),
      reorderPortfolio: (fromIndex, toIndex) =>
        set((state) => {
          if (
            fromIndex === toIndex ||
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= state.resume.portfolio.length ||
            toIndex >= state.resume.portfolio.length
          ) {
            return state;
          }
          const portfolio = [...state.resume.portfolio];
          const [moved] = portfolio.splice(fromIndex, 1);
          portfolio.splice(toIndex, 0, moved);
          return {
            resume: {
              ...state.resume,
              portfolio,
            },
          };
        }),
      loadSample: () => set({ resume: sampleResume() }),
      reset: () => set({ resume: blankResume() }),
      replaceResume: (resume) =>
        set({ resume: normalizeResumeBulletFields(resume) }),
    }),
    {
      name: "resume-builder-data",
      storage: createJSONStorage(() => createDebouncedStorage(450)),
      partialize: (state) => ({ resume: state.resume }),
      onRehydrateStorage: () => (state) => {
        if (!state?.resume) return;
        state.resume = normalizeResumeBulletFields(state.resume);
      },
    },
  ),
);
