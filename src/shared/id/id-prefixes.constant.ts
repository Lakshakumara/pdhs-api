// ── Prefix registry — one place to see every meaningful ID format ──────
// Format: PREFIX-YYYY-NNNN  e.g. REQ-2026-0001, WO-2026-0047
export const ID_PREFIXES = {
  REPAIR_REQUEST: 'REQ',
  WORK_ORDER: 'WO',
  EQUIPMENT: 'EQ',
  PURCHASE_ORDER: 'PO',
  ASSIGNMENT: 'ASN',
  INVENTORY_ITEM: 'INV',
  VENDOR_REPAIR: 'VR',
  INSPECTED_SPARE_PART: 'ISP',
  SUPPLIER: 'SUP',
  INSTITUTION: 'INST',
} as const;

export type IdPrefix = (typeof ID_PREFIXES)[keyof typeof ID_PREFIXES];
