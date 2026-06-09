import { Injectable } from "@nestjs/common";

@Injectable()
export class PrismaQueryBuilder_v1 {

  build(
    query: any,
    scopeWhere: any,
    searchFields: string[] = [],
    exactFilters: string[] = []
  ) {

    const page = Number(query.page ?? 1);
    const size = Number(query.size ?? 20);

    const conditions: any[] = [scopeWhere];

    //
    // Search
    //

    if (query.search?.trim()) {

      conditions.push({
        OR: searchFields.map(field => ({
          [field]: {
            contains: query.search.trim(),
            mode: 'insensitive'
          }
        }))
      });
    }

    //
    // Exact Filters
    //

    exactFilters.forEach(field => {

      const value = query[field];

      if (
        value !== undefined &&
        value !== null &&
        value !== ''
      ) {

        conditions.push({
          [field]: value
        });
      }
    });

    const where = {
      AND: conditions
    };

    return {
      where,
      skip: (page - 1) * size,
      take: size,
      page,
      size
    };
  }
}
/* how to use*/

/*
const {
  where,
  skip,
  take,
  page,
  size
} = this.queryBuilder.build(

  query,

  scopeWhere,

  [
    'name',
    'serialNumber',
    'modelNumber'
  ],

  [
    'category',
    'status',
    'assignedInstitutionId'
  ]
);
*/