import React from 'react'
import {ThemeProvider as EmotionThemeProvider} from "emotion-theming";

const COLORS = {
    black:'#000000',
    lightBlack:'#212121',
    white:'#ffffff',
    semiWhite:'#dadada',
    lightWhite:'#e0e0e0',
    darkBlue:'#202f3c',
    lightBlue:'#e2eaf1',
}

const darkMode = {
    backgroundColor:COLORS.black,
    textColor:COLORS.semiWhite,
    textHarshColor:COLORS.lightWhite,
    borderColor:COLORS.darkBlue
}

const lightMode = {
    backgroundColor:COLORS.white,
    textColor:COLORS.lightBlack,
    textHarshColor:COLORS.black,
    borderColor:COLORS.lightBlue
}

const theme = mode => (mode=='dark'?darkMode:lightMode)

const defaultContextData = {
    darkMode: false,
    toggle:()=>{}
}

const ThemeContext = React.createContext(defaultContextData);
const useTheme = () => React.useContext(ThemeContext)

const useDarkMode = () =>{
    const [themeState,setThemeState] = React.useState({
        dark:false,
        hasThemeMounted:false
    });
    React.useEffect(()=>{
        const isDark = localStorage.getItem("dark") == "true";
        setThemeState({...themeState,dark:isDark,hasThemeMounted:true})
    },[])

    return [themeState,setThemeState];
}

const ThemeProvider = ({children}) =>{
    const [themeState,setThemeState] = useDarkMode();

    if(!themeState.hasThemeMounted){
        return null;
    }

    const toggle = () =>{
        const dark = !themeState.dark;
        localStorage.setItem("dark",JSON.stringify(dark));
        setThemeState({...themeState,dark});
    }

    const computedTheme = themeState.dark ? theme('dark'): theme('light')

    return (
        <EmotionThemeProvider theme={computedTheme}>
            <ThemeContext.Provider
            value={{
                dark:themeState.dark,
                toggle
            }}>
                {children}
            </ThemeContext.Provider>
        </EmotionThemeProvider>
    )
}

export {ThemeProvider,useTheme}