export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Job Matching — Student Internships",
  shortName: "Job Matching",
  url: "https://jobmatching.us",
  description:
    "Find paid summer internships and auto-apply with your resume and LinkedIn. Live Summer 2026 listings filtered for students, with visa sponsorship status surfaced upfront.",
  twitterHandle: "",
  ogImageAlt:
    "Job Matching — find paid summer internships, auto-apply with your resume and LinkedIn",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Internships",
      href: "/internships",
    },
    {
      label: "Apply",
      href: "/apply",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Pricing",
      href: "/pricing",
    },
  ],
  navMenuItems: [
    {
      label: "Internships",
      href: "/internships",
    },
    {
      label: "Apply",
      href: "/apply",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Pricing",
      href: "/pricing",
    },
    {
      label: "Login",
      href: "/auth/login",
    },
    {
      label: "Logout",
      href: "/auth/logout",
    },
  ],
  links: {
    github: "https://github.com/SimplifyJobs/Summer2026-Internships",
    docs: "/internships",
  },
};
