// Type definitions for community.cce.tw teaching packages
// These types are designed to map cleanly to GitHub API + Firestore responses in the future.

export type Level = 'II' | 'III' | 'IV' | 'V';

export type LearningOutcomes = {
  cognitive: string[];
  social: string[];
  behavioural: string[];
};

export type TeachingPackage = {
  keyId: string;
  level: Level;
  topic: string;
  topicEn: string;
  ageBand: string;
  themeNumber: number;
  themeName: string;
  stars: number;
  forks: number;
  publishedAt: string; // ISO date
  keyIdea: string;
  learningOutcomes: LearningOutcomes;
};

/**
 * Lightweight summary used for cards in the /search page.
 * A superset of TeachingPackage's identifying fields, plus some presentation hints.
 */
export type PackageSummary = {
  keyId: string;
  level: Level;
  levelLabel: string; // 幼兒園低年級 / 國小中高 / 國中 / 高中
  topic: string;
  themeNumber: number; // 1..6
  themeName: string;
  summary: string; // 2-line description
  stars: number;
  forks: number;
  contributors: number;
  emojis: string; // hero emoji for card (e.g. "🌡️📈")
  isOfficial?: boolean;
  hasDetail?: boolean; // true only for 1.1-III in this demo
  // Fields from the GitHub _index.json (optional so mock data still fits)
  mascot?: string;
  ageBand?: string;
  publishedAt?: string;
  files?: string[];
};

export type WsaSchool = {
  name: string;
  icon: string;
  focus: string;
  teachers: number;
  remixes: number;
};

export type Remix = {
  authorName: string;
  authorSchool: string;
  publishedAt: string; // ISO date
  summary: string;
  stars: number;
  forks: number;
  /**
   * Applicable city/county the remix is adapted for (Traditional Chinese name, e.g. "台北市").
   * Rendered on the FamilyTree as a 📍 chip and as a pin on the mini Taiwan map.
   */
  applicableCity?: string;
};

export type DiscussionPost = {
  authorName: string;
  authorSchool: string;
  postedAgo: string;
  tag?: { label: string; type: 'suggestion' | 'feedback' | 'question' };
  content: string;
  replies: number;
  likes: number;
};

export type Contributor = {
  initial: string;
  name: string;
  school: string;
  gradientFrom: string;
  gradientTo: string;
};

export type ArtifactFile = {
  name: string;
  filename: string;
  description: string;
  icon: string;
  bgClass: string;
  highlight?: boolean;
  previewUrl?: string;
};
