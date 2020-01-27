import { BlockchainContext } from "blockchainContext";
import { getContext, takeEvery, call, put, fork, take, select, delay } from "redux-saga/effects";
import { 
  poolDeployed, 
  addPoolTx, 
  connectMetamask, 
  deposit, 
  withdraw, 
  withdrawInterest, 
  setPoolInterestRate,
  terminatePool, 
  // setPoolInterestAccrued 
} from "./actions";
import { getType } from "typesafe-actions";
import { Contract, ContractTransaction } from "ethers";
import PoolContractAbi from '../../../../blockchain/build/abis/BasicPool-abi.json';
import { BasicPool as Pool } from '../../../../blockchain/contractInterfaces/BasicPool';
import { Log } from "ethers/providers";
import { formatEther, parseEther, BigNumber } from "ethers/utils";
import { eventChannel } from "redux-saga";
import { selectLatestPoolTxTime } from "./selectors";
import { enqueueSnackbar } from "containers/Notification/actions";
import { setTxContext, setTxHash } from "containers/TransactionModal/actions";

function* poolTerminateListener(poolContract: Pool) {
  while (true) {
    const action = yield take(getType(terminatePool.request));
    const { signer }: BlockchainContext = yield getContext('blockchain');
    if (signer) {
      //@ts-ignore
      const writeableContract = poolContract.connect(signer);
      if (action.payload.poolAddress === poolContract.address) {
        try {
          yield put(setTxContext('Terminating pool'));
          const tx: ContractTransaction = yield call(
            //@ts-ignore
            [writeableContract, writeableContract.terminatePool]);
          yield put(setTxHash(tx.hash));
          yield call([tx, tx.wait]);
          yield put(terminatePool.success());
          yield put(enqueueSnackbar({
            message: 'Pool terminated successfully'
          }))
        } catch (error) {
          yield put(terminatePool.failure(error.message));
          yield put(enqueueSnackbar({
            message: 'Something went wrong processing the transaction',
            options: {
              variant: 'error',
            }
          }))
        }
      }
    } else {
      yield put(enqueueSnackbar({
        message: 'Please connect with metamask to continue',
        options: {
          variant: 'error'
        }
      }))
      yield put(deposit.failure('Please connect with metamask'));
      yield take(getType(connectMetamask.success));
    }
  }
}

function* poolDepositListener(poolContract: Pool) {
  while (true) {
    const action = yield take(getType(deposit.request));
    const { signer }: BlockchainContext = yield getContext('blockchain');
    if (signer) {
      //@ts-ignore
      const writeableContract = poolContract.connect(signer);
      const { daiContract, ethAddress }: BlockchainContext = yield getContext('blockchain');
      if (action.payload.poolAddress === poolContract.address) {
        try {
          //@ts-ignore
          const allowance: BigNumber = yield call([daiContract, daiContract.allowance], ethAddress, poolContract.address);
          const depositAmount = parseEther(action.payload.amount.toString());
          if (allowance.lt(depositAmount)) {
            yield put(setTxContext('Increasing allowance'));
            //@ts-ignore
            const approvalTx: ContractTransaction = yield call([daiContract, daiContract.approve], poolContract.address, depositAmount);
            yield put(setTxHash(approvalTx.hash));
            yield call([approvalTx, approvalTx.wait]);
            yield put(enqueueSnackbar({
              message: 'Successfully increased allowance'
            }))
          }
          yield put(setTxContext('Depositing funds'));
          const tx: ContractTransaction = yield call(
            //@ts-ignore
            [writeableContract, writeableContract.deposit],
            depositAmount
          );
          yield put(setTxHash(tx.hash));
          yield call([tx, tx.wait]);
          yield put(deposit.success());
          yield put(enqueueSnackbar({
            message: 'Deposit successful'
          }))
        } catch (error) {
          yield put(deposit.failure(error.message));
          yield put(enqueueSnackbar({
            message: 'Something went wrong processing the transaction',
            options: {
              variant: 'error',
            }
          }))
        }
      }
    } else {
      yield put(enqueueSnackbar({
        message: 'Please connect with metamask to continue',
        options: {
          variant: 'error'
        }
      }))
      yield put(deposit.failure('Please connect with metamask'));
      yield take(getType(connectMetamask.success));
    }
  }
}

function* poolWithdrawListener(poolContract: Pool) {
  while (true) {
    const action = yield take(getType(withdraw.request));
    const { signer }: BlockchainContext = yield getContext('blockchain');
    if (signer) {
      //@ts-ignore
      const writeableContract = poolContract.connect(signer);
      if (action.payload.poolAddress === poolContract.address) {
        try {
          //@ts-ignore
          const withdrawAmount = parseEther(action.payload.amount.toString());
          yield put(setTxContext('Withdrawing funds'));
          const tx: ContractTransaction = yield call(
            //@ts-ignore
            [writeableContract, writeableContract.withdraw],
            withdrawAmount
          );
          yield put(setTxHash(tx.hash));
          yield call([tx, tx.wait]);
          yield put(withdraw.success());
          yield put(enqueueSnackbar({
            message: 'Withdrawl successful'
          }))
        } catch (error) {
          yield put(withdraw.failure(error.message));
          yield put(enqueueSnackbar({
            message: 'Something went wrong processing the transaction',
            options: {
              variant: 'error',
            }
          }))
        }
      }
    } else {
      yield put(enqueueSnackbar({
        message: 'Please connect with metamask to continue',
        options: {
          variant: 'error'
        }
      }))
      yield put(withdraw.failure('Please connect with metamask'));
      yield take(getType(connectMetamask.success));
    }
  }
}

function* poolWithdrawInterestListener(poolContract: Pool) {
  while (true) {
    const action = yield take(getType(withdrawInterest.request));
    const { signer }: BlockchainContext = yield getContext('blockchain');
    if (signer) {
      //@ts-ignore
      const writeableContract = poolContract.connect(signer);
      if (action.payload.poolAddress === poolContract.address) {
        try {
          // const withdrawAmount = parseEther(action.payload.amount.toString());
          yield put(setTxContext('Withdrawing interest'));
          const tx: ContractTransaction = yield call(
            //@ts-ignore
            [writeableContract, writeableContract.withdrawInterest],
            // withdrawAmount
          );
          yield put(setTxHash(tx.hash));
          yield call([tx, tx.wait]);
          yield put(withdrawInterest.success());
          yield put(enqueueSnackbar({
            message: 'Withdrawl successful'
          }))
        } catch (error) {
          yield put(withdrawInterest.failure(error.message));
          yield put(enqueueSnackbar({
            message: 'Something went wrong processing the transaction',
            options: {
              variant: 'error',
            }
          }))
        }
      }
    } else {
      yield put(enqueueSnackbar({
        message: 'Please connect with metamask to continue',
        options: {
          variant: 'error'
        }
      }))
      yield put(withdrawInterest.failure('Please connect with metamask'));
      yield take(getType(connectMetamask.success));
    }
  }
}

function* poolTransactionListener(poolContract: Pool) {
  const { provider }: BlockchainContext = yield getContext('blockchain');

  const poolTransactionChannel = eventChannel(emit => {
    const depositHandler = (address, daiAmount, cDaiAmount, tx) => {
      emit({
        type: 'Deposit',
        address,
        daiAmount,
        cDaiAmount,
        blockNumber: tx.blockNumber,
        transactionHash: tx.transactionHash,
      })
    };
    const withdrawHandler = (address, withdrawAmount, penaltyAmount, tx) => {
      emit({
        type: 'Withdraw',
        address,
        withdrawAmount,
        penaltyAmount,
        blockNumber: tx.blockNumber,
        transactionHash: tx.transactionHash,
      })
    };
    poolContract.on(poolContract.filters.Deposit(null, null, null), depositHandler);
    poolContract.on(poolContract.filters.Withdraw(null, null, null), withdrawHandler);
    return () => {
      poolContract.off(poolContract.filters.Deposit(null, null, null), depositHandler);
      poolContract.off(poolContract.filters.Withdraw(null, null, null), withdrawHandler);
    };
  });

  while (true) {
    const newTx = yield take(poolTransactionChannel);
    const txDate = yield call([provider, provider.getBlock], newTx.blockNumber);
    const latestTx = yield select(selectLatestPoolTxTime(poolContract.address));
    if (new Date(txDate.timestamp * 1000) > latestTx) {
      (newTx.type === 'Deposit') ?
        yield put(addPoolTx({
          poolAddress: poolContract.address,
          userAddress: newTx.address,
          type: 'Deposit',
          txHash: newTx.transactionHash || '0x',
          time: new Date(txDate.timestamp * 1000),
          amount: Number(formatEther(newTx.daiAmount)),
        })) :
        yield put(addPoolTx({
          poolAddress: poolContract.address,
          userAddress: newTx.address,
          type: 'Withdraw',
          txHash: newTx.transactionHash || '0x',
          time: new Date(txDate.timestamp * 1000),
          amount: Number(formatEther(newTx.withdrawAmount.add(newTx.penaltyAmount)))
        }))
    }
  }
}

function* poolInterestListener(poolContract: Pool) {
  while (true) {
    // const { ethAddress }: BlockchainContext = yield getContext('blockchain');

    const poolInterestRate: BigNumber = yield call([poolContract, poolContract.getInterestRatePerYear]);
    yield put(setPoolInterestRate({
      poolAddress: poolContract.address, 
      interestRate: Number(formatEther(poolInterestRate))
    }));
  
    // if (ethAddress) {
    //   const poolInterestAccrued: BigNumber = yield call([poolContract, poolContract.getInterestAmount], ethAddress);
    //   yield put(setPoolInterestAccrued({
    //     poolAddress: poolContract.address,
    //     interestAccrued: Number(formatEther(poolInterestAccrued))}
    //   ))
    // }

    yield delay(15000);
  }
}

function* poolWatcherSaga(action) {
  const { provider, signer }: BlockchainContext = yield getContext('blockchain');

  //@ts-ignore
  const poolContract: Pool = new Contract(action.payload.address, PoolContractAbi, signer || provider)

  try {
    const depositLogs: Log[] = yield call([provider, provider.getLogs], {
      ...poolContract.filters.Deposit(null, null, null),
      fromBlock: 0,
      toBlock: 'latest',
    })

    const depositTxActions = yield Promise.all(depositLogs.map(
      async log => {
        const parsedDeposit = poolContract.interface.parseLog(log).values;
        return addPoolTx({
          poolAddress: poolContract.address,
          userAddress: parsedDeposit.user,
          type: 'Deposit',
          txHash: log.transactionHash || '0x',
          time: new Date((await provider.getBlock(log.blockNumber || 0)).timestamp * 1000),
          amount: Number(formatEther(parsedDeposit.amountInCollateral)),
        })
      }));

    const withdrawLogs: Log[] = yield call([provider, provider.getLogs], {
      ...poolContract.filters.Withdraw(null, null, null),
      fromBlock: 0,
      toBlock: 'latest',
    })

    const withdrawTxActions = yield Promise.all(withdrawLogs.map(
      async log => {
        const parsedWithdraw = poolContract.interface.parseLog(log).values;

        return addPoolTx({
          poolAddress: poolContract.address,
          userAddress: parsedWithdraw.user,
          type: 'Withdraw',
          txHash: log.transactionHash || '0x',
          time: new Date((await provider.getBlock(log.blockNumber || 0)).timestamp * 1000),
          amount: Number(formatEther(parsedWithdraw.withdrawAmount.add(parsedWithdraw.penaltyAmount)))
        })
      }));

    const actions = depositTxActions.concat(withdrawTxActions).sort((a, b) => a.time - b.time);

    for (const action of actions) {
      yield put(action);
    }
  } catch (error) {
    console.log('There was an error getting the pools transaction logs');
    console.log(error);
  }

  yield fork(poolInterestListener, poolContract);
  yield fork(poolTransactionListener, poolContract);
  yield fork(poolDepositListener, poolContract);
  yield fork(poolWithdrawListener, poolContract);
  yield fork(poolWithdrawInterestListener, poolContract);
  yield fork(poolTerminateListener, poolContract);
}

export default function* poolSaga() {
  yield takeEvery(getType(poolDeployed), poolWatcherSaga)
}