"use client";

import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

const parseValue = <T>(raw: string | null, fallback: T): T => {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn("Failed to parse localStorage item", error);
    return fallback;
  }
};

export const useLocalStorage = <T>(
  key: string,
  defaultValue: T,
): [T, Dispatch<SetStateAction<T>>] => {
  const fallbackRef = useRef(defaultValue);
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return defaultValue;
    }
    return parseValue<T>(window.localStorage.getItem(key), defaultValue);
  });

  useEffect(() => {
    fallbackRef.current = defaultValue;
  }, [defaultValue]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const readValue = () =>
      parseValue<T>(window.localStorage.getItem(key), fallbackRef.current);

    setValue((current) => {
      const next = readValue();
      return Object.is(current, next) ? current : next;
    });

    const handleStorage = (event: StorageEvent) => {
      if (event.key === key) {
        setValue((current) => {
          const next = parseValue<T>(event.newValue, fallbackRef.current);
          return Object.is(current, next) ? current : next;
        });
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [key]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn("Failed to store value in localStorage", error);
    }
  }, [key, value]);

  return [value, setValue];
};
