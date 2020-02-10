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

    const poolPenaltyBalance = p.penaltyPotBalance ? (p.penaltyPotBalance * exchangeRate): 0;
    
    const cdaiByUser =  ethAddress ?
    p.transactions?.filter(t => t.userAddress.toUpperCase() === ethAddress.toUpperCase())
      .reduce((poolCdaiBalance, t) => t.type === 'Deposit' ? poolCdaiBalance += t.cdaiAmount : poolCdaiBalance -= t.cdaiAmount, 0) : 0;

    const contribution =  ethAddress ?
    p.transactions?.filter(t => t.userAddress.toUpperCase() === ethAddress.toUpperCase())
      .reduce((contribution, t) => t.type === 'Deposit' ? contribution += t.amount : contribution -= t.amount, 0) : 0;

    const balance = p.transactions?.reduce((poolBalance, t) =>
        t.type === 'Deposit' ? poolBalance += t.amount : poolBalance -= t.amount, 0) || 0;
    
    
    const totalAmountwithPenalties = contribution > 0 && p.userTotalBalanceAndPenaltiesCDai ? (p.userTotalBalanceAndPenaltiesCDai* exchangeRate): 0;

      var lastWithdrawDate = p.userLastWithdrawDate;
      var withdrawDate;
      if (p.period !== 0 && lastWithdrawDate) {
        let getMonths = lastWithdrawDate.getMonth() + p.period;
        let withdrawDateValue = lastWithdrawDate;
        withdrawDate = withdrawDateValue.setMonth(getMonths);
      }

      
      const daysUntilAccess = lastWithdrawDate && p.period !== 0 ? Math.abs(dayjs(withdrawDate).diff(Date.now(), 'day')).toString() : '-';

      return {
        ...p,
        interestRate: interestRate,
        balance: (cdaiBalancePool * exchangeRate) + poolPenaltyBalance,
        cdaiBalance: cdaiBalancePool,
        participants: balance > 0 ? new Set(p.transactions?.map(t => t.userAddress)).size : 0,
        contribution: contribution,
        interestAccrued: contribution > 0 ? totalAmountwithPenalties - contribution : 0,
        availableInterest: p.period === 0 ? totalAmountwithPenalties - contribution : 0,
        daysUntilAccess: contribution > 0 ? daysUntilAccess : '-',
      }
    })
);

const selectActivePools = createSelector(selectPools, allPools => allPools.filter(p => p.active));
const selectPoolsBalance = createSelector(selectPools, allPools => allPools.reduce((totalBalance, pool) => totalBalance += pool.balance, 0))


const selectHomePage = createStructuredSelector<RootState, StateProps>({
  pools: selectActivePools,
  poolsBalance: selectPoolsBalance
});


export default selectHomePage;
