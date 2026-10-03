import { Module } from '@nestjs/common';

import { UsersController } from './controllers/users.controller';
import { ProfilesController } from './controllers/profiles.controller';
import { BranchesController } from './controllers/branches.controller';
import { GlobalAccessController } from './controllers/global-access.controller';

import { UsersService } from './service/users.service';
import { ProfilesService } from './service/profiles.service';
import { BranchesService } from './service/branches.service';
import { GlobalAccessService } from './service/global-access.service';

import { UsersRepositoryImpl } from './implements/users.repository.impl';
import { ProfilesRepositoryImpl } from './implements/profiles.repository.impl';
import { BranchesRepositoryImpl } from './implements/branches.repository.impl';
import { GlobalAccessRepositoryImpl } from './implements/global-access.repository.impl';

import { USERS_REPOSITORY } from './types/interfaces/users.repository';
import { PROFILES_REPOSITORY } from './types/interfaces/profiles.repository';
import { BRANCHES_REPOSITORY } from './types/interfaces/branches.repository';
import { GLOBAL_ACCESS_REPOSITORY } from './types/interfaces/global-access.repository';

@Module({
  controllers: [
    UsersController,
    ProfilesController,
    BranchesController,
    GlobalAccessController,
  ],
  providers: [
    UsersService,
    ProfilesService,
    BranchesService,
    GlobalAccessService,
    { provide: USERS_REPOSITORY, useClass: UsersRepositoryImpl },
    { provide: PROFILES_REPOSITORY, useClass: ProfilesRepositoryImpl },
    { provide: BRANCHES_REPOSITORY, useClass: BranchesRepositoryImpl },
    { provide: GLOBAL_ACCESS_REPOSITORY, useClass: GlobalAccessRepositoryImpl },
  ],
})
export class SettingsModule {}
