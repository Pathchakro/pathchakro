import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
    isCreatePostOpen: boolean;
    isMobileMenuOpen: boolean;
    searchQuery: string;
}

const initialState: UIState = {
    isCreatePostOpen: false,
    isMobileMenuOpen: false,
    searchQuery: '',
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setCreatePostOpen: (state, action: PayloadAction<boolean>) => {
            state.isCreatePostOpen = action.payload;
        },
        toggleMobileMenu: (state) => {
            state.isMobileMenuOpen = !state.isMobileMenuOpen;
        },
        setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
            state.isMobileMenuOpen = action.payload;
        },
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
        },
    },
});

export const {
    setCreatePostOpen,
    toggleMobileMenu,
    setMobileMenuOpen,
    setSearchQuery,
} = uiSlice.actions;

export default uiSlice.reducer;
