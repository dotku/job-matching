export interface StudentProfile {
  fullName: string;
  email: string;
  resumeUrl: string;
  linkedinUrl: string;
  targetRoles: string;
  targetLocations: string;
  graduationYear: string;
  workAuthorization:
    | "US Citizen"
    | "Permanent Resident"
    | "Student Visa (F-1)"
    | "Other";
  notes?: string;
  updatedAt: number;
}

const STORAGE_KEY = "jm:student-profile";
const SAVED_KEY = "jm:saved-internships";

export function loadProfile(): StudentProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) return null;
  try {
    return JSON.parse(raw) as StudentProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: StudentProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function loadSavedInternshipIds(): string[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(SAVED_KEY);

  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function clearSavedInternships() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SAVED_KEY);
}
