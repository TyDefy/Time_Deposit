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

interface RouteParams {
  poolAddress: string;
}

export interface OwnProps extends RouteComponentProps<RouteParams>,
  React.Props<RouteParams> { }


interface DispatchProps { }

export interface StateProps {
  pool: Pool,
  daiBalance: number,
}

export interface Transaction {
  address: string;
  time: Date;
  type: 'Contribute' | 'Withdraw';
  amount: number;
}

type Props = StateProps & DispatchProps & OwnProps;
type ModalType = 'invest' | 'withdrawInterest' | 'withdrawAll';

const PoolDetailsPage: React.FunctionComponent<Props> = ({pool, daiBalance}: Props) => {
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
              currentInterestRate={pool.interestRate || 0}
              nextWithdrawlDate={new Date()}
              type={pool.type}
              onClose={() => setShowModal(false)}
              onSubmit={(value) => console.log(value)} />;
          case 'withdrawInterest':
            return <WithdrawInterestModal 
              name={pool.name}
              type={pool.type}
              availableInterest={pool.availableInterest || 0}
              onSubmit={(value) => console.log(value)}
              onClose={() => setShowModal(false)} />;
          case 'withdrawAll':
            return <WithdrawAllModal 
            name={pool.name}
            type={pool.type}
            availableFunds={pool.availableInterest || 0}
            onSubmit={(value) => console.log(value)}
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
