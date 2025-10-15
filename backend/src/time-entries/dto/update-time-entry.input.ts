import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateTimeEntryInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  date?: string;

  @Field({ nullable: true })
  hours?: number;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  entryType?: 'work' | 'holiday' | 'leave';
}
