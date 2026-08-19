// Mirrors coaching/models.py PERMISSION_FIELDS / PERMISSION_LABELS on the
// backend. The backend is still the enforcement point — this list only
// drives what toggles render in the UI, in a stable, sensible order.
export const PERMISSION_FIELDS = [
  { key: "share_basic_profile", label: "Basic profile", hint: "Name, age, gender" },
  { key: "share_height", label: "Height", hint: null },
  { key: "share_weight", label: "Current weight", hint: null },
  { key: "share_weight_history", label: "Weight history", hint: "Every logged entry" },
  { key: "share_bmi", label: "BMI", hint: "Body mass index & category" },
  { key: "share_activity_level", label: "Activity level", hint: null },
  { key: "share_fitness_goal", label: "Fitness goal", hint: "Lose / maintain / gain" },
  { key: "share_calorie_target", label: "Calorie target", hint: null },
  { key: "share_fitness_calculations", label: "Fitness calculations", hint: "BMR & TDEE" },
  { key: "share_progress_information", label: "Progress trend", hint: "Summary & direction of change" },
];

export const CONNECTION_STATUS_LABELS = {
  pending: "Pending",
  accepted: "Connected",
  rejected: "Declined",
  disconnected: "Disconnected",
};

export const RECOMMENDATION_CATEGORY_META = {
  safety: { label: "Safety first", tone: "warning" },
  nutrition: { label: "Nutrition", tone: "primary" },
  activity: { label: "Activity", tone: "primary" },
  weight_management: { label: "Weight management", tone: "primary" },
  hydration: { label: "Hydration", tone: "neutral" },
  progress: { label: "Progress", tone: "primary" },
  general: { label: "General", tone: "neutral" },
};
