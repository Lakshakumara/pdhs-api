import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaQueryBuilder } from '../../prisma/prisma-query-builder';
import { JwtRoleClaim } from 'src/auth/jwt-payload.interface';
import { QueryInstituteDto } from './dto/institute.dto';
import { ScopeService } from 'src/auth/scope.service';

@Injectable()
export class InstituteService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly scopeService: ScopeService,
        private readonly queryBuilder: PrismaQueryBuilder,
    ) { }

    async findInstitutions(activeRole: JwtRoleClaim, query: QueryInstituteDto) {
        const scopeWhere = this.scopeService.instituteWhere(activeRole);

        const { where, skip, take, page, size } = this.queryBuilder.build(
            query,
            scopeWhere,
            ['name', 'type'],
            ['type',],
        );

        const [items, total] = await Promise.all([
            this.prisma.institution.findMany({
                where,
                skip,
                take,
                include: { district: true },
                orderBy: { name: 'asc' }
            }),
            this.prisma.institution.count({ where })
        ]);

        return { items, total };
    }

}