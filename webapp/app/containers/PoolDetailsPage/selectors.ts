import { createStructuredSelector, createSelector } from 'reselect';
import { RootState } from 'containers/App/types';
import { StateProps, OwnProps } from '.';
import { selectPools } from 'containers/HomePage/selectors';
import { selectDaiBalance, selectEthAddress, selectExchangeRate, selectInterestRate } from 'containers/App/selectors';

const selectSelectedPoolAddress = (state: RootState, props: OwnProps) => {
  return props.match.params.poolAddress
};

export const selectUtilities = createSelector((state: RootState) => state.utilities, substate => substate);

export const selectPool = createSelector(
  selectPools, 
  selectEthAddress,
  selectSelectedPoolAddress,
  selectExchangeRate,
  selectInterestRate, 
  (allPools, ethAddress, selectedPool, exchangeRate, interestRate) => {
    const pool = allPools.filter(p => p.address === selectedPool)[0];
    pool.transactions = pool.transactions?.filter(t => t.userAddress.toLowerCase() === ethAddress);
    pool.interestRate = interestRate;
    pool.contribution = pool.transactions?.reduce((total, transaction) => 
      (transaction.type === 'Deposit') ? total += transaction.amount : total -= transaction.amount, 0);

    if(pool.contribution > 0 && pool.period !== 0){
      pool.nextWithdrawDate = pool.userLastWithdrawDate; 
    
    }else if(pool.period !== 0){
      var periodMonthsFromNow = new Date();
      periodMonthsFromNow.setMonth(periodMonthsFromNow.getMonth() + pool.period);
      pool.nextWithdrawDate = periodMonthsFromNow
    }

    return pool;
  })


export const selectPoolPenalty = createSelector(
    selectPool,
    selectUtilities,
    (pool, utilities) => {
      const utility = utilities[pool.withdraw];
      return utility?.penaltyRate || 0;
    })

const selectPoolDetailsPage = createStructuredSelector<RootState, OwnProps, StateProps>({
  pool: selectPool,
  daiBalance: selectDaiBalance,
  penaltyRate: selectPoolPenalty
});

export default selectPoolDetailsPage;
