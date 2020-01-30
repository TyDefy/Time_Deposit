import { createSelector, createStructuredSelector } from 'reselect';
import { RootState } from './types';
import { StateProps } from '.';
import { selectEthAddress, selectExchangeRate, selectInterestRate } from 'containers/App/selectors';
import dayjs from 'dayjs';

/**
 * Direct selector to the homePage state domain
 */

export const selectPools = createSelector(
  (state: RootState) =>
  state.pools,
  selectEthAddress,
  selectExchangeRate,
  selectInterestRate,
  (pools, ethAddress, exchangeRate, interestRate) =>
    Object.values(pools).map(p => {
      const cdaiBalance = p.transactions.reduce((poolCdaiBalance, t) =>
        t.type === 'Deposit' ? poolCdaiBalance += t.cdaiAmount : poolCdaiBalance -= t.cdaiAmount, 0) || 0;

      const contribution = ethAddress ?
        p.transactions?.filter(t => t.userAddress === ethAddress)
          .reduce((contribution, t) => t.type === 'Deposit' ? contribution += t.amount : contribution -= t.amount, 0) : 0;

      const cdaiByUser = ethAddress ?
        p.transactions?.filter(t => t.userAddress === ethAddress)
          .reduce((cdaiByUser, t) => t.type === 'Deposit' ? cdaiByUser += t.cdaiAmount : cdaiByUser -= t.cdaiAmount, 0) : 0;

      const balance = p.transactions?.reduce((poolBalance, t) =>
        t.type === 'Deposit' ? poolBalance += t.amount : poolBalance -= t.amount, 0) || 0;


      var lastWithdrawDate = p.userLastWithdrawDate;
      var withdrawDate;
      if (p.period !== 0 && lastWithdrawDate) {
        let getMonths = lastWithdrawDate.getMonth() + p.period;
        withdrawDate = lastWithdrawDate.setMonth(getMonths);
      }

      const daysUntilAccess = lastWithdrawDate && p.period !== 0 ? Math.abs(dayjs(withdrawDate).diff(Date.now(), 'day')).toString() : '-';

      return {
        ...p,
        interestRate: interestRate,
        balance: balance,
        cdaiBalance: cdaiBalance,
        participants: new Set(p.transactions?.map(t => t.userAddress)).size,
        contribution: contribution,
        interestAccrued: (cdaiBalance * exchangeRate) - balance,
        availableInterest: p.period === 0 ? (cdaiByUser * exchangeRate) - contribution : 0,
        daysUntilAccess: daysUntilAccess,
      }
    })
);
const selectPoolsBalance = createSelector(selectPools, allPools => allPools.reduce((totalBalance, pool) => totalBalance += pool.balance, 0))


const selectHomePage = createStructuredSelector<RootState, StateProps>({
  pools: selectPools,
  poolsBalance: selectPoolsBalance
});


export default selectHomePage;
