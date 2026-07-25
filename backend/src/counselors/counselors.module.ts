import { Module } from '@nestjs/common';
import { CounselorsService } from './counselors.service';
import { CounselorsController } from './counselors.controller';

@Module({
  controllers: [CounselorsController],
  providers: [CounselorsService],
  exports: [CounselorsService],
})
export class CounselorsModule {}
