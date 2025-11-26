import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class UserTimeEntriesReportObject {
  @Field()
  userId: string;

  @Field()
  userEmail: string;

  @Field({ nullable: true })
  userFirstName?: string;

  @Field({ nullable: true })
  userLastName?: string;

  // Number of entries the user made during the requested month
  @Field(() => Int)
  entriesCount: number;

  // Number of unique work days (dates) with entryType === 'work'
  @Field(() => Int)
  workDaysCount: number;

  // Total hours summed for entries with entryType === 'work'
  @Field(() => Float)
  totalWorkHours: number;
}
