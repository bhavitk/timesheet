import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { RegisterInput } from './dto/register.input';
import { Public } from './public.decorator';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Query(() => String)
  // @Public()
  hello() {
    return 'hello';
  }

  @Mutation(() => String)
  async register(@Args('input') input: RegisterInput) {
    const created = await this.authService.register(
      input.email,
      input.password,
      input.name,
    );
    // Return a simple string or user ID; adapt as needed
    return (created as any).id;
  }
}
