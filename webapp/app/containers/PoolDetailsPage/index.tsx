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

interface OwnProps { }

interface DispatchProps { }

export interface StateProps {
  // pool: UserPoolDetails,
  // daiBalance: number,
}

export interface Transaction {
  address: string;
  time: Date;
  type: 'Contribute' | 'Withdraw';
  amount: number;
}

export interface UserPoolDetails extends Pool {
  contribution: number;
  interestAccrued: number;
  availableInterest: number;
  transactions: Array<Transaction>;
}

const pool: UserPoolDetails = {
  address: '0x1',
  name: 'Test',
  period: 3,
  interestRate: 0.07,
  type: 'cDAI',
  balance: 900,
  participants: 5,
  availableInterest: 0,
  interestAccrued: 10,
  contribution: 50,
  transactions: [
    { address: '0x2', time: new Date(), type: 'Contribute', amount: 1 },
    { address: '0x3', time: new Date(), type: 'Contribute', amount: 1 },
    { address: '0x4', time: new Date(), type: 'Contribute', amount: 1 },
    { address: '0x5', time: new Date(), type: 'Contribute', amount: 1 },
    { address: '0x6', time: new Date(), type: 'Contribute', amount: 1 },
  ]
}

const daiBalance = 100;

type Props = StateProps & DispatchProps & OwnProps;
type ModalType = 'invest' | 'withdrawInterest' | 'withdrawAll';

const PoolDetailsPage: React.FunctionComponent<Props> = (props: Props) => {
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
              daiBalance={daiBalance}
              currentInterestRate={pool.interestRate}
              nextWithdrawlDate={new Date()}
              type={pool.type}
              onClose={() => setShowModal(false)}
              onSubmit={(value) => console.log(value)} />;
          case 'withdrawInterest':
            return <WithdrawInterestModal 
              name={pool.name}
              type={pool.type}
              availableInterest={pool.availableInterest}
              onSubmit={(value) => console.log(value)}
              onClose={() => setShowModal(false)} />;
          case 'withdrawAll':
            return <WithdrawAllModal 
            name={pool.name}
            type={pool.type}
            availableFunds={pool.availableInterest}
            onSubmit={(value) => console.log(value)}
            onClose={() => setShowModal(false)} />;
          default:
            return null;
        }
      })()}
    </Dialog>
  </>;
};

const mapStateToProps = state => selectPoolDetailsPage(state);

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

export default compose(
  withConnect,
)(PoolDetailsPage);
