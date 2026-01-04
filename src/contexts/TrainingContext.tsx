import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface Translation {
  language_id: number;
  title: string;
  description_short: string;
  description: string;
  welcome_message: string;
  congratulations_message: string;
}

interface Goal {
  id?: number;
  translations: Array<{
    language_id: number;
    title: string;
  }>;
  sort: number;
}

interface Content {
  level_id: number;
  trainers: number[];
  completion_time: number;
  image: {
    file: File | null | string;
    preview: string;
  };
  translations: Array<{
    language_id: number;
    title: string;
    description: string;
    description_short: string;
  }>;
}

interface Message {
  translations: Array<{
    language_id: number;
    welcome_message: string;
    congratulations_message: string;
  }>;
}

interface Level {
  id: number;
  title: string;
}

interface Trainer {
  id: number;
  name: string;
  surname: string;
}

interface Training {
  id: number;
  content: Content;
  goals: Goal[];
  messages: Message;
}

interface TrainingContextType {
  training: Training;
  setTraining: (training: Training) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  selectedLanguageId: number;
  setSelectedLanguageId: (languageId: number) => void;
  trainingId?: string;
  levels: Level[];
  setLevels: (levels: Level[]) => void;
  trainers: Trainer[];
  setTrainers: (trainers: Trainer[]) => void;
}

const TrainingContext = createContext<TrainingContextType | undefined>(
  undefined,
);

interface TrainingProviderProps {
  children: ReactNode;
  trainingId?: string;
}

export function TrainingProvider({
  children,
  trainingId,
}: TrainingProviderProps) {
  const [training, setTraining] = useState<Training>({
    id: 0,
    content: {
      level_id: 0,
      trainers: [],
      completion_time: 0,
      translations: [],
      image: {
        file: null,
        preview: "",
      },
    },
    goals: [],
    messages: {
      translations: [],
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguageId, setSelectedLanguageId] = useState<number>(1);
  const [levels, setLevels] = useState<Level[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);

  const value: TrainingContextType = {
    training,
    setTraining,
    isLoading,
    setIsLoading,
    selectedLanguageId,
    setSelectedLanguageId,
    trainingId,
    levels,
    setLevels,
    trainers,
    setTrainers,
  };

  return (
    <TrainingContext.Provider value={value}>
      {children}
    </TrainingContext.Provider>
  );
}

export function useTraining() {
  const context = useContext(TrainingContext);
  if (context === undefined) {
    throw new Error("useTraining must be used within a TrainingProvider");
  }
  return context;
}

export type { Training, Translation, Goal };
