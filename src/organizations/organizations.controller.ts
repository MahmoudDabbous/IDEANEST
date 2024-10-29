import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Query,
    HttpStatus,
    HttpCode,
    Optional,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
    ApiParam,
} from '@nestjs/swagger';
import { User } from 'src/decorators/user.decorator';
import { CreateOrganizationDto, InviteUserDto, UpdateOrganizationDto } from 'src/dto/organizations.dto';
import { PaginationQueryDto } from 'src/dto/pagination.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { AccessLevel } from 'src/schemas/organization.schema';
import { OrganizationsService } from 'src/organizations/organizations.service';

@ApiTags('Organizations')
@Controller('organization')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationsController {
    constructor(private readonly organizationsService: OrganizationsService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new organization' })
    @ApiResponse({
        status: 201,
        description: 'Organization created successfully'
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid input data'
    })
    async create(
        @User('id') userId: string,
        @Body() createOrgDto: CreateOrganizationDto,
    ) {
        return this.organizationsService.create(userId, createOrgDto);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get all organizations for current user' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiResponse({
        status: 200,
        description: 'Organizations retrieved successfully'
    })
    async findAll(
        @User('id') userId: string,
        @Query() paginationQuery: PaginationQueryDto,
    ) {
        return this.organizationsService.findAll(userId, paginationQuery);
    }

    @Get(':organization_id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get organization by ID' })
    @ApiParam({ name: 'organization_id', type: String })
    @ApiResponse({
        status: 200,
        description: 'Organization retrieved successfully'
    })
    @ApiResponse({
        status: 404,
        description: 'Organization not found'
    })
    async findOne(
        @User('id') userId: string,
        @Param('organization_id') orgId: string,
    ) {
        return this.organizationsService.findOne(orgId, userId);
    }

    @Put(':organization_id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update organization' })
    @ApiParam({ name: 'organization_id', type: String })
    @ApiResponse({
        status: 200,
        description: 'Organization updated successfully'
    })
    @ApiResponse({
        status: 404,
        description: 'Organization not found'
    })
    async update(
        @User('id') userId: string,
        @Param('organization_id') orgId: string,
        @Body() updateOrgDto: UpdateOrganizationDto,
    ) {
        return this.organizationsService.update(orgId, userId, updateOrgDto);
    }

    @Delete(':organization_id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete organization' })
    @ApiParam({ name: 'organization_id', type: String })
    @ApiResponse({
        status: 200,
        description: 'Organization deleted successfully'
    })
    @ApiResponse({
        status: 404,
        description: 'Organization not found'
    })
    async remove(
        @User('id') userId: string,
        @Param('organization_id') orgId: string,
    ) {
        return this.organizationsService.remove(orgId, userId);
    }

    @Post(':organization_id/invite')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Invite user to organization' })
    @ApiParam({ name: 'organization_id', type: String })
    @ApiResponse({
        status: 200,
        description: 'Invitation sent successfully'
    })
    @ApiResponse({
        status: 404,
        description: 'Organization or user not found'
    })
    @ApiResponse({
        status: 400,
        description: 'User already a member'
    })
    async inviteUser(
        @User('id') userId: string,
        @Param('organization_id') orgId: string,
        @Body() inviteDto: InviteUserDto,
    ) {
        return this.organizationsService.inviteUser(orgId, userId, inviteDto);
    }

    @Get(':organization_id/members')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get organization members' })
    @ApiParam({ name: 'organization_id', type: String })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({
        status: 200,
        description: 'Members retrieved successfully'
    })
    @ApiResponse({
        status: 404,
        description: 'Organization not found'
    })
    async getMembers(
        @User('id') userId: string,
        @Param('organization_id') orgId: string,
        @Query() paginationQuery: PaginationQueryDto,
    ) {
        return this.organizationsService.getMembers(orgId, userId, paginationQuery);
    }

    @Delete(':organization_id/members/:member_id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Remove member from organization' })
    @ApiParam({ name: 'organization_id', type: String })
    @ApiParam({ name: 'member_id', type: String })
    @ApiResponse({
        status: 200,
        description: 'Member removed successfully'
    })
    @ApiResponse({
        status: 404,
        description: 'Organization or member not found'
    })
    async removeMember(
        @User('id') userId: string,
        @Param('organization_id') orgId: string,
        @Param('member_id') memberId: string,
    ) {
        return this.organizationsService.removeMember(orgId, userId, memberId);
    }

    @Put(':organization_id/members/:member_id/role')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update member role' })
    @ApiParam({ name: 'organization_id', type: String })
    @ApiParam({ name: 'member_id', type: String })
    @ApiResponse({
        status: 200,
        description: 'Member role updated successfully'
    })
    @ApiResponse({
        status: 404,
        description: 'Organization or member not found'
    })
    async updateMemberRole(
        @User('id') userId: string,
        @Param('organization_id') orgId: string,
        @Param('member_id') memberId: string,
        @Body('role') role: AccessLevel,
    ) {
        return this.organizationsService.updateMemberRole(orgId, userId, memberId, role);
    }
}
