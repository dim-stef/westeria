import React, {useState,useEffect,useRef,useLayoutEffect,useContext} from "react"
import {Link} from "react-router-dom"
import {ToggleContent} from './Temporary'
import {UserContext} from "../container/ContextContainer"
import {SmallBranch} from "./Branch"
import {useMyBranches} from "../container/BranchContainer"
import {CreateNewBranch} from "./CreateNewBranch"
import { CSSTransition,Transition } from 'react-transition-group';
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

export function SideDrawer({children}){
    const userContext = useContext(UserContext);
    
    const [inProp, setInProp] = useState(false);
    const ref = useRef(null);

    function handleHide(e,hide){
        e.stopPropagation();
        setInProp(false);
        //hide();
    }

    function handleShow(e,show){
        e.stopPropagation();
        setInProp(true);
        show();
    }
    
    return(
        <ToggleContent 
            toggle={show=>(
                <div className="flex-fill" style={{height:'100%',width:'100%',justifyContent:'center',WebkitJustifyContent:'center',
                alignItems:'center',WebkitAlignItems:'center',position:'relative',borderTop:'2px solid rgb(226, 234, 241)'}}
                onClick={(e)=>handleShow(e,show)}>
                    {children}
                </div>
            )}
            content={hide => (
                <Modal onClick={(e)=>handleHide(e,hide)}>
                    <CSSTransition in={inProp} timeout={200} classNames="side-drawer" onExited={()=>hide()} appear>
                        <div onClick={e=>e.stopPropagation()} 
                        className={`side-drawer flex-fill`}
                        style={{height:'100%',width:'55%',backgroundColor:'white',
                        justifyContent:'center',WebkitJustifyContent:'center',flexFlow:'column',WebkitFlexFlow:'column'}}>
                            
                            {!userContext.isAuth?<>
                                <Link to="/login" className="flex-fill" style={{textDecoration:'none',color:'black',
                                justifyContent:'center',WebkitJustifyContent:'center',alignItems:'center',WebkitAlignItems:'center',
                                borderBottom:'1px solid rgb(226, 234, 241)',fontSize:'3em',height:'100%'}}>Login</Link>
                                <Link to="/register" className="flex-fill" style={{textDecoration:'none',color:'black',
                                justifyContent:'center',WebkitJustifyContent:'center',alignItems:'center',WebkitAlignItems:'center',
                                fontSize:'3em',height:'100%'}}>Register</Link>
                            </>:<AuthenticatedDrawer handleHide={handleHide}/>}
                        </div>
                    </CSSTransition>     
                </Modal>    
            )}/>    
        
        
    )
}

function AuthenticatedDrawer({handleHide}){
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
            WebkitAlignItems:'flex-start',borderBottom:'1px solid rgb(226, 234, 241)'}}>
                <button onClick={()=>setShowBranches(true)} className="no-highlight" 
                style={{border:0,backgroundColor:'transparent',width:'100%'}}> 
                    <span style={{fontWeight:500,fontSize:'1.2em'}}>Switch</span>
                    <SmallBranch branch={userContext.currentBranch} isLink={false} key={userContext.currentBranch.id}>
                    </SmallBranch>
                </button>
            </div>
            <Link to={`/${userContext.currentBranch.uri}`} onClick={handleHide} 
            className="flex-fill auth-drawer-item" >Profile</Link>
            <Link to="/settings" className="flex-fill auth-drawer-item" onClick={handleHide}>Settings</Link>
            <Link to="/logout" className="flex-fill auth-drawer-item" >Log out</Link>
            {showBranches?
                <>
                <div style={{position:'absolute',height:'100%',width:'100%',zIndex:2,backgroundColor:'white',overflow:'auto'}}>
                    <span style={{margin:10,fontSize:'2em'}} onClick={()=>setShowBranches(false)}>x</span>
                    {branches.map(b=>{
                        let isCurrentBranch = userContext.currentBranch.uri==b.uri?true:false;
                        let backgroundColor = isCurrentBranch?
                        {
                            backgroundColor:'#f5f5f5',
                        }:{
                            backgroundColor:'transparent'
                        }
                        return <button className="flex-fill side-drawer-branch"
                        style={{...backgroundColor}} key={b.id}
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