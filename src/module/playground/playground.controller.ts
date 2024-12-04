import { Controller } from '@nestjs/common';
import { PlaygroundService } from './playground.service';

@Controller('users/playground')
export class PlaygroundController {
  constructor(private readonly playgroundService: PlaygroundService) {}
}
