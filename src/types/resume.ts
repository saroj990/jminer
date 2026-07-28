export type PersonalInfo = {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
};

export type WorkExperience = {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
};

export type Education = {
  id: string;
  school: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  details: string;
};

export type SkillGroup = {
  id: string;
  category: string;
  skills: string;
};

export type PortfolioItem = {
  id: string;
  name: string;
  url: string;
  description: string;
  technologies: string;
};

export type ResumeData = {
  personal: PersonalInfo;
  summary: string;
  experiences: WorkExperience[];
  education: Education[];
  skills: SkillGroup[];
  portfolio: PortfolioItem[];
};

export const emptyPersonalInfo = (): PersonalInfo => ({
  fullName: "",
  title: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  linkedin: "",
  github: "",
});

export const createExperience = (): WorkExperience => ({
  id: crypto.randomUUID(),
  company: "",
  role: "",
  location: "",
  startDate: "",
  endDate: "",
  current: false,
  description: "",
});

export const createEducation = (): Education => ({
  id: crypto.randomUUID(),
  school: "",
  degree: "",
  field: "",
  location: "",
  startDate: "",
  endDate: "",
  details: "",
});

export const createSkillGroup = (): SkillGroup => ({
  id: crypto.randomUUID(),
  category: "",
  skills: "",
});

export const createPortfolioItem = (): PortfolioItem => ({
  id: crypto.randomUUID(),
  name: "",
  url: "",
  description: "",
  technologies: "",
});

export const sampleResume = (): ResumeData => ({
  personal: {
    fullName: "Alex Morgan",
    title: "Senior Software Engineer",
    email: "alex.morgan@email.com",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA",
    website: "alexmorgan.dev",
    linkedin: "linkedin.com/in/alexmorgan",
    github: "github.com/alexmorgan",
  },
  summary:
    "Product-minded engineer with 8+ years building reliable web platforms. Strengths in TypeScript, system design, and shipping features that move business metrics.",
  experiences: [
    {
      id: crypto.randomUUID(),
      company: "Northwind Labs",
      role: "Senior Software Engineer",
      location: "San Francisco, CA",
      startDate: "2021-03",
      endDate: "",
      current: true,
      description:
        "Led migration of core dashboard to Next.js, cutting p95 load time by 42%.\nBuilt shared design system used across 4 product teams.\nMentored 3 engineers and ran hiring loops for frontend roles.",
    },
    {
      id: crypto.randomUUID(),
      company: "Brightside Co",
      role: "Software Engineer",
      location: "Remote",
      startDate: "2018-06",
      endDate: "2021-02",
      current: false,
      description:
        "Owned billing and subscription services serving 50k+ customers.\nIntroduced CI quality gates that reduced production incidents by 30%.",
    },
  ],
  education: [
    {
      id: crypto.randomUUID(),
      school: "University of California, Berkeley",
      degree: "B.S.",
      field: "Computer Science",
      location: "Berkeley, CA",
      startDate: "2014-08",
      endDate: "2018-05",
      details: "Dean's List · Focus on distributed systems and HCI",
    },
  ],
  skills: [
    {
      id: crypto.randomUUID(),
      category: "Languages",
      skills: "TypeScript, JavaScript, Python, SQL",
    },
    {
      id: crypto.randomUUID(),
      category: "Frontend",
      skills: "React, Next.js, Tailwind CSS, Accessibility",
    },
    {
      id: crypto.randomUUID(),
      category: "Backend",
      skills: "Node.js, PostgreSQL, Redis, REST, GraphQL",
    },
  ],
  portfolio: [
    {
      id: crypto.randomUUID(),
      name: "Pulseboard",
      url: "https://github.com/alexmorgan/pulseboard",
      description: "Real-time analytics dashboard with role-based access and exportable reports.",
      technologies: "Next.js, Postgres, WebSockets",
    },
    {
      id: crypto.randomUUID(),
      name: "Formkit CLI",
      url: "https://github.com/alexmorgan/formkit",
      description: "Developer tool for scaffolding validated multi-step forms.",
      technologies: "TypeScript, Node.js",
    },
  ],
});
