import React, {useEffect,useRef,useState,useLayoutEffect} from 'react'
import { useMediaQuery } from 'react-responsive'
import { CSSTransition,Transition } from 'react-transition-group';
import {MobileModal} from "./MobileModal"
import {ToggleContent,Modal} from "./Temporary"


export function DropdownActionList({actions,wrapper,style=null,children}){
    const Wrapper = wrapper;
    const isDesktopOrLaptop = useMediaQuery({
        query: '(min-device-width: 1224px)'
    })
    const [isOpen,setOpen] = useState(false);
    const ref = useRef(null);

    function handleClick(e,show){
        e.stopPropagation();
        if(!isDesktopOrLaptop){
            setOpen(true);
            show();
        }else{
            setOpen(!isOpen);
        }
    }

    function handleHide(e,hide){
        e.stopPropagation();
        setOpen(false);
    }


    function handleOutsideClick(e){
        e.stopPropagation();
        if(ref.current){
            if(!ref.current.contains(e.target)){
                //setOpen(false);
            }
        }
    }

    useEffect(()=>{
        document.addEventListener('click',handleOutsideClick);

        return ()=>{
            document.removeEventListener('click',handleOutsideClick);
        }
    },[])

    return (
        <ToggleContent 
            toggle={show=>{
            return <>
                    <div ref={ref} style={{position:'relative'}} onClick={e=>handleClick(e,show)}>
                        {children}
                        {isOpen && isDesktopOrLaptop?
                        <div className="flex-fill filter-dropdown" style={style}>
                            {actions.map(a=>{
                                return <Action action={a}/>
                            })}
                        </div>:null}
                    </div>
                </>
            }}
            content={hide => (
            <Modal onClick={(e)=>handleHide(e,hide)}>
                <CSSTransition in={isOpen} timeout={200} classNames="side-drawer" onExited={()=>hide()} appear>
                    <MobileModal>
                        {actions.map(a=>{
                            return <Action action={a}/>
                        })}
                    </MobileModal>
                </CSSTransition>
            </Modal>    
            )}/>
    )
}

import {AreYouSure} from "./AreYouSure"

function Action({action}){

    return <>
        {action.confirmation?
            <AreYouSure handleYes={action.action} handleNo={()=>{}} message={action.confirmation_message}>
                <span
                className="filter-dropdown-item">{action.label}</span>
            </AreYouSure>
            :<span
                onClick={action.action} 
                className="filter-dropdown-item">{action.label}
            </span>}
            
        </>
    
}