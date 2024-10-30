import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateOrganizationDto, InviteUserDto, UpdateOrganizationDto } from 'src/dto/organizations.dto';
import { PaginationQueryDto } from 'src/dto/pagination.dto';
import { AccessLevel, Organization, OrganizationDocument } from 'src/schemas/organization.schema';
import { User, UserDocument } from 'src/schemas/user.schema';

@Injectable()
export class OrganizationsService {
    constructor(
        @InjectModel(Organization.name) private organizationModel: Model<OrganizationDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    async create(userId: string, createOrgDto: CreateOrganizationDto) {
        const organization = new this.organizationModel({
            ...createOrgDto,
            created_by: userId,
            organization_members: [{
                name: (await this.userModel.findById(userId)).name,
                email: (await this.userModel.findById(userId)).email,
                access_level: AccessLevel.ADMIN,
            }],
        });

        const savedOrg = await organization.save();
        await this.userModel.findByIdAndUpdate(
            userId,
            { $push: { organizations: savedOrg._id } },
        );

        return { organization_id: savedOrg._id };
    }

    async findOne(orgId: string, userId: string) {
        const organization = await this.organizationModel.findOne({
            _id: orgId,
            'organization_members.email': (await this.userModel.findById(userId)).email,
        });

        if (!organization) {
            throw new NotFoundException('Organization not found');
        }

        return organization;
    }

    async findAll(userId: string, paginationQuery: PaginationQueryDto) {
        const { page, limit, search } = paginationQuery;
        const skip = (page - 1) * limit;

        const query = {
            'organization_members.email': (await this.userModel.findById(userId)).email,
        };

        if (search) {
            query['name'] = { $regex: search, $options: 'i' };
        }


        const organizations = await this.organizationModel.find(query)
            .skip(skip)
            .limit(limit)
            .exec();

        const total = await this.organizationModel.countDocuments(query).exec();

        return {
            organizations,
            page,
            limit,
            total,
        };
    }

    async update(orgId: string, userId: string, updateOrgDto: UpdateOrganizationDto) {
        const organization = await this.organizationModel.findOne({
            _id: orgId,
            'organization_members': {
                $elemMatch: {
                    email: (await this.userModel.findById(userId)).email,
                    access_level: AccessLevel.ADMIN,
                },
            },
        });

        if (!organization) {
            throw new UnauthorizedException('Not authorized to update this organization');
        }

        return this.organizationModel.findByIdAndUpdate(
            orgId,
            updateOrgDto,
            { new: true },
        );
    }

    async remove(orgId: string, userId: string) {
        const organization = await this.organizationModel.findOne({
            _id: orgId,
            'organization_members': {
                $elemMatch: {
                    email: (await this.userModel.findById(userId)).email,
                    access_level: AccessLevel.ADMIN,
                },
            },
        });

        if (!organization) {
            throw new UnauthorizedException('Not authorized to delete this organization');
        }

        await this.organizationModel.findByIdAndDelete(orgId);
        await this.userModel.updateMany(
            { organizations: orgId },
            { $pull: { organizations: orgId } },
        );

        return { message: 'Organization deleted successfully' };
    }

    async inviteUser(orgId: string, inviterUserId: string, inviteUserDto: InviteUserDto) {
        const { user_email } = inviteUserDto;

        const organization = await this.organizationModel.findOne({
            _id: orgId,
            'organization_members': {
                $elemMatch: {
                    email: (await this.userModel.findById(inviterUserId)).email,
                    access_level: AccessLevel.ADMIN,
                },
            },
        });

        if (!organization) {
            throw new UnauthorizedException('Not authorized to invite users');
        }

        const invitedUser = await this.userModel.findOne({ email: user_email });
        if (!invitedUser) {
            throw new NotFoundException('User not found');
        }

        if (organization.organization_members.some(member => member.email === user_email)) {
            throw new BadRequestException('User is already a member');
        }


        await this.organizationModel.findByIdAndUpdate(
            orgId,
            {
                $push: {
                    organization_members: {
                        name: invitedUser.name,
                        email: invitedUser.email,
                        access_level: AccessLevel.MEMBER,
                    },
                },
            },
        );

        await this.userModel.findByIdAndUpdate(
            invitedUser._id,
            { $push: { organizations: orgId } },
        );

        return { message: 'User invited successfully' };
    }

    async getMembers(
        orgId: string,
        userId: string,
        paginationQuery: PaginationQueryDto
    ) {
        const organization = await this.organizationModel.findOne({
            _id: orgId,
            'organization_members.email': (await this.userModel.findById(userId)).email,
        });

        if (!organization) {
            throw new NotFoundException('Organization not found or access denied');
        }

        const { page = 1, limit = 10 } = paginationQuery;
        const skip = (page - 1) * limit;

        const members = organization.organization_members
            .slice(skip, skip + limit);

        const total = organization.organization_members.length;

        return {
            members,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async removeMember(orgId: string, adminUserId: string, memberEmail: string) {
        const adminUser = await this.userModel.findById(adminUserId);
        if (!adminUser) {
            throw new NotFoundException('Admin user not found');
        }

        const organization = await this.organizationModel.findOne({
            _id: orgId,
            'organization_members': {
                $elemMatch: {
                    email: adminUser.email,
                    access_level: AccessLevel.ADMIN,
                },
            },
        });

        if (!organization) {
            throw new UnauthorizedException('Not authorized to remove members from this organization');
        }

        const memberToRemove = organization.organization_members.find(
            (member) => member.email === memberEmail
        );

        if (!memberToRemove) {
            throw new NotFoundException('Member not found');
        }

        const updatedOrg = await this.organizationModel.findByIdAndUpdate(
            orgId,
            {
                $pull: {
                    organization_members: {
                        email: memberToRemove.email,
                    },
                },
            },
            { new: true }
        );

        await this.userModel.findOneAndUpdate(
            { email: memberToRemove.email },
            {
                $pull: {
                    organizations: orgId,
                },
            }
        );

        return {
            message: 'Member removed successfully',
            organization: updatedOrg,
        };
    }

    async updateMemberRole(
        orgId: string,
        adminUserId: string,
        memberEmail: string,
        newRole: AccessLevel
    ) {
        if (!Object.values(AccessLevel).includes(newRole)) {
            throw new BadRequestException('Invalid role specified');
        }

        const adminUser = await this.userModel.findById(adminUserId);
        if (!adminUser) {
            throw new NotFoundException('Admin user not found');
        }

        const organization = await this.organizationModel.findOne({
            _id: orgId,
            'organization_members': {
                $elemMatch: {
                    email: adminUser.email,
                    access_level: AccessLevel.ADMIN,
                },
            },
        });

        if (!organization) {
            throw new UnauthorizedException('Not authorized to remove members from this organization');
        }

        const memberToUpdate = organization.organization_members.find(
            (member) => member.email === memberEmail
        );

        if (!memberToUpdate) {
            throw new NotFoundException('Member not found');
        }
        if (adminUser.email === memberToUpdate.email) {
            throw new BadRequestException('Cannot change your own role');
        }

        if (newRole !== AccessLevel.ADMIN) {
            const admins = organization.organization_members.filter(
                member => member.access_level === AccessLevel.ADMIN
            );
            const memberIsAdmin = organization.organization_members.find(
                member => member.email === memberToUpdate.email && member.access_level === AccessLevel.ADMIN
            );

            if (admins.length === 1 && memberIsAdmin) {
                throw new BadRequestException('Cannot demote the last admin of the organization');
            }
        }

        const updatedOrg = await this.organizationModel.findOneAndUpdate(
            {
                _id: orgId,
                'organization_members.email': memberToUpdate.email,
            },
            {
                $set: {
                    'organization_members.$.access_level': newRole,
                },
            },
            { new: true }
        );

        if (!updatedOrg) {
            throw new NotFoundException('Member not found in organization');
        }

        return {
            message: 'Member role updated successfully',
            member: updatedOrg.organization_members.find(
                member => member.email === memberToUpdate.email
            ),
        };
    }

}