import { request } from "@/lib/api";

const TOKEN_KEY = "tx_applicant_token";

export function getApplicantToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function setApplicantToken(token: string) {
  if (typeof window !== "undefined") window.sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearApplicantToken() {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(TOKEN_KEY);
}

function applicantRequest<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return request<T>(path, { ...init, headers }, { auth: false, retry: false, activity: false });
}

export type WindowInfo = { id: string; opens_at: string; closes_at: string; decisions_publish_at: string };
export type WindowStatus = { state: "open" | "closed"; window: WindowInfo | null; next_opens_at: string | null };

export type Clarification = { id: string; question: string; response: string | null; status: "open" | "answered"; due_at: string };

export type ApplicationView = {
  reference: string;
  status: "draft" | "submitted" | "shortlisted" | "waitlisted" | "accepted" | "declined" | "withdrawn";
  email: string;
  full_name: string;
  birth_date: string;
  country: string;
  city: string;
  whatsapp: string;
  school: string | null;
  education_level: string;
  interests: string[];
  skill_level: "beginner" | "intermediate" | "advanced" | null;
  skill_level_note: string | null;
  current_skills: string[];
  learning_goals: string[];
  portfolio_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  clarifications: Clarification[];
  submitted_at: string | null;
  editable: boolean;
  guardian: { required: boolean; status: "not_requested" | "pending" | "expired" | "confirmed" | "withdrawn" } | null;
  window: WindowInfo & { state: "open" | "closed" };
  message?: string;
};

export type StartApplicationInput = {
  email: string;
  full_name: string;
  birth_date: string;
  country: string;
  city: string;
  whatsapp: string;
  school?: string | null;
  education_level: string;
};

export const getWindow = () => request<WindowStatus>("/admissions/window");

export const startApplication = (data: StartApplicationInput) =>
  request<{ message: string }>("/admissions/start", { method: "POST", body: JSON.stringify(data) });

export const lookupApplication = (email: string) =>
  request<{ message: string }>("/admissions/lookup", { method: "POST", body: JSON.stringify({ email }) });

export const requestReminder = (email: string) =>
  request<{ message: string }>("/admissions/reminders", { method: "POST", body: JSON.stringify({ email }) });

export const getMyApplication = (token: string) => applicantRequest<ApplicationView>("/admissions/me", token);

export const updateDraft = (token: string, data: Partial<Record<string, unknown>>) =>
  applicantRequest<ApplicationView>("/admissions/draft", token, { method: "PATCH", body: JSON.stringify(data) });

export const submitApplication = (token: string) =>
  applicantRequest<ApplicationView>("/admissions/submit", token, { method: "POST" });

export const withdrawApplication = (token: string) =>
  applicantRequest<ApplicationView>("/admissions/withdraw", token, { method: "POST" });

export const replyToClarification = (token: string, id: string, response: string) =>
  applicantRequest<{ message: string }>(`/admissions/clarifications/${id}/reply`, token, {
    method: "POST",
    body: JSON.stringify({ response }),
  });

export const requestGuardian = (token: string, parent_email: string) =>
  applicantRequest<{ message: string }>("/admissions/guardian", token, {
    method: "POST",
    body: JSON.stringify({ parent_email }),
  });

export type InterviewQuestion = { position: number; question: string; format: string };
export type InterviewState = {
  answered: { position: number; question: string; answer: string }[];
  can_submit: boolean;
  next?: InterviewQuestion | null;
};

export const getInterview = (token: string) => applicantRequest<InterviewState>("/admissions/interview", token);

export const nextQuestion = (token: string) =>
  applicantRequest<InterviewState>("/admissions/interview/next", token, { method: "POST" });

export const answerQuestion = (token: string, position: number, answer: string) =>
  applicantRequest<{ saved: boolean; safety_message?: string | null } & InterviewState>(
    `/admissions/interview/answers/${position}`,
    token,
    { method: "PUT", body: JSON.stringify({ answer }) }
  );

export type Attachment = { id: string; kind: "image" | "link"; url: string; created_at: string };

export const listAttachments = (token: string) => applicantRequest<Attachment[]>("/admissions/attachments", token);

export const addAttachmentLink = (token: string, url: string) =>
  applicantRequest<Attachment>("/admissions/attachments/link", token, { method: "POST", body: JSON.stringify({ url }) });

export const removeAttachment = (token: string, id: string) =>
  applicantRequest<{ message: string }>(`/admissions/attachments/${id}`, token, { method: "DELETE" });

export async function uploadAttachmentImage(token: string, file: File): Promise<Attachment> {
  const form = new FormData();
  form.append("image", file);
  return applicantRequest<Attachment>("/admissions/attachments/image", token, { method: "POST", body: form });
}
