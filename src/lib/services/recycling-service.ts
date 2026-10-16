/** Stages the server performs for each submission, shown while it is processed. */
export type VerificationStage = "location" | "image" | "duplicates";

export const VERIFICATION_STAGES: { id: VerificationStage; label: string; detail: string }[] = [
  { id: "location", label: "Checking bin location", detail: "Comparing your device location with the selected bin" },
  { id: "image", label: "Assessing image evidence", detail: "Looking for a bottle, a hand and the recycling bin" },
  {
    id: "duplicates",
    label: "Checking for duplicate or suspicious submissions",
    detail: "Making sure this photo hasn't been submitted before",
  },
];
