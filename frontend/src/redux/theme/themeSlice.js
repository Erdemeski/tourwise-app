import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    theme: 'light'
};

const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        toggleTheme: (state) => {
            state.theme = state.theme === 'light' ? 'dark' : 'light';

        },
        toggleThemeToDark: (state) => {
            state.theme = 'dark';
        },
        toggleThemeToLight: (state) => {
            state.theme = 'light';
        }
    }
});

export const { toggleTheme, toggleThemeToDark, toggleThemeToLight } = themeSlice.actions;

export default themeSlice.reducer;