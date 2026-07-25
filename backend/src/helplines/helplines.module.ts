import { Module } from '@nestjs/common';
import { HelplinesService } from './helplines.service';
import { HelplinesController } from './helplines.controller';

@Module({
  controllers: [HelplinesController],
  providers: [HelplinesService],
})
export class HelplinesModule {}
