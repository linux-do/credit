import * as React from "react";

interface CommonControlledStateProps<T> {
  value?: T;
  defaultValue?: T;
}

/**
 * 受控状态 Hook
 * 用于处理受控和非受控组件的状态管理
 *
 * @example
 * ```tsx
 * const [value, setValue] = useControlledState({ value: propValue, onChange: console.log })
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useControlledState<T, Rest extends any[] = []>(
  props: CommonControlledStateProps<T> & {
    onChange?: (value: T, ...args: Rest) => void;
  }
): readonly [T, (next: T, ...args: Rest) => void] {
  const { value, defaultValue, onChange } = props;

  const [state, setInternalState] = React.useState<T>(
    value !== undefined ? value : (defaultValue as T)
  );

  React.useEffect(() => {
    if (value !== undefined) setInternalState(value);
  }, [value]);

  const setState = React.useCallback(
    (next: T, ...args: Rest) => {
      setInternalState(next);
      onChange?.(next, ...args);
    },
    [onChange]
  );

  return [state, setState] as const;
}
