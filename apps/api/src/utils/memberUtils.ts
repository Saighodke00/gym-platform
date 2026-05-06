import { prisma } from '../config/database';

export async function generateMemberCode(gymId: string): Promise<string> {
  const year = new Date().getFullYear();
  
  // Count members this year for this gym
  const count = await prisma.member.count({
    where: {
      gym_id: gymId,
      joined_at: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
  });

  const seq = String(count + 1).padStart(4, '0');
  return `GDK-${year}-${seq}`;
}

export function calculateMemberStatus(endDate: Date): 'active' | 'expiring_soon' | 'expired' {
  const now = new Date();
  const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'expired';
  if (diffDays <= 7) return 'expiring_soon';
  return 'active';
}

export function calculateAttendanceStreak(attendanceDates: Date[]): number {
  if (!attendanceDates.length) return 0;
  
  const sorted = attendanceDates
    .map(d => new Date(d.toDateString()))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const diff = (sorted[i].getTime() - sorted[i + 1].getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}
