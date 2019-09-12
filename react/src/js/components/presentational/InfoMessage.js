import React, {useEffect,useRef,useState,useLayoutEffect} from 'react';
import ReactDOM from 'react-dom';
import { CSSTransition,Transition } from 'react-transition-group';


export function InfoMessage({message,time}){
    const [isOpen,setOpen] = useState(true)

    useEffect(()=>{
        setTimeout(()=>{
            setOpen(false);
        },time)
    },[])

    return(
        ReactDOM.createPortal(
            <CSSTransition in={isOpen} classNames="fade" timeout={1000} appear>
                <div className="flex-fill" className="top-info-message-wrapper">
                <div className="top-info-message">
                    <span style={{color:'white'}}>{message}</span>
                </div>
            </div>
            </CSSTransition>
            ,
            document.getElementById('info-message-root')
        )
        
    )
}
//isOpen?:null