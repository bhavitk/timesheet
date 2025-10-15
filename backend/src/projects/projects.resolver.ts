import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ProjectsService } from './projects.service';
import { ProjectObject } from './dto/project.object';
import { CreateProjectInput } from './dto/create-project.input';
import { UpdateProjectInput } from './dto/update-project.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Admin } from 'src/auth/admin.decorator';
import { AdminGuard } from 'src/auth/admin.guard';

@Resolver(() => ProjectObject)
export class ProjectsResolver {
  constructor(private projectsService: ProjectsService) {}

  @Query(() => [ProjectObject])
  @UseGuards(JwtAuthGuard)
  @Admin()
  @UseGuards(AdminGuard)
  async listProjects() {
    return this.projectsService.list();
  }

  @Mutation(() => ProjectObject)
  @UseGuards(JwtAuthGuard)
  @Admin()
  @UseGuards(AdminGuard)
  async createProject(@Args('input') input: CreateProjectInput) {
    return this.projectsService.create(input as any);
  }

  @Mutation(() => ProjectObject, { nullable: true })
  @UseGuards(JwtAuthGuard)
  @Admin()
  @UseGuards(AdminGuard)
  async updateProject(@Args('input') input: UpdateProjectInput) {
    const { id, ...data } = input;
    return this.projectsService.update(id, data as any);
  }
}
