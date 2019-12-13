/**
 *
 * PortfolioPage
 *
 */

import React from 'react';
import { connect } from 'react-redux';

import { compose, Dispatch } from 'redux';

interface OwnProps {}

interface DispatchProps {}

type Props = DispatchProps & OwnProps;

const PortfolioPage: React.FC<Props> = (props: Props) => <>PortfolioPage</>;

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
