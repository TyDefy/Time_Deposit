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
    { address: '0x1', withdraw: '0xWithdraw', name: 'Test 1', description:'test description', type: 'cDAI', period: 1, balance: 500, participants: 100, interestRate: 0.035,  },
    { address: '0x2', withdraw: '0xWithdraw', name: 'Test 2', description:'test description', type: 'cDAI', period: 2, balance: 1000, participants: 200, interestRate: 0.07 },
    { address: '0x3', withdraw: '0xWithdraw', name: 'Test 3', description:'test description', type: 'cDAI', period: 3, balance: 2000, participants: 500, interestRate: 0.105 },
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
