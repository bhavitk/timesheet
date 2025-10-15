import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateUserInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ defaultValue: false })
  isAdmin?: boolean;

  @Field({ nullable: true })
  projectId?: string;
}
