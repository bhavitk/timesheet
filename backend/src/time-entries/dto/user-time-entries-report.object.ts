import { ObjectType, Field } from '@nestjs/graphql';
import { TimeEntryObject } from './time-entry.object';

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

  @Field(() => [TimeEntryObject])
  entries: TimeEntryObject[];
}
