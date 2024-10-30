import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { AccessLevel } from 'src/schemas/organization.schema';

export class CreateOrganizationDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    name: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    description?: string;
}

export class UpdateOrganizationDto {
    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    name?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    description?: string;
}

export class InviteUserDto {
    @IsEmail()
    @IsNotEmpty()
    @ApiProperty()
    user_email: string;
}


export class RemoveMemberDto {
    @IsEmail()
    @IsNotEmpty()
    @ApiProperty()
    member_email: string;
}

export class UpdateMemberRole {
    @IsEmail()
    @IsNotEmpty()
    @ApiProperty()
    member_email: string;


    @IsEnum(AccessLevel)
    @IsNotEmpty()
    @ApiProperty({ enum: AccessLevel })
    role: AccessLevel;
}
