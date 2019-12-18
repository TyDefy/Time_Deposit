/**
 *
 * PortfolioPage
 *
 */

import React from 'react';
import { connect } from 'react-redux';

import { compose, Dispatch } from 'redux';
import Portfolio from 'components/Portfolio';
import { Pool } from 'containers/App';
import selectPortfolioPage from './selectors';

interface OwnProps {}

interface DispatchProps {}

export interface StateProps {
  pools: Array<Pool>,
  totalHoldings: number,
  portfolioInterestRate: number,
  contributed: number,
  interestAccrued: number,
  interestAvailable: number,
}

type Props = StateProps & DispatchProps & OwnProps;

const PortfolioPage: React.FC<Props> = (props: Props) => <Portfolio {...props} />;

const mapStateToProps = (state) => selectPortfolioPage(state);

const mapDispatchToProps = (
  dispatch: Dispatch,
  ownProps: OwnProps,
): DispatchProps => {
  return {
    dispatch: dispatch,
  };
};

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(withConnect)(PortfolioPage);
