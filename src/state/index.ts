import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import { load, save } from "redux-localstorage-simple";
import { multicall } from "../utils/multicall";

import application from "./application/reducer";
import burn from "./burn/reducer";
import { updateVersion } from "./global/actions";
import lists from "./lists/reducer";
import mint from "./mint/reducer";
import swap from "./swap/reducer";
import transactions from "./transactions/reducer";
import user from "./user/reducer";

// TODO DOGESWAP: verify that we want to persist these, e.g. persisting "lists" can cause problems with localnet
const PERSISTED_KEYS: string[] = ["user", "transactions"];

const store = configureStore({
    reducer: {
        application,
        user,
        transactions,
        swap,
        mint,
        burn,
        [multicall.reducerPath as any]: multicall.reducer, // Don't know why we need the any here
        lists,
    },
    middleware: [...getDefaultMiddleware({ thunk: false }), save({ states: PERSISTED_KEYS })],
    preloadedState: load({ states: PERSISTED_KEYS }),
});

store.dispatch(updateVersion());

export default store;

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
