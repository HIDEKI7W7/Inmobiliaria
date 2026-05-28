import { Module } from '@nestjs/common';
import { StitchController } from './stitch.controller';
import { StitchService } from './stitch.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'ea82a472bb58ffcdcf9e54a558b9f3d61b369c0d54020c68abef68dae178120d',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [StitchController],
  providers: [StitchService],
})
export class StitchModule {}
