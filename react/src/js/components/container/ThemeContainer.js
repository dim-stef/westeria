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
    darkGray:'#404040',
    lightGray:'#a9a9a9',
}

const darkMode = {
    primaryColor:'rgb(33, 150, 243)',
    backgroundColor:'#090a10',
    backgroundLightColor:'#151827',
    backgroundDarkColor: COLORS.black,
    backgroundBoxColor:'#151827',
    backgroundLightOppositeColor:COLORS.white,
    chatBubbleColor:'#090a10',
    postFloatingButtonColor:'#272727',
    postFloatingButtonShadow:`0 0.1px 0.2px -1px rgba(0, 0, 0, 0.273),
    0 0.3px 0.6px -1px rgba(0, 0, 0, 0.361),
    0 0.6px 1.5px -1px rgba(0, 0, 0, 0.481),
    0 2px 5px -1px rgba(0, 0, 0, 0.97)`,
    navBarColor:'#090a10',
    textColor:COLORS.semiWhite,
    textLightColor:COLORS.lightGray,
    textHarshColor:COLORS.lightWhite,
    borderColor:COLORS.darkBlue,
    hoverColor:'#090a10',
    embeddedHoverColor:'#121b23',
    notificationBranchColor:'#121b23',
    skeletonColor:'#151827',
    skeletonHighlightColor:'#0d0f1b',
    landingPageButtonColor:'#33364a',
    scrollBarColor:'#22232d',

}

const lightMode = {
    primaryColor:'rgb(33, 150, 243)',
    backgroundColor:COLORS.white,
    backgroundLightColor:'#fbfbfb',
    backgroundDarkColor:'#f5f5f5',
    backgroundLightOppositeColor:darkMode.backgroundLightColor,
    backgroundBoxColor:COLORS.white,
    chatBubbleColor:'#f5f5f5',
    postFloatingButtonColor:COLORS.white,
    postFloatingButtonShadow:`0 0.5px 0.8px rgba(0, 0, 0, 0.016),
    0 1.6px 2.7px rgba(0, 0, 0, 0.024),
    0 7px 12px rgba(0, 0, 0, 0.04)`,
    navBarColor:COLORS.white,
    textColor:COLORS.lightBlack,
    textLightColor:COLORS.darkGray,
    textHarshColor:COLORS.black,
    borderColor:COLORS.lightBlue,
    hoverColor:'#f4f6f9',
    embeddedHoverColor:'#e1e7ef',
    notificationBranchColor:'#e1e7ef',
    skeletonColor:'#f0f3f5',
    skeletonHighlightColor:'#e2e7ea',
    landingPageButtonColor:'#d0d3d6',
    scrollBarColor:'#dfe4ec',
}

const theme = mode => (mode=='dark'?darkMode:lightMode)

const defaultContextData = {
    darkMode: false,
    toggle:()=>{}
}

const ThemeContext = React.createContext(defaultContextData);
const useTheme = () => React.useContext(ThemeContext)

const useDarkMode = () =>{
    let defaultDark = false;

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('dark')) {
        defaultDark = true;
        localStorage.setItem("dark",'true');
    }
    const [themeState,setThemeState] = React.useState({
        dark:defaultDark,
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