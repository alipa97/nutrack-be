import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding IDDS Food Groups...');
  const foodGroupsData = [
    { name: 'Serealia', description: 'Nasi putih/merah, jagung, roti gandum, mie, oat' },
    { name: 'Sayur Kaya Vit. A', description: 'Wortel, labu kuning, ubi jalar oranye' },
    { name: 'Umbi & Akar Putih', description: 'Singkong, kentang, talas, ubi kayu putih' },
    { name: 'Sayur Hijau Gelap', description: 'Bayam, kangkung, daun singkong, sawi hijau' },
    { name: 'Sayuran Lainnya', description: 'Terong, timun, buncis, tomat, kubis, kembang kol' },
    { name: 'Buah Kaya Vit. A', description: 'Mangga matang, pepaya, melon oranye' },
    { name: 'Buah Lainnya', description: 'Pisang, apel, jeruk, semangka, salak, buah naga' },
    { name: 'Daging & Jeroan', description: 'Daging sapi, ayam, bebek, hati ayam/sapi' },
    { name: 'Telur', description: 'Telur ayam, telur bebek, telur puyuh' },
    { name: 'Ikan & Seafood', description: 'Ikan laut, ikan tawar, udang, cumi, teri' },
    { name: 'Kacang-Kacangan', description: 'Tempe, tahu, kacang tanah, kacang hijau, kedelai' },
    { name: 'Susu & Produk Susu', description: 'Susu cair UHT, keju, yogurt murni' },
    { name: 'UPF (Ultra-Processed)', description: 'Mi instan, minuman manis kemasan, snack bumbu gurih, fast food' },
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

  console.log('Seeding Sample Food Catalog...');
  const catalogData = [
    { name: 'Nasi Putih Warmindo', groupName: 'Serealia', defaultImageUrl: '' },
    { name: 'Roti Gandum Utuh', groupName: 'Serealia', defaultImageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500' },
    { name: 'Tumis Bayam & Sawi Hijau', groupName: 'Sayur Hijau Gelap', defaultImageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500' },
    { name: 'Sayur Sop Wortel Buncis', groupName: 'Sayur Kaya Vit. A', defaultImageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500' },
    { name: 'Telur Rebus Rumahan', groupName: 'Telur', defaultImageUrl: '' },
    { name: 'Telur Dadar Daun Bawang', groupName: 'Telur', defaultImageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500' },
    { name: 'Ayam Goreng Lengkuas', groupName: 'Daging & Jeroan', defaultImageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500' },
    { name: 'Ikan Kembung Bakar', groupName: 'Ikan & Seafood', defaultImageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500' },
    { name: 'Tempe Goreng Gurih', groupName: 'Kacang-Kacangan', defaultImageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500' },
    { name: 'Pisang Ambon Matang', groupName: 'Buah Lainnya', defaultImageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500' },
    { name: 'Pepaya Potong Segar', groupName: 'Buah Kaya Vit. A', defaultImageUrl: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=500' },
    { name: 'Susu UHT Cokelat', groupName: 'Susu & Produk Susu', defaultImageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500' },
    { name: 'Mi Instan Goreng', groupName: 'UPF (Ultra-Processed)', defaultImageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500' },
    { name: 'Minuman Soda Kemasan', groupName: 'UPF (Ultra-Processed)', defaultImageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500' },
  ];

  for (const item of catalogData) {
    const foodGroupId = groupMap.get(item.groupName);
    if (foodGroupId) {
      await prisma.foodCatalog.upsert({
        where: { name: item.name },
        create: {
          name: item.name,
          foodGroupId,
          defaultImageUrl: item.defaultImageUrl,
          source: 'system',
          isActive: true,
        },
        update: {
          foodGroupId,
          defaultImageUrl: item.defaultImageUrl,
        },
      });
    }
  }

  console.log('Seeding Badges...');
  const badgesData = [
    {
      code: 'pahlawan_idds',
      title: 'Pahlawan IDDS',
      description: 'Mencapai IDDS >= 6 dalam sehari',
      iconKey: 'stars_rounded',
      isActive: true,
    },
    {
      code: 'hydro_hero_akg',
      title: 'Hydro Hero AKG',
      description: 'Memenuhi target air minum harian AKG 2019',
      iconKey: 'water_drop_rounded',
      isActive: true,
    },
    {
      code: 'raja_sayur_hijau',
      title: 'Raja Sayur Hijau',
      description: 'Mencatat konsumsi sayur hijau 3 hari berturut-turut',
      iconKey: 'grass_rounded',
      isActive: true,
    },
    {
      code: 'bebas_upf',
      title: 'Bebas UPF',
      description: 'Tidak mengonsumsi UPF seharian penuh',
      iconKey: 'shield_rounded',
      isActive: true,
    },
    {
      code: 'master_buah_vit_a',
      title: 'Master Buah Vit A',
      description: 'Mengonsumsi buah kaya Vitamin A',
      iconKey: 'apple_rounded',
      isActive: true,
    },
    {
      code: 'streak_7_hari',
      title: 'Streak 7 Hari',
      description: 'Mencatat jurnal makanan 7 hari berturut-turut',
      iconKey: 'local_fire_department_rounded',
      isActive: true,
    },
  ];

  for (const b of badgesData) {
    await prisma.badge.upsert({
      where: { code: b.code },
      create: b,
      update: b,
    });
  }

  console.log('Seeding Weekly Challenges...');
  const challengesData = [
    {
      title: 'Capai IDDS ≥ 6 Selama 5 Hari',
      description: 'Konsumsi minimal 6 kelompok pangan berbeda setiap hari.',
      category: 'Keberagaman Pangan',
      rewardXp: 100,
      targetDays: 5,
      isActive: true,
    },
    {
      title: 'Batasi UPF Maksimal 1x/Hari',
      description: 'Kurangi mi instan & minuman manis kemasan minggu ini.',
      category: 'Pengendalian UPF',
      rewardXp: 80,
      targetDays: 7,
      isActive: true,
    },
    {
      title: 'Penuhi Target Air AKG Harian',
      description: 'Minum air putih sesuai target kecukupan AKG usiamu.',
      category: 'Hidrasi AKG',
      rewardXp: 70,
      targetDays: 7,
      isActive: true,
    },
  ];

  for (const c of challengesData) {
    const existing = await prisma.weeklyChallenge.findFirst({ where: { title: c.title } });
    if (!existing) {
      await prisma.weeklyChallenge.create({ data: c });
    } else {
      await prisma.weeklyChallenge.update({
        where: { id: existing.id },
        data: c,
      });
    }
  }

  console.log('Seeding BCT Recommendations...');
  const bctData = [
    {
      title: 'Sediakan Buah & Sayur Hijau di Meja',
      category: 'Keberagaman Pangan',
      techniqueName: 'Restrukturisasi Lingkungan',
      summary: 'Sediakan potongan buah dan sayur hijau siap makan agar mudah dijangkau saat lapar.',
      fullContent: 'Strategi Restrukturisasi Lingkungan: Menyediakan buah dan sayuran di tempat yang mudah terlihat meningkatkan konsumsi gizi harian secara konsisten.',
      iconKey: 'grass_rounded',
      isActive: true,
    },
    {
      title: 'Ganti Minuman Manis dengan Air Putih',
      category: 'Pengendalian UPF',
      techniqueName: 'Substitusi Perilaku',
      summary: 'Selalu bawa botol air minum sendiri ke sekolah untuk membatasi konsumsi UPF.',
      fullContent: 'Substitusi Perilaku: Mengganti minuman kemasan manis dengan air putih dingin menjaga konsentrasi belajar dan mencegah lonjakan gula.',
      iconKey: 'water_drop_rounded',
      isActive: true,
    },
    {
      title: 'Minta Dukungan Orang Tua / Ibu',
      category: 'Dukungan Keluarga',
      techniqueName: 'Dukungan Sosial',
      summary: 'Diskusikan variasi menu 13 kelompok pangan bersama ibu saat menyiapkan makanan.',
      fullContent: 'Dukungan Sosial: Melibatkan orang tua dalam pemilihan bahan makanan 13 kelompok pangan memperkuat kebiasaan sehat berkelanjutan.',
      iconKey: 'family_restroom_rounded',
      isActive: true,
    },
  ];

  for (const bct of bctData) {
    const existing = await prisma.bctRecommendation.findFirst({ where: { title: bct.title } });
    if (!existing) {
      await prisma.bctRecommendation.create({ data: bct });
    } else {
      await prisma.bctRecommendation.update({
        where: { id: existing.id },
        data: bct,
      });
    }
  }

  console.log('Seed completed successfully! 🌱');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });