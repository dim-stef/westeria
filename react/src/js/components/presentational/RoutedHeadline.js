import React, { useState,useContext,useEffect } from "react";
import { withRouter } from "react-router";

function RoutedHeadline({match,location,history,headline,to,children}){
    
     
    const navigate = ()=>{
        if(to){
            history.push(to);
        }else{
            history.goBack();
        }
    }

    return(
        <div className="flex-fill" style={{padding:'10px',borderBottom:'1px solid #e2eaf1'}}>
            <button className="flex-fill" 
            className="back-button" onClick={navigate}>
                <LeftArrowSvg/>
            </button>
            <span style={{fontWeight:'bold', fontSize:'2em'}}>{headline}</span>
        </div>
    )
}


function LeftArrowSvg(){
    return(
        <svg
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        x="0px"
        y="0px"
        viewBox="0 0 492 492"
        style={{ enableBackground: "new 0 0 492 492" }}
        xmlSpace="preserve"
        style={{height:24,padding:'0 20px 0 10px'}}
        >
        <path d="M464.344 207.418l.768.168H135.888l103.496-103.724c5.068-5.064 7.848-11.924 7.848-19.124 0-7.2-2.78-14.012-7.848-19.088L223.28 49.538c-5.064-5.064-11.812-7.864-19.008-7.864-7.2 0-13.952 2.78-19.016 7.844L7.844 226.914C2.76 231.998-.02 238.77 0 245.974c-.02 7.244 2.76 14.02 7.844 19.096l177.412 177.412c5.064 5.06 11.812 7.844 19.016 7.844 7.196 0 13.944-2.788 19.008-7.844l16.104-16.112c5.068-5.056 7.848-11.808 7.848-19.008 0-7.196-2.78-13.592-7.848-18.652L134.72 284.406h329.992c14.828 0 27.288-12.78 27.288-27.6v-22.788c0-14.82-12.828-26.6-27.656-26.6z" />
        </svg>

    )
}

export default withRouter(RoutedHeadline);