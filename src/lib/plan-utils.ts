export function getMonthlyCreditLimit(plan: string, subscriptionCredits?: number | null): number {
  if (typeof subscriptionCredits === 'number' && subscriptionCredits > 0) {
    return subscriptionCredits;
  }

  switch (plan?.toUpperCase()) {
    case 'PRO':
      return 1000;
    case 'TEAM':
    case 'ENTERPRISE':
      return 1000000;
    default:
      return 100;
  }
}
