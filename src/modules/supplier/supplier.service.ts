import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtRoleClaim } from 'src/auth/jwt-payload.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { IdService, ID_PREFIXES } from 'src/shared/id/id.service';
import {
  CreateSupplierDto,
  QuerySupplierDto,
  UpdateSupplierDto,
} from './dto/supplier.dto';

@Injectable()
export class SupplierService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idService: IdService,
  ) {}

  async findSupplier(activeRole: JwtRoleClaim, query: QuerySupplierDto) {
    const {
      rating,
      search,
      page = 1,
      size = 10,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;
    const where: any = {
      isDeleted: false,
    };

    if (rating) {
      where.rating = Number(rating);
    }

    if (search && search.trim()) {
      const s = search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { contactPerson: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s, mode: 'insensitive' } },
        { contactEmail: { contains: s, mode: 'insensitive' } },
        { contactPhone: { contains: s, mode: 'insensitive' } },
        { whatsApp: { contains: s, mode: 'insensitive' } },
        { remarks: { contains: s, mode: 'insensitive' } },
        { performanceNotes: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip: (page - 1) * size,
        take: Number(size),
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return {
      items,
      page: Number(page),
      size: Number(size),
      total,
      totalPages: Math.ceil(total / size),
    };
  }

  async getSupplierById(id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, isDeleted: false },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID "${id}" not found`);
    }

    return supplier;
  }

  async createSupplier(dto: CreateSupplierDto) {
    const id = await this.idService.generate(ID_PREFIXES.SUPPLIER);

    return this.prisma.supplier.create({
      data: {
        id,
        name: dto.name,
        contactPerson: dto.contactPerson || null,
        phone: dto.phone || null,
        email: dto.email || null,
        contactPhone: dto.contactPhone || null,
        contactEmail: dto.contactEmail || null,
        whatsApp: dto.whatsApp || null,
        performanceNotes: dto.performanceNotes || null,
        rating: dto.rating ? Number(dto.rating) : null,
        remarks: dto.remarks || null,
        supplyItem: dto.supplyItem || [],
        isDeleted: false,
      },
    });
  }

  async updateSupplier(id: string, dto: UpdateSupplierDto) {
    const existing = await this.prisma.supplier.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException(`Supplier with ID "${id}" not found`);
    }

    return this.prisma.supplier.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name : existing.name,
        contactPerson:
          dto.contactPerson !== undefined
            ? dto.contactPerson
            : existing.contactPerson,
        phone: dto.phone !== undefined ? dto.phone : existing.phone,
        email: dto.email !== undefined ? dto.email : existing.email,
        contactPhone:
          dto.contactPhone !== undefined
            ? dto.contactPhone
            : existing.contactPhone,
        contactEmail:
          dto.contactEmail !== undefined
            ? dto.contactEmail
            : existing.contactEmail,
        whatsApp: dto.whatsApp !== undefined ? dto.whatsApp : existing.whatsApp,
        performanceNotes:
          dto.performanceNotes !== undefined
            ? dto.performanceNotes
            : existing.performanceNotes,
        rating:
          dto.rating !== undefined
            ? dto.rating
              ? Number(dto.rating)
              : null
            : existing.rating,
        remarks: dto.remarks !== undefined ? dto.remarks : existing.remarks,
        supplyItem:
          dto.supplyItem !== undefined
            ? (dto.supplyItem as any)
            : (existing.supplyItem as any),
      },
    });
  }

  async deleteSupplier(id: string) {
    const existing = await this.prisma.supplier.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException(`Supplier with ID "${id}" not found`);
    }

    return this.prisma.supplier.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
