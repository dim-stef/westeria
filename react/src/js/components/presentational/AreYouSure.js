import React, {useEffect,useRef,useState,useLayoutEffect} from 'react'
import { useMediaQuery } from 'react-responsive'
import { CSSTransition,Transition } from 'react-transition-group';
import {MobileModal} from "./MobileModal"
import {ToggleContent,AreYouSureModal} from "./Temporary"


export function AreYouSure({handleYes,handleNo,message,children}){

    // these two trough e,show,hide not defined errors
    // try catch needed
    function handleShow(e,show){
        try{
            e.stopPropagation();
            show();
        }catch(e){

        }
    }

    function handleHide(e,hide){
        try{
            e.stopPropagation();
            hide();
        }catch(e){

        }   
    }

    return (
        <ToggleContent 
            toggle={show=>{
            return <>
                    {React.cloneElement(children,{ onClick: e=>handleShow(e,show) })}
                </>
            }}
            content={hide => (
            <AreYouSureModal onClick={()=>handleHide(hide)}>
                <div className="modal-confirmation-box">
                    <span style={{fontSize:'1.4rem',fontWeight:500}}>{message}</span>
                    <div className="flex-fill" style={{marginTop:10}}>
                        <button onClick={handleYes} className="accept-btn">yes</button>
                        <button onClick={handleNo} className="decline-btn">no</button>
                    </div>
                </div>
            </AreYouSureModal>    
        )}/>
    )
}