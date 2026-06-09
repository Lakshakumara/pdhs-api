/*import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Permission } from 'src/auth/permission.enum';
import { CreateUserDto, UpdateUserDto } from 'src/dto/index.dto';
import { UsersService } from 'src/service/user.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermission(Permission.USER_VIEW)
  findAll(@Query('search') search?: string) {
    return this.usersService.findAll(search);
  }

  @Get(':id')
  @RequirePermission(Permission.USER_VIEW)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermission(Permission.USER_CREATE)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @RequirePermission(Permission.USER_UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(Permission.USER_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/reset-password')
  @RequirePermission(Permission.USER_UPDATE)
  resetPassword(@Param('id') id: string) {
    return this.usersService.triggerPasswordReset(id);
  }
}
*/