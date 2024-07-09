import {
  getLocalStorage,
  setLocalStorage,
  removeLocalStorage,
} from "@ribeirolabs/local-storage";
import { useReducer, useCallback, useRef, useEffect, useMemo } from "react";

type DefaultValues = Record<string, any>;

type ReducerAction<
  Values extends DefaultValues = DefaultValues,
  Field extends keyof Values = keyof Values,
> =
  | {
      type: "RESET";
      values?: Values;
    }
  | {
      type: "COMMIT";
    }
  | {
      type: "CHANGE";
      field: Field;
      value: Values[Field];
    };

type ReducerState<Values extends DefaultValues> = {
  initial: Values;
  values: Values;
};

type Reducer<Values extends DefaultValues> = (
  state: ReducerState<Values>,
  action: ReducerAction<Values>
) => ReducerState<Values>;

const reducer: <Values extends DefaultValues>() => Reducer<Values> =
  () => (state, action) => {
    const values = { ...state.values };

    if (action.type === "RESET") {
      return {
        ...state,
        values: action.values ?? state.initial,
        initial: action.values ?? state.initial,
      };
    }

    if (action.type === "COMMIT") {
      return {
        ...state,
        initial: state.values,
      };
    }

    if (action.type === "CHANGE") {
      if (
        typeof state.initial[action.field] === "number" &&
        (action.value == null || Number.isNaN(action.value))
      ) {
        // @ts-ignore
        values[action.field] = "";
      } else {
        values[action.field] = action.value;
      }

      return {
        ...state,
        values,
      };
    }

    return state;
  };

type UseFormReturn<
  Values extends DefaultValues,
  Field extends keyof Values = keyof Values,
> = {
  values: Values;
  hasChanged(): boolean;
  change(field: Field, value: Values[Field]): void;
  /**
   * Resets the form state with `initial` value.
   */
  reset(values?: Values): void;
  /**
   * Updates the initial value with the current state of the form.
   */
  commit(): void;
};

type PersistOption = {
  /**
   * Key used to store the value. Default is to use the field name.
   */
  key?: string | (() => string);
  /**
   * When to expire the value in ms or string representation like "10m" | "24h"
   * | "10d". Default is to never expire.
   */
  expiration?: string | number;
  /**
   * Use `true|false` to enable/disable storing the value. Default is to always store.
   */
  set?: boolean;
  /**
   * Use `true|false` to enable/disable getting the value. Default is to always get.
   */
  get?: boolean;
};

export function useForm<Values extends DefaultValues>({
  initial,
  persist = {},
  onChange,
}: {
  initial: Values;
  /**
   * Option to store specific values. Default is to never store.
   */
  persist?: Partial<Record<keyof Values, null | PersistOption>>;
  onChange?: (values: Values) => void;
}): UseFormReturn<Values> {
  const [state, send] = useReducer(reducer<Values>(), initial, (initial) => {
    const values = initial;

    // For all the fields defined as persistent we get the local storage value.
    for (let field in persist) {
      const option = persist[field];

      if (!option) {
        continue;
      }

      // Ignore the stored value when getting is explicitly disabled.
      if (option.get === false) {
        continue;
      }

      const key =
        typeof option.key === "function"
          ? option.key()
          : option.key || (field as string);

      values[field] = getLocalStorage(key, initial[field]);
    }

    return {
      initial: values,
      values,
    };
  });

  const change = useCallback<UseFormReturn<Values>["change"]>(
    (field, value) => {
      const persistOption = persist[field];

      send({ type: "CHANGE", field, value });

      if (!persistOption || persistOption.set === false) {
        return;
      }

      const key =
        typeof persistOption.key === "function"
          ? persistOption.key()
          : persistOption.key || field;

      if (value != null) {
        setLocalStorage(key as string, value);
      } else {
        removeLocalStorage(key as string);
      }
    },
    [persist]
  );

  const reset = useCallback<UseFormReturn<Values>["reset"]>((values) => {
    send({ type: "RESET", values });
  }, []);

  const commit = useCallback<UseFormReturn<Values>["commit"]>(() => {
    send({ type: "COMMIT" });
  }, []);

  const initialLoad = useRef(true);

  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }

    if (onChange) {
      onChange(state.values);
    }
  }, [state.values, onChange]);

  const hasChanged = useCallback(() => {
    let changed = false;

    for (let key in state.values) {
      if (state.values[key] !== state.initial[key]) {
        changed = true;
        break;
      }
    }

    return changed;
  }, [state]);

  return {
    values: state.values,
    hasChanged,
    change,
    reset,
    commit,
  };
}
