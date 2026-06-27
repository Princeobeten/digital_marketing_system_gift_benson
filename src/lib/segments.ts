import { Customer } from "@/models/Customer";

export interface SegmentRule {
  field: string;
  operator: string;
  value: string | number;
}

const ARRAY_FIELDS = new Set(["interests", "tags"]);
const NUMBER_FIELDS = new Set(["totalSpend"]);

/**
 * Translate one targeting rule into a MongoDB condition.
 * Combined by buildSegmentQuery with logical AND.
 */
function ruleToCondition(rule: SegmentRule): Record<string, unknown> | null {
  const { field, operator } = rule;
  let { value } = rule;

  if (value === "" || value === null || value === undefined) return null;

  // Array membership fields (interests, tags).
  if (ARRAY_FIELDS.has(field)) {
    switch (operator) {
      case "ne":
        return { [field]: { $ne: value } };
      // eq / contains both mean "the array includes this value".
      default:
        return { [field]: value };
    }
  }

  // Numeric fields.
  if (NUMBER_FIELDS.has(field)) {
    value = Number(value);
    switch (operator) {
      case "eq":
        return { [field]: value };
      case "ne":
        return { [field]: { $ne: value } };
      case "gt":
        return { [field]: { $gt: value } };
      case "gte":
        return { [field]: { $gte: value } };
      case "lt":
        return { [field]: { $lt: value } };
      case "lte":
        return { [field]: { $lte: value } };
      default:
        return { [field]: value };
    }
  }

  // Text fields (location, etc.).
  const str = String(value);
  switch (operator) {
    case "contains":
      return { [field]: { $regex: str, $options: "i" } };
    case "ne":
      return { [field]: { $ne: str } };
    case "eq":
    default:
      // Case-insensitive exact match.
      return { [field]: { $regex: `^${escapeRegex(str)}$`, $options: "i" } };
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Build a Mongo filter from a list of rules (AND-combined). Empty rules = match all. */
export function buildSegmentQuery(
  rules: SegmentRule[]
): Record<string, unknown> {
  const conditions = (rules || [])
    .map(ruleToCondition)
    .filter((c): c is Record<string, unknown> => c !== null);
  if (conditions.length === 0) return {};
  return { $and: conditions };
}

/** Count customers matching a set of rules. */
export async function countSegmentMatches(rules: SegmentRule[]): Promise<number> {
  return Customer.countDocuments(buildSegmentQuery(rules));
}

/** List customers matching a set of rules. */
export async function findSegmentMatches(rules: SegmentRule[]) {
  return Customer.find(buildSegmentQuery(rules)).lean();
}
