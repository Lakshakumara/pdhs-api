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
    if (query.search != undefined && query.search?.trim()) {

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
          OR: exactFilters.map(field =>
            this.buildContainsCondition(
              field,
              value
            )
          )
        });
      }
    });
    // -------------------------
    // SORTING
    // -------------------------
    let orderBy: any = undefined;

    if (query.sortBy) {

      orderBy = {
        [query.sortBy]: query.sortOrder ?? 'asc'
      };
    }
    const where = {
      AND: conditions
    }
    return {
      where,
      skip: (page - 1) * size,
      take: size,
      orderBy,
      page,
      size
    };
  }


  private buildContainsCondition(
    field: string,
    value: string
  ): any {

    const parts = field.split('.');

    if (parts.length === 1) {
      return {
        [field]: {
          contains: value,
          mode: 'insensitive'
        }
      };
    }

    return parts
      .reverse()
      .reduce(
        (acc, key, index) =>
          index === 0
            ? {
              [key]: {
                contains: value,
                mode: 'insensitive'
              }
            }
            : {
              [key]: acc
            },
        {}
      );
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