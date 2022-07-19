import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import { load, save } from "redux-localstorage-simple";

import application from "./application/reducer";
import burn from "./burn/reducer";
import { updateVersion } from "./global/actions";
import lists from "./lists/reducer";
import mint from "./mint/reducer";
import multicall from "./multicall/reducer";
import swap from "./swap/reducer";
import transactions from "./transactions/reducer";
import user from "./user/reducer";

// TODO DOGESWAP: verify that we want to persist these, e.g. "lists" used to be here but that screws up local dev.
const PERSISTED_KEYS: string[] = ["user", "transactions"];

const store = configureStore({
    reducer: {
        application,
        user,
        transactions,
        swap,
        mint,
        burn,
        multicall,
        lists,
    },
    middleware: [...getDefaultMiddleware({ thunk: false }), save({ states: PERSISTED_KEYS })],
    preloadedState: load({ states: PERSISTED_KEYS }),
});

store.dispatch(updateVersion());

export default store;

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
