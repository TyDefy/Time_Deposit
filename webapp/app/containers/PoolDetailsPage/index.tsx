/**
 *
 * PoolDetailsPage
 *
 */

import React, { useState } from 'react';
import { connect } from 'react-redux';

import { compose, Dispatch } from 'redux';

import selectPoolDetailsPage from './selectors';
import PoolDetails from 'components/PoolDetails';
import { Pool } from 'containers/App';
import { Dialog } from '@material-ui/core';
import InvestModal from 'components/InvestModal';
import WithdrawInterestModal from 'components/WithdrawInterestModal';
import WithdrawAllModal from 'components/WithdrawAllModal';
import { RouteComponentProps } from 'react-router-dom';
import { RootState } from './types';
import { deposit, withdraw, withdrawInterest } from 'containers/App/actions';

interface RouteParams {
  poolAddress: string;
}

export interface OwnProps extends RouteComponentProps<RouteParams>,
  React.Props<RouteParams> { }


interface DispatchProps {
  deposit(amount: number): void;
  withdraw(amount: number): void;
  withdrawInterest(amount: number): void;
}

export interface StateProps {
  pool: Pool,
  daiBalance: number,
  penaltyRate: number
}

export interface Transaction {
  userAddress: string;
  time: Date;
  type: 'Deposit' | 'Withdraw';
  amount: number;
  cdaiAmount: number;
  txHash: string;
}

type Props = StateProps & DispatchProps & OwnProps;
type ModalType = 'invest' | 'withdrawInterest' | 'withdrawAll';

const PoolDetailsPage: React.FunctionComponent<Props> = ({ 
  pool, 
  daiBalance, 
  deposit,
  withdrawInterest,
  withdraw,
  penaltyRate
}: Props) => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('invest');

  const displayModal = (modalToShow: ModalType) => {
    setShowModal(true);
    setModalType(modalToShow);
  }

  return <>
    <PoolDetails {...pool} showModal={displayModal} />
    <Dialog open={showModal}>
      {(() => {
        switch (modalType) {
          case 'invest':
            return <InvestModal
              name={pool.name}
              period={pool.period}
              daiBalance={daiBalance}
              currentInterestRate={pool.interestRate || 0}
              nextWithdrawlDate={pool.nextWithdrawDate? pool.nextWithdrawDate : new Date()}
              type={pool.type}
              onClose={() => setShowModal(false)}
              onSubmit={(value) => deposit(value)} />;
          case 'withdrawInterest':
            return <WithdrawInterestModal
              name={pool.name}
              type={pool.type}
              availableInterest={pool.availableInterest || 0}
              onSubmit={(value) => withdrawInterest(value)}
              onClose={() => setShowModal(false)} />;
          case 'withdrawAll':
            return <WithdrawAllModal
              name={pool.name}
              type={pool.type}
              penaltyRate={penaltyRate}
              availableFunds={(pool.contribution ? pool.contribution + (pool.availableInterest || 0) : 0)}
              onSubmit={(value) => withdraw(value)}
              onClose={() => setShowModal(false)} />;
          default:
            return null;
        }
      })()}
    </Dialog>
  </>;
};

const mapStateToProps = (state: RootState, props: OwnProps) => selectPoolDetailsPage(state, props);

const mapDispatchToProps = (
  dispatch: Dispatch,
  ownProps: OwnProps,
): DispatchProps => {
  return {
    deposit: (amount: number) => dispatch(deposit.request({poolAddress: ownProps.match.params.poolAddress, amount})),
    withdraw: (amount: number) => dispatch(withdraw.request({poolAddress: ownProps.match.params.poolAddress, amount})),
    withdrawInterest: (amount: number) => dispatch(withdrawInterest.request({poolAddress: ownProps.match.params.poolAddress, amount})),
  };
};

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(
  withConnect,
)(PoolDetailsPage);
