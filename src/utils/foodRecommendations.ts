export type TargetDirection = 'minimal' | 'maksimal';
export type EvaluationStatus = 'kurang' | 'sesuai' | 'lebih';

export interface FoodGroupRecommendationConfig {
  no: number;
  name: string;
  aliases: string[];
  targetDirection: TargetDirection;
  targetDaily: number;
  targetWeekly: number;
  messageKurang: string;
  messageSesuai: string;
  messageLebih: string;
}

export const BASE_FOOD_RECOMMENDATIONS: FoodGroupRecommendationConfig[] = [
  {
    no: 1,
    name: 'Serealia',
    aliases: [
      'serealia',
      'karbohidrat',
      'makanan pokok',
      'cereal',
      'grains',
      'nasi',
      'beras',
      'mie',
      'mi',
      'bihun',
      'kwetiau',
      'roti',
      'jagung',
      'gandum',
      'oat',
      'oatmeal',
      'pasta',
      'spaghetti',
    ],
    targetDirection: 'minimal',
    targetDaily: 1,
    targetWeekly: 7,
    messageKurang:
      'Yuk, tambah porsi makanan pokok, seperti nasi, mi, roti, kentang, atau sereal biar energi kamu buat aktivitas seharian tetap oke!',
    messageSesuai: 'Keren! konsumsi makanan pokok kamu udah pas! Pertahankan ya.',
    messageLebih:
      'Konsumsi makanan pokok kamu udah lebih dari cukup, sekarang seimbangin juga sama sayur dan protein ya!',
  },
  {
    no: 2,
    name: 'Sayur/Umbi Kaya Vitamin A',
    aliases: [
      'sayur kaya vit. a',
      'sayur/umbi kaya vitamin a',
      'sayur kaya vitamin a',
      'vitamin a vegetables',
      'wortel',
      'labu kuning',
      'ubi jalar',
      'ubi oranye',
      'ubi merah',
    ],
    targetDirection: 'minimal',
    targetDaily: 1,
    targetWeekly: 7,
    messageKurang:
      'Coba tambahin sayur/umbi kaya vitamin A, seperti wortel, labu, ubi jalar oranye minimal sekali sehari, bagus buat mata dan daya tahan tubuh kamu!',
    messageSesuai: 'Mantap! Konsumsi sayur/umbi kaya vitamin A kamu udah sesuai anjuran!',
    messageLebih: 'Konsumsi sayur/umbi kaya vitamin A kamu udah bagus banget, pertahankan terus ya!',
  },
  {
    no: 3,
    name: 'Umbi & Akar Putih',
    aliases: [
      'umbi & akar putih',
      'umbi dan akar putih',
      'white roots',
      'singkong',
      'talas',
      'kentang',
      'ubi kayu',
      'ubi putih',
    ],
    targetDirection: 'minimal',
    targetDaily: 1,
    targetWeekly: 7,
    messageKurang:
      'Sesekali coba variasikan makanan pokok kamu dengan umbi/akar putih, seperti singkong atau kentang!',
    messageSesuai: 'Nice! Variasi makanan pokok kamu dengan umbi & akar putih udah sesuai anjuran.',
    messageLebih: 'Konsumsi umbi & akar putih kamu udah baik, terus jaga variasinya ya!',
  },
  {
    no: 4,
    name: 'Sayuran Hijau Berdaun Gelap',
    aliases: [
      'sayur hijau gelap',
      'sayuran hijau berdaun gelap',
      'dark green vegetables',
      'bayam',
      'kangkung',
      'daun singkong',
      'sawi',
      'sawi hijau',
      'pakcoy',
      'selada',
    ],
    targetDirection: 'minimal',
    targetDaily: 1,
    targetWeekly: 7,
    messageKurang:
      'Tambahin sayuran hijau berdaun gelap, seperti bayam, kangkung minimal sekali sehari, bagus buat zat besi kamu!',
    messageSesuai: 'Keren! Konsumsi sayuran hijau berdaun gelap kamu udah sesuai anjuran.',
    messageLebih: 'Sayuran hijau berdaun gelap kamu udah oke, pertahankan keragamannya ya!',
  },
  {
    no: 5,
    name: 'Sayuran Lainnya',
    aliases: [
      'sayuran lainnya',
      'other vegetables',
      'tomat',
      'timun',
      'mentimun',
      'terong',
      'brokoli',
      'buncis',
      'kol',
      'kubis',
      'kembang kol',
      'tauge',
      'toge',
      'capcay',
      'sayur asam',
      'sayur lodeh',
      'oyong',
      'labu siam',
    ],
    targetDirection: 'minimal',
    targetDaily: 1,
    targetWeekly: 7,
    messageKurang: 'Coba tambah variasi sayuran lain, seperti brokoli, tomat, terong di menu harian kamu!',
    messageSesuai: 'Mantap! Konsumsi sayuran lainnya kamu udah sesuai anjuran.',
    messageLebih: 'Sayuran lainnya kamu udah cukup baik, tetap jaga variasi jenisnya ya!',
  },
  {
    no: 6,
    name: 'Buah Kaya Vitamin A',
    aliases: [
      'buah kaya vit. a',
      'buah kaya vitamin a',
      'vitamin a fruits',
      'pepaya',
      'mangga',
      'melon',
      'blewah',
    ],
    targetDirection: 'minimal',
    targetDaily: 1,
    targetWeekly: 7,
    messageKurang: 'Yuk tambahin buah kaya vitamin A, seperti pepaya, mangga sebagai camilan sehat kamu!',
    messageSesuai: 'Keren! Konsumsi buah kaya vitamin A kamu udah sesuai anjuran.',
    messageLebih: 'Buah kaya vitamin A kamu udah bagus, pertahankan ya!',
  },
  {
    no: 7,
    name: 'Buah Lainnya',
    aliases: [
      'buah lainnya',
      'other fruits',
      'pisang',
      'apel',
      'jeruk',
      'semangka',
      'salak',
      'buah naga',
      'alpukat',
      'jambu',
      'nanas',
      'strawberi',
      'pir',
    ],
    targetDirection: 'minimal',
    targetDaily: 1,
    targetWeekly: 7,
    messageKurang: 'Tambah konsumsi buah lain sebagai camilan sehat, minimal sekali sehari ya!',
    messageSesuai: 'Mantap! Konsumsi buah lainnya kamu udah sesuai anjuran, pertahankan!',
    messageLebih: 'Buah lainnya kamu udah cukup, tetap variasikan jenisnya ya!',
  },
  {
    no: 8,
    name: 'Daging',
    aliases: [
      'daging & jeroan',
      'daging',
      'meat',
      'ayam',
      'sapi',
      'bebek',
      'kambing',
      'hati ayam',
      'hati sapi',
      'jeroan',
      'bakso',
      'sosis',
    ],
    targetDirection: 'minimal',
    targetDaily: 1,
    targetWeekly: 7,
    messageKurang: 'Tambah lauk daging/ayam biar kebutuhan protein buat pertumbuhan kamu tercukupi!',
    messageSesuai: 'Keren! Konsumsi daging kamu udah sesuai anjuran.',
    messageLebih: 'Daging kamu udah cukup tinggi, imbangi juga dengan ikan, protein nabati, dan sayur ya!',
  },
  {
    no: 9,
    name: 'Telur',
    aliases: ['telur', 'eggs', 'telur ayam', 'telur puyuh', 'telur bebek', 'dadar', 'ceplok'],
    targetDirection: 'minimal',
    targetDaily: 1,
    targetWeekly: 7,
    messageKurang: 'Tambah konsumsi telur, coba targetkan minimal sekali sehari!',
    messageSesuai: 'Mantap! Konsumsi telur kamu udah sesuai anjuran, pertahankan!',
    messageLebih: 'Telur kamu udah cukup, pertahankan variasinya dengan lauk lain ya!',
  },
  {
    no: 10,
    name: 'Ikan',
    aliases: [
      'ikan & seafood',
      'ikan',
      'fish',
      'seafood',
      'udang',
      'cumi',
      'kepiting',
      'teri',
      'lele',
      'nila',
      'tongkol',
      'tuna',
      'salmon',
      'gurame',
      'bandeng',
    ],
    targetDirection: 'minimal',
    targetDaily: 1,
    targetWeekly: 7,
    messageKurang: 'Tambah konsumsi ikan/hasil laut, sumber protein & omega-3 yang bagus buat kamu!',
    messageSesuai: 'Keren! Konsumsi ikan kamu udah sesuai anjuran, pertahankan!',
    messageLebih: 'Ikan kamu udah cukup baik, tetap variasikan jenis ikannya ya!',
  },
  {
    no: 11,
    name: 'Kacang-kacangan, Biji-bijian & Polong',
    aliases: [
      'kacang-kacangan',
      'kacang-kacangan, biji-bijian & polong',
      'legumes',
      'tempe',
      'tahu',
      'kedelai',
      'kacang tanah',
      'kacang merah',
      'kacang hijau',
      'kacang polong',
      'edamame',
    ],
    targetDirection: 'minimal',
    targetDaily: 1,
    targetWeekly: 7,
    messageKurang:
      'Tambah lauk nabati, seperti tahu, tempe, kacang-kacangan buat variasi sumber protein kamu!',
    messageSesuai: 'Mantap! Konsumsi kacang-kacangan/polong kamu udah sesuai anjuran.',
    messageLebih: 'Kacang-kacangan/polong kamu udah baik, pertahankan variasinya ya!',
  },
  {
    no: 12,
    name: 'Susu & Produk Susu',
    aliases: [
      'susu & produk susu',
      'susu dan produk susu',
      'susu',
      'milk',
      'dairy',
      'keju',
      'yogurt',
      'yoghurt',
    ],
    targetDirection: 'minimal',
    targetDaily: 1,
    targetWeekly: 7,
    messageKurang: 'Tambah konsumsi susu/produk susu, seperti keju, yogurt biar kebutuhan kalsium kamu tercukupi!',
    messageSesuai: 'Keren! Konsumsi susu & produk susu kamu udah sesuai anjuran.',
    messageLebih: 'Susu & produk susu kamu udah cukup, pertahankan ya!',
  },
  {
    no: 13,
    name: 'UPF (Ultra-Processed Food)',
    aliases: [
      'upf',
      'upf (ultra-processed)',
      'ultra-processed',
      'ultra processed',
      'makanan kemasan',
      'mi instan',
      'mie instan',
      'snack',
      'chiki',
      'ciki',
      'biskuit',
      'wafer',
      'soda',
      'minuman kemasan',
      'minuman manis',
      'fast food',
      'nugget',
    ],
    targetDirection: 'maksimal',
    targetDaily: 1,
    targetWeekly: 7,
    messageKurang:
      'Keren! Konsumsi makanan/minuman kemasan olahan (UPF) kamu masih rendah, pertahankan kebiasaan ini ya!',
    messageSesuai: 'Konsumsi UPF kamu masih dalam batas wajar, tetap jaga ya!',
    messageLebih:
      'Coba kurangi konsumsi makanan/minuman kemasan olahan, seperti mi instan, snack kemasan, dan minuman manis, ganti dengan pangan segar ya!',
  },
];

export interface FoodGroupEvaluationResult {
  no: number;
  foodGroupName: string;
  targetDirection: TargetDirection;
  targetCount: number;
  actualCount: number;
  period: 'daily' | 'weekly';
  status: EvaluationStatus;
  statusLabel: string;
  isPositiveStatus: boolean;
  message: string | null;
}

export const findRecommendationConfig = (groupIdentifier: string): FoodGroupRecommendationConfig | undefined => {
  const normalized = groupIdentifier.trim().toLowerCase();
  return BASE_FOOD_RECOMMENDATIONS.find(
    (item) =>
      item.name.toLowerCase() === normalized ||
      item.aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized))
  );
};

/**
 * Extracts all matching IDDS food group names from a food log.
 * Handles both direct catalog linkage and natural language parsing with word boundaries.
 */
export const extractFoodGroupsFromLog = (
  foodName: string,
  catalogGroupName?: string | null
): string[] => {
  // 1. If catalog group is already associated with this log, use it as the single source of truth!
  if (catalogGroupName) {
    const matched = findRecommendationConfig(catalogGroupName);
    return [matched ? matched.name : catalogGroupName];
  }

  // 2. Fallback: match the single primary food group from the food name
  const nameLower = (foodName || '').toLowerCase();

  for (const config of BASE_FOOD_RECOMMENDATIONS) {
    for (const alias of config.aliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'i');
      if (regex.test(nameLower)) {
        return [config.name];
      }
    }
  }

  // 3. Ultimate fallback
  return ['Serealia'];
};

export const evaluateFoodGroup = (
  config: FoodGroupRecommendationConfig,
  actualCount: number,
  period: 'daily' | 'weekly' = 'daily'
): FoodGroupEvaluationResult => {
  const targetCount = period === 'daily' ? config.targetDaily : config.targetWeekly;
  let status: EvaluationStatus;
  let message: string | null = null;
  let isPositiveStatus = false;
  let statusLabel = '';

  if (config.targetDirection === 'minimal') {
    if (actualCount < targetCount) {
      status = 'kurang';
      statusLabel = period === 'daily' ? 'Belum dikonsumsi' : 'Kurang dari target';
      message = period === 'weekly' ? config.messageKurang : null;
      isPositiveStatus = false;
    } else if (actualCount === targetCount) {
      status = 'sesuai';
      statusLabel = 'Sesuai anjuran';
      message = period === 'weekly' ? config.messageSesuai : null;
      isPositiveStatus = true;
    } else {
      status = 'lebih';
      statusLabel = 'Lebih dari target';
      message = period === 'weekly' ? config.messageLebih : null;
      isPositiveStatus = true;
    }
  } else {
    // UPF (Maksimal 1 kali/hari, 7 kali/minggu)
    if (actualCount < targetCount) {
      status = 'kurang';
      statusLabel = period === 'daily' ? 'Bagus (Belum dikonsumsi)' : 'Bagus (Sangat rendah)';
      message = period === 'weekly' ? config.messageKurang : null;
      isPositiveStatus = true;
    } else if (actualCount === targetCount) {
      status = 'sesuai';
      statusLabel = 'Batas wajar';
      message = period === 'weekly' ? config.messageSesuai : null;
      isPositiveStatus = true;
    } else {
      status = 'lebih';
      statusLabel = 'Melebihi batas maksimal';
      message = period === 'weekly' ? config.messageLebih : null;
      isPositiveStatus = false;
    }
  }

  return {
    no: config.no,
    foodGroupName: config.name,
    targetDirection: config.targetDirection,
    targetCount,
    actualCount,
    period,
    status,
    statusLabel,
    isPositiveStatus,
    message,
  };
};

export const generateAllFoodGroupEvaluations = (
  consumedCountsByNameOrId: Record<string, number>,
  period: 'daily' | 'weekly' = 'daily'
): {
  evaluations: FoodGroupEvaluationResult[];
  priorityAdvices: string[];
} => {
  const evaluations: FoodGroupEvaluationResult[] = [];
  const priorityAdvices: string[] = [];

  for (const config of BASE_FOOD_RECOMMENDATIONS) {
    let count = 0;
    for (const [key, value] of Object.entries(consumedCountsByNameOrId)) {
      const match = findRecommendationConfig(key);
      if (match && match.no === config.no) {
        count += value;
      }
    }

    const evaluation = evaluateFoodGroup(config, count, period);
    evaluations.push(evaluation);

    // Klien: Kalimat rekomendasi BCT hanya dimunculkan per minggu
    if (period === 'weekly' && !evaluation.isPositiveStatus && evaluation.message) {
      priorityAdvices.push(evaluation.message);
    }
  }

  return { evaluations, priorityAdvices };
};

