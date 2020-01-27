import { createStructuredSelector, createSelector } from 'reselect';
import { RootState } from 'containers/App/types';
import { StateProps } from '.';
import { OwnProps } from 'containers/PoolDetailsPage';
import { selectPool, selectUtilities } from 'containers/PoolDetailsPage/selectors';

/**
 * Default selector used by AdminPoolDetailsPage
 */

const selectAdminPoolDetails = createSelector(
  selectPool,
  selectUtilities,
  (pool, utilities) => {
    const participants = new Set(pool.transactions?.map(p => p.userAddress))
    const penaltyRate = utilities[pool.withdraw].penaltyRate;
    const poolParticipants = [...participants]
      .map(participant => {
        const userTransactions = pool.transactions?.filter(t => t.userAddress === participant);
        const userContribution = userTransactions?.reduce((userContributed, transaction) => 
          transaction.type === 'Deposit' ? userContributed += transaction.amount : userContributed -= transaction.amount, 0) || 0;
        return {
          address: participant,
          joined: userTransactions?.reduce((minDate, transaction) => minDate < transaction.time ? minDate : transaction.time, new Date()) || new Date(),
          contributed: userContribution,
          interest: pool.interestRate,
        }
      });
    return {
      ...pool,
      participantDetails: poolParticipants,
      totalInterest: 0, 
      feeRate: 0, 
      pentalyRate: penaltyRate
    }
  }
)

const selectAdminPoolDetailsPage = createStructuredSelector<RootState, OwnProps, StateProps>({
  pool: selectAdminPoolDetails,
});

export default selectAdminPoolDetailsPage;