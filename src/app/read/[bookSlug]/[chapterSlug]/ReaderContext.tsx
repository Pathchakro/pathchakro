"use client";

import { createContext, useContext } from 'react';

interface ReaderContextType {
    showUI: boolean;
}

export const ReaderContext = createContext<ReaderContextType>({ showUI: true });

export const useReaderUI = () => useContext(ReaderContext);
