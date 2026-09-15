export type TuneUpValues = {
  duration: string;
  priority: string;
  energyLevel: string;
  dueDate: string;
};

const labels = {
  duration: "time estimate",
  priority: "priority",
  energyLevel: "energy needed",
  dueDate: "due date",
} as const;

export function getMissingTuneUpFields(values: TuneUpValues): string[] {
  const missing: string[] = [];
  if (!values.duration || Number(values.duration) <= 0)
    missing.push(labels.duration);
  if (!values.priority) missing.push(labels.priority);
  if (!values.energyLevel) missing.push(labels.energyLevel);
  if (!values.dueDate) missing.push(labels.dueDate);
  return missing;
}

export function tuneUpIsReady(values: TuneUpValues): boolean {
  return getMissingTuneUpFields(values).length === 0;
}
