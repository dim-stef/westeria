import React from "react";
import {withRouter} from "react-router-dom";
import { css } from "@emotion/core";


const headlineContainer = (theme,containerStyle) =>css({
    padding:'10px',borderBottom:`1px solid ${theme.borderColor}`,
    backgroundColor:'transparent',
    ...containerStyle
})

const leftButtonSvg = theme =>css({
    height:24,padding:'0 20px 0 10px',fill:theme.textColor
})

function RoutedHeadline({match,location,className='',history,headline,to,containerStyle={},children}){
     
    const navigate = ()=>{
        if(to){
            history.push(to);
        }else{
            history.goBack();
        }
    }

    return(
        <div className={`flex-fill ${className}`} css={theme=>headlineContainer(theme,containerStyle)}>
            <button className="flex-fill" 
            className="back-button" onClick={navigate}>
                <LeftArrowSvg/>
            </button>
            {children?children:<span style={{fontWeight:'bold', fontSize:'2em'}}>{headline}</span>}
            
        </div>
    )
}


const LeftArrowSvg = props =>{
    return(
        <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        x="0px"
        y="0px"
        viewBox="0 0 31.494 31.494"
        style={{ enableBackground: "new 0 0 31.494 31.494" }}
        css={theme=>leftButtonSvg(theme)}        
        xmlSpace="preserve"
        >
        <path
            d="M10.273,5.009c0.444-0.444,1.143-0.444,1.587,0c0.429,0.429,0.429,1.143,0,1.571l-8.047,8.047h26.554  c0.619,0,1.127,0.492,1.127,1.111c0,0.619-0.508,1.127-1.127,1.127H3.813l8.047,8.032c0.429,0.444,0.429,1.159,0,1.587  c-0.444,0.444-1.143,0.444-1.587,0l-9.952-9.952c-0.429-0.429-0.429-1.143,0-1.571L10.273,5.009z"
        />
        </svg>
    )
}


export default withRouter(RoutedHeadline);