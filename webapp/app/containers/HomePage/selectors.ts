import { createSelector, createStructuredSelector } from 'reselect';
import { RootState } from './types';
import { StateProps } from '.';
import { selectEthAddress, selectExchangeRate, selectInterestRate } from 'containers/App/selectors';
import dayjs from 'dayjs';

/**
 * Direct selector to the homePage state domain
 */

export const selectPools = createSelector(
  (state: RootState) => state.pools, 
  selectEthAddress, 
  selectExchangeRate, 
  selectInterestRate, 
  (pools, ethAddress, exchangeRate, interestRate) =>
  Object.values(pools).map(p => {
    const daiBalance = Object.values(p.daiBalances).reduce((total, userBalance) => total += userBalance, 0);
    const cdaiBalance = Object.values(p.cdaiBalances).reduce((total, userCDaiBalance) => total += userCDaiBalance, 0);
    const contribution = ethAddress && p.daiBalances[ethAddress.toLowerCase()] ? 
      p.daiBalances[ethAddress.toLowerCase()] : 0;
    const currentValue = ethAddress && p.cdaiBalances[ethAddress.toLowerCase()] ? 
      p.cdaiBalances[ethAddress.toLowerCase()] : 0;
    const userBalanceWithPenalty = (currentValue + p.userPenaltyPotBalanceCDai) * exchangeRate;

    const lastDepositDate = p.transactions
      .filter(t => t.userAddress.toLowerCase() === ethAddress?.toLowerCase() && t.type === 'Deposit')
      .map(t => t.time)
      .reduce((a, b) => a > b ? a : b, new Date('01/01/1970'));

    const daysUntilAccess = (contribution > 0) ? dayjs(lastDepositDate).add(p.period, 'month').diff(Date.now(), 'day') : 0;

    const poolPenaltyBalance = p.penaltyPotBalanceCDai ? p.penaltyPotBalanceCDai * exchangeRate : 0;
    return {
      ...p,
      interestRate: interestRate,
      balance: daiBalance,
      cdaiBalance: cdaiBalance,
      penaltyPotBalanceDai: poolPenaltyBalance,
      participants: new Set(p.transactions?.map(t => t.userAddress)).size,
      contribution: contribution,
      interestAccrued: Math.abs((cdaiBalance * exchangeRate) - daiBalance),
      availableInterest: Math.abs(userBalanceWithPenalty - contribution),
      daysUntilAccess: daysUntilAccess,
    }
  })
);

export const selectPoolParticipantAddresses = (poolAddress: string) => createSelector((state: RootState) =>
  state.pools, (allPools) => {
    const pool = Object.values(allPools).filter(p => p.address === poolAddress)[0];
    const participants = new Set(pool.transactions?.map(t => t.userAddress));
    return [...participants]
  });

const selectActivePools = createSelector(selectPools, allPools => allPools.filter(p => p.active));
const selectPoolsBalance = createSelector(selectPools, allPools => allPools.reduce((totalBalance, pool) => totalBalance += pool.balance, 0))


const selectHomePage = createStructuredSelector<RootState, StateProps>({
  pools: selectActivePools,
  poolsBalance: selectPoolsBalance
});


export default selectHomePage;
