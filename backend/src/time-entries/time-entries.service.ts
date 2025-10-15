import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TimeEntry } from './time-entry.entity';
import { User } from '../users/user.entity';

@Injectable()
export class TimeEntriesService {
  constructor(
    @InjectRepository(TimeEntry)
    private timeEntriesRepository: Repository<TimeEntry>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(userId: string, data: Partial<TimeEntry>) {
    // Validate hours (max 9 hours unless it's a holiday or leave)
    if (
      data.entryType !== 'holiday' &&
      data.entryType !== 'leave' &&
      data.hours &&
      data.hours > 9
    ) {
      throw new Error('Hours cannot exceed 9 per day');
    }

    // Normalize holiday/leave entries
    if (data.entryType === 'holiday') {
      data.hours = 0;
      data.description = data.description || 'Holiday';
    } else if (data.entryType === 'leave') {
      data.hours = 0;
      data.description = data.description || 'Leave';
    }

    const timeEntry = this.timeEntriesRepository.create({
      ...data,
      userId,
    });
    return this.timeEntriesRepository.save(timeEntry);
  }

  async findByUserAndMonth(userId: string, year: number, month: number) {
    const date = new Date(year, month + 1, 0);
    const lastDay = date.getDate();

    month = month + 1;
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = `${year}-${String(month).padStart(2, '0')}-${String(
      lastDay,
    ).padStart(2, '0')}`;

    return this.timeEntriesRepository.find({
      where: {
        userId,
        date: Between(start, end),
      },
      relations: ['user'],
      order: { date: 'DESC' },
    });
  }

  async update(id: string, userId: string, data: Partial<TimeEntry>) {
    // Validate hours (max 9 hours unless it's a holiday or leave)
    if (
      data.entryType !== 'holiday' &&
      data.entryType !== 'leave' &&
      data.hours &&
      data.hours > 9
    ) {
      throw new Error('Hours cannot exceed 9 per day');
    }

    // Normalize holiday/leave entries
    if (data.entryType === 'holiday') {
      data.hours = 0;
      data.description = data.description || 'Holiday';
    } else if (data.entryType === 'leave') {
      data.hours = 0;
      data.description = data.description || 'Leave';
    }

    const timeEntry = await this.timeEntriesRepository.findOne({
      where: { id, userId },
      relations: ['user'],
    });

    if (!timeEntry) {
      throw new Error('Time entry not found');
    }

    Object.assign(timeEntry, data);
    return this.timeEntriesRepository.save(timeEntry);
  }

  async delete(
    id: string,
    // accept either a userId string (legacy) or the full user object from context
    currentUser: string | { userId?: string; isAdmin?: boolean },
  ): Promise<TimeEntry> {
    // Resolve userId and admin flag
    const userId =
      typeof currentUser === 'string' ? currentUser : currentUser.userId;
    const isAdmin =
      typeof currentUser === 'string' ? false : Boolean(currentUser.isAdmin);

    // If admin, allow finding entry by id only; otherwise ensure ownership
    const findWhere = isAdmin ? { id } : { id, userId };
    const timeEntry = await this.timeEntriesRepository.findOne({
      where: findWhere,
      relations: ['user'],
    });

    if (!timeEntry) {
      // Differentiate message for unauthorized vs not found
      if (isAdmin) {
        throw new Error('Time entry not found');
      }
      throw new Error(
        'Time entry not found or you are not authorized to delete it',
      );
    }

    // Clone the entity (including loaded relations) so we can return its data after removal
    const cloned: TimeEntry = { ...timeEntry } as TimeEntry;

    await this.timeEntriesRepository.remove(timeEntry);

    return cloned;
  }

  async findById(id: string, userId: string) {
    return this.timeEntriesRepository.findOne({
      where: { id, userId },
      relations: ['user'],
    });
  }

  // Admin methods for reports
  async getAllUsers() {
    return this.usersRepository.find({
      where: { isDeleted: false },
      order: { email: 'ASC' },
    });
  }

  async getUserTimeEntriesAdmin(userId: string, year: number, month: number) {
    const date = new Date(year, month, 0);
    const lastDay = date.getDate();

    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = `${year}-${String(month).padStart(2, '0')}-${String(
      lastDay,
    ).padStart(2, '0')}`;

    return this.timeEntriesRepository.find({
      where: {
        userId,
        date: Between(start, end),
      },
      relations: ['user'],
      order: { date: 'ASC' },
    });
  }

  async getAllUsersTimeEntriesReport(year: number, month: number) {
    const date = new Date(year, month, 0);
    const lastDay = date.getDate();

    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = `${year}-${String(month).padStart(2, '0')}-${String(
      lastDay,
    ).padStart(2, '0')}`;

    // Get all users (excluding deleted ones)
    const users = await this.usersRepository.find({
      where: { isDeleted: false },
      order: { email: 'ASC' },
    });

    // Get all time entries for the month
    const timeEntries = await this.timeEntriesRepository.find({
      where: {
        date: Between(start, end),
      },
      relations: ['user'],
      order: { date: 'ASC' },
    });

    // Group time entries by user
    const entriesByUser = timeEntries.reduce(
      (acc, entry) => {
        if (!acc[entry.userId]) {
          acc[entry.userId] = [];
        }
        acc[entry.userId].push(entry);
        return acc;
      },
      {} as Record<string, TimeEntry[]>,
    );

    // Create report data
    return users.map((user) => ({
      userId: user.id,
      userEmail: user.email,
      userFirstName: user.name?.split(' ')[0] || null,
      userLastName: user.name?.split(' ').slice(1).join(' ') || null,
      entries: entriesByUser[user.id] || [],
    }));
  }

  async generateFullReportCsv(year: number, month: number): Promise<string> {
    const date = new Date(year, month, 0);
    const lastDay = date.getDate();

    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = `${year}-${String(month).padStart(2, '0')}-${String(
      lastDay,
    ).padStart(2, '0')}`;

    // Get all users (excluding deleted ones) with project information
    const users = await this.usersRepository.find({
      where: { isDeleted: false },
      relations: ['project'],
      order: { email: 'ASC' },
    });

    // Get all time entries for the month with user relations
    const timeEntries = await this.timeEntriesRepository.find({
      where: {
        date: Between(start, end),
      },
      relations: ['user'],
      order: { userId: 'ASC', date: 'ASC' },
    });

    // Helper function to escape CSV fields
    const escapeCsvField = (value: any) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Build CSV content
    const csvRows: string[] = [];

    // CSV Headers
    csvRows.push(
      ['Name', 'Email', 'Project', 'Date', 'Hours', 'Description', 'Entry Type']
        .map(escapeCsvField)
        .join(','),
    );

    // Add entries sorted by username then date
    for (const user of users) {
      const userEntries = timeEntries.filter(
        (entry) => entry.userId === user.id,
      );
      const name = user.name || user.email.split('@')[0];

      for (const entry of userEntries) {
        csvRows.push(
          [
            escapeCsvField(name),
            escapeCsvField(user.email),
            escapeCsvField(user.project?.name || ''),
            escapeCsvField(entry.date),
            escapeCsvField(entry.hours),
            escapeCsvField(entry.description),
            escapeCsvField(entry.entryType),
          ].join(','),
        );
      }
    }

    // Return CSV with BOM for Excel compatibility
    return '\uFEFF' + csvRows.join('\n');
  }
}
