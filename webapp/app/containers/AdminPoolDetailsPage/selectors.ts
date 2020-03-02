import { createStructuredSelector, createSelector } from 'reselect';
import { RootState } from 'containers/App/types';
import { StateProps } from '.';
import { OwnProps } from 'containers/PoolDetailsPage';
import { selectPools } from 'containers/HomePage/selectors';
import { selectSelectedPoolAddress } from 'containers/PoolDetailsPage/selectors';
import { selectExchangeRate } from 'containers/App/selectors';

/**
 * Default selector used by AdminPoolDetailsPage
 */

const selectAdminPoolDetails = createSelector(
  selectPools,
  selectExchangeRate,
  selectSelectedPoolAddress,
  (pools, exchangeRate, poolAddress) => {
    const pool = pools.filter(p => p.address === poolAddress)[0];
    const poolParticipants = Object.keys(pool.daiBalances)
      .map(participant => {
        const userTransactions = pool.transactions?.filter(t => t.userAddress === participant);
        const userContribution = pool.daiBalances[participant];
        const userBalance = pool.cdaiBalance[participant];
        return {
          address: participant,
          joined: userTransactions?.reduce((minDate, transaction) => minDate < transaction.time ? minDate : transaction.time, new Date()) || new Date(),
          contributed: userContribution,
          interest: Math.abs((userBalance * exchangeRate) - userContribution), // To be wired up once individual user interest earned can be calculated
        }
      });
    return {
      ...pool,
      feeAmountDai: (pool.feeAmountCDai || 0) * exchangeRate,
      participantDetails: poolParticipants,
      totalInterest: poolParticipants.reduce((totalInterest, participant) => 
        totalInterest += participant.interest, 0), 
    }
  }
)

const selectAdminPoolDetailsPage = createStructuredSelector<RootState, OwnProps, StateProps>({
  pool: selectAdminPoolDetails,
});

export default selectAdminPoolDetailsPage;