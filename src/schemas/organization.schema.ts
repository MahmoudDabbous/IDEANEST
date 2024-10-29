import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum AccessLevel {
    ADMIN = 'admin',
    MEMBER = 'member',
}

@Schema({ timestamps: true })
export class OrganizationMember {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    email: string;

    @Prop({
        required: true,
        enum: AccessLevel,
        default: AccessLevel.MEMBER
    })
    access_level: AccessLevel;
}

@Schema({ timestamps: true })
export class Organization {
    @Prop({ required: true })
    name: string;

    @Prop()
    description: string;

    @Prop({ type: [OrganizationMember] })
    organization_members: OrganizationMember[];

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    created_by: Types.ObjectId;
}

export type OrganizationDocument = Organization & Document<string, any, Organization>;
export const OrganizationSchema = SchemaFactory.createForClass(Organization);
