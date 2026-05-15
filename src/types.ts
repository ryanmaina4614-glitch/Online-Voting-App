export enum UserRole {
  VOTER = 'voter',
  ADMIN = 'admin',
}

export enum ElectionStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export interface Candidate {
  id: string;
  name: string;
  bio: string;
  photoUrl?: string;
  votesCount: number;
}

export interface Election {
  id: string;
  title: string;
  description: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  status: ElectionStatus;
  candidates: Candidate[];
  totalVotes: number;
  creatorId: string;
  createdAt: string;
}

export interface VoteRecord {
  id: string;
  voterId: string; // User UID
  electionId: string;
  timestamp: string;
}

export interface AnonymousVote {
  id: string;
  electionId: string;
  candidateId: string;
  timestamp: string;
  // No voterId here to maintain anonymity
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  details: any;
  timestamp: string;
  ipAddress: string;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  votedElections: string[]; // List of election IDs
  age?: number;
  classGroup?: string;
  gender?: string;
}
