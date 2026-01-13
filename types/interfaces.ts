export interface InstructorDashboardEvent {
  id: string;
  title: string;
  startTime: number;
  rounds: Round[];
  participants: Participant[];
  draft: boolean;
  participantIds: string[];
  teams: { [key: string]: Team };
  instructor: string;
  timestamp: Timestamp;
  instructorEmail: string;
  coverLink?: string | null;
  roundsCount: number;
  currentRound: number;
  timeLeft: number;
  timeLeftUnits: string;
  finished: boolean;
  started: boolean;
  endTime: number;
  viewTime: number;
  roundsStarted: boolean;
  roundEndTime: number;
}

export interface Round {
  case: Case;
  endTime: number;
  startTime: number;
  viewTime: number;
  aiRound: boolean;
  aiSide: string;
  aiParams: AiParams;
  inAppChat: boolean;
  matches: Match[];
  notified: boolean;
}

export interface Case {
  id: string;
  summary: string;
  scorable: boolean;
  bName: string;
  author: string;
  aName: string;
  ai: string;
  title: string;
  params: Param[];
}

export interface Param {
  name: string;
  id: string;
}

export interface AiParams {}

export interface Match {
  a: string;
  b: string;
}

export interface Participant {
  email: string;
  name: string;
  studentId: string;
  org: string;
  team: string;
  rounds?: number[] | null;
  lastSeenTime?: number;
  error: boolean;
  id: string;
}

export interface Team {
  name: string;
  org: string;
  participants: string[];
}

export interface Timestamp {
  _seconds: number;
  _nanoseconds: number;
}

export interface FeedItemInterface {
  title: string;
  description: string;
  link?: string;
  type: "congrats" | "new-content" | "event-ended"; // Extend as needed
}
