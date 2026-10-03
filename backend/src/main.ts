
import { AppModule } from './app.module';
import { BffServer } from './core/server';

new BffServer().withModule(AppModule).start();
