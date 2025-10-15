import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async list() {
    return this.projectsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: Partial<Project>) {
    const project = this.projectsRepository.create(data);
    return this.projectsRepository.save(project);
  }

  async update(id: string, data: Partial<Project>) {
    const project = await this.projectsRepository.findOne({ where: { id } });
    if (!project) return null;
    Object.assign(project, data);
    return this.projectsRepository.save(project);
  }

  async findById(id: string) {
    return this.projectsRepository.findOne({ where: { id } });
  }
}
