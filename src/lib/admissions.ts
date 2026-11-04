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

export const getWindow = () => request<WindowStatus>("/applications/window");

export const startApplication = (data: StartApplicationInput) =>
  request<{ message: string }>("/applications/start", { method: "POST", body: JSON.stringify(data) });

export const lookupApplication = (email: string) =>
  request<{ message: string }>("/applications/lookup", { method: "POST", body: JSON.stringify({ email }) });

export const requestReminder = (email: string) =>
  request<{ message: string }>("/applications/reminders", { method: "POST", body: JSON.stringify({ email }) });

export const getMyApplication = (token: string) => applicantRequest<ApplicationView>("/applications/me", token);

export const updateDraft = (token: string, data: Partial<Record<string, unknown>>) =>
  applicantRequest<ApplicationView>("/applications/draft", token, { method: "PATCH", body: JSON.stringify(data) });

export const submitApplication = (token: string) =>
  applicantRequest<ApplicationView>("/applications/submit", token, { method: "POST" });

export const withdrawApplication = (token: string) =>
  applicantRequest<ApplicationView>("/applications/withdraw", token, { method: "POST" });

export const replyToClarification = (token: string, id: string, response: string) =>
  applicantRequest<{ message: string }>(`/applications/clarifications/${id}/reply`, token, {
    method: "POST",
    body: JSON.stringify({ response }),
  });

export const requestGuardian = (token: string, parent_email: string) =>
  applicantRequest<{ message: string }>("/applications/guardian", token, {
    method: "POST",
    body: JSON.stringify({ parent_email }),
  });

/** How a question is answered. Typed answers have no spec. */
export type QuestionSpec = { options?: string[]; min?: number; max?: number; low?: string; high?: string };
export type QuestionFormat = "text" | "choice" | "multi" | "scale" | "slider";
export type InterviewQuestion = { position: number; question: string; format: QuestionFormat | string; spec: QuestionSpec | null };
export type AnswerPayload = { answer?: string; choice?: string[]; value?: number; note?: string };
export type InterviewState = {
  /** The most questions Alfred will ask. He may stop sooner once he has heard enough. */
  total: number;
  /** How many have been answered. */
  answered: number;
  complete: boolean;
  can_submit: boolean;
  questions: { position: number; question: string; format: string; spec: QuestionSpec | null; answer: string | null }[];
  next?: InterviewQuestion | null;
};

export const getInterview = (token: string) => applicantRequest<InterviewState>("/applications/interview", token);

export const nextQuestion = (token: string) =>
  applicantRequest<InterviewState>("/applications/interview/next", token, { method: "POST" });

export const answerQuestion = (token: string, position: number, payload: AnswerPayload) =>
  applicantRequest<{ saved: boolean; safety_message?: string | null } & InterviewState>(
    `/applications/interview/answers/${position}`,
    token,
    { method: "PUT", body: JSON.stringify(payload) }
  );

// Images are private, so the API gives no address for them; links carry their address.
export type Attachment = { id: string; kind: "image" | "link"; url: string | null; filename: string | null; size_bytes: number | null };

export const listAttachments = async (token: string) => (await applicantRequest<{ items: Attachment[] }>("/applications/attachments", token)).items;

export const addAttachmentLink = (token: string, url: string) =>
  applicantRequest<Attachment>("/applications/attachments/link", token, { method: "POST", body: JSON.stringify({ url }) });

export const removeAttachment = (token: string, id: string) =>
  applicantRequest<{ ok: boolean }>(`/applications/attachments/${id}`, token, { method: "DELETE" });

export async function uploadAttachmentImage(token: string, file: File): Promise<Attachment> {
  const form = new FormData();
  form.append("image", file);
  return applicantRequest<Attachment>("/applications/attachments/image", token, { method: "POST", body: form });
}
