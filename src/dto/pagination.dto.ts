import { IsOptional, IsPositive, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
    @IsOptional()
    @IsInt()
    @IsPositive()
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @IsInt()
    @IsPositive()
    @Type(() => Number)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    search?: string;
}