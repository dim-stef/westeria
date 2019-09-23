import React from 'react'
import { useTheme } from 'emotion-theming'

export function MobileModal({options,mobileRef=null,children}){
    const theme = useTheme();
    return(
        <div ref={mobileRef} style={{position:'fixed',width:'95%',bottom:20,left:0,right:0,maxHeight:'70%',overflowY:'auto',margin:'0 auto'}}>
            <div className="flex-fill" style={{width:'100%',height:'100%',flexFlow:'column',WebkitFlexFlow:'column',fontSize:'2em',
            backgroundColor:theme.borderColor,borderRadius:20}}>
                {children}
            </div>
        </div>
    )
}