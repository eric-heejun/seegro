type CostGroup = {
  name: string;
  aliases?: string[];
  sizes: [string, number][];
  needsReview?: boolean;
};

const COST_CATALOG_DATA: CostGroup[] = [
  {
    "name": "레이지데이 방수 러그 사각형",
    "aliases": [
      "레이지데이 방수 러그 사각",
      "레이지데이 사각 러그",
      "레이지데이 러그 사각형"
    ],
    "sizes": [
      [
        "100*150",
        17400
      ],
      [
        "150*200",
        31400
      ],
      [
        "170*230",
        41400
      ],
      [
        "200*260",
        50400
      ],
      [
        "200*300",
        61900
      ],
      [
        "200*350",
        71400
      ],
      [
        "200*400",
        79400
      ]
    ],
    "needsReview": false
  },
  {
    "name": "레이지데이 방수 러그 타원형",
    "aliases": [
      "레이지데이 방수 러그 타원",
      "레이지데이 타원 러그",
      "레이지데이 러그 타원형"
    ],
    "sizes": [
      [
        "100*150",
        17400
      ],
      [
        "150*200",
        31400
      ],
      [
        "170*230",
        41400
      ],
      [
        "200*260",
        50400
      ],
      [
        "200*300",
        61900
      ],
      [
        "200*350",
        71400
      ],
      [
        "200*400",
        79400
      ]
    ],
    "needsReview": false
  },
  {
    "name": "모던타임즈 스트라이프 러그",
    "aliases": [
      "모던타임즈 스트라이프 러그",
      "모던타임즈 러그",
      "모던라인즈 스트라이프 러그",
      "모던라인 스트라이프 러그",
      "모던라인즈 러그",
      "스트라이프 러그"
    ],
    "sizes": [
      [
        "100*150",
        21900
      ],
      [
        "150*200",
        31900
      ],
      [
        "170*230",
        41900
      ],
      [
        "200*260",
        46400
      ],
      [
        "200*300",
        52400
      ]
    ],
    "needsReview": false
  },
  {
    "name": "코니 라운드 러그",
    "aliases": [
      "코니 러그",
      "코니 라운드"
    ],
    "sizes": [
      [
        "100*150",
        15400
      ],
      [
        "150*200",
        25400
      ],
      [
        "170*230",
        32400
      ],
      [
        "200*260",
        34400
      ]
    ],
    "needsReview": false
  },
  {
    "name": "써니블록",
    "aliases": [
      "써니블록",
      "레드베리",
      "두들 스카이",
      "하트플라워",
      "페블",
      "정글 드로잉",
      "레트로 가든",
      "블로썸 체크",
      "프렌치 코스트",
      "미드나잇 플라워",
      "누보 페르시안",
      "모노 메트로",
      "웨이비리듬",
      "노벰버",
      "써니블록 러그",
      "써니블록 터프티드 러그"
    ],
    "sizes": [
      [
        "100*150",
        24900
      ],
      [
        "150*200",
        39400
      ],
      [
        "170*230",
        52400
      ]
    ],
    "needsReview": true
  },
  {
    "name": "레드베리",
    "sizes": [
      [
        "100*150",
        24900
      ],
      [
        "150*200",
        39400
      ],
      [
        "170*230",
        52400
      ]
    ],
    "needsReview": false
  },
  {
    "name": "두들 스카이",
    "sizes": [
      [
        "100*150",
        24900
      ],
      [
        "150*200",
        39400
      ],
      [
        "170*230",
        52400
      ]
    ],
    "needsReview": false
  },
  {
    "name": "하트플라워",
    "sizes": [
      [
        "100*150",
        24900
      ],
      [
        "150*200",
        39400
      ],
      [
        "170*230",
        52400
      ]
    ],
    "needsReview": false
  },
  {
    "name": "페블",
    "sizes": [
      [
        "100*150",
        24900
      ],
      [
        "150*200",
        39400
      ],
      [
        "170*230",
        52400
      ]
    ],
    "needsReview": false
  },
  {
    "name": "정글 드로잉",
    "sizes": [
      [
        "100*150",
        24900
      ],
      [
        "150*200",
        39400
      ],
      [
        "170*230",
        52400
      ]
    ],
    "needsReview": false
  },
  {
    "name": "레트로 가든",
    "sizes": [
      [
        "100*150",
        24900
      ],
      [
        "150*200",
        39400
      ],
      [
        "170*230",
        52400
      ]
    ],
    "needsReview": false
  },
  {
    "name": "블로썸 체크",
    "sizes": [
      [
        "100*150",
        24900
      ],
      [
        "150*200",
        39400
      ],
      [
        "170*230",
        52400
      ]
    ],
    "needsReview": false
  },
  {
    "name": "프렌치 코스트",
    "sizes": [
      [
        "100*150",
        24900
      ],
      [
        "150*200",
        39400
      ],
      [
        "170*230",
        52400
      ]
    ],
    "needsReview": false
  },
  {
    "name": "미드나잇 플라워",
    "sizes": [
      [
        "100*150",
        24900
      ],
      [
        "150*200",
        39400
      ],
      [
        "170*230",
        52400
      ]
    ],
    "needsReview": false
  },
  {
    "name": "누보 페르시안",
    "sizes": [
      [
        "100*150",
        24900
      ],
      [
        "150*200",
        39400
      ],
      [
        "170*230",
        52400
      ]
    ],
    "needsReview": false
  },
  {
    "name": "모노 메트로",
    "sizes": [
      [
        "100*150",
        24900
      ],
      [
        "150*200",
        39400
      ],
      [
        "170*230",
        52400
      ]
    ],
    "needsReview": false
  },
  {
    "name": "웨이비리듬",
    "sizes": [
      [
        "100*150",
        24900
      ],
      [
        "150*200",
        39400
      ],
      [
        "170*230",
        52400
      ]
    ],
    "needsReview": false
  },
  {
    "name": "노벰버",
    "sizes": [
      [
        "100*150",
        24900
      ],
      [
        "150*200",
        39400
      ],
      [
        "170*230",
        52400
      ]
    ],
    "needsReview": false
  },
  {
    "name": "베른",
    "aliases": [
      "베른",
      "메리그리드",
      "네모 메리골드 러그",
      "네모 러그",
      "메리골드 러그"
    ],
    "sizes": [
      [
        "100*150",
        24900
      ],
      [
        "150*200",
        39400
      ],
      [
        "170*230",
        50900
      ]
    ],
    "needsReview": false
  },
  {
    "name": "메리그리드",
    "sizes": [
      [
        "100*150",
        24900
      ],
      [
        "150*200",
        39400
      ],
      [
        "170*230",
        50900
      ]
    ],
    "needsReview": false
  },
  {
    "name": "팜하우스 극세사 러그",
    "aliases": [
      "팜하우스",
      "팜마우스 극세사 러그",
      "팜마우스 러그"
    ],
    "sizes": [
      [
        "100*150",
        13130
      ],
      [
        "150*200",
        21130
      ],
      [
        "170*230",
        29130
      ],
      [
        "200*250",
        37130
      ],
      [
        "200*300",
        42130
      ]
    ],
    "needsReview": false
  },
  {
    "name": "모니카 극세사 러그",
    "aliases": [
      "모니카 러그"
    ],
    "sizes": [
      [
        "100*150",
        13630
      ],
      [
        "150*200",
        21630
      ],
      [
        "170*230",
        30630
      ],
      [
        "200*250",
        38630
      ],
      [
        "200*300",
        44330
      ]
    ],
    "needsReview": false
  },
  {
    "name": "로파이 자카드 러그",
    "aliases": [
      "로파이 자카드",
      "로파이 러그",
      "로페이 자카드 러그",
      "로페이 자카드",
      "로페이 러그"
    ],
    "sizes": [
      [
        "100*150",
        20900
      ],
      [
        "150*200",
        34900
      ],
      [
        "170*230",
        50900
      ],
      [
        "200*250",
        58900
      ],
      [
        "200*300",
        69400
      ]
    ],
    "needsReview": true
  },
  {
    "name": "허쉬 러그",
    "aliases": [
      "허쉬 엔틱아이보리",
      "허쉬 엔틱블랙",
      "허쉬 크림블랙",
      "허쉬 앤틱아이보리"
    ],
    "sizes": [
      [
        "100*150",
        16900
      ],
      [
        "150*200",
        26900
      ],
      [
        "170*230",
        34400
      ],
      [
        "200*250",
        39400
      ],
      [
        "200*300",
        53400
      ]
    ],
    "needsReview": false
  },
  {
    "name": "룬 울트라 퍼포먼스",
    "aliases": [
      "룬",
      "룬 울트라 퍼포먼스",
      "룬 솔트 터프티드 러그",
      "룬 솔트 러그",
      "룬솔트 터프티드"
    ],
    "sizes": [
      [
        "100*150",
        20000
      ],
      [
        "150*200",
        31000
      ],
      [
        "170*230",
        47500
      ],
      [
        "200*270",
        63000
      ],
      [
        "200*300",
        67000
      ],
      [
        "200*400",
        91000
      ],
      [
        "75*200",
        20000
      ],
      [
        "100 원형",
        14000
      ],
      [
        "150 원형",
        37000
      ],
      [
        "170 원형",
        41000
      ],
      [
        "200 원형",
        53000
      ],
      [
        "45*65",
        7500
      ]
    ],
    "needsReview": true
  },
  {
    "name": "빌라 브리즈 사이잘 러그",
    "aliases": [
      "빌라 브리즈 사이잘러그",
      "빌라브리즈 사이잘 러그",
      "빌라 브리즈 러그",
      "벨라 브리즈 사이잘 러그",
      "벨라 브리즈 사이잘러그",
      "벨라 브리즈 러그"
    ],
    "sizes": [
      [
        "100*150",
        15500
      ],
      [
        "150*200",
        29500
      ],
      [
        "170*230",
        36100
      ],
      [
        "200*270",
        45000
      ],
      [
        "200*300",
        50000
      ],
      [
        "65*130",
        13000
      ],
      [
        "65*180",
        18000
      ],
      [
        "65*230",
        18000
      ]
    ],
    "needsReview": false
  },
  {
    "name": "도트 방수러그",
    "aliases": [
      "도트 방수 러그",
      "도트 러그"
    ],
    "sizes": [
      [
        "100*150",
        20000
      ],
      [
        "150*200",
        35000
      ],
      [
        "170*230",
        51000
      ],
      [
        "200*270",
        63000
      ],
      [
        "200*300",
        66000
      ],
      [
        "75*200",
        20000
      ]
    ],
    "needsReview": false
  },
  {
    "name": "사이잘룩 러그",
    "aliases": [
      "사이잘룩",
      "사이잘 러그"
    ],
    "sizes": [
      [
        "100*150",
        21000
      ],
      [
        "150*200",
        38000
      ],
      [
        "200*250",
        65000
      ],
      [
        "200*300",
        71000
      ],
      [
        "45*65",
        7000
      ],
      [
        "65*300",
        22000
      ]
    ],
    "needsReview": true
  },
  {
    "name": "말/꽃 시어서커 DTP 러그",
    "aliases": [
      "발트 사이잘러 DTP 러그",
      "발트 사이잘러그 DTP",
      "발트 DTP 러그"
    ],
    "sizes": [
      [
        "100*150",
        15000
      ],
      [
        "150*200",
        23000
      ],
      [
        "170*230",
        40000
      ],
      [
        "200*270",
        48000
      ],
      [
        "200*300",
        53000
      ]
    ],
    "needsReview": false
  },
  {
    "name": "버드 가든",
    "aliases": [
      "소르베 그리드",
      "트윙클 다이아",
      "버드 가든",
      "스윔",
      "리틀 큐브"
    ],
    "sizes": [
      [
        "100*150",
        27000
      ],
      [
        "150*200",
        48000
      ],
      [
        "150*200",
        48000
      ],
      [
        "170*230",
        71000
      ],
      [
        "200*300",
        97000
      ]
    ],
    "needsReview": true
  },
  {
    "name": "소르베 그리드",
    "aliases": [
      "트윙클 다이아",
      "버드 가든",
      "스윔",
      "리틀 큐브",
      "소프트그리드 러그",
      "소프트 그리드",
      "트윌드 다이아",
      "버튼 가든",
      "스윙 리듬 쿠션"
    ],
    "sizes": [
      [
        "100*150",
        27000
      ],
      [
        "150*200",
        48000
      ],
      [
        "170*230",
        71000
      ],
      [
        "200*300",
        97000
      ]
    ],
    "needsReview": false
  },
  {
    "name": "트윙클 다이아",
    "sizes": [
      [
        "100*150",
        27000
      ],
      [
        "150*200",
        48000
      ],
      [
        "170*230",
        71000
      ],
      [
        "200*300",
        97000
      ]
    ],
    "needsReview": false
  },
  {
    "name": "스윔",
    "sizes": [
      [
        "100*150",
        27000
      ],
      [
        "150*200",
        48000
      ],
      [
        "170*230",
        71000
      ],
      [
        "200*300",
        97000
      ]
    ],
    "needsReview": false
  },
  {
    "name": "리틀큐브",
    "sizes": [
      [
        "100*150",
        27000
      ],
      [
        "150*200",
        48000
      ],
      [
        "170*230",
        71000
      ],
      [
        "200*300",
        97000
      ]
    ],
    "needsReview": false
  },
  {
    "name": "멜로우데이 러그",
    "aliases": [
      "멜로우데이"
    ],
    "sizes": [
      [
        "100*150",
        20000
      ],
      [
        "150*200",
        37000
      ],
      [
        "170*230",
        53000
      ],
      [
        "200*270",
        63000
      ],
      [
        "200*300",
        68000
      ],
      [
        "100 원형",
        15000
      ],
      [
        "150 원형",
        35000
      ],
      [
        "170 원형",
        41000
      ],
      [
        "200 원형",
        53000
      ],
      [
        "75*200",
        20000
      ]
    ],
    "needsReview": true
  },
  {
    "name": "솔리드 면모 러그",
    "aliases": [
      "솔리드 면모",
      "솔리드 면모러그"
    ],
    "sizes": [
      [
        "50*150",
        9000
      ],
      [
        "100*150",
        15000
      ],
      [
        "150*200",
        27000
      ],
      [
        "200*250",
        43000
      ],
      [
        "200*300",
        48000
      ]
    ],
    "needsReview": false
  },
  {
    "name": "타일카페트",
    "aliases": [
      "타일카페트 오리지널",
      "타일 카페트 오리지널",
      "타일카페트 오리지날",
      "타일 카페트 오리지날",
      "타일 카페트",
      "카페트타일",
      "카페트 타일",
      "데코타일 카페트"
    ],
    "sizes": [
      [
        "50*50 낱장",
        1900
      ],
      [
        "50*50 18장 세트",
        34200
      ],
      [
        "60*60 낱장",
        3000
      ],
      [
        "60*60 12장 세트",
        36000
      ]
    ],
    "needsReview": false
  },
  {
    "name": "타일카페트 접착스티커",
    "aliases": [
      "접착스티커",
      "접착 스티커",
      "타일카페트 스티커",
      "타일 카페트 스티커",
      "스티커 10개"
    ],
    "sizes": [
      [
        "접착스티커",
        1000
      ]
    ],
    "needsReview": false
  }
];

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

export const COST_ENTRIES: CostEntry[] = [];

for (const group of COST_CATALOG_DATA) {
  for (const [optionName, unitCost] of group.sizes) {
    COST_ENTRIES.push({
      standardName: group.name,
      optionName,
      unitCost,
      aliases: group.aliases ?? [],
      needsReview: group.needsReview ?? false
    });
  }
}

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

type SaleUnit = "piece" | "set" | "";

function getTileCarpetSaleUnit(value: string): SaleUnit {
  const normalized = value.toLowerCase().replace(/\s+/g, "");

  if (
    /세트|set|박스|box|18장|18개|18매|18p|18pcs|12장|12개|12매|12p|12pcs/.test(
      normalized
    )
  ) {
    return "set";
  }

  if (/낱장|낱개|한장|1장|1개|1매|장당|개별|단품|piece|each/.test(normalized)) {
    return "piece";
  }

  return "";
}

function isTileCarpetEntry(entry: CostEntry) {
  const entryText = compactText(
    `${entry.standardName} ${entry.aliases.join(" ")}`
  );

  return (
    entryText.includes("타일카페트") ||
    entryText.includes("타일카펫") ||
    entryText.includes("카페트타일") ||
    entryText.includes("카펫타일")
  );
}

function hasCompatibleTileCarpetSaleUnit(entry: CostEntry, inputText: string) {
  if (!isTileCarpetEntry(entry)) {
    return true;
  }

  if (compactText(entry.standardName).includes("접착스티커")) {
    return true;
  }

  const entrySaleUnit = getTileCarpetSaleUnit(entry.optionName);
  if (!entrySaleUnit) {
    return true;
  }

  const inputSaleUnit = getTileCarpetSaleUnit(inputText);
  if (inputSaleUnit) {
    return inputSaleUnit === entrySaleUnit;
  }

  return entrySaleUnit === "piece";
}

function hasCompatibleSize(entry: CostEntry, inputText: string) {
  if (hasSameSize(entry.optionName, inputText)) {
    return true;
  }

  if (!isTileCarpetEntry(entry) || normalizeSize(inputText)) {
    return false;
  }

  const inputCompact = compactText(inputText);
  const isOriginalTileCarpet =
    inputCompact.includes("타일카페트오리지널") ||
    inputCompact.includes("타일카페트오리지날");

  return (
    isOriginalTileCarpet &&
    normalizeSize(entry.optionName) === "50*50" &&
    getTileCarpetSaleUnit(entry.optionName) === "piece"
  );
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

  const score = candidateTokens.reduce((total, candidateToken) => {
    const tokenScore = inputTokens.reduce((best, inputToken) => {
      if (inputToken === candidateToken) {
        return 1;
      }

      if (inputToken.includes(candidateToken)) {
        return Math.max(best, 0.9);
      }

      if (candidateToken.includes(inputToken)) {
        return Math.max(best, 0.45);
      }

      return best;
    }, 0);

    return total + tokenScore;
  }, 0);

  return score / candidateTokens.length;
}

function scoreEntry(input: MatchInput, entry: CostEntry): CostMatch | null {
  const productName = input.productName ?? "";
  const optionName = input.optionName ?? "";
  const inputText = `${productName} ${optionName}`.trim();

  if (!hasCompatibleSize(entry, `${optionName} ${productName}`)) {
    return null;
  }

  if (!hasCompatibleTileCarpetSaleUnit(entry, inputText)) {
    return null;
  }

  const candidates = [entry.standardName, ...entry.aliases];
  let bestScore = 0;
  let bestReason: CostMatch["reason"] = "similar";

  candidates.forEach((candidate, index) => {
    const rawScore = getNameScore(productName, candidate);
    const score =
      index === 0 && rawScore > 0 && rawScore < 1
        ? Math.min(1, rawScore + 0.02)
        : rawScore;
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
