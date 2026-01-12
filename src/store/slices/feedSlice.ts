import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IPost } from '@/types';

interface FeedState {
    posts: IPost[];
    loading: boolean;
    hasMore: boolean;
    page: number;
}

const initialState: FeedState = {
    posts: [],
    loading: false,
    hasMore: true,
    page: 1,
};

const feedSlice = createSlice({
    name: 'feed',
    initialState,
    reducers: {
        setPosts: (state, action: PayloadAction<IPost[]>) => {
            state.posts = action.payload;
        },
        addPosts: (state, action: PayloadAction<IPost[]>) => {
            state.posts = [...state.posts, ...action.payload];
        },
        addPost: (state, action: PayloadAction<IPost>) => {
            state.posts = [action.payload, ...state.posts];
        },
        updatePost: (state, action: PayloadAction<IPost>) => {
            const index = state.posts.findIndex(p => p._id === action.payload._id);
            if (index !== -1) {
                state.posts[index] = action.payload;
            }
        },
        removePost: (state, action: PayloadAction<string>) => {
            state.posts = state.posts.filter(p => p._id !== action.payload);
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setHasMore: (state, action: PayloadAction<boolean>) => {
            state.hasMore = action.payload;
        },
        incrementPage: (state) => {
            state.page += 1;
        },
        resetFeed: (state) => {
            state.posts = [];
            state.page = 1;
            state.hasMore = true;
        },
    },
});

export const {
    setPosts,
    addPosts,
    addPost,
    updatePost,
    removePost,
    setLoading,
    setHasMore,
    incrementPage,
    resetFeed,
} = feedSlice.actions;

export default feedSlice.reducer;
