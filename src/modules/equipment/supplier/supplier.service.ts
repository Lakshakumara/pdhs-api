import { Injectable } from '@nestjs/common';
import { ScopeService } from 'src/auth/scope.service';
import { JwtRoleClaim } from 'src/auth/jwt-payload.interface';
import { QuerySupplierDto } from './dto/supplier.dto';
import { PrismaQueryBuilder } from 'src/prisma/prisma-query-builder';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SupplierService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly scopeService: ScopeService,
        private readonly queryBuilder: PrismaQueryBuilder,
    ) { }

    async findSupplier(activeRole: JwtRoleClaim, query: QuerySupplierDto) {
        const where: any = {};
        const {rating, search, page, size} = query;

        if (rating) where.rating = +rating;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { contactPerson: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }
        const [items, total] = await Promise.all([
            this.prisma.supplier.findMany({
                where,
                skip: (page - 1) * size,
                take: size,
                orderBy: { name: 'asc' }
            }),
            this.prisma.supplier.count({ where })
        ]);

        return { items, total };
    }

}