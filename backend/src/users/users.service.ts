import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email, isDeleted: false },
      relations: ['project'],
    });
  }

  async create(
    email: string,
    password: string,
    name?: string,
    isAdmin?: boolean,
    projectId?: string,
  ) {
    const hash = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      email,
      password: hash,
      name,
      isAdmin: isAdmin || false,
      projectId,
    });
    return this.usersRepository.save(user);
  }

  async list() {
    return this.usersRepository.find({
      where: { isDeleted: false },
      relations: ['project'],
      order: { name: 'ASC' },
    });
  }

  async update(id: string, attrs: Partial<User>) {
    const user = await this.usersRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['project'],
    });
    if (!user) return null;

    if (attrs.password) {
      const hash = await bcrypt.hash(attrs.password, 10);
      attrs.password = hash;
    }

    Object.assign(user, attrs);
    return this.usersRepository.save(user);
  }

  async delete(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!user) return null;

    // Soft delete - just mark as deleted
    user.isDeleted = true;
    await this.usersRepository.save(user);
    return user;
  }

  // Admin method for reports
  async getAllUsers() {
    return this.usersRepository.find({
      where: { isDeleted: false },
      relations: ['project'],
      order: { email: 'ASC' },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: userId, isDeleted: false },
    });
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;

    await this.usersRepository.save(user);
    const { password, ...rest } = user as any;
    return rest;
  }
}
