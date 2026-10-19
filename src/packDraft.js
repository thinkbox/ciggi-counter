// The new-pack form is remembered while the review page is open.
// Closing the dialog drops it, unless we are only leaving to review.

const PACK_DRAFT_KEY = "cigicounter-new-pack";
const PACK_RESUME_KEY = "cigicounter-new-pack-resume";
const PACK_KEEP_KEY = "cigicounter-new-pack-keep";

export function readPackDraft() {
  try {
    const raw = sessionStorage.getItem(PACK_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writePackDraft(draft) {
  sessionStorage.setItem(PACK_DRAFT_KEY, JSON.stringify(draft));
}

export function clearPackDraft() {
  sessionStorage.removeItem(PACK_DRAFT_KEY);
  sessionStorage.removeItem(PACK_RESUME_KEY);
  sessionStorage.removeItem(PACK_KEEP_KEY);
}

export function keepPackDraft() {
  sessionStorage.setItem(PACK_KEEP_KEY, "1");
}

export function packDraftKept() {
  return sessionStorage.getItem(PACK_KEEP_KEY) === "1";
}

export function releaseKeptDraft() {
  sessionStorage.removeItem(PACK_KEEP_KEY);
}

export function resumePackDraft() {
  sessionStorage.setItem(PACK_RESUME_KEY, "1");
}

export function takePackResume() {
  const resume = sessionStorage.getItem(PACK_RESUME_KEY) === "1";
  if (resume) sessionStorage.removeItem(PACK_RESUME_KEY);
  return resume;
}
