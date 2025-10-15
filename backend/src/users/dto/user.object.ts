import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ProjectObject } from '../../projects/dto/project.object';

@ObjectType()
export class UserObject {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  name?: string;

  @Field()
  isAdmin: boolean;

  @Field({ nullable: true })
  project?: ProjectObject;

  @Field({ nullable: true })
  projectId?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
