const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 0. Seed Default Admin User
  const adminPasswordHash = await bcrypt.hash('Admin@1234', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@mpscprepai.com' },
    update: {
      role: 'ADMIN',
      passwordHash: adminPasswordHash,
    },
    create: {
      name: 'System Admin',
      email: 'admin@mpscprepai.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`✅ Admin account seeded: ${adminUser.email} (Password: Admin@1234)`);

  // 1. Seed Exam: MPSC Group C
  const mpscExam = await prisma.exam.upsert({
    where: { code: 'MPSC_GROUP_C' },
    update: {},
    create: {
      name: 'MPSC Group C Services Exam',
      code: 'MPSC_GROUP_C',
      description: 'Maharashtra Public Service Commission (MPSC) Group C Services Examination',
      isActive: true,
    },
  });
  console.log(`✅ Exam seeded: ${mpscExam.name}`);

  // 2. Seed Stages: Prelims & Mains
  const prelimsStage = await prisma.examStage.upsert({
    where: {
      examId_code: {
        examId: mpscExam.id,
        code: 'PRELIMS',
      },
    },
    update: {},
    create: {
      examId: mpscExam.id,
      name: 'Prelims Examination',
      code: 'PRELIMS',
      description: 'MPSC Group C Combined Preliminary Examination',
    },
  });

  const mainsStage = await prisma.examStage.upsert({
    where: {
      examId_code: {
        examId: mpscExam.id,
        code: 'MAINS',
      },
    },
    update: {},
    create: {
      examId: mpscExam.id,
      name: 'Mains Examination',
      code: 'MAINS',
      description: 'MPSC Group C Main Examination',
    },
  });
  console.log(`✅ Stages seeded: ${prelimsStage.name}, ${mainsStage.name}`);

  // 3. Seed 10 Core Subjects & Topics
  const subjectsData = [
    {
      name: 'History',
      code: 'HISTORY',
      description: 'Modern History of India with special emphasis on Maharashtra history.',
      icon: '📜',
      topics: [
        'Modern History of India (1857 to 1947)',
        'History of Maharashtra & Social Reformers',
        'Indian National Movement',
        'Post-Independence Era',
      ],
    },
    {
      name: 'Geography',
      code: 'GEOGRAPHY',
      description: 'Physical, Social & Economic Geography of Maharashtra and India.',
      icon: '🗺️',
      topics: [
        'Physical Geography of Maharashtra',
        'Rivers, Climate & Agriculture of Maharashtra',
        'Indian Physical & Political Geography',
        'Population & Human Geography',
      ],
    },
    {
      name: 'Indian Polity',
      code: 'POLITY',
      description: 'Indian Constitution, Governance, and Panchayati Raj.',
      icon: '⚖️',
      topics: [
        'Preamble & Fundamental Rights',
        'Directive Principles of State Policy',
        'Union & State Executive and Legislature',
        'Panchayati Raj & Local Self Government',
        'Judiciary & Constitutional Bodies',
      ],
    },
    {
      name: 'Economy',
      code: 'ECONOMY',
      description: 'Indian Economy, Government Schemes & Financial System.',
      icon: '📈',
      topics: [
        'National Income & Economic Development',
        'Banking, Inflation & Monetary Policy',
        'Government Budget & Public Finance',
        'Agriculture, Industry & Infrastructure',
        'Government Welfare Schemes',
      ],
    },
    {
      name: 'General Science',
      code: 'SCIENCE',
      description: 'Physics, Chemistry, Biology & Hygiene.',
      icon: '🔬',
      topics: [
        'Physics (Motion, Energy, Optics, Electricity)',
        'Chemistry (Matter, Elements, Acids & Bases)',
        'Botany & Plant Physiology',
        'Zoology & Human Physiology',
        'Hygiene, Health & Diseases',
      ],
    },
    {
      name: 'Current Affairs',
      code: 'CURRENT_AFFAIRS',
      description: 'State, National & International events.',
      icon: '📰',
      topics: [
        'State Level Current Events (Maharashtra)',
        'National & International Events',
        'Awards, Sports & Appointments',
        'Science & Technology Updates',
      ],
    },
    {
      name: 'Marathi',
      code: 'MARATHI',
      description: 'Marathi Grammar, Vocabulary & Comprehension.',
      icon: '✍️',
      topics: [
        'मराठी व्याकरण (व्याकरण, समास, प्रयोग)',
        'शब्दसंपदा (समानार्थी, विरुद्धार्थी, म्हणी)',
        'वाक्यरचना व अर्थ',
        'उतारा व आकलन',
      ],
    },
    {
      name: 'English',
      code: 'ENGLISH',
      description: 'English Grammar, Vocabulary & Comprehension.',
      icon: '🔤',
      topics: [
        'Grammar (Tenses, Parts of Speech, Voice)',
        'Vocabulary (Synonyms, Antonyms, Idioms)',
        'Sentence Structure & Correction',
        'Reading Comprehension Passages',
      ],
    },
    {
      name: 'Mathematics',
      code: 'MATHEMATICS',
      description: 'Basic Numeracy, Quantitative Aptitude & Arithmetic.',
      icon: '🔢',
      topics: [
        'Percentage, Profit & Loss',
        'Ratio, Proportion & Average',
        'Time, Speed, Distance & Work',
        'Simple & Compound Interest',
      ],
    },
    {
      name: 'Reasoning',
      code: 'REASONING',
      description: 'Logical & Analytical Reasoning.',
      icon: '🧩',
      topics: [
        'Coding-Decoding & Series',
        'Blood Relations & Direction Sense',
        'Syllogism & Statement-Conclusions',
        'Data Interpretation & Analytical Puzzles',
      ],
    },
  ];

  for (const s of subjectsData) {
    const subject = await prisma.subject.upsert({
      where: { code: s.code },
      update: {
        name: s.name,
        description: s.description,
        icon: s.icon,
      },
      create: {
        name: s.name,
        code: s.code,
        description: s.description,
        icon: s.icon,
      },
    });

    for (const topicName of s.topics) {
      await prisma.topic.upsert({
        where: {
          subjectId_name: {
            subjectId: subject.id,
            name: topicName,
          },
        },
        update: {},
        create: {
          subjectId: subject.id,
          name: topicName,
        },
      });
    }
    console.log(`✅ Subject seeded: ${subject.name} (${s.topics.length} topics)`);
  }

  // 4. Seed Subscription Plans
  const plansData = [
    {
      code: 'FREE',
      name: 'Free Aspirant',
      description: 'Essential practice tools for beginners.',
      price: 0.0,
      interval: 'MONTHLY',
      features: [
        '10 Practice Questions per day',
        'Access to basic PYQ Library',
        'Daily Quiz access',
        'Basic accuracy performance stats',
      ],
    },
    {
      code: 'PREMIUM_MONTHLY',
      name: 'Premium Monthly',
      description: 'Full unlimited access paid monthly.',
      price: 99.0,
      interval: 'MONTHLY',
      features: [
        'Unlimited PYQ Practice & Full Library',
        'Unlimited AI Quiz Generation',
        'Full-length Timed Mock Tests',
        'Advanced Subject & Topic Analytics',
        'Targeted Weak-Topic Revision',
        'Ad-free experience',
      ],
    },
    {
      code: 'PREMIUM_QUARTERLY',
      name: 'Premium Quarterly',
      description: 'Popular choice for focused exam preparation.',
      price: 249.0,
      interval: 'QUARTERLY',
      features: [
        'Everything in Premium Monthly',
        'Save 16% compared to monthly plan',
        'Priority AI Quiz Generation',
        'Unlimited Revision Mode',
        'Ad-free experience',
      ],
    },
    {
      code: 'PREMIUM_YEARLY',
      name: 'Premium Annual Pass',
      description: 'Best value complete 1-year exam pass.',
      price: 699.0,
      interval: 'YEARLY',
      features: [
        'Everything in Premium Quarterly',
        'Save 40% compared to monthly plan',
        'Full 12 Months Access to all MPSC exams',
        'Priority Support & Beta Features',
        'Ad-free experience',
      ],
    },
  ];

  for (const p of plansData) {
    await prisma.subscriptionPlan.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        description: p.description,
        price: p.price,
        interval: p.interval,
        features: p.features,
      },
      create: {
        code: p.code,
        name: p.name,
        description: p.description,
        price: p.price,
        interval: p.interval,
        features: p.features,
        isActive: true,
      },
    });
  }
  console.log(`✅ ${plansData.length} Subscription Plans seeded!`);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
