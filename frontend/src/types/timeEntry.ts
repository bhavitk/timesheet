export interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  description: string;
  entryType: "work" | "holiday" | "leave";
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeEntryInput {
  date: string;
  hours: number;
  description: string;
  entryType?: "work" | "holiday" | "leave";
}

export interface UpdateTimeEntryInput {
  date?: string;
  hours?: number;
  description?: string;
  entryType?: "work" | "holiday" | "leave";
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
}

export interface UserTimeEntriesReport {
  userId: string;
  userEmail: string;
  userFirstName?: string;
  userLastName?: string;
  entriesCount: number;
  workDaysCount: number;
  totalWorkHours: number;
}

export interface MonthlyReportStats {
  totalUsers: number;
  usersWithMissingEntries: number;
  usersWithCompleteEntries: number;
  workingDaysInMonth: number;
}
