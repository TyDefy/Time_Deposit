import { createStructuredSelector, createSelector } from 'reselect';
import { RootState } from 'containers/App/types';
import { StateProps } from '.';
import { selectPools } from 'containers/HomePage/selectors';

const selectPortfolioPools = createSelector(selectPools,
  (allPools) => allPools.filter(p => p.contribution && p.contribution > 0))

const selectPortfolioTotalHoldings = createSelector(selectPortfolioPools,
  pools => pools.reduce((total, pool) => total += pool.contribution || 0, 0));

const selectPortfolioInterestRate = createSelector(selectPortfolioPools,
  pools => 0)

const selectPortfolioContributed = createSelector(selectPortfolioPools,
  pools => pools.reduce((total, pool) => total += pool.contribution || 0, 0));

const selectPortfolioInterestAccrued = createSelector(selectPortfolioPools,
  pools => pools.reduce((total, pool) => total += pool.interestAccrued || 0, 0));

const selectPortfolioInterestAvailable = createSelector(selectPortfolioPools,
  pools => pools.reduce((total, pool) => total += pool.interestAccrued || 0, 0));

const selectPortfolioPage = createStructuredSelector<RootState, StateProps>({
  pools: selectPortfolioPools,
  totalHoldings: selectPortfolioTotalHoldings,
  portfolioInterestRate: selectPortfolioInterestRate,
  contributed: selectPortfolioContributed,
  interestAccrued: selectPortfolioInterestAccrued,
  interestAvailable: selectPortfolioInterestAvailable,
});

export default selectPortfolioPage;