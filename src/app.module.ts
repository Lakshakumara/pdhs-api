
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { BiomedicalStateController } from './biomedical-state.controller';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [UsersController, BiomedicalStateController],
  providers: [UsersService, PrismaService],
})
export class AppModule {}
