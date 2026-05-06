const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const gymId = 'seed-gym-001';
  const adminId = 'c5cf0ee5-8719-4965-a394-a2c8be02b8bb';

  const exercises = [
    // Lower Body
    { name: 'Barbell Back Squat', muscle_groups: 'Quadriceps', equipment: 'Barbell', difficulty: 4 },
    { name: 'Leg Press', muscle_groups: 'Quadriceps', equipment: 'Machine', difficulty: 2 },
    { name: 'Leg Extension', muscle_groups: 'Quadriceps', equipment: 'Machine', difficulty: 1 },
    { name: 'Romanian Deadlift', muscle_groups: 'Hamstrings', equipment: 'Barbell', difficulty: 3 },
    { name: 'Lying Leg Curl', muscle_groups: 'Hamstrings', equipment: 'Machine', difficulty: 1 },
    { name: 'Barbell Hip Thrust', muscle_groups: 'Glutes', equipment: 'Barbell', difficulty: 3 },
    { name: 'Glute Bridge', muscle_groups: 'Glutes', equipment: 'Bodyweight', difficulty: 1 },
    { name: 'Standing Calf Raise', muscle_groups: 'Calves', equipment: 'Machine', difficulty: 1 },
    // Chest
    { name: 'Barbell Bench Press', muscle_groups: 'Chest', equipment: 'Barbell', difficulty: 3 },
    { name: 'Incline DB Press', muscle_groups: 'Chest', equipment: 'Dumbbell', difficulty: 3 },
    { name: 'Decline BB Press', muscle_groups: 'Chest', equipment: 'Barbell', difficulty: 4 },
    { name: 'Cable Crossover', muscle_groups: 'Chest', equipment: 'Cable', difficulty: 3 },
    { name: 'DB Chest Fly', muscle_groups: 'Chest', equipment: 'Dumbbell', difficulty: 2 },
    { name: 'Push-up', muscle_groups: 'Chest', equipment: 'Bodyweight', difficulty: 1 },
    // Back
    { name: 'Lat Pulldown', muscle_groups: 'Back', equipment: 'Machine', difficulty: 1 },
    { name: 'Pull-up', muscle_groups: 'Back', equipment: 'Bodyweight', difficulty: 4 },
    { name: 'Seated Cable Row', muscle_groups: 'Back', equipment: 'Machine', difficulty: 1 },
    { name: 'Bent-Over BB Row', muscle_groups: 'Back', equipment: 'Barbell', difficulty: 3 },
    { name: 'One-Arm DB Row', muscle_groups: 'Back', equipment: 'Dumbbell', difficulty: 1 },
    // Shoulders
    { name: 'Military Press', muscle_groups: 'Shoulders', equipment: 'Barbell', difficulty: 3 },
    { name: 'Dumbbell Press', muscle_groups: 'Shoulders', equipment: 'Dumbbell', difficulty: 1 },
    { name: 'Lateral Raise', muscle_groups: 'Shoulders', equipment: 'Dumbbell', difficulty: 1 },
    { name: 'Face Pull', muscle_groups: 'Shoulders', equipment: 'Cable', difficulty: 1 },
    // Arms
    { name: 'Barbell Curl', muscle_groups: 'Arms', equipment: 'Barbell', difficulty: 1 },
    { name: 'Hammer Curl', muscle_groups: 'Arms', equipment: 'Dumbbell', difficulty: 1 },
    { name: 'Tricep Pushdown', muscle_groups: 'Arms', equipment: 'Cable', difficulty: 1 },
    { name: 'Skullcrushers', muscle_groups: 'Arms', equipment: 'Barbell', difficulty: 3 },
    // Core
    { name: 'Plank', muscle_groups: 'Core', equipment: 'Bodyweight', difficulty: 1 },
    { name: 'Hanging Leg Raise', muscle_groups: 'Core', equipment: 'Bodyweight', difficulty: 3 },
    { name: 'Russian Twist', muscle_groups: 'Core', equipment: 'Weight', difficulty: 2 },
    { name: 'Bicycle Crunch', muscle_groups: 'Core', equipment: 'Bodyweight', difficulty: 1 },
  ];

  console.log('Seeding Pro Exercise Library...');
  for (const ex of exercises) {
    await prisma.exercise.upsert({
      where: { id: `ex_${ex.name.toLowerCase().replace(/\s/g, '_')}` },
      update: {},
      create: {
        id: `ex_${ex.name.toLowerCase().replace(/\s/g, '_')}`,
        gym_id: gymId,
        ...ex
      }
    });
  }

  console.log('Seeding Tiered Workout Plans...');
  
  // 1. The Foundation Plan (Beginner)
  await prisma.workoutPlan.create({
    data: {
      gym_id: gymId,
      name: 'The Foundation Plan',
      level: 'Beginner',
      goal: 'General Fitness',
      duration_weeks: 8,
      days_per_week: 3,
      description: 'Establish motor patterns and build a foundation of general physical preparedness (GPP).',
      is_template: true,
      created_by: adminId,
      days: {
        create: [
          { week_num: 1, day_num: 1, muscle_focus: 'Full Body', exercises: JSON.stringify([
            { name: 'DB Goblet Squat', sets: 3, reps: '12-15', rest: '60s' },
            { name: 'DB Bench Press', sets: 3, reps: '10-12', rest: '60s' },
            { name: 'Lat Pulldown', sets: 3, reps: '12', rest: '60s' }
          ])},
          { week_num: 1, day_num: 2, muscle_focus: 'Full Body', exercises: JSON.stringify([
            { name: 'Bodyweight Lunge', sets: 3, reps: '12/side', rest: '60s' },
            { name: 'Seated Cable Row', sets: 3, reps: '12', rest: '60s' },
            { name: 'Push-up', sets: 3, reps: 'Max', rest: '60s' }
          ])}
        ]
      }
    }
  });

  // 2. The Metabolic Circuit (Weight Loss)
  await prisma.workoutPlan.create({
    data: {
      gym_id: gymId,
      name: 'The Metabolic Circuit',
      level: 'Beginner',
      goal: 'Weight Loss',
      duration_weeks: 12,
      days_per_week: 3,
      description: 'Higher rep ranges and shorter rest periods to increase caloric expenditure while maintaining muscle tissue.',
      is_template: true,
      created_by: adminId,
      days: {
        create: [
          { week_num: 1, day_num: 1, muscle_focus: 'Metabolic Conditioning', exercises: JSON.stringify([
            { name: 'Leg Press', sets: 3, reps: '15-20', rest: '30s' },
            { name: 'Lat Pulldown', sets: 3, reps: '15-20', rest: '30s' },
            { name: 'DB Chest Press', sets: 3, reps: '15-20', rest: '30s' }
          ])}
        ]
      }
    }
  });

  // 3. Advanced PPL
  await prisma.workoutPlan.create({
    data: {
      gym_id: gymId,
      name: 'Advanced PPL',
      level: 'Advanced',
      goal: 'Muscle Building',
      duration_weeks: 12,
      days_per_week: 6,
      description: 'Maximal recovery of specific muscle groups while maintaining high weekly volume.',
      is_template: true,
      created_by: adminId,
      days: {
        create: [
          { week_num: 1, day_num: 1, muscle_focus: 'Push', exercises: JSON.stringify([{ name: 'Bench Press' }, { name: 'Shoulder Press' }])},
          { week_num: 1, day_num: 2, muscle_focus: 'Pull', exercises: JSON.stringify([{ name: 'Lat Pulldown' }, { name: 'BB Row' }])},
          { week_num: 1, day_num: 3, muscle_focus: 'Legs', exercises: JSON.stringify([{ name: 'Squats' }, { name: 'Leg Press' }])}
        ]
      }
    }
  });

  console.log('✅ Pro Seeding complete!');
  process.exit(0);
}

seed();
