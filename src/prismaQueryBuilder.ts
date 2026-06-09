import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaQueryBuilder {

  build<T extends object>(
    query: any,
    scopeWhere: any,
    searchFields: string[] = []
  ) {

    const page = Number(query.page ?? 1);
    const size = Number(query.size ?? 20);

    const skip = (page - 1) * size;
    const take = size;

    // -------------------------
    // SEARCH BUILDER
    // -------------------------
    let searchWhere = {};

    if (query.search && searchFields.length > 0) {

      searchWhere = {
        OR: searchFields.map(field => ({
          [field]: {
            contains: query.search,
            mode: 'insensitive'
          }
        }))
      };
    }

    // -------------------------
    // FINAL WHERE
    // -------------------------
    const where = {
      AND: [
        scopeWhere,
        searchWhere
      ]
    };

    // -------------------------
    // SORTING
    // -------------------------
    let orderBy: any = undefined;

    if (query.sortBy) {

      orderBy = {
        [query.sortBy]: query.sortOrder ?? 'asc'
      };
    }

    return {
      where,
      skip,
      take,
      orderBy,
      page,
      size
    };
  }
}