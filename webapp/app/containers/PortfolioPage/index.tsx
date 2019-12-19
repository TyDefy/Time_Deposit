/**
 *
 * PortfolioPage
 *
 */

import React from 'react';
import { connect } from 'react-redux';

import { compose, Dispatch } from 'redux';
import Portfolio from 'components/Portfolio';

interface OwnProps {}

interface DispatchProps {}

type Props = DispatchProps & OwnProps;

const portfolioProps = {
  totalHoldings: 1100,
  portfolioInterestRate: 0.035,
  contributed: 100,
  interestAccrued: 100,
  interestAvailable: 50,
  pools: [
    { address: '0x1', name: 'Test 1', type: 'cDAI', period: 1, balance: 500, participants: 100, interestRate: 0.035, description: "t" },
    { address: '0x2', name: 'Test 2', type: 'cDAI', period: 2, balance: 1000, participants: 200, interestRate: 0.07, description: "t" },
    { address: '0x3', name: 'Test 3', type: 'cDAI', period: 3, balance: 2000, participants: 500, interestRate: 0.105, description: "t" },
  ],
}

const PortfolioPage: React.FC<Props> = (props: Props) => <Portfolio {...portfolioProps} />;

const mapDispatchToProps = (
  dispatch: Dispatch,
  ownProps: OwnProps,
): DispatchProps => {
  return {
    dispatch: dispatch,
  };
};

const withConnect = connect(
  null,
  mapDispatchToProps,
);

export default compose(withConnect)(PortfolioPage);
