import { createStructuredSelector, createSelector } from 'reselect';
import { RootState } from 'containers/App/types';
import { StateProps } from '.';
import { selectPools } from 'containers/HomePage/selectors';
import { selectExchangeRate, selectInterestRate, selectEthAddress } from 'containers/App/selectors';

const selectPortfolioPools = createSelector(selectPools, selectEthAddress,
  (allPools, ethAddress) => allPools.filter(p => ethAddress && 
    p.daiBalances[ethAddress] && p.daiBalances[ethAddress] > 0))

const selectPortfolioTotalHoldings = createSelector(selectPortfolioPools, 
  selectEthAddress, 
  selectExchangeRate, 
  (pools, ethAddress, exchangeRate) => 
  pools.reduce((total, pool) => total += ethAddress && pool.cdaiBalances[ethAddress] ? 
  pool.cdaiBalances[ethAddress] * exchangeRate : 0, 0)
);

const selectPortfolioContributed = createSelector(selectPortfolioPools,
  pools => pools.reduce((total, pool) => total += pool.contribution || 0, 0));
  
const selectPortfolioInterestAccrued = createSelector(selectPortfolioPools,
  pools => pools.reduce((total, pool) => total += pool.interestAccrued || 0, 0));

const selectPortfolioInterestAvailable = createSelector(selectPortfolioPools,
  pools => pools.reduce((total, pool) => total += pool.availableInterest || 0, 0));

const selectPortfolioPage = createStructuredSelector<RootState, StateProps>({
  pools: selectPortfolioPools,
  totalHoldings: selectPortfolioTotalHoldings,
  portfolioInterestRate: selectInterestRate,
  contributed: selectPortfolioContributed,
  interestAccrued: selectPortfolioInterestAccrued,
  interestAvailable: selectPortfolioInterestAvailable,
});

export default selectPortfolioPage;