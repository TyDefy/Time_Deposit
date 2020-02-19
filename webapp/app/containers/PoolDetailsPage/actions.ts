import { createStandardAction } from "typesafe-actions";

export const setShowModal = createStandardAction('POOL_DETAILS/SET_SHOW_MODAL')<{showModal: boolean}>();