import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateTimeEntryInput {
  @Field()
  date: string;

  @Field()
  hours: number;

  @Field()
  description: string;

  @Field({ defaultValue: 'work' })
  entryType?: 'work' | 'holiday' | 'leave';
}
