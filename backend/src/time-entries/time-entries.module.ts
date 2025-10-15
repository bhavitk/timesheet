import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeEntry } from './time-entry.entity';
import { User } from '../users/user.entity';
import { TimeEntriesService } from './time-entries.service';
import { TimeEntriesResolver } from './time-entries.resolver';
import { TimeEntriesController } from './time-entries.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TimeEntry, User])],
  providers: [TimeEntriesService, TimeEntriesResolver],
  controllers: [TimeEntriesController],
  exports: [TimeEntriesService],
})
export class TimeEntriesModule {}
