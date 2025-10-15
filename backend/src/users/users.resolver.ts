import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { UserObject } from './dto/user.object';
import { UpdateUserInput } from './dto/update-user.input';
import { CreateUserInput } from './dto/create-user.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Admin } from 'src/auth/admin.decorator';
import { AdminGuard } from 'src/auth/admin.guard';

@Resolver(() => UserObject)
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query(() => UserObject)
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Context() context: any) {
    // username is set to email in jwt.strategy
    const email = context.req.user?.username;
    if (!email) return null;

    let user = await this.usersService.findByEmail(email);
    if (!user) {
      // create user if not exists (generate a random password)
      const name = email.split('@')[0];
      user = await this.usersService.create(
        email,
        Math.random().toString(36).slice(-8),
        name,
      );
    }

    const { password, ...rest } = user as any;
    return rest;
  }

  @Query(() => [UserObject])
  @UseGuards(JwtAuthGuard)
  @Admin()
  @UseGuards(AdminGuard)
  async listUsers() {
    const all = await this.usersService.list();
    // remove password before returning
    return all.map((u) => {
      const { password, ...rest } = u as any;
      return rest;
    });
  }

  @Query(() => [UserObject])
  @UseGuards(JwtAuthGuard)
  @Admin()
  @UseGuards(AdminGuard)
  async getAllUsers() {
    const all = await this.usersService.getAllUsers();
    // remove password before returning
    return all.map((u) => {
      const { password, ...rest } = u as any;
      return rest;
    });
  }

  @Mutation(() => UserObject, { nullable: true })
  @UseGuards(JwtAuthGuard)
  @Admin()
  @UseGuards(AdminGuard)
  async updateUser(@Args('input') input: UpdateUserInput) {
    const updated = await this.usersService.update(input.id, input as any);
    if (!updated) return null;
    const { password, ...rest } = updated as any;
    return rest;
  }

  @Mutation(() => UserObject)
  @UseGuards(JwtAuthGuard)
  @Admin()
  @UseGuards(AdminGuard)
  async createUser(@Args('input') input: CreateUserInput) {
    const created = await this.usersService.create(
      input.email,
      input.password,
      input.name,
      input.isAdmin,
      input.projectId,
    );
    const { password, ...rest } = created as any;
    return rest;
  }

  @Mutation(() => UserObject, { nullable: true })
  @UseGuards(JwtAuthGuard)
  @Admin()
  @UseGuards(AdminGuard)
  async deleteUser(@Args('id') id: string) {
    const deleted = await this.usersService.delete(id);
    if (!deleted) return null;
    const { password, ...rest } = deleted as any;
    return rest;
  }
}
