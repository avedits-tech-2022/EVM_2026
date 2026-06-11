export interface Candidate {
  id: string;
  name: string;
  postId: number; // 0: School Pupil Leader, 1: Asst School Pupil Leader, 2: Ambassador
  postName: string;
  faceUrl: string;
}

export interface Vote {
  id: string;
  timestamp: string; // Indian Standard Time format or local ISO
  spl: string;      // Selected candidate name
  aspl: string;     // Selected candidate name
  amb: string;      // Selected candidate name
  booth: string;    // e.g. "ballot1", "ballot2" etc.
}

export type Role = "master" | "ballot1" | "ballot2" | "ballot3" | "ballot4";

export interface BoothStats {
  boothId: string;
  name: string;
  voteCount: number;
}
