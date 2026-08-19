import { api } from "./api";

export async function getFitnessProfile() {
  const { data } = await api.get("/health/profile/");
  return data;
}

export async function createFitnessProfile(payload) {
  const { data } = await api.post("/health/profile/", payload);
  return data;
}

export async function updateFitnessProfile(payload) {
  const { data } = await api.patch("/health/profile/", payload);
  return data;
}

export async function getCalculations() {
  const { data } = await api.get("/health/calculations/");
  return data;
}

export async function getRecommendations() {
  const { data } = await api.get("/health/recommendations/");
  return data.recommendations;
}

export const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary", hint: "Little or no exercise, desk job" },
  { value: "light", label: "Lightly active", hint: "Light exercise 1-3 days/week" },
  { value: "moderate", label: "Moderately active", hint: "Moderate exercise 3-5 days/week" },
  { value: "active", label: "Active", hint: "Hard exercise 6-7 days/week" },
  { value: "very_active", label: "Very active", hint: "Very hard training, physical job" },
];

export const GOALS = [
  { value: "lose", label: "Lose weight" },
  { value: "maintain", label: "Maintain weight" },
  { value: "gain", label: "Gain weight" },
];

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export const BMI_CATEGORY_LABELS = {
  underweight: "Underweight",
  normal: "Normal weight",
  overweight: "Overweight",
  obese: "Obese",
};
