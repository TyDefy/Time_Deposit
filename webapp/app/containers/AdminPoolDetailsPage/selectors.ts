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
  pool => {
    const participants = new Set(pool.transactions?.map(p => p.address))
    const poolParticipants = [...participants]
      .map(participant => {
        const userTransactions = pool.transactions?.filter(t => t.address === participant);
        const userContribution = userTransactions?.reduce((userContributed, transaction) => 
          transaction.type === 'Contribute' ? userContributed += transaction.amount : userContributed -= transaction.amount, 0);
        return {
          address: participant,
          dateJoined: userTransactions?.reduce((minDate, transaction) => minDate < transaction.time ? minDate : transaction.time, new Date()),
          contributed: userContribution,
          interest: 0, // TODO: Wire this up
        }
      });
    return {
      ...pool,
      participantDetails: poolParticipants,
    }
  }
)

const selectAdminPoolDetailsPage = createStructuredSelector<RootState, OwnProps, StateProps>({
  pool: selectAdminPoolDetails,
});

export default selectAdminPoolDetailsPage;