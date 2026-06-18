'use client';

import React, { createContext, useContext, useMemo } from 'react';

interface I18nContextProps {
  locale: string;
  messages: any;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextProps | null>(null);

function isObject(item: any): item is Record<string, any> {
  return item && typeof item === 'object' && !Array.isArray(item);
}

function mergeDeep(target: any, ...sources: any[]): any {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: any;
  children: React.ReactNode;
}) {
  const parent = useContext(I18nContext);

  const mergedMessages = useMemo(() => {
    if (!parent) return messages;
    return mergeDeep(JSON.parse(JSON.stringify(parent.messages)), messages);
  }, [parent, messages]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value = mergedMessages;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    return typeof value === 'string' ? value : key;
  };

  return (
    <I18nContext.Provider value={{ locale, messages: mergedMessages, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

