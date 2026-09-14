export type MoodPhase = "rise" | "unwind";
export type MoodValue = 1 | 2 | 3 | 4 | 5;
export type MoodEnergy = 1 | 2 | 3;

export type DailyMoodEntry = {
  id: string;
  date: string | Date;
  phase: MoodPhase;
  mood: MoodValue;
  energy: MoodEnergy | null;
  note: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type DailyMoodInput = {
  date: string;
  phase: MoodPhase;
  mood: MoodValue | null;
  energy?: MoodEnergy | null;
  note?: string;
};
