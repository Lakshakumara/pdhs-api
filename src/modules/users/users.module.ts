import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DeveloperController } from './delete-deploy.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [AuthModule],
  controllers: [UsersController, DeveloperController],
  providers: [UsersService, PrismaService],
  exports: [UsersService ],
})
export class UsersModule { }
