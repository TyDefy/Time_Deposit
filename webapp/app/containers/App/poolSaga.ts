import { BlockchainContext } from "blockchainContext";
import { getContext, takeEvery, call, put, fork, take, select, delay } from "redux-saga/effects";
import {
  poolDeployed,
  addPoolTx,
  connectMetamask,
  deposit,
  withdraw,
  withdrawInterest,
  setUserPoolBalance,
  setPoolPenaltyPotBalance,
  setPoolFeeRate,
  setPoolFeeAmount,
  withdrawPoolFee,
  terminatePool,
} from "./actions";
import { getType } from "typesafe-actions";
import { Contract, ContractTransaction } from "ethers";
import PoolContractAbi from '../../../../blockchain/build/abis/BasicPool-abi.json';
import { BasicPool as Pool } from '../../../../blockchain/contractInterfaces/BasicPool';
import { Log } from "ethers/providers";
import { formatEther, parseEther, BigNumber, formatUnits } from "ethers/utils";
import { eventChannel } from "redux-saga";
import { selectLatestPoolTxTime, selectIsAdmin, selectEthAddress } from "./selectors";
import { enqueueSnackbar } from "containers/Notification/actions";
import { setTxContext, setTxHash } from "containers/TransactionModal/actions";

function* terminatePoolListener(poolContract: Pool) {
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
          yield put(terminatePool.success({ poolAddress: poolContract.address }));
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

function* withdrawFeeListener(poolContract: Pool) {
  while (true) {
    const action = yield take(getType(withdrawPoolFee.request));
    const { signer }: BlockchainContext = yield getContext('blockchain');
    if (signer) {
      if (action.payload.poolAddress === poolContract.address) {
        //@ts-ignore
        const writeableContract = poolContract.connect(signer);
        try {
          yield put(setTxContext('Terminating pool'));
          const tx: ContractTransaction = yield call(
            [writeableContract, writeableContract.withdrawAdminFee]);
          yield put(setTxHash(tx.hash));
          yield call([tx, tx.wait]);
          yield put(withdrawPoolFee.success({ poolAddress: poolContract.address }));
          yield put(enqueueSnackbar({
            message: 'Pool terminated successfully'
          }))
        } catch (error) {
          yield put(withdrawPoolFee.failure(error.message));
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

function* poolTerminatedListener(poolContract: Pool) {
  const poolTerminatedChannel = eventChannel(emit => {
    const terminateHandler = () => {
      emit({
        poolTerminated: 'pool terminated',
      });
    };
    poolContract.on(poolContract.filters.PoolTerminated(null), terminateHandler);
    return () => {
      poolContract.off(poolContract.filters.PoolTerminated(null), terminateHandler);
    };
  });

  while (true) {
    yield take(poolTerminatedChannel);
    yield put(terminatePool.success({ poolAddress: poolContract.address }));
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
          const withdrawAmount = parseEther(action.payload.amount.toString());
          yield put(setTxContext('Withdrawing interest'));
          const tx: ContractTransaction = yield call(
            //@ts-ignore
            [writeableContract, writeableContract.withdrawInterest],
            withdrawAmount
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

function* getPoolTotalPenalty(poolContract: Pool) {
  try {
    const penaltyPotValue = yield call([poolContract, poolContract.penaltyPotBalance]);
    yield put(setPoolPenaltyPotBalance({
      poolAddress: poolContract.address,
      penaltyPotBalance: Number(formatEther(penaltyPotValue)),
    }));
  } catch (e) {
    console.log('There was an error getting the penaltyPoolBalance amount');
  }
}

function* getPoolFeeBalance(poolContract: Pool) {
  const poolFeeAmount = yield call([poolContract, poolContract.accumulativeFee]);
  yield put(setPoolFeeAmount({ poolAddress: poolContract.address, feeAmount: Number(formatUnits(poolFeeAmount, 9)) }))
}

function* getPoolUserBalance(poolContract: Pool, ethAddress: string) {
  const userBalance = yield call([poolContract, poolContract.getUserBalance], ethAddress);
  yield put(setUserPoolBalance({ poolAddress: poolContract.address, userBalance: Number(formatUnits(userBalance, 9)) }))
}

function* poolPoller(poolContract: Pool) {
  while (true) {
    const ethAddress: string = yield select(selectEthAddress);
    const isAdmin: Boolean = yield select(selectIsAdmin);

    yield call(getPoolTotalPenalty, poolContract)

    if (ethAddress) {
      yield call(getPoolUserBalance, poolContract, ethAddress);
    }

    if (ethAddress && isAdmin) {
      yield call(getPoolFeeBalance, poolContract)
    }

    yield delay(15000);
  }
}

function* poolTransactionListener(poolContract: Pool) {
  const { provider, ethAddress }: BlockchainContext = yield getContext('blockchain');

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
    const withdrawHandler = (address, withdrawAmount, cDaiAmount, penaltyAmount, tx) => {
      emit({
        type: 'Withdraw',
        address,
        withdrawAmount,
        cDaiAmount,
        penaltyAmount,
        blockNumber: tx.blockNumber,
        transactionHash: tx.transactionHash,
      })
    };
    poolContract.on(poolContract.filters.Deposit(null, null, null), depositHandler);
    poolContract.on(poolContract.filters.Withdraw(null, null, null, null), withdrawHandler);
    return () => {
      poolContract.off(poolContract.filters.Deposit(null, null, null), depositHandler);
      poolContract.off(poolContract.filters.Withdraw(null, null, null, null), withdrawHandler);
    };
  });

  while (true) {
    const newTx = yield take(poolTransactionChannel);
    const txDate = yield call([provider, provider.getBlock], newTx.blockNumber);
    const latestTx = yield select(selectLatestPoolTxTime(poolContract.address));
    if (new Date(txDate.timestamp * 1000) > latestTx) {
      if (newTx.type === 'Deposit') {
        yield put(addPoolTx({
          poolAddress: poolContract.address,
          userAddress: newTx.address,
          type: 'Deposit',
          txHash: newTx.transactionHash || '0x',
          time: new Date(txDate.timestamp * 1000),
          amount: Number(formatEther(newTx.daiAmount)),
          cdaiAmount: Number(formatUnits(newTx.cDaiAmount, 9))
        }));
      } else {
        yield put(addPoolTx({
          poolAddress: poolContract.address,
          userAddress: newTx.address,
          type: 'Withdraw',
          txHash: newTx.transactionHash || '0x',
          time: new Date(txDate.timestamp * 1000),
          amount: Number(formatEther(newTx.withdrawAmount)),
          cdaiAmount: Number(formatUnits(newTx.cDaiAmount, 9))
        }))
        yield put(addPoolTx({
          poolAddress: poolContract.address,
          userAddress: newTx.address,
          type: 'Penalty',
          txHash: newTx.transactionHash || '0x',
          time: new Date(txDate.timestamp * 1000),
          amount: Number(formatEther(newTx.penaltyAmount)),
          cdaiAmount: 0,
        }))
      }
      if (ethAddress && newTx.address.toLowerCase() === ethAddress?.toLowerCase()) {
        yield call(getPoolUserBalance, poolContract, ethAddress);
      }
      const isAdmin = yield select(selectIsAdmin);
      if (isAdmin) {
        yield call(getPoolTotalPenalty, poolContract);
      } 
    }
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
          cdaiAmount: Number(formatUnits(parsedDeposit.amountInInterestEarning, 9))
        })
      }));

    const withdrawLogs: Log[] = yield call([provider, provider.getLogs], {
      ...poolContract.filters.Withdraw(null, null, null, null),
      fromBlock: 0,
      toBlock: 'latest',
    })

    const withdrawTxActions = yield Promise.all(withdrawLogs.map(
      async log => {
        const parsedWithdraw = poolContract.interface.parseLog(log).values;
        return [addPoolTx({
          poolAddress: poolContract.address,
          userAddress: parsedWithdraw.user,
          type: 'Withdraw',
          txHash: log.transactionHash || '0x',
          time: new Date((await provider.getBlock(log.blockNumber || 0)).timestamp * 1000),
          amount: Number(formatEther(parsedWithdraw.amountInDai)),
          cdaiAmount: Number(formatUnits(parsedWithdraw.amountIncDai, 9))
        }),
        addPoolTx({
          poolAddress: poolContract.address,
          userAddress: parsedWithdraw.user,
          type: 'Penalty',
          txHash: log.transactionHash || '0x',
          time: new Date((await provider.getBlock(log.blockNumber || 0)).timestamp * 1000),
          amount: Number(formatEther(parsedWithdraw.penalty)),
          cdaiAmount: 0
        }),
        ]
      }));

    const actions = depositTxActions.concat(withdrawTxActions.flat()).sort((a, b) => a.time - b.time);

    for (const action of actions) {
      yield put(action);
    }
  } catch (error) {
    debugger;
    console.log('There was an error getting the pools transaction logs');
    console.log(error);
  }

  const terminateLogs: Log[] = yield call([provider, provider.getLogs], {
    ...poolContract.filters.PoolTerminated(null),
    fromBlock: 0,
    toBlock: 'latest',
  });

  if (terminateLogs.length > 0) {
    yield put(terminatePool.success({ poolAddress: poolContract.address }));
  }

  const feeSetLogs: Log[] = yield call([provider, provider.getLogs], {
    ...poolContract.filters.FeeSet(null),
    fromBlock: 0,
    toBlock: 'latest',
  });

  if (feeSetLogs.length > 0) {
    const parsedLog = poolContract.interface.parseLog(feeSetLogs[0]).values;
    yield put(setPoolFeeRate({ poolAddress: poolContract.address, feeRate: parsedLog.feePercentage }));
  }

  yield fork(poolTransactionListener, poolContract);
  yield fork(poolDepositListener, poolContract);
  yield fork(poolWithdrawListener, poolContract);
  yield fork(poolWithdrawInterestListener, poolContract);
  yield fork(poolTerminatedListener, poolContract);
  yield fork(terminatePoolListener, poolContract);
  yield fork(getPoolTotalPenalty, poolContract);
  yield fork(getPoolFeeBalance, poolContract)
  yield fork(withdrawFeeListener, poolContract);
  yield fork(poolPoller, poolContract);
}

export default function* poolSaga() {
  yield takeEvery(getType(poolDeployed), poolWatcherSaga)
}