import { createAsyncAction, createStandardAction } from "typesafe-actions";

export const connectMetamask = createAsyncAction(
  'REQUEST/CONNECT_METAMASK',
  'SUCCESS/CONNECT_METAMASK',
  'FAILURE/CONNECT_METAMASK')
  <undefined,
    {
      approvedNetwork: boolean,
      ethAddress: string,
      networkName?: string,
      chainId: number
    },
    string>();

export const setWeb3 = createStandardAction('BLOCKCHAIN_READY')<{
  isMetamaskInstalled: boolean,
  approvedNetworkName: string,
  approvedChainId: number
}>();

export const setDaiBalance = createStandardAction('SET_DAI_BALANCE')<number>();
export const setIsAdmin = createStandardAction('SET_IS_ADMIN')<boolean>();
export const poolDeployed = createStandardAction('POOL_DEPLOYED')<{
  address: string,
  withdraw: string,
  name: string,
  description: string,
  type: string,
  period: number,
  active: boolean,
  canWithdrawInterestInViolation: boolean,
  canWithdrawInViolation: boolean,
  penaltyRate: number,
}>();

export const setCDaiRates = createAsyncAction(
'REQUEST/SET_CDAI_RATES', 
'SUCCESS/SET_CDAI_RATES', 
'FAILURE/SET_CDAI_RATES')
<undefined, 
{
  exchangeRate: number,
  interestRate: number
},
string>();

export const setUserPoolBalance = createStandardAction(
  'SET_USER_POOL_BALANCE')
  <{
    poolAddress: string,
    userBalance: number
  }>();

  export const setPoolPenaltyPotBalance = createStandardAction(
    'SET_POOL_PENALTY_POT_BALANCE')
    <{
      poolAddress: string,
      penaltyPotBalance: number
    }>();

export const setUserInfo = createStandardAction('SET_USER_INFO')<{
    lastDepositDate: Date;
    lastWithdrawDate: Date;
    poolAddress: string;
  }>();

export const createPool = createAsyncAction(
  '@TX_REQUEST/CREATE_POOL',
  '@TX_SUCCESS/CREATE_POOL',
  '@TX_FAILURE/CREATE_POOL')<{
    name: string,
    description: string,
    type: number,
    utilityAddress: string,
    cycleLength: number,
    withdrawName: string,
    penaltyAddress: string,
    penaltyName: string,
    penaltyRate: number,
    feeRate: number,
    canWithdrawInViolation: boolean,
    canWithdrawInterestInViolation: boolean,
  }, 
  undefined, 
  string>();

export const addPoolTx = createStandardAction('ADD_POOL_TX')<{
  poolAddress: string,
  userAddress: string;
  time: Date;
  type: 'Deposit' | 'Withdraw' | 'Penalty' | 'Withdraw Interest';
  amount: number;
  cdaiAmount: number;
  txHash: string;
}>()

export const setPoolInterestRate = createStandardAction('SET_POOL_INTEREST_RATE')<{
  poolAddress: string;
  interestRate: number;
}>()

export const setPoolFeeRate = createStandardAction('SET_POOL_FEE_RATE')<{
  poolAddress: string;
  feeRate: number;
}>()

export const setPoolInterestAccrued = createStandardAction('SET_POOL_INTEREST_ACCRUED')<{
  poolAddress: string;
  interestAccrued: number;
}>()

export const setPoolFeeAmount = createStandardAction('SET_POOL_FEE_AMOUNT')<{
  poolAddress: string;
  feeAmount: number;
}>()

export const deposit = createAsyncAction(
  '@TX_REQUEST/POOL_DEPOSIT',
  '@TX_SUCCESS/POOL_DEPOSIT',
  '@TX_FAILURE/POOL_DEPOSIT',
)<{poolAddress: string, amount: number}, undefined, string>();

export const withdrawInterest = createAsyncAction(
  '@TX_REQUEST/WITHDRAW_INTEREST',
  '@TX_SUCCESS/WITHDRAW_INTEREST',
  '@TX_FAILURE/WITHDRAW_INTEREST',
)<{poolAddress: string, amount: number}, undefined, string>();

export const withdraw = createAsyncAction(
  '@TX_REQUEST/WITHDRAW',
  '@TX_SUCCESS/WITHDRAW',
  '@TX_FAILURE/WITHDRAW',
)<{poolAddress: string, amount: number}, undefined, string>();

export const withdrawAll = createAsyncAction(
  '@TX_REQUEST/WITHDRAW_ALL',
  '@TX_SUCCESS/WITHDRAW_ALL',
  '@TX_FAILURE/WITHDRAW_ALL',
)<{poolAddress: string}, undefined, string>();

export const utilityDeployed = createStandardAction('UTILITY_DEPLOYED')<{
  withdrawAddress: string,
  cycleLength: number,
  withdrawName: string,
  penaltyAddress: string,
  penaltyRate: number,
  penaltyName: string,
  canWithdrawInViolation: boolean,
  canWithdrawInterestInViolation: boolean,
}>();

export const terminatePool = createAsyncAction(
  '@TX_REQUEST/TERMINATE_POOL',
  '@TX_SUCCESS/TERMINATE_POOL',
  '@TX_FAILURE/TERMINATE_POOL',
)<{poolAddress: string}, {poolAddress: string}, string>();

export const withdrawPoolFee = createAsyncAction(
  '@TX_REQUEST/WITHDRAW_POOL_FEE',
  '@TX_SUCCESS/WITHDRAW_POOL_FEE',
  '@TX_FAILURE/WITHDRAW_POOL_FEE',
)<{poolAddress: string}, {poolAddress: string}, string>();