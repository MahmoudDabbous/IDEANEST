import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Organization, OrganizationSchema } from '../schemas/organization.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { OrganizationsController } from 'src/organizations/organizations.controller';
import { OrganizationsService } from 'src/organizations/organizations.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Organization.name, schema: OrganizationSchema },
            { name: User.name, schema: UserSchema },
        ]),
    ],
    controllers: [OrganizationsController],
    providers: [OrganizationsService],
})
export class OrganizationsModule { }