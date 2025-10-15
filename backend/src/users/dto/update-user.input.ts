import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateUserInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  password?: string;

  @Field({ nullable: true })
  isAdmin?: boolean;

  @Field({ nullable: true })
  projectId?: string;
}
