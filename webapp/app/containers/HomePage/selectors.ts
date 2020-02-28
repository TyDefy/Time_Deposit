import { createSelector, createStructuredSelector } from 'reselect';
import { RootState } from './types';
import { StateProps } from '.';
import { selectEthAddress, selectExchangeRate, selectInterestRate } from 'containers/App/selectors';
import dayjs from 'dayjs';

/**
 * Direct selector to the homePage state domain
 */

export const selectPools = createSelector((state: RootState) => state.pools, selectEthAddress, selectExchangeRate, selectInterestRate, (pools, ethAddress, exchangeRate, interestRate) =>
  Object.values(pools).map(p => {

    const cdaiBalancePool = p.transactions?.reduce((poolCdaiBalance, t) =>
      t.type === 'Deposit' ? poolCdaiBalance += t.cdaiAmount : poolCdaiBalance -= t.cdaiAmount, 0) || 0;

    const poolPenaltyBalance = p.penaltyPotBalanceCDai ? (p.penaltyPotBalanceCDai * exchangeRate) : 0;
    const contribution = ethAddress ?
      p.transactions?.filter(t => t.userAddress.toLowerCase() === ethAddress.toLowerCase())
        .reduce((contribution, t) => t.type === 'Deposit' ? contribution += t.amount : contribution -= t.amount, 0) : 0;

    const balance = p.transactions?.reduce((poolBalance, t) =>
      t.type === 'Deposit' ? poolBalance += t.amount : poolBalance -= t.amount, 0) || 0;


    const totalAmountWithPenalties = contribution > 0 && p.userBalanceCDai ? (p.userBalanceCDai * exchangeRate) : 0;

    //@ts-ignore
    const lastWithdrawDate = p.transactions
      .filter(t => t.userAddress.toLowerCase() === ethAddress?.toLowerCase() && t.type === 'Withdraw')
      .map(t => t.time)
      .reduce((a, b) => a > b ? a : b, new Date('01/01/1970'));

    const lastDepositDate = p.transactions
      .filter(t => t.userAddress.toLowerCase() === ethAddress?.toLowerCase() && t.type === 'Deposit')
      .map(t => t.time)
      .reduce((a, b) => a > b ? a : b, new Date('01/01/1970'));

    const daysUntilAccess = (contribution > 0) ? dayjs(lastDepositDate).add(p.period, 'month').diff(Date.now(), 'day') : 0;

    return {
      ...p,
      interestRate: interestRate,
      balance: (cdaiBalancePool * exchangeRate) + poolPenaltyBalance,
      cdaiBalance: cdaiBalancePool,
      penaltyPotBalanceDai: poolPenaltyBalance,
      participants: balance > 0 ? new Set(p.transactions?.map(t => t.userAddress)).size : 0,
      contribution: contribution,
      interestAccrued: contribution > 0 && totalAmountWithPenalties ? Math.abs(totalAmountWithPenalties - contribution) : 0,
      availableInterest: p.period === 0 && totalAmountWithPenalties ? Math.abs(totalAmountWithPenalties - contribution) : 0,
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
