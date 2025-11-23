
export enum Emotion {
  Neutral = 'neutral',
  Anger = 'anger',
  Joy = 'joy',
  Sadness = 'sad',
  Fear = 'fear',
  Disgust = 'disgust',
  Embarrassment = 'embarrassment',
  Anxiety = 'anxiety',
  Ennui = 'ennui',
  Envy = 'envy',
  Sarcasm = 'sarcasm',
  Burnout = 'burnout',
  Crashout = 'crashout',
}

export type Theme = 'light' | 'dark';
export type Sensitivity = 'quiet' | 'normal' | 'loud';

export enum Avatar {
  Cat = '🐱',
  Dog = '🐶',
  Fox = '🦊',
  Bunny = '🐰',
  Panda = '🐼',
  Koala = '🐨',
  Owl = '🦉',
  Bear = '🐻'
}

export interface Recording {
  id: string;
  timestamp: number;
  transcript: string;
  dominantEmotion: Emotion;
  duration: number;
}

export interface TaskHistory {
  date: string; // ISO date string YYYY-MM-DD
  completed: boolean;
}

export interface WeeklyTask {
  id: string;
  text: string;
  completed: boolean; // Status for today
  category: 'exercise' | 'mindfulness' | 'gratitude' | 'joy' | 'custom';
  streak: number;
  history: TaskHistory[];
}

export interface GardenNote {
  id: string;
  title: string;
  content: string;
  date: string;
  timestamp: number;
}

export interface UserState {
  name: string;
  points: number;
  streak: number;
  level: number;
  plantStage: number; // 0-5 (seed -> sprout -> tree)
  unlockedEmotions: Emotion[];
  avatar: Avatar;
  unlockedAvatars: Avatar[];
  inventory: {
    seeds: string[];
    flowers: string[];
  };
  theme: Theme;
  micSensitivity: Sensitivity;
  recordings: Recording[];
}

export interface TranscriptSegment {
  text: string;
  emotion: Emotion;
  timestamp: number;
}

export interface HistoryPoint {
  day: string;
  score: number;
  emotion: Emotion;
}

export const EMOTION_COLORS: Record<Emotion, string> = {
  [Emotion.Neutral]: '#9ca3af',
  [Emotion.Anger]: '#ef4444',
  [Emotion.Joy]: '#eab308',
  [Emotion.Sadness]: '#3b82f6',
  [Emotion.Fear]: '#a855f7',
  [Emotion.Disgust]: '#22c55e',
  [Emotion.Embarrassment]: '#ec4899',
  [Emotion.Anxiety]: '#f97316',
  [Emotion.Ennui]: '#6366f1',
  [Emotion.Envy]: '#2dd4bf',
  [Emotion.Sarcasm]: '#78350f',
  [Emotion.Burnout]: '#c2410c',
  [Emotion.Crashout]: '#ff0000',
};

// Keyword lists for heuristic analysis
export const EMOTION_KEYWORDS: Partial<Record<Emotion, string[]>> = {
  [Emotion.Joy]: ['happy', 'great', 'love', 'amazing', 'wonderful', 'excited', 'good', 'best', 'fantastic', 'fun', 'smile', 'laugh', 'blessed', 'glad', 'yay', 'delighted'],
  [Emotion.Anger]: ['hate', 'furious', 'mad', 'angry', 'stupid', 'idiot', 'annoying', 'rage', 'upset', 'worst', 'hell', 'shut up', 'damn', 'pissed', 'hostile'],
  [Emotion.Sadness]: ['sad', 'cry', 'depressed', 'lonely', 'miss', 'heartbroken', 'down', 'blue', 'unhappy', 'sorry', 'grief', 'lost', 'fail', 'bad', 'hurt', 'pain'],
  [Emotion.Fear]: ['scared', 'afraid', 'terrified', 'horror', 'spooky', 'creepy', 'nightmare', 'danger', 'panic', 'nervous', 'shaking', 'trembling', 'run'],
  [Emotion.Anxiety]: ['anxious', 'stress', 'worried', 'nervous', 'panic', 'pressure', 'overwhelmed', 'tense', 'tight', 'deadline', 'rush', 'doubt'],
  [Emotion.Burnout]: ['tired', 'exhausted', 'drained', 'done', 'finished', 'over it', 'too much', 'can\'t', 'sleep', 'fatigue', 'heavy', 'weak', 'depleted', 'overwork', 'workload'],
  [Emotion.Crashout]: ['insane', 'crazy', 'destroy', 'break', 'explode', 'can\'t take it', 'freaking', 'aaaa', 'kill', 'end', 'snap', 'lose it', 'done with this']
};

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    webkitAudioContext: any;
  }
}
