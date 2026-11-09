"use client";

import { useState, type FormEvent } from "react";
import { UserIcon } from "@animateicons/react/lucide/user-icon";
import { MapPinIcon } from "@animateicons/react/lucide/map-pin-icon";
import { RocketIcon } from "@animateicons/react/lucide/rocket-icon";
import { ArrowLeftIcon } from "@animateicons/react/lucide/arrow-left-icon";
import { ArrowRightIcon } from "@animateicons/react/lucide/arrow-right-icon";
import FormField from "@/components/FormField";
import StepRail, { type Step } from "@/components/auth/StepRail";
import BirthDatePicker from "@/components/ui/BirthDatePicker";
import useIconHover from "@/lib/useIconHover";
import { startApplicationSchema, fieldErrors } from "@/lib/applyValidation";
import { ApiError } from "@/lib/api";
import { startApplication } from "@/lib/admissions";

const STEPS: Step[] = [
  { id: "you", label: "You", icon: UserIcon },
  { id: "where", label: "Where", icon: MapPinIcon },
  { id: "review", label: "Review", icon: RocketIcon },
];

const EDUCATION_LEVELS = ["Middle school", "High school", "College / University", "Not currently in school"];

export default function StartApplyForm({ testKey }: { testKey?: string | null } = {}) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [attempt, setAttempt] = useState(0);
  const [stepFailed, setStepFailed] = useState(false);

  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [school, setSchool] = useState("");
  const [educationLevel, setEducationLevel] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const backIcon = useIconHover();
  const nextIcon = useIconHover();
  const rocketIcon = useIconHover();

  const fields = { full_name: fullName, birth_date: birthDate, email, country, city, whatsapp, school, education_level: educationLevel };

  const goTo = (index: number, dir: "forward" | "back") => {
    setDirection(dir);
    setStepFailed(false);
    setStep(index);
  };

  const validateStep = (index: number) => {
    if (index === 0) {
      const result = startApplicationSchema.pick({ full_name: true, birth_date: true, email: true }).safeParse(fields);
      setErrors(fieldErrors(result));
      return result.success;
    }
    if (index === 1) {
      const result = startApplicationSchema
        .pick({ country: true, city: true, whatsapp: true, education_level: true })
        .safeParse(fields);
      setErrors(fieldErrors(result));
      return result.success;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) {
      setStepFailed(true);
      setAttempt((a) => a + 1);
      return;
    }
    goTo(Math.min(STEPS.length - 1, step + 1), "forward");
  };

  const goBack = () => goTo(Math.max(0, step - 1), "back");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      goNext();
      return;
    }
    setFormError(null);
    const result = startApplicationSchema.safeParse(fields);
    if (!result.success) {
      setErrors(fieldErrors(result));
      goTo(0, "back");
      return;
    }
    setSubmitting(true);
    try {
      await startApplication({ ...result.data, school: result.data.school || null, ...(testKey && { test_key: testKey }) });
      setDone(true);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const panelClass = direction === "back" ? "step-panel-back" : "step-panel-forward";

  if (done) {
    return (
      <div className="rounded-md border border-ink bg-pink/20 p-6 text-center">
        <h2 className="text-xl font-bold">Check your inbox.</h2>
        <p className="mt-2 text-sm text-muted">
          If that email can apply, we&rsquo;ve sent a link to finish your application. It covers your profile,
          a short chat with Alfred, and anything you want to show us.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-ink bg-cream p-6">
      <StepRail steps={STEPS} current={step} />

      <h2 className="text-2xl font-bold">
        {step === 0 && "Tell us who you are"}
        {step === 1 && "Where can we reach you"}
        {step === 2 && "Review and send"}
      </h2>

      <form onSubmit={handleSubmit} noValidate className="mt-4">
        <div key={`panel-${step}`} className={`flex flex-col gap-3.5 ${panelClass}`}>
          {step === 0 && (
            <>
              <FormField label="Full name" name="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} error={errors.full_name} autoFocus />
              <div>
                <p className="mb-2 text-sm font-bold">Date of birth</p>
                <BirthDatePicker value={birthDate} onChange={setBirthDate} error={errors.birth_date} />
                <p className="mt-1.5 text-xs text-muted">TeenovateX is for ages 13 and up.</p>
              </div>
              <FormField label="Email" type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Country" name="country" value={country} onChange={(e) => setCountry(e.target.value)} error={errors.country} autoFocus />
                <FormField label="State or city" name="city" value={city} onChange={(e) => setCity(e.target.value)} error={errors.city} />
              </div>
              <FormField label="WhatsApp number" name="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} error={errors.whatsapp} />
              <FormField label="School (optional)" name="school" value={school} onChange={(e) => setSchool(e.target.value)} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" htmlFor="education_level">Current education level</label>
                <select
                  id="education_level"
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className={`w-full rounded-md border px-4 py-3 text-[15px] outline-none transition-colors focus:ring-2 focus:ring-rose ${errors.education_level ? "border-rose bg-rose/[0.06]" : "border-ink bg-cream"}`}
                >
                  <option value="">Choose one</option>
                  {EDUCATION_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
                {errors.education_level && <p className="text-xs text-rose">{errors.education_level}</p>}
              </div>
            </>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-2.5 rounded-md border border-ink bg-pink/30 p-3.5 text-sm">
              <Row label="Name" value={fullName} />
              <Row label="Date of birth" value={birthDate} />
              <Row label="Email" value={email} />
              <Row label="Location" value={`${city}, ${country}`} />
              <Row label="WhatsApp" value={whatsapp} />
              <Row label="School" value={school || "Not set"} />
              <Row label="Education" value={educationLevel} />
              <p className="text-xs text-muted">
                We&rsquo;ll email a link to continue: build the rest of your profile, chat with Alfred, and submit when ready.
              </p>
            </div>
          )}

          {formError && <p className="text-sm text-rose">{formError}</p>}

          <div className="mt-1 flex items-center gap-3">
            {step > 0 && (
              <button type="button" onClick={goBack} onMouseEnter={backIcon.onMouseEnter} onMouseLeave={backIcon.onMouseLeave} aria-label="Back" className="btn-secondary btn-icon shrink-0">
                <ArrowLeftIcon ref={backIcon.ref} size={18} />
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="submit" onMouseEnter={nextIcon.onMouseEnter} onMouseLeave={nextIcon.onMouseLeave} key={attempt} className={`btn flex-1 justify-center ${stepFailed ? "step-shake" : ""}`}>
                Continue <ArrowRightIcon ref={nextIcon.ref} size={16} />
              </button>
            ) : (
              <button type="submit" disabled={submitting} onMouseEnter={rocketIcon.onMouseEnter} onMouseLeave={rocketIcon.onMouseLeave} className="btn flex-1 justify-center disabled:opacity-60">
                {submitting ? "Sending…" : "Send my application"} <RocketIcon ref={rocketIcon.ref} size={16} />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="text-sm font-medium">{value || "Not set"}</p>
    </div>
  );
}
