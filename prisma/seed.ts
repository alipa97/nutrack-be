import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting full database seed from client PDF dataset...');

  // =========================================================================
  // 1. 13 IDDS Food Groups (FAO IDDS Scheme + UPF)
  // =========================================================================
  console.log('1. Seeding 13 IDDS Food Groups...');
  const foodGroupsData = [
    { name: 'Serealia', description: 'Nasi putih/merah, jagung, roti gandum, mie, bihun, lontong, pasta, oat' },
    { name: 'Sayur/Umbi Kaya Vitamin A', description: 'Wortel, labu kuning, ubi jalar oranye' },
    { name: 'Umbi & Akar Putih', description: 'Singkong, kentang, talas, ubi kayu putih, perkedel' },
    { name: 'Sayuran Hijau Berdaun Gelap', description: 'Bayam, kangkung, daun singkong, sawi hijau' },
    { name: 'Sayuran Lainnya', description: 'Terong, timun, buncis, tomat, kubis, kembang kol, sop brokoli, capcay, gado-gado, gudeg' },
    { name: 'Buah Kaya Vitamin A', description: 'Mangga matang, pepaya, melon oranye' },
    { name: 'Buah Lainnya', description: 'Pisang, apel, jeruk, semangka, salak, alpukat, buah naga, rujak' },
    { name: 'Daging', description: 'Daging sapi, ayam, bebek, ceker ayam, rendang, sate, opor, bakso, nugget, sosis' },
    { name: 'Telur', description: 'Telur ayam, telur bebek, telur puyuh, telur balado, martabak telur' },
    { name: 'Ikan', description: 'Ikan laut, ikan tawar, udang, cumi, teri, pecel lele, pempek, batagor' },
    { name: 'Kacang-kacangan, Biji-bijian & Polong', description: 'Tempe, tahu, kacang tanah, kacang hijau, kedelai, bubur kacang hijau' },
    { name: 'Susu & Produk Susu', description: 'Susu cair UHT, keju, yogurt murni' },
    { name: 'UPF (Ultra-Processed Food)', description: 'Mie instan, minuman bersoda, teh kemasan manis, keripik kemasan, wafer, biskuit krim, coklat batang' },
  ];

  for (const fg of foodGroupsData) {
    await prisma.foodGroup.upsert({
      where: { name: fg.name },
      create: fg,
      update: { description: fg.description },
    });
  }

  const groups = await prisma.foodGroup.findMany();
  const groupMap = new Map(groups.map((g) => [g.name, g.id]));

  // Helper to find ID by standard or alias name
  const getGroupId = (name: string): string => {
    if (groupMap.has(name)) return groupMap.get(name)!;
    const lower = name.toLowerCase();
    for (const [gName, gId] of groupMap.entries()) {
      const gLower = gName.toLowerCase();
      if (gLower === lower || gLower.includes(lower) || lower.includes(gLower)) {
        return gId;
      }
    }
    return groupMap.get('Serealia')!;
  };

  // =========================================================================
  // 2. 91 Official Base Foods (from PDF 2: BASE NAMA & KELOMPOK MAKANAN)
  // =========================================================================
  console.log('2. Seeding 91 Official Base Foods Catalog...');
  const baseFoods: { name: string; group: string }[] = [
    { name: 'alpukat', group: 'Buah Lainnya' },
    { name: 'apel', group: 'Buah Lainnya' },
    { name: 'jeruk', group: 'Buah Lainnya' },
    { name: 'melon', group: 'Buah Lainnya' },
    { name: 'pepaya', group: 'Buah Kaya Vitamin A' },
    { name: 'pisang_potong', group: 'Buah Lainnya' },
    { name: 'semangka', group: 'Buah Lainnya' },
    { name: 'sayur_bayam', group: 'Sayuran Hijau Berdaun Gelap' },
    { name: 'sayur_asam', group: 'Sayuran Lainnya' },
    { name: 'lodeh', group: 'Sayuran Lainnya' },
    { name: 'tumis_kangkung', group: 'Sayuran Hijau Berdaun Gelap' },
    { name: 'capcay', group: 'Sayuran Lainnya' },
    { name: 'sop_brokoli', group: 'Sayuran Lainnya' },
    { name: 'oseng', group: 'Sayuran Lainnya' },
    { name: 'nasi putih', group: 'Serealia' },
    { name: 'nasi_putih', group: 'Serealia' },
    { name: 'mie', group: 'Serealia' },
    { name: 'bihun', group: 'Serealia' },
    { name: 'lontong', group: 'Serealia' },
    { name: 'pasta', group: 'Serealia' },
    { name: 'roti', group: 'Serealia' },
    { name: 'sereal', group: 'Serealia' },
    { name: 'singkong', group: 'Umbi & Akar Putih' },
    { name: 'ketan_hijau', group: 'Serealia' },
    { name: 'ketan_hitam', group: 'Serealia' },
    { name: 'ayam_bakar', group: 'Daging' },
    { name: 'ayam_goreng', group: 'Daging' },
    { name: 'ayam_pop', group: 'Daging' },
    { name: 'ikan_goreng', group: 'Ikan' },
    { name: 'gulai_ikan', group: 'Ikan' },
    { name: 'pepes_ikan', group: 'Ikan' },
    { name: 'ceker_ayam', group: 'Daging' },
    { name: 'telur', group: 'Telur' },
    { name: 'telur_balado', group: 'Telur' },
    { name: 'udang', group: 'Ikan' },
    { name: 'rendang', group: 'Daging' },
    { name: 'sate_ayam', group: 'Daging' },
    { name: 'sate_jeroan', group: 'Daging' },
    { name: 'sate_telur', group: 'Telur' },
    { name: 'pecel_lele', group: 'Ikan' },
    { name: 'opor_ayam', group: 'Daging' },
    { name: 'tongseng', group: 'Daging' },
    { name: 'nugget', group: 'Daging' },
    { name: 'sosis', group: 'Daging' },
    { name: 'tahu', group: 'Kacang-kacangan, Biji-bijian & Polong' },
    { name: 'tempe', group: 'Kacang-kacangan, Biji-bijian & Polong' },
    { name: 'tempe_bacem', group: 'Kacang-kacangan, Biji-bijian & Polong' },
    { name: 'nasi_goreng', group: 'Serealia' },
    { name: 'nasi_kuning', group: 'Serealia' },
    { name: 'nasi_padang', group: 'Serealia' },
    { name: 'bakso', group: 'Daging' },
    { name: 'mie_goreng', group: 'Serealia' },
    { name: 'soto', group: 'Daging' },
    { name: 'soto_ayam', group: 'Daging' },
    { name: 'rawon', group: 'Daging' },
    { name: 'bubur_ayam', group: 'Serealia' },
    { name: 'gado_gado', group: 'Sayuran Lainnya' },
    { name: 'pecel', group: 'Sayuran Lainnya' },
    { name: 'gudeg', group: 'Sayuran Lainnya' },
    { name: 'lontong_sayur', group: 'Serealia' },
    { name: 'pempek', group: 'Ikan' },
    { name: 'perkedel', group: 'Umbi & Akar Putih' },
    { name: 'batagor', group: 'Ikan' },
    { name: 'bakwan', group: 'Sayuran Lainnya' },
    { name: 'sate', group: 'Daging' },
    { name: 'bika_ambon', group: 'Serealia' },
    { name: 'cakwe', group: 'Serealia' },
    { name: 'cenil', group: 'Serealia' },
    { name: 'dadar_gulung', group: 'Serealia' },
    { name: 'klepon', group: 'Serealia' },
    { name: 'kue_cubit', group: 'Serealia' },
    { name: 'martabak_manis', group: 'Serealia' },
    { name: 'martabak_telur', group: 'Telur' },
    { name: 'putu_ayu', group: 'Serealia' },
    { name: 'risol', group: 'Serealia' },
    { name: 'kerupuk', group: 'Serealia' },
    { name: 'bubur_kacang_hijau', group: 'Kacang-kacangan, Biji-bijian & Polong' },
    { name: 'bubur_mutiara', group: 'Serealia' },
    { name: 'bubur_sumsum', group: 'Serealia' },
    { name: 'es_pisang_ijo', group: 'Buah Lainnya' },
    { name: 'rujak', group: 'Buah Lainnya' },
    { name: 'rujak_buah', group: 'Buah Lainnya' },
    { name: 'Mie instan goreng', group: 'UPF (Ultra-Processed Food)' },
    { name: 'Mie instan kuah', group: 'UPF (Ultra-Processed Food)' },
    { name: 'Keripik jagung/snack kemasan', group: 'UPF (Ultra-Processed Food)' },
    { name: 'Keripik kentang kemasan', group: 'UPF (Ultra-Processed Food)' },
    { name: 'Wafer', group: 'UPF (Ultra-Processed Food)' },
    { name: 'Biskuit sandwich krim', group: 'UPF (Ultra-Processed Food)' },
    { name: 'Coklat batang', group: 'UPF (Ultra-Processed Food)' },
    { name: 'Minuman bersoda', group: 'UPF (Ultra-Processed Food)' },
    { name: 'Teh kemasan manis siap minum', group: 'UPF (Ultra-Processed Food)' },
  ];

  for (const item of baseFoods) {
    const foodGroupId = getGroupId(item.group);
    await prisma.foodCatalog.upsert({
      where: { name: item.name },
      create: {
        name: item.name,
        foodGroupId,
        source: 'client_dataset',
        isActive: true,
      },
      update: {
        foodGroupId,
      },
    });
  }

  // =========================================================================
  // 3. Clean up legacy dummy demo accounts and fake logs
  // (User profiles, food logs, and hydration logs belong to live application usage)
  // =========================================================================
  console.log('3. Cleaning up legacy dummy demo accounts and logs if any exist...');
  const legacyDemoEmails = [
    'nadia.putri@nutrack.id',
    'farhan.ramadhan@nutrack.id',
    'rani.ayu@nutrack.id',
    'bagas.pratama@nutrack.id',
    'siti.aisyah@nutrack.id',
    'dimas.anggara@nutrack.id',
    'rian.hidayat@nutrack.id',
    'zahra.amelia@nutrack.id',
  ];

  const existingDemoUsers = await prisma.user.findMany({
    where: { email: { in: legacyDemoEmails } },
    select: { id: true },
  });

  if (existingDemoUsers.length > 0) {
    const demoIds = existingDemoUsers.map((u) => u.id);
    await prisma.foodLog.deleteMany({ where: { userId: { in: demoIds } } });
    await prisma.hydrationLog.deleteMany({ where: { userId: { in: demoIds } } });
    await prisma.userMeasurementHistory.deleteMany({ where: { userId: { in: demoIds } } });
    await prisma.userFollow.deleteMany({
      where: { OR: [{ followerId: { in: demoIds } }, { followingId: { in: demoIds } }] },
    });
    await prisma.streakPartner.deleteMany({
      where: { OR: [{ userId: { in: demoIds } }, { partnerId: { in: demoIds } }] },
    });
    await prisma.articleLike.deleteMany({ where: { userId: { in: demoIds } } });
    await prisma.articleBookmark.deleteMany({ where: { userId: { in: demoIds } } });
    await prisma.userProfile.deleteMany({ where: { userId: { in: demoIds } } });
    await prisma.user.deleteMany({ where: { id: { in: demoIds } } });
    console.log(`🧹 Cleaned up ${existingDemoUsers.length} legacy dummy demo accounts and fake logs.`);
  }


  // =========================================================================
  // 4. Badges, Challenges & BCT Recommendations
  // =========================================================================
  console.log('4. Seeding Badges, Challenges & BCT (Rows 1, 2, 4 from Gamification Reference)...');
  const badgesData = [
    {
      code: 'hydration_hero',
      title: 'Hydration Hero',
      description: 'Minum air minimal 2 Liter/hari selama 7 hari berturut-turut',
      iconKey: 'water_drop_rounded',
      isActive: true,
    },
    {
      code: 'veggie_warrior',
      title: 'Veggie Warrior',
      description: 'Mencatat konsumsi Sayur Kaya Vit. A, Sayur Hijau Gelap, atau Sayuran Lainnya selama 5 hari dalam seminggu',
      iconKey: 'grass_rounded',
      isActive: true,
    },
    {
      code: 'master_tracker',
      title: 'Master Tracker',
      description: 'Mengunggah foto food log lengkap (pagi, siang, malam) selama 7 hari berturut-turut',
      iconKey: 'camera_alt_rounded',
      isActive: true,
    },
  ];

  const activeCodes = badgesData.map((b) => b.code);
  await prisma.badge.deleteMany({
    where: {
      code: { notIn: activeCodes },
    },
  });

  for (const b of badgesData) {
    await prisma.badge.upsert({
      where: { code: b.code },
      create: b,
      update: b,
    });
  }

  const challengesData = [
    {
      title: 'Hydration Hero',
      description: 'Minum air minimal 2 Liter/hari selama 7 hari berturut-turut',
      category: 'Hidrasi',
      rewardXp: 100,
      targetDays: 7,
      isActive: true,
    },
    {
      title: 'Veggie Warrior',
      description: 'Mencatat konsumsi kelompok pangan Sayur Kaya Vit. A, Sayur Hijau Gelap, atau Sayuran Lainnya selama 5 hari dalam seminggu',
      category: 'Konsumsi Sayur',
      rewardXp: 80,
      targetDays: 5,
      isActive: true,
    },
    {
      title: 'Master Tracker',
      description: 'Mengunggah foto food log lengkap (pagi, siang, malam) selama 7 hari berturut-turut',
      category: 'Pencatatan Makanan',
      rewardXp: 150,
      targetDays: 7,
      isActive: true,
    },
  ];

  const activeChallengeTitles = challengesData.map((c) => c.title);
  await prisma.weeklyChallenge.deleteMany({
    where: {
      title: { notIn: activeChallengeTitles },
    },
  });

  for (const c of challengesData) {
    const existing = await prisma.weeklyChallenge.findFirst({ where: { title: c.title } });
    if (!existing) {
      await prisma.weeklyChallenge.create({ data: c });
    } else {
      await prisma.weeklyChallenge.update({ where: { id: existing.id }, data: c });
    }
  }

  // =========================================================================
  // 4b. Reminder Templates (Master - 10 templates from Client PDF)
  // =========================================================================
  console.log('5. Seeding 10 Official Reminder Templates from Client PDF...');
  const reminderTemplatesData = [
    {
      category: 'Olahraga',
      subType: 'Pagi — tanya rencana olahraga',
      reminderTime: '07:00',
      optionNumber: 1,
      title: 'Olahraga Pagi (Opsi 1)',
      description: 'Pagi! Olahraga apa yang mau kamu coba hari ini?',
      iconKey: 'wb_sunny_rounded',
    },
    {
      category: 'Olahraga',
      subType: 'Pagi — tanya rencana olahraga',
      reminderTime: '07:00',
      optionNumber: 2,
      title: 'Olahraga Pagi (Opsi 2)',
      description: 'Semangat pagi! Sudah kepikiran mau olahraga apa hari ini?',
      iconKey: 'wb_sunny_rounded',
    },
    {
      category: 'Olahraga',
      subType: 'Sore — tanya status & ajakan olahraga',
      reminderTime: '16:30',
      optionNumber: 1,
      title: 'Olahraga Sore (Opsi 1)',
      description: 'Sore-sore enaknya jalan kaki atau stretching dulu. Udah sempat olahraga belum?',
      iconKey: 'directions_run_rounded',
    },
    {
      category: 'Olahraga',
      subType: 'Sore — tanya status & ajakan olahraga',
      reminderTime: '16:30',
      optionNumber: 2,
      title: 'Olahraga Sore (Opsi 2)',
      description: 'Masih ada waktu buat olahraga sebentar nih sebelum hari berakhir. Yuk!',
      iconKey: 'directions_run_rounded',
    },
    {
      category: 'Minum & Makan',
      subType: 'Siang — ingatkan makan siang & minum',
      reminderTime: '12:00',
      optionNumber: 1,
      title: 'Minum & Makan Siang (Opsi 1)',
      description: 'Perut mulai lapar? Yuk makan siang & jangan lupa juga minum air putih ya 🍽💧',
      iconKey: 'restaurant_rounded',
    },
    {
      category: 'Minum & Makan',
      subType: 'Siang — ingatkan makan siang & minum',
      reminderTime: '12:00',
      optionNumber: 2,
      title: 'Minum & Makan Siang (Opsi 2)',
      description: 'Udah jam makan siang nih, yuk isi perut & jangan lupa minum air putih.',
      iconKey: 'restaurant_rounded',
    },
    {
      category: 'Minum',
      subType: 'Malam — tanya total minum hari ini',
      reminderTime: '20:00',
      optionNumber: 1,
      title: 'Minum Malam (Opsi 1)',
      description: 'Udah berapa gelas air putih yang kamu minum hari ini?',
      iconKey: 'water_drop_rounded',
    },
    {
      category: 'Minum',
      subType: 'Malam — tanya total minum hari ini',
      reminderTime: '20:00',
      optionNumber: 2,
      title: 'Minum Malam (Opsi 2)',
      description: 'Sudah cukup minum air putih hari ini? Yuk dicek dan dicatat!',
      iconKey: 'water_drop_rounded',
    },
    {
      category: 'Tidur',
      subType: 'Malam — ingatkan tidur cukup',
      reminderTime: '21:30',
      optionNumber: 1,
      title: 'Tidur Malam (Opsi 1)',
      description: 'Waktunya bersiap tidur! Tidur cukup penting buat badan & mood kamu besok',
      iconKey: 'bedtime_rounded',
    },
    {
      category: 'Tidur',
      subType: 'Malam — ingatkan tidur cukup',
      reminderTime: '21:30',
      optionNumber: 2,
      title: 'Tidur Malam (Opsi 2)',
      description: 'Jangan begadang ya, tidur cukup bikin kamu lebih fokus besok',
      iconKey: 'bedtime_rounded',
    },
  ];

  for (const rt of reminderTemplatesData) {
    const existing = await prisma.reminderTemplate.findFirst({
      where: {
        reminderTime: rt.reminderTime,
        optionNumber: rt.optionNumber,
        category: rt.category,
      },
    });
    if (!existing) {
      await prisma.reminderTemplate.create({ data: rt });
    } else {
      await prisma.reminderTemplate.update({ where: { id: existing.id }, data: rt });
    }
  }

  // =========================================================================
  // 4c. Master Table 13 Food Group Recommendations (Client PDF Dataset)
  // =========================================================================
  console.log('6. Seeding 13 Official Food Group Recommendations from Client PDF...');
  const foodGroupRecommendationsData = [
    {
      no: 1,
      foodGroupName: 'Serealia',
      targetDirection: 'Minimal',
      targetDaily: 1,
      targetWeekly: 7,
      messageKurang:
        'Yuk, tambah porsi makanan pokok, seperti nasi, mi, roti, kentang, atau sereal biar energi kamu buat aktivitas seharian tetap oke!',
      messageSesuai: 'Keren! konsumsi makanan pokok kamu udah pas! Pertahankan ya.',
      messageLebih:
        'Konsumsi makanan pokok kamu udah lebih dari cukup, sekarang seimbangin juga sama sayur dan protein ya!',
      iconKey: 'grain_rounded',
    },
    {
      no: 2,
      foodGroupName: 'Sayur/Umbi Kaya Vitamin A',
      targetDirection: 'Minimal',
      targetDaily: 1,
      targetWeekly: 7,
      messageKurang:
        'Coba tambahin sayur/umbi kaya vitamin A, seperti wortel, labu, ubi jalar oranye minimal sekali sehari, bagus buat mata dan daya tahan tubuh kamu!',
      messageSesuai: 'Mantap! Konsumsi sayur/umbi kaya vitamin A kamu udah sesuai anjuran!',
      messageLebih: 'Konsumsi sayur/umbi kaya vitamin A kamu udah bagus banget, pertahankan terus ya!',
      iconKey: 'visibility_rounded',
    },
    {
      no: 3,
      foodGroupName: 'Umbi & Akar Putih',
      targetDirection: 'Minimal',
      targetDaily: 1,
      targetWeekly: 7,
      messageKurang:
        'Sesekali coba variasikan makanan pokok kamu dengan umbi/akar putih, seperti singkong atau kentang!',
      messageSesuai: 'Nice! Variasi makanan pokok kamu dengan umbi & akar putih udah sesuai anjuran.',
      messageLebih: 'Konsumsi umbi & akar putih kamu udah baik, terus jaga variasinya ya!',
      iconKey: 'spa_rounded',
    },
    {
      no: 4,
      foodGroupName: 'Sayuran Hijau Berdaun Gelap',
      targetDirection: 'Minimal',
      targetDaily: 1,
      targetWeekly: 7,
      messageKurang:
        'Tambahin sayuran hijau berdaun gelap, seperti bayam, kangkung minimal sekali sehari, bagus buat zat besi kamu!',
      messageSesuai: 'Keren! Konsumsi sayuran hijau berdaun gelap kamu udah sesuai anjuran.',
      messageLebih: 'Sayuran hijau berdaun gelap kamu udah oke, pertahankan keragamannya ya!',
      iconKey: 'grass_rounded',
    },
    {
      no: 5,
      foodGroupName: 'Sayuran Lainnya',
      targetDirection: 'Minimal',
      targetDaily: 1,
      targetWeekly: 7,
      messageKurang: 'Coba tambah variasi sayuran lain, seperti brokoli, tomat, terong di menu harian kamu!',
      messageSesuai: 'Mantap! Konsumsi sayuran lainnya kamu udah sesuai anjuran.',
      messageLebih: 'Sayuran lainnya kamu udah cukup baik, tetap jaga variasi jenisnya ya!',
      iconKey: 'local_florist_rounded',
    },
    {
      no: 6,
      foodGroupName: 'Buah Kaya Vitamin A',
      targetDirection: 'Minimal',
      targetDaily: 1,
      targetWeekly: 7,
      messageKurang: 'Yuk tambahin buah kaya vitamin A, seperti pepaya, mangga sebagai camilan sehat kamu!',
      messageSesuai: 'Keren! Konsumsi buah kaya vitamin A kamu udah sesuai anjuran.',
      messageLebih: 'Buah kaya vitamin A kamu udah bagus, pertahankan ya!',
      iconKey: 'apple_rounded',
    },
    {
      no: 7,
      foodGroupName: 'Buah Lainnya',
      targetDirection: 'Minimal',
      targetDaily: 1,
      targetWeekly: 7,
      messageKurang: 'Tambah konsumsi buah lain sebagai camilan sehat, minimal sekali sehari ya!',
      messageSesuai: 'Mantap! Konsumsi buah lainnya kamu udah sesuai anjuran, pertahankan!',
      messageLebih: 'Buah lainnya kamu udah cukup, tetap variasikan jenisnya ya!',
      iconKey: 'restaurant_rounded',
    },
    {
      no: 8,
      foodGroupName: 'Daging',
      targetDirection: 'Minimal',
      targetDaily: 1,
      targetWeekly: 7,
      messageKurang: 'Tambah lauk daging/ayam biar kebutuhan protein buat pertumbuhan kamu tercukupi!',
      messageSesuai: 'Keren! Konsumsi daging kamu udah sesuai anjuran.',
      messageLebih: 'Daging kamu udah cukup tinggi, imbangi juga dengan ikan, protein nabati, dan sayur ya!',
      iconKey: 'lunch_dining_rounded',
    },
    {
      no: 9,
      foodGroupName: 'Telur',
      targetDirection: 'Minimal',
      targetDaily: 1,
      targetWeekly: 7,
      messageKurang: 'Tambah konsumsi telur, coba targetkan minimal sekali sehari!',
      messageSesuai: 'Mantap! Konsumsi telur kamu udah sesuai anjuran, pertahankan!',
      messageLebih: 'Telur kamu udah cukup, pertahankan variasinya dengan lauk lain ya!',
      iconKey: 'egg_rounded',
    },
    {
      no: 10,
      foodGroupName: 'Ikan',
      targetDirection: 'Minimal',
      targetDaily: 1,
      targetWeekly: 7,
      messageKurang: 'Tambah konsumsi ikan/hasil laut, sumber protein & omega-3 yang bagus buat kamu!',
      messageSesuai: 'Keren! Konsumsi ikan kamu udah sesuai anjuran, pertahankan!',
      messageLebih: 'Ikan kamu udah cukup baik, tetap variasikan jenis ikannya ya!',
      iconKey: 'set_meal_rounded',
    },
    {
      no: 11,
      foodGroupName: 'Kacang-kacangan, Biji-bijian & Polong',
      targetDirection: 'Minimal',
      targetDaily: 1,
      targetWeekly: 7,
      messageKurang:
        'Tambah lauk nabati, seperti tahu, tempe, kacang-kacangan buat variasi sumber protein kamu!',
      messageSesuai: 'Mantap! Konsumsi kacang-kacangan/polong kamu udah sesuai anjuran.',
      messageLebih: 'Kacang-kacangan/polong kamu udah baik, pertahankan variasinya ya!',
      iconKey: 'eco_rounded',
    },
    {
      no: 12,
      foodGroupName: 'Susu & Produk Susu',
      targetDirection: 'Minimal',
      targetDaily: 1,
      targetWeekly: 7,
      messageKurang: 'Tambah konsumsi susu/produk susu, seperti keju, yogurt biar kebutuhan kalsium kamu tercukupi!',
      messageSesuai: 'Keren! Konsumsi susu & produk susu kamu udah sesuai anjuran.',
      messageLebih: 'Susu & produk susu kamu udah cukup, pertahankan ya!',
      iconKey: 'local_drink_rounded',
    },
    {
      no: 13,
      foodGroupName: 'UPF (Ultra-Processed Food)',
      targetDirection: 'Maksimal',
      targetDaily: 1,
      targetWeekly: 7,
      messageKurang:
        'Keren! Konsumsi makanan/minuman kemasan olahan (UPF) kamu masih rendah, pertahankan kebiasaan ini ya!',
      messageSesuai: 'Konsumsi UPF kamu masih dalam batas wajar, tetap jaga ya!',
      messageLebih:
        'Coba kurangi konsumsi makanan/minuman kemasan olahan, seperti mi instan, snack kemasan, dan minuman manis, ganti dengan pangan segar ya!',
      iconKey: 'shield_rounded',
    },
  ];

  for (const fgr of foodGroupRecommendationsData) {
    await prisma.foodGroupRecommendation.upsert({
      where: { no: fgr.no },
      create: fgr,
      update: fgr,
    });
  }

  // =========================================================================
  // 7. Official Education Articles from 5 Trusted Sources
  // 1. https://rso.go.id/gizi-seimbang-pada-remaja
  // 2. https://keslan.kemkes.go.id/view_artikel/179/pilar-utama-dalam-prinsip-gizi-seimbang
  // 3. https://ayosehat.kemkes.go.id/isi-piringku-pedoman-makan-kekinian-orang-indonesia
  // 4. https://health.detik.com/berita-detikhealth/d-4021763/4-masalah-gizi-yang-sering-dialami-remaja-di-indonesia?page=5
  // 5. https://www.kompasiana.com/ridhopangestu/6a9544bdc925c453c225d01d/remaja-putri-sehat-langkah-awal-menuju-generasi-bebas-stunting
  // =========================================================================
  console.log('7. Seeding 5 Official Education Articles from 5 Distinct Health Portals...');

  const educationArticlesData = [
    {
      id: 'b25db08b-e410-4da5-aa49-3bcd75b66439',
      title: 'Gizi Seimbang Pada Remaja: Fondasi Tumbuh Kembang & Pencegahan Stunting',
      category: 'Kesehatan Remaja',
      readTimeMinutes: '5 menit',
      summary:
        'Panduan pemenuhan gizi seimbang bagi remaja usia 10-18 tahun untuk mengoptimalkan masa pubertas, mencegah anemia & obesitas, serta mewujudkan generasi bebas stunting.',
      contentMarkdown: `Pentingnya Gizi Seimbang pada Masa Pubertas Remaja

Remaja yang berstatus gizi baik menjadi salah satu pilar utama pencegahan stunting serta penurunan angka kematian ibu dan anak. Menurut Peraturan Menteri Kesehatan RI Nomor 25 Tahun 2014, remaja adalah penduduk dalam rentang usia 10 – 18 tahun.

Saat memasuki masa remaja, anak mengalami fase pubertas dengan pertumbuhan fisik pesat (growth spurt) yang disertai perkembangan mental, kognitif, dan psikis. Tidak terpenuhinya zat gizi pada fase krusial ini dapat menimbulkan gangguan dan hambatan permanen pada proses tumbuh kembang.

---

Masalah Asupan Gizi pada Remaja

Berdasarkan telaah klinis RS Ortopedi Prof. Dr. R. Soeharso Surakarta, ada beberapa masalah gizi yang sering dijumpai:

1. Gangguan Makan (Eating Disorder)  
   Kerap dipicu oleh obsesi keliru untuk menguruskan badan secara instan. Gejalanya meliputi pembatasan makan ekstrem, penurunan berat badan drastis, hingga terhentinya siklus menstruasi (amenore) akibat disfungsi hormonal.

2. Obesitas  
   Terjadi karena asupan zat gizi melebihi kebutuhan metabolik tubuh tanpa diimbangi aktivitas fisik teratur.

3. Kurang Energi Kronis (KEK)  
   Pada umumnya terjadi karena pola makan yang terlalu sedikit dan tidak sesuai kebutuhan tubuh atau berada di bawah standar gizi harian.

4. Anemia Defisiensi Besi  
   Paling sering dialami oleh remaja perempuan. Diperlukan asupan bahan makanan hewani berkualitas tinggi (seperti daging, hati, ayam) serta makanan tinggi Vitamin C untuk membantu penyerapan zat besi.

---

4 Pilar Gizi Seimbang & Panduan Isi Piringku

Gizi Seimbang menurut Kemenkes RI memperhatikan keanekaragaman pangan, perilaku hidup bersih dan sehat (PHBS), aktivitas fisik teratur, serta pemantauan berat badan ideal.

Pemerintah menerapkan panduan "Isi Piringku" pengganti 4 Sehat 5 Sempurna:
- 1/3 Piring: Makanan pokok karbohidrat kompleks (beras, jagung, umbi)
- 1/3 Piring: Aneka macam sayur-sayuran
- 1/6 Piring: Lauk-pauk protein hewani dan nabati
- 1/6 Piring: Buah-buahan aneka warna

> "Remaja perempuan yang nantinya menjadi calon ibu di masa depan harus dipersiapkan sedini mungkin untuk melahirkan generasi emas bebas stunting dengan memperhatikan asupan gizi sekarang dan nanti." — Purtiantini, S.Gz, MM

---

Daftar Pustaka:
1. Kemenkes RI (2018). Remaja Indonesia Harus Sehat.
2. IDAI (2013). Nutrisi pada Remaja.
3. Dit P2PTM Kemenkes RI (2019). 4 Pilar Utama Dalam Prinsip Gizi Seimbang.
4. Jurnal Menara Medika (2020). Perilaku Penerapan Gizi Seimbang Masyarakat.`,
      imageUrl: 'https://rso.go.id/wp-content/uploads/2023/06/Gizi-Remaja.jpg',
      tag: 'Gizi Seimbang',
      sourceUrl: 'https://rso.go.id/gizi-seimbang-pada-remaja',
      author: 'Purtiantini, S.Gz, MM (RS Ortopedi Prof. Dr. R. Soeharso Surakarta)',
      publishedDate: '14 Juni 2023',
      keyTakeaways: [
        'Remaja (10-18 tahun) membutuhkan gizi makro dan mikro optimal untuk mendukung lonjakan pertumbuhan pubertas.',
        'Terapkan 4 pilar gizi seimbang: makanan beragam, PHBS, olahraga rutin, dan pantau berat badan normal.',
        'Cegah gangguan makan, obesitas, kurang energi kronis (KEK), dan anemia defisiensi besi sejak dini.',
        'Terapkan panduan porsi Isi Piringku: sepertiga pokok, sepertiga sayur, seperenam lauk, seperenam buah.',
        'Gizi baik pada remaja putri merupakan investasi mencetak generasi emas masa depan bebas stunting.',
      ],
      isActive: true,
    },
    {
      id: '38eb93d1-8d27-478f-9666-34c8b7efaa69',
      title: '4 Pilar Utama dalam Prinsip Gizi Seimbang Kemenkes RI',
      category: 'Gizi Seimbang',
      readTimeMinutes: '4 menit',
      summary:
        'Upaya menyeimbangkan zat gizi masuk dan keluar melalui 4 pilar: konsumsi makanan beragam, pola hidup aktif & olahraga, PHBS, serta kontrol berat badan normal.',
      contentMarkdown: `Keseimbangan Gizi Masuk dan Keluar

Gizi Seimbang adalah susunan asupan sehari-hari yang jenis dan jumlah zat gizinya sesuai dengan kebutuhan tubuh. Prinsip ini bertumpu pada 4 pilar utama yang menyeimbangkan antara zat gizi yang keluar dan yang masuk:

---

1. Konsumsi Makanan dengan Beraneka Ragam
Makanan yang kita konsumsi menyumbangkan zat-zat gizi yang berlainan, sehingga tidak ada satu pun makanan yang lengkap kandungan zat gizinya (kecuali ASI untuk bayi 0-6 bulan). Oleh karena itu, kita dianjurkan mengonsumsi aneka ragam makanan dan aneka ragam warna:
- Karbohidrat (3–4 porsi/hari): Nasi, jagung, umbi-umbian, tepung.
- Protein (2–4 porsi/hari): Ikan, ayam, daging sapi, telur, tahu, tempe, dan polong-polongan.
- Sayur (3–4 porsi/hari) & Buah (2–3 porsi/hari): Konsumsi keduanya karena fungsi vitamin dan mineral di dalamnya saling melengkapi.
- Batasi GGL: Batasi konsumsi gula, garam, dan minyak secara berlebih.

2. Pola Hidup Aktif dan Berolahraga
Aktivitas fisik adalah segala macam pergerakan tubuh yang mengeluarkan energi. Olahraga rutin minimal 3 kali seminggu dengan durasi 30 menit per sesi membantu memperlancar metabolisme zat gizi dan membakar kelebihan cadangan kalori.

3. Menerapkan Pola Hidup Bersih dan Sehat (PHBS)
Menurut UU No. 36 Tahun 2009, kesehatan fisik dan lingkungan saling berkaitan erat. Menjalankan PHBS menghindarkan tubuh dari penyakit infeksi. Bahkan 45% penyakit diare dapat dicegah hanya dengan membiasakan cuci tangan pakai sabun dan air mengalir, terutama sebelum makan dan sesudah beraktivitas.

4. Menjaga Berat Badan Ideal
Indikator utama tercapainya keseimbangan gizi dalam tubuh adalah mempertahankan Indeks Massa Tubuh (IMT) dalam batas ambang normal. Pemantauan berat badan secara berkala mencegah bahaya gizi kurang maupun obesitas.

---

Sumber: Direktorat Jenderal Pelayanan Kesehatan (Ditjen Keslan) Kementerian Kesehatan Republik Indonesia.`,
      imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
      tag: '4 Pilar',
      sourceUrl: 'https://keslan.kemkes.go.id/view_artikel/179/pilar-utama-dalam-prinsip-gizi-seimbang',
      author: 'Ditjen Pelayanan Kesehatan (Ditjen Keslan) Kemenkes RI',
      publishedDate: '19 April 2022',
      keyTakeaways: [
        'Tidak ada satu pun makanan tunggal yang lengkap gizinya, sehingga aneka ragam pangan mutlak dipenuhi.',
        'Penuhi takaran harian: 3-4 porsi karbohidrat, 2-4 porsi protein, 3-4 porsi sayur, dan 2-3 porsi buah.',
        'Lakukan aktivitas fisik dan olahraga minimal 3x seminggu berdurasi 30 menit untuk metabolisme prima.',
        'Cuci tangan pakai sabun sebelum makan terbukti mencegah hingga 45% kejadian diare dan infeksi.',
        'Pertahankan Indeks Massa Tubuh (IMT) dalam rentang normal melalui pemantauan berat badan teratur.',
      ],
      isActive: true,
    },
    {
      id: '4950918d-484f-4451-a2be-ceb77872b3eb',
      title: 'Isi Piringku: Pedoman Makan Kekinian Pengganti 4 Sehat 5 Sempurna',
      category: 'Isi Piringku',
      readTimeMinutes: '3 menit',
      summary:
        'Pedoman gizi seimbang masa kini dari Kemenkes: setengah piring sayur & buah, setengah piring makanan pokok & lauk, minum air 8 gelas sehari, dan aktif bergerak.',
      contentMarkdown: `Konsep 4 Sehat 5 Sempurna vs. Isi Piringku

Healthies tentu sudah sangat akrab dengan slogan "4 Sehat 5 Sempurna" yang diperkenalkan sejak tahun 1952. Namun seiring perkembangan ilmu gizi klinis modern, slogan tersebut telah resmi digantikan oleh panduan "Isi Piringku" berdasarkan Permenkes No. 41 Tahun 2014.

Bukan hanya mengatur kelompok makanan yang harus tersedia, Isi Piringku memberikan panduan visual mengenai proporsi takaran saji per sekali makan:

---

Komposisi Satu Piring Makan Sehat:
- 1/2 Piring: Diisi dengan kombinasi sayur-sayuran (2/3 dari setengah piring) dan buah-buahan segar (1/3 dari setengah piring).
- 1/2 Piring Lainnya: Diisi dengan makanan pokok sumber karbohidrat (2/3 dari setengah piring) dan lauk-pauk protein hewani/nabati (1/3 dari setengah piring).

---

3 Kebiasaan Penunjang Isi Piringku:
1. Minum Air Putih: Cukupi minimal 8 gelas air putih per hari untuk hidrasi sel tubuh.
2. Aktivitas Fisik: Luangkan waktu 30 menit setiap hari untuk bergerak aktif atau berolahraga ringan.
3. Kebersihan Diri: Cuci tangan dengan air mengalir dan sabun antiseptik sebelum menyentuh makanan.

> Fakta Riskesdas Kemenkes:  
> Baru sekitar 4,5% penduduk Indonesia yang mengonsumsi sayur dan buah sesuai rekomendasi WHO (5 porsi per hari). Melalui kampanye KerenDimakan, Kemenkes mengajak generasi muda membudayakan makan sayur dan buah setiap hari!

---

Sumber: Ayo Sehat - Kementerian Kesehatan Republik Indonesia.`,
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
      tag: 'Isi Piringku',
      sourceUrl: 'https://ayosehat.kemkes.go.id/isi-piringku-pedoman-makan-kekinian-orang-indonesia',
      author: 'Bhinuri Darmawanti (Ayo Sehat Kemenkes RI)',
      publishedDate: '24 November 2022',
      keyTakeaways: [
        'Konsep 4 Sehat 5 Sempurna (1952) telah disempurnakan menjadi pedoman porsi Isi Piringku Kemenkes.',
        'Proporsi piring makan: setengah piring sayur & buah, setengah piring makanan pokok & lauk protein.',
        'Baru 4,5% penduduk Indonesia yang memenuhi rekomendasi konsumsi sayur dan buah 5 porsi per hari.',
        'Lengkapi pola makan dengan minum 8 gelas air putih, olahraga 30 menit sehari, dan cuci tangan sabun.',
        'Isi Piringku dirancang agar mudah dipraktikkan remaja di rumah maupun di kantin sekolah.',
      ],
      isActive: true,
    },
    {
      id: '069aed61-4026-435f-b692-9fc5f88557f3',
      title: '4 Masalah Gizi yang Kerap Dialami Remaja di Indonesia',
      category: 'Kesehatan Remaja',
      readTimeMinutes: '4 menit',
      summary:
        'Kemenkes RI memaparkan 4 persoalan gizi utama remaja di Indonesia: anemia kekurangan zat besi, stunting kronis, kurus atau KEK, serta kegemukan dan obesitas.',
      contentMarkdown: `Remaja Sebagai Penggerak Masa Depan Bangsa

Remaja merupakan masa yang sangat berharga. Mereka adalah calon pemimpin dan penggerak pembangunan di masa depan. Namun, Kementerian Kesehatan RI mencatat masih banyak remaja di tanah air yang menghadapi tantangan gizi serius.

Disampaikan oleh Plt. Dirjen Kesehatan Masyarakat Kemenkes RI, dr. Pattiselano Robert Johan, MARS, berikut adalah 4 masalah gizi utama yang kerap dialami remaja di Indonesia:

---

1. Kekurangan Zat Besi (Anemia)
Prevalensi anemia di kalangan remaja perempuan jauh lebih tinggi dibanding laki-laki. Dampaknya mencakup penurunan imunitas, konsentrasi belajar yang buyar, dan hilangnya kebugaran fisik. Bagi remaja putri, anemia meningkatkan risiko kematian ibu melahirkan serta kelahiran bayi BBLR di masa depan.

2. Stunting (Kurang Gizi Kronis)
Banyak remaja tidak menyadari bahwa tubuh pendek (stunting) merupakan akumulasi kurang gizi kronis sejak masa balita. Stunting menimbulkan dampak jangka panjang berupa penurunan fungsi kognitif serta kerentanan terhadap penyakit degeneratif (diabetes melitus, hipertensi, jantung koroner).

3. Kurus atau Kurang Energi Kronis (KEK)
Remaja kurus dapat dipicu oleh keterbatasan ekonomi maupun faktor psikososial, seperti rasa insecure terhadap penampilan fisik sehingga melakukan diet ketat tak sehat. Kondisi ini meningkatkan risiko infeksi dan ketidakseimbangan hormonal.

4. Kegemukan dan Obesitas
Data Global School Health Survey menunjukkan:
- 42,5% remaja menerapkan gaya hidup sedentari (kurang gerak).
- 93,6% remaja kurang mengonsumsi sayur dan buah.
- 75,7% remaja gemar mengonsumsi makanan berpengawet dan berpemanis/penyedap tinggi.

Pola makan buruk ini mendorong lonjakan kasus obesitas yang memicu penyakit tidak menular (PTM) di usia muda.

---

Sumber: detikHealth & Kementerian Kesehatan Republik Indonesia.`,
      imageUrl: 'https://awsimages.detik.net.id/community/media/visual/2018/01/25/13583bf9-768d-4773-845c-202574df9c91_169.jpeg?w=1200',
      tag: 'Masalah Gizi',
      sourceUrl: 'https://health.detik.com/berita-detikhealth/d-4021763/4-masalah-gizi-yang-sering-dialami-remaja-di-indonesia?page=5',
      author: 'Wednes Veronica Giawa (detikHealth / Kemenkes RI)',
      publishedDate: '15 Mei 2018',
      keyTakeaways: [
        'Anemia dominan menyerang remaja putri dan berdampak serius pada performa belajar serta kesehatan reproduksi.',
        'Stunting pada usia remaja merupakan imbas defisit gizi jangka panjang yang menurunkan daya kognitif.',
        'Remaja kurus (KEK) sering dipicu oleh pembatasan makan ekstrem akibat obsesi standar tubuh langsing.',
        'Data GSHS: 42,5% remaja sedenter dan 93,6% kurang makan sayur-buah, memicu risiko obesitas usia muda.',
        'Pemahaman edukasi gizi seimbang sangat penting bagi generasi muda dalam menjalani pendidikan.',
      ],
      isActive: true,
    },
    {
      id: '71f996dd-b6fe-4720-855e-df84b723137f',
      title: 'Remaja Putri Sehat, Langkah Awal Menuju Generasi Bebas Stunting',
      category: 'Pencegahan Stunting',
      readTimeMinutes: '4 menit',
      summary:
        'Pencegahan stunting harus dimulai jauh sebelum masa kehamilan. Menjaga kesehatan dan kecukupan gizi remaja putri adalah fondasi memutus rantai stunting antargenerasi.',
      contentMarkdown: ` Mencegah Stunting Dimulai Jauh Sebelum Anak Lahir

Setiap anak berhak tumbuh sehat, berkembang optimal, dan menjangkau potensi terbaiknya. Namun, perjalanan menuju generasi sehat tidak semata-mata dimulai saat seorang bayi lahir ke dunia.

Pencegahan stunting memerlukan perhatian berkesinambungan di berbagai fase kehidupan. Stunting pada balita bukan sekadar persoalan tinggi badan, melainkan menyangkut perkembangan organ vital dan daya pikir anak.

---

 Dari Masa Balita Menuju Fase Remaja

Kesehatan merupakan sebuah perjalanan yang berlangsung sepanjang daur kehidupan (life-cycle approach):
1. Fase Pubertas & Perubahan Fisik:  
   Remaja putri mengalami masa kematangan biologis yang sangat cepat. Pada periode ini, kecukupan gizi makro dan mikro, terutama zat besi dan asam folat, mutlak dipenuhi.
2. Pencegahan Anemia pada Calon Ibu:  
   Remaja putri yang mengalami anemia defisiensi besi dan kekurangan energi kronis memiliki risiko berlipat ganda melahirkan anak stunting di kemudian hari. Oleh karena itu, edukasi kesehatan remaja putri merupakan langkah preventif hulu yang paling strategis.

---

 Sinergi Gerakan JANGGIRA & FEEBOO

Upaya mewujudkan generasi emas bebas stunting memerlukan kolaborasi lintas inisiatif:
- Gerakan Feeboo: Berfokus pada peningkatan kesadaran remaja putri untuk mencegah anemia dan mencintai tubuh melalui asupan pangan bergizi serta tablet penambah darah.
- Gerakan Janggira: Berfokus pada edukasi pencegahan stunting balita dengan mengusung semangat "Jangkau potensi, tumbuh sehat, raih masa depan".

> "Kesehatan remaja putri dan pencegahan stunting pada balita adalah satu kesatuan rantai kepedulian menuju terciptanya generasi Indonesia yang lebih kuat dan berdaya saing." — Ridho Pangestu

---

Sumber: Publikasi Promosi Kesehatan Kompasiana.`,
      imageUrl: 'https://assets-a2.kompasiana.com/items/album/2026/08/31/whatsapp-image-2026-08-31-at-14-29-47-6a954423c925c477f7742963.jpeg?t=o&v=770',
      tag: 'Stunting',
      sourceUrl: 'https://www.kompasiana.com/ridhopangestu/6a9544bdc925c453c225d01d/remaja-putri-sehat-langkah-awal-menuju-generasi-bebas-stunting',
      author: 'Ridho Pangestu (Promosi Kesehatan Kompasiana)',
      publishedDate: '31 Agustus 2026',
      keyTakeaways: [
        'Pencegahan stunting harus dimulai sejak masa remaja putri sebagai calon ibu, bukan baru saat anak lahir.',
        'Remaja putri yang bebas anemia mencegah risiko komplikasi kehamilan dan bayi berat lahir rendah (BBLR).',
        'Pola gizi seimbang sepanjang siklus hidup merupakan kunci utama memutus rantai stunting antargenerasi.',
        'Gerakan edukasi remaja (Feeboo & Janggira) mendorong kesadaran nutrisi dan pola hidup sehat sedini mungkin.',
        'Generasi emas bebas stunting dibangun dari komitmen remaja dalam menjaga kesehatan tubuh setiap hari.',
      ],
      isActive: true,
    },
  ];

  for (const art of educationArticlesData) {
    await prisma.educationArticle.upsert({
      where: { id: art.id },
      create: art,
      update: art,
    });
  }

  // =========================================================================
  // 8. Official Nutrition Glossary Terms from Client Frontend
  // =========================================================================
  console.log('8. Seeding Nutrition Glossary Terms...');
  const glossaryData = [
    {
      term: 'IDDS (Indeks Keragaman Pangan)',
      category: 'Indikator Gizi',
      definition: 'Skor variasi konsumsi 13 kelompok pangan harian untuk mengukur kecukupan gizi mikro remaja.',
    },
    {
      term: 'UPF (Ultra-Processed Food)',
      category: 'Kelompok Makanan',
      definition: 'Makanan hasil olahan pabrik berlebih dengan bahan tambahan pangan yang perlu dibatasi (maksimal 1x/hari).',
    },
    {
      term: 'IMT/U (Indeks Massa Tubuh Menurut Usia)',
      category: 'Status Gizi',
      definition: 'Pengukuran rasio berat dan tinggi badan yang disesuaikan dengan kelompok usia remaja.',
    },
    {
      term: 'Serealia',
      category: '13 Kelompok Pangan',
      definition: 'Bahan pangan utama penyedia karbohidrat seperti beras, jagung, gandum, dan oat.',
    },
    {
      term: 'Sayur Berdaun Hijau Gelap',
      category: '13 Kelompok Pangan',
      definition: 'Sayuran kaya zat besi dan asam folat seperti bayam, kangkung, dan sawi hijau.',
    },
  ];

  for (const g of glossaryData) {
    await prisma.nutritionGlossary.upsert({
      where: { term: g.term },
      create: g,
      update: g,
    });
  }

  console.log('✅ Master data & templates successfully seeded to PostgreSQL! 🚀');
}

main()
  .catch((error) => {
    console.error('❌ Error during seeding:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });