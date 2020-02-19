import { put, take, fork } from "redux-saga/effects";
import { getType } from "typesafe-actions";
import { deposit, withdraw, withdrawInterest } from "containers/App/actions";
import { setShowModal } from "./actions";

function* closeModalWatcher() {
  while (true) {
    yield take([getType(deposit.success), getType(withdraw.success), getType(withdrawInterest.success)]);
    yield put(setShowModal({showModal: false}))
  }
}

export default function* root() {
  yield fork(closeModalWatcher)
}