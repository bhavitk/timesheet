import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TimeEntriesService } from './time-entries.service';
import { TimeEntryObject } from './dto/time-entry.object';
import { CreateTimeEntryInput } from './dto/create-time-entry.input';
import { UpdateTimeEntryInput } from './dto/update-time-entry.input';
import { UserTimeEntriesReportObject } from './dto/user-time-entries-report.object';
import { Admin } from '../auth/admin.decorator';
import { AdminGuard } from '../auth/admin.guard';

@Resolver(() => TimeEntryObject)
@UseGuards(JwtAuthGuard)
export class TimeEntriesResolver {
  constructor(private timeEntriesService: TimeEntriesService) {}

  @Query(() => [TimeEntryObject])
  async getTimeEntries(
    @Args('year') year: number,
    @Args('month') month: number,
    @Context() context: any,
  ) {
    const userId = context.req.user.userId;
    return this.timeEntriesService.findByUserAndMonth(userId, year, month);
  }

  @Mutation(() => TimeEntryObject)
  async createTimeEntry(
    @Args('input') input: CreateTimeEntryInput,
    @Context() context: any,
  ) {
    const userId = context.req.user.userId;

    // Handle holiday/leave logic
    if (input.entryType === 'holiday') {
      input.hours = 0;
      input.description = 'Holiday';
    } else if (input.entryType === 'leave') {
      input.hours = 0;
      input.description = 'Leave';
    }

    return this.timeEntriesService.create(userId, input);
  }

  @Mutation(() => TimeEntryObject)
  async updateTimeEntry(
    @Args('input') input: UpdateTimeEntryInput,
    @Context() context: any,
  ) {
    const userId = context.req.user.userId;
    const { id, ...data } = input;

    // Handle holiday/leave logic
    if (data.entryType === 'holiday') {
      data.hours = 0;
      data.description = 'Holiday';
    } else if (data.entryType === 'leave') {
      data.hours = 0;
      data.description = 'Leave';
    }

    return this.timeEntriesService.update(id, userId, data);
  }

  @Mutation(() => TimeEntryObject)
  async deleteTimeEntry(@Args('id') id: string, @Context() context: any) {
    // Pass the full user object so service can decide based on roles (admin vs owner)
    const currentUser = context.req.user;
    return this.timeEntriesService.delete(id, currentUser);
  }

  // Admin queries for reports
  @Query(() => [TimeEntryObject])
  @Admin()
  @UseGuards(AdminGuard)
  async getUserTimeEntriesAdmin(
    @Args('userId') userId: string,
    @Args('year') year: number,
    @Args('month') month: number,
    @Context() context: any,
  ) {
    return this.timeEntriesService.getUserTimeEntriesAdmin(userId, year, month);
  }

  @Query(() => [UserTimeEntriesReportObject])
  @Admin()
  @UseGuards(AdminGuard)
  async getAllUsersTimeEntriesReport(
    @Args('year') year: number,
    @Args('month') month: number,
    @Args('projectId', { nullable: true }) projectId?: string,
    @Context() context?: any,
  ) {
    return this.timeEntriesService.getAllUsersTimeEntriesReport(
      year,
      month,
      projectId,
    );
  }
}
