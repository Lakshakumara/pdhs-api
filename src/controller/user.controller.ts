// users.controller.ts

import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { UsersService } from '../service/user.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@Req() req: any): Promise<any> {
    // req.user is populated by JwtAuthGuard with decode payload (sub = userId)
    return this.usersService.getUserById(req.user.sub);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<any> {
    return this.usersService.getUserById(id);
  }
}


