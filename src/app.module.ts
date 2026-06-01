/*import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { BiomedicalStateController } from './biomedical-state.controller';

@Module({
  imports: [],
  controllers: [AppController, BiomedicalStateController],
  providers: [AppService, PrismaService],
})
export class AppModule {}*/
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { BiomedicalStateController } from './biomedical-state.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController, BiomedicalStateController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
