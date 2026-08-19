import { useState } from "react";

import Button from "./ui/Button";
import { Input, Select } from "./ui/FormControls";
import { ACTIVITY_LEVELS, GENDERS, GOALS } from "../services/fitness";

export default function FitnessProfileForm({ initialValues, mode = "create", onSubmit, submitting, submitLabel }) {
  const [form, setForm] = useState({
    age: initialValues?.age ?? "",
    gender: initialValues?.gender ?? "male",
    height_cm: initialValues?.height_cm ?? "",
    weight_kg: initialValues?.weight_kg ?? "",
    activity_level: initialValues?.activity_level ?? "moderate",
    goal: initialValues?.goal ?? "maintain",
    target_weight_kg: initialValues?.target_weight_kg ?? "",
  });
  const [errors, setErrors] = useState({});

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function validate() {
    const next = {};
    if (!form.age || form.age < 13 || form.age > 100) next.age = "Enter an age between 13 and 100.";
    if (!form.height_cm || form.height_cm < 100 || form.height_cm > 250) next.height_cm = "Enter a height between 100 and 250 cm.";
    if (mode === "create" && (!form.weight_kg || form.weight_kg < 30 || form.weight_kg > 300)) {
      next.weight_kg = "Enter a weight between 30 and 300 kg.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      age: Number(form.age),
      gender: form.gender,
      height_cm: Number(form.height_cm),
      activity_level: form.activity_level,
      goal: form.goal,
      target_weight_kg: form.target_weight_kg ? Number(form.target_weight_kg) : null,
    };
    if (mode === "create") payload.weight_kg = Number(form.weight_kg);
    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Age" type="number" min={13} max={100} required value={form.age} onChange={update("age")} error={errors.age} />
        <Select label="Gender" required value={form.gender} onChange={update("gender")}>
          {GENDERS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Height (cm)"
          type="number"
          min={100}
          max={250}
          required
          value={form.height_cm}
          onChange={update("height_cm")}
          error={errors.height_cm}
        />
        {mode === "create" ? (
          <Input
            label="Current weight (kg)"
            type="number"
            min={30}
            max={300}
            step="0.1"
            required
            value={form.weight_kg}
            onChange={update("weight_kg")}
            error={errors.weight_kg}
            hint="You can log new weigh-ins any time from Progress."
          />
        ) : (
          <Input
            label="Target weight (kg)"
            type="number"
            min={30}
            max={300}
            step="0.1"
            value={form.target_weight_kg}
            onChange={update("target_weight_kg")}
            hint="Optional"
          />
        )}
      </div>

      {mode === "create" && (
        <Input
          label="Target weight (kg)"
          type="number"
          min={30}
          max={300}
          step="0.1"
          value={form.target_weight_kg}
          onChange={update("target_weight_kg")}
          hint="Optional — helps Progress show how far you have to go."
        />
      )}

      <Select
        label="Activity level"
        required
        value={form.activity_level}
        onChange={update("activity_level")}
        hint={ACTIVITY_LEVELS.find((a) => a.value === form.activity_level)?.hint}
      >
        {ACTIVITY_LEVELS.map((a) => (
          <option key={a.value} value={a.value}>
            {a.label}
          </option>
        ))}
      </Select>

      <Select label="Goal" required value={form.goal} onChange={update("goal")}>
        {GOALS.map((g) => (
          <option key={g.value} value={g.value}>
            {g.label}
          </option>
        ))}
      </Select>

      <Button type="submit" className="w-full" loading={submitting}>
        {submitLabel || (mode === "create" ? "Complete profile" : "Save changes")}
      </Button>
    </form>
  );
}
