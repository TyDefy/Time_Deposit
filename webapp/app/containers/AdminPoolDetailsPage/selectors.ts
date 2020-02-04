import { createStructuredSelector, createSelector } from 'reselect';
import { RootState } from 'containers/App/types';
import { StateProps } from '.';
import { OwnProps } from 'containers/PoolDetailsPage';
import { selectPool } from 'containers/PoolDetailsPage/selectors';

/**
 * Default selector used by AdminPoolDetailsPage
 */

const selectAdminPoolDetails = createSelector(
  selectPool,
  (pool) => {
    const participants = new Set(pool.transactions?.map(p => p.userAddress))
    const poolParticipants = [...participants]
      .map(participant => {
        const userTransactions = pool.transactions?.filter(t => t.userAddress === participant);
        const userContribution = userTransactions?.reduce((userContributed, transaction) => 
          transaction.type === 'Deposit' ? userContributed += transaction.amount : userContributed -= transaction.amount, 0) || 0;
        
        return {
          address: participant,
          joined: userTransactions?.reduce((minDate, transaction) => minDate < transaction.time ? minDate : transaction.time, new Date()) || new Date(),
          contributed: userContribution,
          interest: 0, // To be wired up once individual user interest earned can be calculated
        }
      });
    return {
      ...pool,
      participantDetails: poolParticipants,
      totalInterest: poolParticipants.reduce((totalInterest, participant) => totalInterest += participant.interest, 0), 
      feeRate: 0, 
    }
  }
)

const selectAdminPoolDetailsPage = createStructuredSelector<RootState, OwnProps, StateProps>({
  pool: selectAdminPoolDetails,
});

export default selectAdminPoolDetailsPage;