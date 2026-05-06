import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding GDK database...');

  // ─── GYM ─────────────────────────────────────────────────────────────────
  const gym = await prisma.gym.upsert({
    where: { id: 'seed-gym-001' },
    update: {},
    create: {
      id: 'seed-gym-001',
      name: 'GDK Fitness Hub',
      address: '123 MG Road, Bangalore, Karnataka 560001',
      phone: '+91 9876543210',
      email: 'admin@gdkgym.com',
      gstin: '29ABCDE1234F1Z5',
      whatsapp_number: '919876543210',
      absence_threshold: 7,
    },
  });
  console.log('✅ Gym created:', gym.name);

  // ─── ADMIN USER ───────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@GDK123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gdkgym.com' },
    update: {},
    create: {
      gym_id: gym.id,
      name: 'GDK Admin',
      email: 'admin@gdkgym.com',
      phone: '9876543210',
      role: 'admin',
      password_hash: adminPassword,
    },
  });
  console.log('✅ Admin created:', admin.email);

  // ─── TRAINER ─────────────────────────────────────────────────────────────
  const trainerPassword = await bcrypt.hash('Trainer@GDK123', 12);
  const trainer = await prisma.user.upsert({
    where: { email: 'trainer@gdkgym.com' },
    update: {},
    create: {
      gym_id: gym.id,
      name: 'Rajesh Kumar',
      email: 'trainer@gdkgym.com',
      phone: '9876543211',
      role: 'trainer',
      password_hash: trainerPassword,
    },
  });
  console.log('✅ Trainer created:', trainer.email);

  // ─── MEMBERSHIP PLANS ─────────────────────────────────────────────────────
  const plans = [
    {
      name: 'Monthly Basic',
      description: 'Gym access only — ideal for self-motivated members',
      duration_days: 30,
      price: 1500,
      gst_rate: 18,
      features: ['Gym Access', 'Locker Room', 'Free WiFi'],
    },
    {
      name: 'Quarterly Pro',
      description: 'Gym + 1 trainer session/week',
      duration_days: 90,
      price: 4000,
      gst_rate: 18,
      features: ['Gym Access', 'Trainer Sessions (4/month)', 'Diet Consultation', 'Locker Room'],
    },
    {
      name: 'Half-Yearly Elite',
      description: 'Full access with personal training and diet plan',
      duration_days: 180,
      price: 7500,
      gst_rate: 18,
      features: ['Gym Access', 'Personal Trainer', 'Diet Plan', 'Progress Tracking', 'Guest Passes (2)'],
    },
    {
      name: 'Annual Premium',
      description: 'Best value — all-inclusive yearly membership',
      duration_days: 365,
      price: 12000,
      gst_rate: 18,
      features: ['Unlimited Gym Access', 'Personal Trainer', 'Diet Plan', 'Body Analysis Monthly', 'Guest Passes (5)', 'Priority Booking'],
    },
    {
      name: 'Student Monthly',
      description: 'Discounted plan for students with valid ID',
      duration_days: 30,
      price: 999,
      gst_rate: 18,
      features: ['Gym Access', 'Locker Room'],
    },
  ];

  for (const planData of plans) {
    await prisma.membershipPlan.upsert({
      where: { id: `seed-plan-${planData.name.toLowerCase().replace(/\s/g, '-')}` },
      update: {},
      create: {
        id: `seed-plan-${planData.name.toLowerCase().replace(/\s/g, '-')}`,
        gym_id: gym.id,
        ...planData,
        features: JSON.stringify(planData.features),
      },
    });
  }
  console.log('✅ 5 Membership plans created');

  // ─── EXERCISE LIBRARY ──────────────────────────────────────────────────────
  const exercises = [
    { name: 'Barbell Bench Press', muscle_groups: ['chest', 'triceps', 'shoulders'], equipment: 'barbell', default_sets: 4, default_reps: 10, difficulty: 3, video_url: 'https://youtube.com/watch?v=bench-press' },
    { name: 'Squat', muscle_groups: ['quadriceps', 'glutes', 'hamstrings'], equipment: 'barbell', default_sets: 4, default_reps: 8, difficulty: 4 },
    { name: 'Deadlift', muscle_groups: ['back', 'glutes', 'hamstrings'], equipment: 'barbell', default_sets: 3, default_reps: 6, difficulty: 5 },
    { name: 'Pull-Up', muscle_groups: ['back', 'biceps'], equipment: 'bodyweight', default_sets: 3, default_reps: 10, difficulty: 3 },
    { name: 'Dumbbell Shoulder Press', muscle_groups: ['shoulders', 'triceps'], equipment: 'dumbbells', default_sets: 3, default_reps: 12, difficulty: 2 },
    { name: 'Dumbbell Bicep Curl', muscle_groups: ['biceps'], equipment: 'dumbbells', default_sets: 3, default_reps: 15, difficulty: 1 },
    { name: 'Tricep Dips', muscle_groups: ['triceps', 'chest'], equipment: 'bodyweight', default_sets: 3, default_reps: 12, difficulty: 2 },
    { name: 'Leg Press', muscle_groups: ['quadriceps', 'glutes'], equipment: 'machine', default_sets: 4, default_reps: 12, difficulty: 2 },
    { name: 'Cable Lat Pulldown', muscle_groups: ['back', 'biceps'], equipment: 'cable', default_sets: 3, default_reps: 12, difficulty: 2 },
    { name: 'Plank', muscle_groups: ['core', 'shoulders'], equipment: 'none', default_sets: 3, default_reps: 1, rest_seconds: 30, difficulty: 2 },
    { name: 'Burpees', muscle_groups: ['full body'], equipment: 'none', default_sets: 3, default_reps: 15, difficulty: 4 },
    { name: 'Lunges', muscle_groups: ['quadriceps', 'glutes'], equipment: 'none', default_sets: 3, default_reps: 12, difficulty: 2 },
    { name: 'Romanian Deadlift', muscle_groups: ['hamstrings', 'glutes', 'back'], equipment: 'barbell', default_sets: 3, default_reps: 10, difficulty: 3 },
    { name: 'Incline Dumbbell Press', muscle_groups: ['upper chest', 'triceps'], equipment: 'dumbbells', default_sets: 3, default_reps: 12, difficulty: 2 },
    { name: 'Face Pull', muscle_groups: ['rear delts', 'traps'], equipment: 'cable', default_sets: 3, default_reps: 15, difficulty: 2 },
    { name: 'Treadmill Run', muscle_groups: ['cardio', 'legs'], equipment: 'machine', default_sets: 1, default_reps: 20, rest_seconds: 0, difficulty: 2 },
    { name: 'Jump Rope', muscle_groups: ['cardio', 'calves'], equipment: 'none', default_sets: 3, default_reps: 100, difficulty: 2 },
    { name: 'Mountain Climbers', muscle_groups: ['core', 'cardio'], equipment: 'none', default_sets: 3, default_reps: 30, difficulty: 3 },
  ];

  for (const ex of exercises) {
    await prisma.exercise.create({
      data: {
        gym_id: gym.id,
        name: ex.name,
        muscle_groups: JSON.stringify(ex.muscle_groups),
        equipment: ex.equipment,
        default_sets: ex.default_sets,
        default_reps: ex.default_reps,
        rest_seconds: (ex as any).rest_seconds ?? 60,
        difficulty: ex.difficulty,
        video_url: (ex as any).video_url ?? null,
      },
    }).catch(() => {}); // Skip if exists
  }
  console.log('✅ 18 Exercises seeded');

  console.log('\n🎉 Database seeded successfully!');
  console.log('──────────────────────────────────────');
  console.log('Admin login:   admin@gdkgym.com  /  Admin@GDK123');
  console.log('Trainer login: trainer@gdkgym.com  /  Trainer@GDK123');
  console.log('──────────────────────────────────────');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
