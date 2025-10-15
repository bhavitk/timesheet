import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserObject } from '../../users/dto/user.object';

@ObjectType()
export class TimeEntryObject {
  @Field(() => ID)
  id: string;

  @Field()
  date: string;

  @Field()
  hours: number;

  @Field()
  description: string;

  @Field()
  entryType: string;

  @Field(() => UserObject)
  user: UserObject;

  @Field()
  userId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
