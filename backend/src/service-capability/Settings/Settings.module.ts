import { Module } from '@nestjs/common';

import { UsersController } from './controllers/users.controller';
import { ProfilesController } from './controllers/profiles.controller';
import { BranchesController } from './controllers/branches.controller';
import { GlobalAccessController } from './controllers/global-access.controller';
import { PrescriptionController } from './controllers/prescription.controller';
import { DocumentTemplateController } from './controllers/document-template.controller';

import { UsersService } from './service/users.service';
import { ProfilesService } from './service/profiles.service';
import { BranchesService } from './service/branches.service';
import { GlobalAccessService } from './service/global-access.service';
import { PrescriptionService } from './service/prescription.service';
import { DocumentTemplateService } from './service/document-template.service';
import { DocumentGenerator } from '../../core/utils/document/DocumentGenerator';

import { UsersRepositoryImpl } from './implements/users.repository.impl';
import { ProfilesRepositoryImpl } from './implements/profiles.repository.impl';
import { BranchesRepositoryImpl } from './implements/branches.repository.impl';
import { GlobalAccessRepositoryImpl } from './implements/global-access.repository.impl';
import { PrescriptionRepositoryImpl } from './implements/prescription.repository.impl';
import { DocumentTemplateRepositoryImpl } from './implements/document-template.repository.impl';

import { USERS_REPOSITORY } from './types/interfaces/users.repository';
import { PROFILES_REPOSITORY } from './types/interfaces/profiles.repository';
import { BRANCHES_REPOSITORY } from './types/interfaces/branches.repository';
import { GLOBAL_ACCESS_REPOSITORY } from './types/interfaces/global-access.repository';
import { PRESCRIPTION_REPOSITORY } from './types/interfaces/prescription.repository';
import { DOCUMENT_TEMPLATE_REPOSITORY } from './types/interfaces/document-template.repository';
import { DoctorSignatureController } from './controllers/doctor-signature.controller';
import { DoctorSignatureService } from './service/doctor-signature.service';
import { DOCTORSIGNATURE_REPOSITORY } from './types/interfaces/doctorSignature.repository';
import { DoctorSignatureRepositoryImpl } from './implements/doctor-signature.repository.impl';

@Module({
  controllers: [
    UsersController,
    ProfilesController,
    BranchesController,
    GlobalAccessController,
    PrescriptionController,
    DocumentTemplateController,
    DoctorSignatureController
  ],
  providers: [
    UsersService,
    ProfilesService,
    BranchesService,
    GlobalAccessService,
    PrescriptionService,
    DocumentTemplateService,
    DocumentGenerator,
    DoctorSignatureService,
    { provide: USERS_REPOSITORY, useClass: UsersRepositoryImpl },
    { provide: PROFILES_REPOSITORY, useClass: ProfilesRepositoryImpl },
    { provide: BRANCHES_REPOSITORY, useClass: BranchesRepositoryImpl },
    { provide: GLOBAL_ACCESS_REPOSITORY, useClass: GlobalAccessRepositoryImpl },
    { provide: PRESCRIPTION_REPOSITORY, useClass: PrescriptionRepositoryImpl },
    { provide: DOCUMENT_TEMPLATE_REPOSITORY, useClass: DocumentTemplateRepositoryImpl },
    { provide: DOCTORSIGNATURE_REPOSITORY, useClass: DoctorSignatureRepositoryImpl },
  ],
})
export class SettingsModule {}
