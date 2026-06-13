/**
 * Settlement Calculator
 * 
 * Pool-based model:
 * - Members pay INTO a shared pool (via payments)
 * - Expenses are paid FROM the pool (shared equally)
 * - Settlement = who hasn't paid their fair share yet
 * 
 * Fair share = perPersonBudget (or totalExpenses / memberCount if expenses exceed budget)
 * Net balance = totalPaymentsMade - fairShare
 *   Positive → overpaid (is owed a refund)
 *   Negative → underpaid (still owes money)
 */

export interface MemberBalance {
  memberId: string;
  memberName: string;
  totalPaymentsMade: number;  // Approved payments to pool
  fairShare: number;          // What each member should pay
  netBalance: number;         // payments - fairShare → positive = overpaid, negative = underpaid
}

export interface Settlement {
  from: string;       // Member ID who owes
  fromName: string;
  to: string;         // Member ID who is owed
  toName: string;
  amount: number;
}

export interface SettlementSummary {
  totalExpenses: number;
  totalCollected: number;
  fairSharePerPerson: number;
  poolBalance: number;        // collected - expenses
  memberBalances: MemberBalance[];
  settlements: Settlement[];
}

interface MemberInput {
  id: string;
  name: string;
  paymentsMade: number;  // Approved payments
}

/**
 * Calculate settlements using pool-based model.
 * 
 * Each member's fair share = totalExpenses / memberCount
 * If a member paid more than their fair share, they are owed back.
 * If a member paid less, they still owe.
 */
export function calculateSettlements(
  members: MemberInput[],
  totalExpenses: number,
  totalCollected: number
): SettlementSummary {
  const memberCount = members.length;
  if (memberCount === 0) {
    return {
      totalExpenses: 0,
      totalCollected: 0,
      fairSharePerPerson: 0,
      poolBalance: 0,
      memberBalances: [],
      settlements: [],
    };
  }

  // Fair share is based on actual expenses
  const fairShare = totalExpenses / memberCount;

  // Calculate net balance for each member
  const memberBalances: MemberBalance[] = members.map((m) => ({
    memberId: m.id,
    memberName: m.name,
    totalPaymentsMade: m.paymentsMade,
    fairShare,
    netBalance: m.paymentsMade - fairShare,
  }));

  // Separate into overpaid (creditors) and underpaid (debtors)
  const creditors: { id: string; name: string; amount: number }[] = [];
  const debtors: { id: string; name: string; amount: number }[] = [];

  memberBalances.forEach((mb) => {
    if (mb.netBalance > 0.01) {
      creditors.push({
        id: mb.memberId,
        name: mb.memberName,
        amount: mb.netBalance,
      });
    } else if (mb.netBalance < -0.01) {
      debtors.push({
        id: mb.memberId,
        name: mb.memberName,
        amount: Math.abs(mb.netBalance),
      });
    }
  });

  // Sort descending by amount for greedy matching
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Min-cash-flow greedy algorithm
  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const settleAmount = Math.min(creditor.amount, debtor.amount);

    if (settleAmount > 0.01) {
      settlements.push({
        from: debtor.id,
        fromName: debtor.name,
        to: creditor.id,
        toName: creditor.name,
        amount: Math.round(settleAmount * 100) / 100,
      });
    }

    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return {
    totalExpenses,
    totalCollected,
    fairSharePerPerson: Math.round(fairShare * 100) / 100,
    poolBalance: Math.round((totalCollected - totalExpenses) * 100) / 100,
    memberBalances,
    settlements,
  };
}
