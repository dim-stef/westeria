import React, {useContext, useEffect, useRef, useState} from "react"
import {Link} from "react-router-dom"
import { css } from "@emotion/core";
import {useTheme as useEmotionTheme} from "emotion-theming";
import history from "../../history"
import {ToggleContent} from './Temporary'
import {UserContext} from "../container/ContextContainer"
import {SmallBranch} from "./Branch"
import {useMyBranches} from "../container/BranchContainer"
import {CreateNewBranch} from "./CreateNewBranch"
import {CSSTransition} from 'react-transition-group';
import {useTheme} from "../container/ThemeContainer";
import ReactDOM from 'react-dom';

const Modal = ({ children ,onClick}) => {
    
    useEffect(()=>{
        document.body.style.overflowY = 'hidden';

        return ()=>{
            document.body.style.overflowY = 'scroll';
        }
    })
    
    function preventScrollEvents(e){
        e.stopPropagation();
    }

    return ReactDOM.createPortal(
        <div className="modal" onClick={onClick} onTouchMove={preventScrollEvents}>
            {children}
        </div>,
        document.getElementById('modal-root')
    )
};

const mobileNavBarContainer = emotionTheme => css({
    boxSizing:'border-box',
    borderTop:`2px solid ${emotionTheme.borderColor}`,
    height:'100%',
    width:'100%',
    textDecoration:'none',
    justifyContent:'center',
    alignItems:'center'
})

const linkTextColor = emotionTheme => css({
    color:emotionTheme.textColor,
    borderBottom:`1px solid ${emotionTheme.borderColor}`
})

const borderBottom = emotionTheme =>css({
    borderBottom:`1px solid ${emotionTheme.borderColor}`
})

export function SideDrawer({open,setOpen,children}){
    const theme = useTheme();
    const emotionTheme = useEmotionTheme();
    const userContext = useContext(UserContext);
    const [inProp, setInProp] = useState(false);
    const ref = useRef(null);

    function handleHide(e,hide){
        e.stopPropagation();
        setOpen(false);
        //hide();
    }

    function handleShow(e,show){
        if(e){
            e.stopPropagation();
        }
        
        if(userContext.isAuth){
            history.push(`/${userContext.currentBranch.uri}`)
        }else{
            setOpen(true);
            show();
        }
    }

    return(
        <ToggleContent 
            toggle={show=>{
                return (
                <div className="flex-fill" css={emotionTheme=>mobileNavBarContainer(emotionTheme)}
                onClick={(e)=>handleShow(e,show)}>
                    {children}
                </div>
            )
            }}
            content={hide => (
                <Modal onClick={(e)=>handleHide(e,hide)}>
                    <CSSTransition in={open} timeout={200} classNames="side-drawer" onExited={()=>hide()} appear>
                        <div onClick={e=>e.stopPropagation()} 
                        className={`side-drawer flex-fill`}
                        style={{height:'100%',width:'55%',backgroundColor:emotionTheme.backgroundColor,
                        justifyContent:'center',WebkitJustifyContent:'center',flexFlow:'column',WebkitFlexFlow:'column'}}>
                            
                            {!userContext.isAuth?<>
                                <Link to="/login" className="flex-fill" style={{textDecoration:'none',
                                justifyContent:'center',WebkitJustifyContent:'center',alignItems:'center',WebkitAlignItems:'center',
                                fontSize:'3em',height:'100%'}}
                                css={emotionTheme=>linkTextColor(emotionTheme)}>Login</Link>
                                <Link to="/register" className="flex-fill" style={{textDecoration:'none',
                                justifyContent:'center',WebkitJustifyContent:'center',alignItems:'center',WebkitAlignItems:'center',
                                fontSize:'3em',height:'100%'}}
                                css={emotionTheme=>linkTextColor(emotionTheme)}>Register</Link>
                                <button className="flex-fill auth-drawer-item" style={{textDecoration:'none',
                                justifyContent:'center',WebkitJustifyContent:'center',alignItems:'center',WebkitAlignItems:'center',
                                fontSize:'3em',height:'50%',backgroundColor:'inherit',border:0}}
                                css={emotionTheme=>linkTextColor(emotionTheme)}
                                onClick={theme.toggle}>
                                {theme.dark?'Light mode':'Dark mode'}</button>
                            </>:<AuthenticatedDrawer handleHide={handleHide}/>}
                        </div>
                    </CSSTransition>     
                </Modal>    
            )}/>    
        
        
    )
}

function AuthenticatedDrawer({handleHide}){
    const emotionTheme = useEmotionTheme();
    const theme = useTheme();
    const [showBranches,setShowBranches] = useState(false);
    const branches = useMyBranches();
    const userContext = useContext(UserContext);

    function handleCurrentBranchChange(b){
        userContext.changeCurrentBranch(b);
    }

    return(
        <div className="flex-fill" style={{height:'100%',
        justifyContent:'center',WebkitJustifyContent:'center',flexFlow:'column',WebkitFlexFlow:'column',position:'relative'}}>
            <div className="flex-fill" style={{padding:10,flexFlow:'column',WebkitFlexFlow:'column',alignItems:'flex-start',
            WebkitAlignItems:'flex-start',borderBottom:`1px solid ${emotionTheme.borderColor}`}}>
                <button onClick={()=>setShowBranches(true)} className="no-highlight" 
                style={{border:0,backgroundColor:'transparent',width:'100%'}}> 
                    <span style={{fontWeight:500,fontSize:'1.2em',color:emotionTheme.textLightColor}}>Switch</span>
                    <SmallBranch branch={userContext.currentBranch} isLink={false} key={userContext.currentBranch.id}>
                    </SmallBranch>
                </button>
            </div>
            <Link to={`/${userContext.currentBranch.uri}`} onClick={handleHide} 
            className="flex-fill auth-drawer-item" css={emotionTheme=>linkTextColor(emotionTheme)}>Profile</Link>
            <Link to="/settings" className="flex-fill auth-drawer-item" css={emotionTheme=>linkTextColor(emotionTheme)}
            onClick={handleHide}>Settings</Link>
            <button className="flex-fill auth-drawer-item" style={{textAlign:'inherit',backgroundColor:'inherit',border:0,
            borderBottom:`1px solid ${emotionTheme.borderColor}`,color:emotionTheme.textColor}} onClick={theme.toggle}>
            {theme.dark?'Light mode':'Dark mode'}</button>

            <Link to="/logout/instant" className="flex-fill auth-drawer-item" css={emotionTheme=>linkTextColor(emotionTheme)}>Log out</Link>
            {showBranches?<>
                <div style={{position:'absolute',top:0,height:'100%',width:'100%',
                zIndex:2,backgroundColor:emotionTheme.backgroundColor,overflow:'auto'}}>
                    <span style={{margin:10,fontSize:'2em'}} onClick={()=>setShowBranches(false)}>x</span>
                    {branches.map(b=>{
                        let isCurrentBranch = userContext.currentBranch.uri==b.uri?true:false;
                        let backgroundColor = isCurrentBranch?
                        {
                            backgroundColor:emotionTheme.hoverColor,
                        }:{
                            backgroundColor:'transparent'
                        }
                        return <button className="flex-fill side-drawer-branch"
                        style={{...backgroundColor,borderBottom:`1px solid ${emotionTheme.borderColor}`}} key={b.id}
                        onClick={(e)=>{handleCurrentBranchChange(b);handleHide(e);}}>
                                <SmallBranch branch={b} isLink={false}/>
                            </button>
                    })}
                    <CreateNewBranch onClick={handleHide}/>
                </div>
                
                </>
            :null}
        </div>
    )
}