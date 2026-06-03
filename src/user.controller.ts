// users.controller.ts

import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './user.service';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getUserById(
    @Param('id') id: string,
  ): Promise<any> {
    return this.usersService.getUserById(id);
  }
}