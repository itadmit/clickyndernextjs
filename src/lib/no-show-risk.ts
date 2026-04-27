/**
 * Heuristic no-show risk scorer.
 * Returns a score 0-100 with a tier label. Not real ML — a transparent
 * weighted formula based on past no-shows, cancellations, and recent
 * activity. The intent is to surface the customers most likely to be
 * no-shows so the manager can request confirmations / deposits.
 */

import { prisma } from '@/lib/prisma';

export interface NoShowRiskResult {
  score: number; // 0-100
  tier: 'low' | 'medium' | 'high';
  factors: {
    pastNoShows: number;
    pastCanceled: number;
    pastCompleted: number;
    daysSinceLast: number | null;
    completedRate: number;
  };
  reasons: string[];
}

export async function computeNoShowRisk(
  businessId: string,
  customerId: string,
): Promise<NoShowRiskResult> {
  const appointments = await prisma.appointment.findMany({
    where: { businessId, customerId, startAt: { lt: new Date() } },
    select: { status: true, startAt: true },
    orderBy: { startAt: 'desc' },
    take: 50,
  });

  const total = appointments.length;
  const noShows = appointments.filter((a) => a.status === 'no_show').length;
  const canceled = appointments.filter((a) => a.status === 'canceled').length;
  const completed = appointments.filter((a) => a.status === 'completed').length;
  const lastDate = appointments[0]?.startAt;
  const daysSinceLast = lastDate ? Math.floor((Date.now() - lastDate.getTime()) / 86_400_000) : null;
  const completedRate = total > 0 ? completed / total : 0;

  // Score components (each 0-100), weighted average
  const noShowRate = total > 0 ? noShows / total : 0;
  const canceledRate = total > 0 ? canceled / total : 0;

  // Heuristic weights:
  let score = 0;
  const reasons: string[] = [];

  // 60% weight: no-show rate
  score += noShowRate * 60;
  if (noShows >= 1) reasons.push(`היו ${noShows} מקרי אי-הגעה בעבר`);

  // 20% weight: cancellation rate
  score += canceledRate * 20;
  if (canceledRate > 0.3) reasons.push(`שיעור ביטולים גבוה (${Math.round(canceledRate * 100)}%)`);

  // 10% weight: new customer with no history (slight up-weighting)
  if (total === 0) {
    score += 10;
    reasons.push('לקוח חדש (ללא היסטוריה)');
  } else if (total === 1 && completed === 0) {
    score += 8;
    reasons.push('היסטוריה דלה');
  }

  // 10% weight: long inactive
  if (daysSinceLast != null && daysSinceLast > 180) {
    score += 6;
    reasons.push(`לא הגיע יותר מ-${Math.floor(daysSinceLast / 30)} חודשים`);
  }

  // Boost / dampen by completed rate
  if (completedRate > 0.9 && total >= 5) {
    score = Math.max(0, score - 15);
    if (!reasons.length) reasons.push('היסטוריה חיובית: מגיע באופן עקבי');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const tier: NoShowRiskResult['tier'] = score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low';

  return {
    score,
    tier,
    factors: {
      pastNoShows: noShows,
      pastCanceled: canceled,
      pastCompleted: completed,
      daysSinceLast,
      completedRate: Math.round(completedRate * 100) / 100,
    },
    reasons: reasons.length ? reasons : ['אין סימני אזהרה'],
  };
}
