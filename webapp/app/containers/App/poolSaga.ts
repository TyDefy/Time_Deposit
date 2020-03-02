import { BlockchainContext } from "blockchainContext";
import { getContext, takeEvery, call, put, fork, take, select, delay } from "redux-saga/effects";
import {
  poolDeployed,
  addPoolTx,
  connectMetamask,
  deposit,
  withdraw,
  withdrawInterest,
  setPoolPenaltyPotBalance,
  setPoolFeeRate,
  setPoolFeeAmount,
  withdrawPoolFee,
  terminatePool,
  setPoolUserBalances,
  setPoolUserCDaiBalance,
  setPoolUserPenaltyPotPortion,
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
import { selectPoolParticipantAddresses } from "containers/HomePage/selectors";

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
          yield put(setTxContext('Withdraw pool fee'));
          const tx: ContractTransaction = yield call(
            [writeableContract, writeableContract.withdrawAdminFee]);
          yield put(setTxHash(tx.hash));
          yield call([tx, tx.wait]);
          yield put(withdrawPoolFee.success({ poolAddress: poolContract.address }));
          yield put(enqueueSnackbar({
            message: 'Pool Fee Withdrawal Successful'
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
            message: 'Withdrawal successful'
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
          yield put(setTxContext('Withdrawing interest'));
          const tx: ContractTransaction = yield call(
            //@ts-ignore
            [writeableContract, writeableContract.withdrawInterest],
          );
          yield put(setTxHash(tx.hash));
          yield call([tx, tx.wait]);
          yield put(withdrawInterest.success());
          yield put(enqueueSnackbar({
            message: 'Withdrawal successful'
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


function* getPoolFeeBalance(poolContract: Pool) {
  try {
    const poolFeeAmount = yield call([poolContract, poolContract.accumulativeFee]);
    yield put(setPoolFeeAmount({ poolAddress: poolContract.address, feeAmount: Number(formatUnits(poolFeeAmount, 9)) }))
  } catch (error) {
    console.log(`There was an error getting the fee balance for pool ${poolContract.address}`);
  }
}

function* getUserPenaltyPotPortion(poolContract: Pool, ethAddress: string) {
  try {
    const poolFeeAmount = yield call([poolContract, poolContract.getPenaltyPotPortion], ethAddress);
    yield put(setPoolUserPenaltyPotPortion({ 
      poolAddress: poolContract.address, 
      userAddress: ethAddress,
      penaltyPotPortionCDai: Number(formatUnits(poolFeeAmount, 9)) 
    }))
  } catch (error) {
    console.log(`There was an error getting the fee balance for pool ${poolContract.address}`);
  }
}

function* poolPoller(poolContract: Pool) {
  while (true) {
    const ethAddress: string = yield select(selectEthAddress);
    const isAdmin: Boolean = yield select(selectIsAdmin);

    if (ethAddress) {
      yield call(getUserPenaltyPotPortion, poolContract, ethAddress);
    }

    if (ethAddress && isAdmin) {
      yield call(getPoolFeeBalance, poolContract);
    }

    yield delay(15000);
  }
}

function* poolTransactionListener(poolContract: Pool) {
  const { provider }: BlockchainContext = yield getContext('blockchain');

  const poolTransactionChannel = eventChannel(emit => {
    const depositHandler = (address, daiAmount, daiBalance, cdaiBalance, tx) => {
      emit({
        type: 'Deposit',
        address,
        daiAmount,
        daiBalance,
        cdaiBalance,
        blockNumber: tx.blockNumber,
        transactionHash: tx.transactionHash,
      })
    };
    const withdrawHandler = (address, daiAmount, daiBalance, cdaiBalance, tx) => {
      emit({
        type: 'Withdraw',
        address,
        daiAmount,
        daiBalance,
        cdaiBalance,
        blockNumber: tx.blockNumber,
        transactionHash: tx.transactionHash,
      })
    };
    const withdrawInterestHandler = (address, daiAmount, cdaiBalance, tx) => {
      emit({
        type: 'Withdraw Interest',
        address,
        daiAmount,
        cdaiBalance,
        blockNumber: tx.blockNumber,
        transactionHash: tx.transactionHash,
      })
    };
    const penaltyChargedHandler = (address, daiAmount, penaltyPotCDaiBalance, tx) => {
      emit({
        type: 'Penalty',
        address,
        daiAmount,
        penaltyPotCDaiBalance,
        blockNumber: tx.blockNumber,
        transactionHash: tx.transactionHash,
      })
    };
    const penaltyWithdrawnHandler = (penaltyPotCDaiBalance) => {
      debugger;
      emit({
        type: 'Penalty Withdrawn',
        penaltyPotCDaiBalance,
      })
    };
    const interestAccruedHandler = (address, daiAmount, tx) => {
      emit({
        type: 'Interest Accrued',
        address,
        daiAmount,
        blockNumber: tx.blockNumber,
        transactionHash: tx.transactionHash,
      })
    };
    poolContract.on(poolContract.filters.Deposit(null, null, null, null), depositHandler);
    poolContract.on(poolContract.filters.Withdraw(null, null, null, null), withdrawHandler);
    poolContract.on(poolContract.filters.WithdrawInterest(null, null, null), withdrawInterestHandler);
    poolContract.on(poolContract.filters.PenaltyCharged(null, null, null), penaltyChargedHandler);
    poolContract.on(poolContract.filters.PenaltyWithdrawn(null), penaltyWithdrawnHandler);
    poolContract.on(poolContract.filters.InterestAccrued(null, null), interestAccruedHandler);
    return () => {
      poolContract.off(poolContract.filters.Deposit(null, null, null, null), depositHandler);
      poolContract.off(poolContract.filters.Withdraw(null, null, null, null), withdrawHandler);
      poolContract.off(poolContract.filters.WithdrawInterest(null, null, null), withdrawInterestHandler);
      poolContract.off(poolContract.filters.PenaltyCharged(null, null, null), penaltyChargedHandler);
      poolContract.off(poolContract.filters.PenaltyWithdrawn(null), penaltyWithdrawnHandler);
      poolContract.off(poolContract.filters.InterestAccrued(null, null), interestAccruedHandler);
    };
  });

  while (true) {
    yield takeEvery(poolTransactionChannel, processPoolTx, provider, poolContract);
  }
}

function* processPoolTx(provider, poolContract, newTx) {
  const txDate = yield call([provider, provider.getBlock], newTx.blockNumber);
  const latestTxDate = yield select(selectLatestPoolTxTime(poolContract.address));
  const newTxDate = new Date(txDate.timestamp * 1000);
  if ((newTx.type !== 'Penalty Withdrawn') &&
    (newTxDate > latestTxDate) || (newTxDate >= latestTxDate &&
      (newTx.type === 'Penalty' || newTx.type === 'Withdraw' || newTx.type === 'Interest Accrued'))) {
    yield put(addPoolTx({
      poolAddress: poolContract.address,
      userAddress: newTx.address,
      type: newTx.type,
      amount: Number(formatEther(newTx.daiAmount)),
      txHash: newTx.transactionHash,
      time: new Date(txDate.timestamp * 1000),
    }))
    if (newTx.daiBalance && newTx.cdaiBalance) {
      yield put(setPoolUserBalances({
        poolAddress: poolContract.address,
        userAddress: newTx.address,
        daiBalance: Number(formatEther(newTx.daiBalance)),
        cdaiBalance: Number(formatUnits(newTx.cdaiBalance, 9)),
      }))
    } else if (newTx.cdaiBalance) {
      yield put(setPoolUserCDaiBalance({
        poolAddress: poolContract.address,
        userAddress: newTx.address,
        cdaiBalance: Number(formatUnits(newTx.cdaiBalance, 9)),
      }))
    }
    if (newTx.penaltyPotCDaiBalance) {
      yield put(setPoolPenaltyPotBalance({
        poolAddress: poolContract.address,
        penaltyPotBalance: Number(formatUnits(newTx.penaltyPotCDaiBalance, 9)),
      }))
    }
  }
}

function* poolWatcherSaga(action) {
  const { provider, signer }: BlockchainContext = yield getContext('blockchain');
  const poolContract: Pool = new Contract(action.payload.address, PoolContractAbi, signer || provider)

  try {
    const depositLogs: Log[] = yield call([provider, provider.getLogs], {
      ...poolContract.filters.Deposit(null, null, null, null),
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
          amount: Number(formatEther(parsedDeposit.unitAmount)),
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
        return addPoolTx({
          poolAddress: poolContract.address,
          userAddress: parsedWithdraw.user,
          type: 'Withdraw',
          txHash: log.transactionHash || '0x',
          time: new Date((await provider.getBlock(log.blockNumber || 0)).timestamp * 1000),
          amount: Number(formatEther(parsedWithdraw.unitAmount)),
        })
      }));

    const withdrawInterestLogs: Log[] = yield call([provider, provider.getLogs], {
      ...poolContract.filters.WithdrawInterest(null, null, null),
      fromBlock: 0,
      toBlock: 'latest',
    })

    const withdrawInterestTxActions = yield Promise.all(withdrawInterestLogs.map(
      async log => {
        const parsedWithdrawInterest = poolContract.interface.parseLog(log).values;
        return addPoolTx({
          poolAddress: poolContract.address,
          userAddress: parsedWithdrawInterest.user,
          type: 'Withdraw Interest',
          txHash: log.transactionHash || '0x',
          time: new Date((await provider.getBlock(log.blockNumber || 0)).timestamp * 1000),
          amount: Number(formatEther(parsedWithdrawInterest.unitAmount)),
        })
      }));

    const penaltyChargedLogs: Log[] = yield call([provider, provider.getLogs], {
      ...poolContract.filters.PenaltyCharged(null, null, null),
      fromBlock: 0,
      toBlock: 'latest',
    })

    const penaltyChargedTxActions = yield Promise.all(penaltyChargedLogs.map(
      async log => {
        const parsedPenaltyCharged = poolContract.interface.parseLog(log).values;
        return addPoolTx({
          poolAddress: poolContract.address,
          userAddress: parsedPenaltyCharged.user,
          type: 'Penalty',
          txHash: log.transactionHash || '0x',
          time: new Date((await provider.getBlock(log.blockNumber || 0)).timestamp * 1000),
          amount: Number(formatEther(parsedPenaltyCharged.unitAmount)),
        })
      }));

    const interestAccruedLogs: Log[] = yield call([provider, provider.getLogs], {
      ...poolContract.filters.InterestAccrued(null, null),
      fromBlock: 0,
      toBlock: 'latest',
    })

    const interestAccruedTxActions = yield Promise.all(interestAccruedLogs.map(
      async log => {
        const parsedInterestAccrued = poolContract.interface.parseLog(log).values;
        return addPoolTx({
          poolAddress: poolContract.address,
          userAddress: parsedInterestAccrued.user,
          type: 'Interest Accrued',
          txHash: log.transactionHash || '0x',
          time: new Date((await provider.getBlock(log.blockNumber || 0)).timestamp * 1000),
          amount: Number(formatEther(parsedInterestAccrued.unitValue)),
        })
      }));
    const actions = depositTxActions
      .concat(withdrawTxActions)
      .concat(withdrawInterestTxActions)
      .concat(penaltyChargedTxActions)
      .concat(interestAccruedTxActions)
      .sort((a, b) => a.time - b.time);

    for (const action of actions) {
      yield put(action);
    }
  } catch (error) {
    console.log(`There was an error getting the pool's transaction logs`);
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

  const users: Array<string> = yield select(selectPoolParticipantAddresses(poolContract.address));

  for (const user of users) {
    const userInfo = yield call([poolContract, poolContract.getUserInfo], user);
    yield put(setPoolUserBalances({
      poolAddress: poolContract.address,
      userAddress: user,
      daiBalance: Number(formatEther(userInfo[0])),
      cdaiBalance: Number(formatUnits(userInfo[1], 9))
    }))
  };

  const penaltyPotValue = yield call([poolContract, poolContract.penaltyPotBalance]);
  yield put(setPoolPenaltyPotBalance({
    poolAddress: poolContract.address,
    penaltyPotBalance: Number(formatUnits(penaltyPotValue, 9)),
  }));

  const poolFeeAmount = yield call([poolContract, poolContract.accumulativeFee]);
  yield put(setPoolFeeAmount({ 
    poolAddress: poolContract.address, 
    feeAmount: Number(formatUnits(poolFeeAmount, 9)) 
  }));

  yield fork(poolTransactionListener, poolContract);
  yield fork(poolDepositListener, poolContract);
  yield fork(poolWithdrawListener, poolContract);
  yield fork(poolWithdrawInterestListener, poolContract);
  yield fork(poolTerminatedListener, poolContract);
  yield fork(terminatePoolListener, poolContract);
  yield fork(withdrawFeeListener, poolContract);
  yield fork(poolPoller, poolContract);
}

export default function* poolSaga() {
  yield takeEvery(getType(poolDeployed), poolWatcherSaga)
}