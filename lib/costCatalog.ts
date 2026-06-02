import { COST_CATALOG_DATA } from "./costCatalogData";

export type CostEntry = {
  standardName: string;
  optionName: string;
  unitCost: number;
  aliases: string[];
  needsReview: boolean;
};

export type CostMatch = {
  entry: CostEntry;
  confidence: number;
  reason: "exact" | "alias" | "similar";
};

type MatchInput = {
  productName?: string;
  optionName?: string;
};

const NOISE_WORDS = new Set([
  "무료배송",
  "오늘출발",
  "당일발송",
  "예약배송",
  "국내제작",
  "세탁가능",
  "미끄럼방지",
  "대형",
  "소형",
  "특대형",
  "거실",
  "침실",
  "주방",
  "현관",
  "인테리어",
  "러그",
  "카페트",
  "카펫",
  "매트"
]);

const SIZE_PATTERN = /(\d{2,3})\s*[*xX×]\s*(\d{2,3})/;
const ROUND_SIZE_PATTERN =
  /(?:(\d{2,3})\s*(?:cm)?\s*원형|원형\s*(\d{2,3})\s*(?:cm)?|(\d{2,3})\s*파이)/;

export const COST_ENTRIES: CostEntry[] = COST_CATALOG_DATA
  .flatMap((group) =>
    group.sizes.map(([optionName, unitCost]) => ({
      standardName: group.name,
      optionName,
      unitCost,
      aliases: group.aliases ?? [],
      needsReview: group.needsReview ?? false
    }))
  );

export function normalizeSize(value: string | undefined) {
  const match = value?.match(SIZE_PATTERN);
  if (match) {
    return `${match[1]}*${match[2]}`;
  }

  const roundMatch = value?.match(ROUND_SIZE_PATTERN);
  if (roundMatch) {
    return `${roundMatch[1] ?? roundMatch[2] ?? roundMatch[3]} 원형`;
  }

  return "";
}

function compactText(value: string) {
  return value
    .toLowerCase()
    .replace(/[×x]/g, "*")
    .replace(/\[[^\]]*]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^가-힣a-z0-9*]+/g, "")
    .trim();
}

function tokenize(value: string) {
  const tokens = value
    .toLowerCase()
    .replace(/[×x]/g, "*")
    .replace(SIZE_PATTERN, " ")
    .replace(/\[[^\]]*]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .match(/[가-힣a-z0-9]+/g);

  return (tokens ?? []).filter(
    (token) => token.length > 1 && !NOISE_WORDS.has(token)
  );
}

function hasSameSize(entryOptionName: string, inputText: string) {
  const entrySize = normalizeSize(entryOptionName);
  if (!entrySize) {
    return compactText(inputText).includes(compactText(entryOptionName));
  }

  return normalizeSize(inputText) === entrySize;
}

function getNameScore(inputText: string, candidateText: string) {
  const inputCompact = compactText(inputText);
  const candidateCompact = compactText(candidateText);

  if (!inputCompact || !candidateCompact) {
    return 0;
  }

  if (inputCompact === candidateCompact) {
    return 1;
  }

  if (inputCompact.includes(candidateCompact)) {
    return 0.95;
  }

  if (candidateCompact.includes(inputCompact)) {
    return 0.9;
  }

  const inputTokens = tokenize(inputText);
  const candidateTokens = tokenize(candidateText);
  if (candidateTokens.length === 0 || inputTokens.length === 0) {
    return 0;
  }

  const overlap = candidateTokens.filter((candidateToken) =>
    inputTokens.some(
      (inputToken) =>
        inputToken === candidateToken ||
        inputToken.includes(candidateToken) ||
        candidateToken.includes(inputToken)
    )
  );

  return overlap.length / candidateTokens.length;
}

function scoreEntry(input: MatchInput, entry: CostEntry) {
  const productName = input.productName ?? "";
  const optionName = input.optionName ?? "";
  const inputText = `${productName} ${optionName}`.trim();

  if (!hasSameSize(entry.optionName, `${optionName} ${productName}`)) {
    return null;
  }

  const candidates = [entry.standardName, ...entry.aliases];
  let bestScore = 0;
  let bestReason: CostMatch["reason"] = "similar";

  candidates.forEach((candidate, index) => {
    const score = getNameScore(productName, candidate);
    if (score > bestScore) {
      bestScore = score;
      bestReason =
        score >= 1 ? "exact" : index > 0 && score >= 0.9 ? "alias" : "similar";
    }
  });

  if (bestScore === 0) {
    return null;
  }

  const sizeBonus = normalizeSize(inputText) ? 0.18 : 0;
  return {
    entry,
    confidence: Math.min(1, bestScore * 0.82 + sizeBonus),
    reason: bestReason
  };
}

export function matchCostEntry(input: MatchInput): CostMatch | null {
  const matches = COST_ENTRIES
    .map((entry) => scoreEntry(input, entry))
    .filter((match): match is CostMatch => Boolean(match))
    .sort((a, b) => b.confidence - a.confidence);

  const bestMatch = matches[0];
  if (!bestMatch || bestMatch.confidence < 0.52) {
    return null;
  }

  return bestMatch;
}
