export type NutritionalStatusKey =
  | 'giziBuruk'
  | 'giziKurang'
  | 'giziBaik'
  | 'giziLebih'
  | 'obesitas';

export const calculateBmi = (weightKg: number, heightCm: number): number => {
  if (heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
};

/**
 * Z-Score Classification Rujukan Permenkes RI No. 2 Tahun 2020 (Tabel 15 & 16)
 */
export const getNutritionalStatus = (bmi: number): { key: NutritionalStatusKey; label: string } => {
  if (bmi < 14.5) return { key: 'giziBuruk', label: 'Gizi Buruk' };
  if (bmi < 17.0) return { key: 'giziKurang', label: 'Gizi Kurang' };
  if (bmi <= 23.0) return { key: 'giziBaik', label: 'Gizi Baik' };
  if (bmi <= 27.0) return { key: 'giziLebih', label: 'Gizi Lebih' };
  return { key: 'obesitas', label: 'Obesitas' };
};

export const getBmiCategory = (bmi: number): string => {
  return getNutritionalStatus(bmi).label;
};

export const calculateAge = (birthDate: Date | string | null | undefined): {
  years: number;
  months: number;
  totalMonths: number;
  formatted: string;
} => {
  if (!birthDate) {
    return { years: 14, months: 0, totalMonths: 168, formatted: '14 Thn 0 Bln' };
  }

  const birth = new Date(birthDate);
  const now = new Date();

  let months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) {
    months--;
  }

  const totalMonths = Math.max(0, months);
  const years = Math.floor(totalMonths / 12);
  const remMonths = totalMonths % 12;

  return {
    years,
    months: remMonths,
    totalMonths,
    formatted: `${years} Thn ${remMonths} Bln (${totalMonths} Bln)`,
  };
};

/**
 * Target Air Minum Standard AKG 2019 (mL/hari)
 */
export const calculateTargetWaterMl = (gender: 'male' | 'female' | 'other', ageYears: number): number => {
  if (gender === 'female') {
    return ageYears <= 15 ? 2100 : 2150;
  }
  return ageYears <= 15 ? 2100 : 2300;
};

export const getBctAdvice = (statusKey: NutritionalStatusKey, specificFoodAdvice?: string): string => {
  if (specificFoodAdvice) {
    return specificFoodAdvice;
  }

  switch (statusKey) {
    case 'giziBuruk':
    case 'giziKurang':
      return 'Tingkatkan konsumsi makanan kaya protein (Telur, Ikan, Daging) & 13 kelompok pangan harianmu!';
    case 'giziBaik':
      return 'Pertahankan keberagaman 13 kelompok pangan harian (skor IDDS ≥ 6) dan penuhi air minum harian!';
    case 'giziLebih':
    case 'obesitas':
      return 'Batasi konsumsi UPF (maksimal 1x/hari), perbanyak sayuran hijau berdaun gelap & aktif bergerak!';
  }
};