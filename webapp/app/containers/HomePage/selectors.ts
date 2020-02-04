import { createSelector, createStructuredSelector } from 'reselect';
import { RootState } from './types';
import { StateProps } from '.';
import { selectEthAddress, selectExchangeRate, selectInterestRate } from 'containers/App/selectors';

/**
 * Direct selector to the homePage state domain
 */

export const selectPools = createSelector((state: RootState) => state.pools, selectEthAddress, selectExchangeRate, selectInterestRate, (pools, ethAddress, exchangeRate, interestRate) =>
  Object.values(pools).map(p => {

    const cdaiBalancePool = p.transactions?.reduce((poolCdaiBalance, t) =>
    t.type === 'Deposit' ? poolCdaiBalance += t.cdaiAmount : poolCdaiBalance -= t.cdaiAmount, 0) || 0;
    
    const cdaiByUser =  ethAddress ?
    p.transactions?.filter(t => t.userAddress.toUpperCase() === ethAddress.toUpperCase())
      .reduce((poolCdaiBalance, t) => t.type === 'Deposit' ? poolCdaiBalance += t.cdaiAmount : poolCdaiBalance -= t.cdaiAmount, 0) : 0;

    const contribution =  ethAddress ?
    p.transactions?.filter(t => t.userAddress === ethAddress)
      .reduce((contribution, t) => t.type === 'Deposit' ? contribution += t.amount : contribution -= t.amount, 0) : 0;

    const balance = p.transactions?.reduce((poolBalance, t) =>
    t.type === 'Deposit' ? poolBalance += t.amount : poolBalance -= t.amount, 0) || 0;
    
   const penaltyAmount = p.userTotalBalanceAndPenaltiesCDai ? (p.userTotalBalanceAndPenaltiesCDai - cdaiByUser): 0;

    return {
      ...p,
      interestRate: interestRate,
      balance: balance,
      cdaiBalance: cdaiBalancePool,
      participants: new Set(p.transactions?.map(t => t.userAddress)).size,
      contribution: contribution,
      interestAccrued: ((cdaiByUser + penaltyAmount) * exchangeRate) - contribution,
      availableInterest: p.period === 0 ? ((cdaiByUser + penaltyAmount) * exchangeRate) - contribution : 0
    }
  })
);
const selectPoolsBalance = createSelector(selectPools, allPools => allPools.reduce((totalBalance, pool) => totalBalance += pool.balance, 0))


const selectHomePage = createStructuredSelector<RootState, StateProps>({
  pools: selectPools,
  poolsBalance: selectPoolsBalance
});


export default selectHomePage;
