const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const gymId = 'seed-gym-001';
  
  const exercises = [
    { name: 'Bench Press', muscle_groups: 'Chest', equipment: 'Barbell', default_sets: 3, default_reps: 10, rest_seconds: 90 },
    { name: 'Squats', muscle_groups: 'Legs', equipment: 'Barbell', default_sets: 4, default_reps: 8, rest_seconds: 120 },
    { name: 'Deadlift', muscle_groups: 'Back/Legs', equipment: 'Barbell', default_sets: 3, default_reps: 5, rest_seconds: 180 },
    { name: 'Shoulder Press', muscle_groups: 'Shoulders', equipment: 'Dumbbells', default_sets: 3, default_reps: 12, rest_seconds: 60 },
    { name: 'Lat Pulldown', muscle_groups: 'Back', equipment: 'Machine', default_sets: 3, default_reps: 12, rest_seconds: 60 },
    { name: 'Bicep Curls', muscle_groups: 'Arms', equipment: 'Dumbbells', default_sets: 3, default_reps: 15, rest_seconds: 45 },
    { name: 'Tricep Pushdown', muscle_groups: 'Arms', equipment: 'Cable', default_sets: 3, default_reps: 15, rest_seconds: 45 },
    { name: 'Leg Press', muscle_groups: 'Legs', equipment: 'Machine', default_sets: 3, default_reps: 12, rest_seconds: 90 },
  ];

  console.log('Seeding exercises...');
  for (const ex of exercises) {
    await prisma.exercise.create({
      data: { ...ex, gym_id: gymId }
    });
  }

  console.log('Seeding workout template...');
  await prisma.workoutPlan.create({
    data: {
      gym_id: gymId,
      name: 'GDK Beginner Power',
      level: 'Beginner',
      goal: 'Strength',
      duration_weeks: 12,
      days_per_week: 3,
      description: 'A solid foundation for building full-body strength and muscle mass.',
      is_template: true,
      created_by: 'c5cf0ee5-8719-4965-a394-a2c8be02b8bb', // Admin ID
      days: {
        create: [
          { week_num: 1, day_num: 1, muscle_focus: 'Full Body', exercises: JSON.stringify(['Squats', 'Bench Press', 'Lat Pulldown']) },
          { week_num: 1, day_num: 3, muscle_focus: 'Full Body', exercises: JSON.stringify(['Deadlift', 'Shoulder Press', 'Bicep Curls']) },
          { week_num: 1, day_num: 5, muscle_focus: 'Full Body', exercises: JSON.stringify(['Leg Press', 'Tricep Pushdown', 'Plank']) },
        ]
      }
    }
  });

  console.log('✅ Workout seeding complete!');
  process.exit(0);
}

seed();
