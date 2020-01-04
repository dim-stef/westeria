import React, {useContext,useRef,useEffect,useState,useLayoutEffect} from "react";
import {css} from "@emotion/core";
import {useSprings,useSpring,useTransition,useChain,animated,config} from "react-spring/web.cjs";
import {useMediaQuery} from 'react-responsive'
import {useDrag} from "react-use-gesture";
import {MoonLoader} from 'react-spinners';
import {UserContext,CachedBranchesContext} from "../container/ContextContainer";
import {UpdateBranch} from "./SettingsPage";
import {ArrowSvg} from "./Svgs";
import history from "../../history";
import axios from "axios";

const container = isMobile =>css({
    display:'flex',
    justifyContent:'center',
    alignItems:'center',
    height:isMobile?'100%':'85vh',
    position:'absolute',
    left:0,
    right:0,
    top:0,
    bottom:0,
    marginTop:'auto',
    marginBottom:'auto'
})

const simpleForm = (theme,isMobile) =>css({
    overflow:'hidden',
    position:'relative',
    display:'flex',
    flexFlow:'column',
    alignItems:'flex-end',
    width:'40%',
    padding:'7em',
    backgroundColor:theme.backgroundLightColor,
    borderRadius:isMobile?null:50,
    boxSizing:'border-box',
    boxShadow:isMobile?null:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
    '@media (max-width: 1226px)':{
        width:'60%'
    },
    '@media (max-width: 767px)':{
        width:'95%',
        padding:'3em'
    }

})

const finishButton = theme =>css({
    height:'auto',
    padding:'10px 20px',
    backgroundColor:'#2397f3',
    borderRadius:25,
    color:'white',
    border:0,
    fontWeight:'bold',
    fontSize:'1.3rem'
})

const imageOverlay = theme =>css({
    position:'absolute',backgroundColor:'rgba(0, 0, 0, 0.4)',top:0,
    width:'100%',height:'100%',display:'flex',justifyContent:'center',
    alignItems:'center'
})

const customScroll = theme =>css({
    '&::-webkit-scrollbar':{
        width:10
    },
    '&::-webkit-scrollbar-thumb':{
        backgroundColor:theme.hoverColor
    }
})

const to = (x) => ({ x: x })

export default function PostRegister(){
    const userContext = useContext(UserContext);
    if(localStorage.getItem('justRegistered')!='true' || !userContext.isAuth){
        history.push('/');
    }
    const index = useRef(0);
    const containerRef = useRef(null);
    const boxRef = useRef(null);
    const [width,setWidth] = useState(0);
    const isMobile = useMediaQuery({
        query: '(max-device-width: 767px)'
    })

    useLayoutEffect(()=>{
        if(boxRef.current){
            setWidth(boxRef.current.clientWidth)
        }
    },[boxRef])

    return(
        userContext.isAuth?
        <div css={()=>container(isMobile)} ref={containerRef}>
            <div css={(theme)=>simpleForm(theme,isMobile)} ref={boxRef} style={{height:isMobile?'100%':'85vh'}}>
                {width!=0?<PageSlider width={width}/>:null}
            </div>
        </div>:null
    )
}

function PageSlider({width}){
    const index = useRef(0);
    const submittionFunc = useRef(()=>{});
    const userContext = useContext(UserContext);
    const editorPageRef = useRef(null);

    const [props,set] = useSprings(2, i=>({
        from:{x:i*width},
    }))

    function sendToRight(){
        index.current = 1;
        set((i)=>to((i - index.current) * width))
    }

    function sendToLeft(){
        index.current = 0;
        set((i)=>to((i - index.current) * width))
    }

    const bind = useDrag(({ down, movement: [mx, my], velocity,direction:[xDir,yDir],delta:[xDelta],cancel }) => {
        if(Math.abs(yDir) > 0.7){
            cancel();
        }
        
        const trigger = velocity > 0.2 && Math.abs(mx) > 10;
        const isGone = trigger && !down
        index.current = isGone? xDir < 0 ? index.current+1 :index.current - 1 : index.current
        if(index.current > 1) index.current = 1;
        if(index.current < 0) index.current = 0;
        set(i=>{
            const x = (i - index.current) * width + (down ? mx : 0)
            return {x:x}
        })
    })

    return(
        props.map(({x},i)=>{
            // these child elements are absolutely positioned to perform animations
            // we need to grab the first "pages" height in order to adjust parent accordingly
            return (
                <animated.div ref={i==0?editorPageRef:null} key={i} {...bind()} css={customScroll}
                style={{height:'100%',width:'100%',position:'absolute',padding:'inherit',boxSizing:'border-box',
                left:0,top:0,overflowY:'scroll',
                transform:x.interpolate(x=>`translateX(${x}px)`)}}>
                    {i==0?<UpdateBranch branch={userContext.currentBranch} postRegister
                        postRegisterAction={sendToRight} submittionFunc={submittionFunc}
                    />:<InitialRecommendations submittionFunc={submittionFunc} sendToLeft={sendToLeft}/>}
                </animated.div>
            )
        })
            
    )
}

function InitialRecommendations({submittionFunc,sendToLeft}){
    const [topLevelBranches,setTopLevelBranches] = useState([]);
    const [followingBranches,setFollowing] = useState([]);
    const [loading,setLoading] = useState(false);
    const userContext = useContext(UserContext);
    const cachedBranches = useContext(CachedBranchesContext);

    async function getTopLevelBranches(){
        let response = await axios.get('/api/v1/top_level_branches/');
        setTopLevelBranches(response.data);
    }

    useEffect(()=>{
        getTopLevelBranches();
    },[])

    async function handleClick(){
        if(!userContext.isAuth){
            return;
        }

        setLoading(true);

        await submittionFunc.current();

        let url = `/api/branches/add_follow/${userContext.currentBranch.uri}/`;

        let ids = followingBranches.map(b=>b.id)
        let data = {
            follows:ids
        }

        axios.patch(
            url,
            data,
            {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            withCredentials: true,
        }).then(response => {
            localStorage.setItem('justRegistered','false');
            cachedBranches.following = followingBranches;
            history.push('/');
            setLoading(false);
        }).catch(error => {
            setLoading(false);
        })
    }

    return(
        <div css={{display:'flex',flexFlow:'column'}}>
            <h1>Follow some topics before you proceed</h1>
            {topLevelBranches.map(branch=>{
                return (
                    <div key={branch.uri} css={{display:'flex',flexFlow:'column',margin:'20px 0'}}>
                        <TopLevelBranch branch={branch} followingBranches={followingBranches}
                            setFollowing={setFollowing}
                        />
                    </div>
                )
            })}
            <div css={{alignSelf:'center',marginTop:10,width:'100%',display:'flex'}}>
                <div css={{display:'flex',flex:1}} onClick={sendToLeft}>
                    <ArrowSvg css={{height:15,width:15,padding:10,borderRadius:'50%',backgroundColor:'#2397f3',
                    fill:'white',}}/>
                </div>
                {loading?
                <MoonLoader
                sizeUnit={"px"}
                size={20}
                color={'#123abc'}
                loading={true}
                />:
                <button css={finishButton} onClick={handleClick}>Finish</button>}
            </div>
        </div>
    )
}

function TopLevelBranch({branch,followingBranches,setFollowing}){
    const [nodes,setNodes] = useState([]);
    const [clicked,setClicked] = useSuggestionClicked(branch,followingBranches,setFollowing);

    // Build a spring and catch its ref
    const springRef = useRef()
    const props = useSpring({
        from: { borderRadius:10 },
        to: { borderRadius:25 }
        , config:config.stiff, ref: springRef
    })
    // Build a transition and catch its ref
    const transitionRef = useRef()
    const transitions = useTransition(clicked ? nodes : [], item => item.name, {
        ref: transitionRef,
        unique: true,
        trail: 400 / nodes.length,
        from: { opacity: 0, transform: 'scale(0)' },
        enter: { opacity: 1, transform: 'scale(1)' },
        leave: { opacity: 0, transform: 'scale(0)' }
    })    // First run the spring, when it concludes run the transition
    useChain(clicked ? [springRef, transitionRef] : [transitionRef, springRef], [0, clicked ? 0.1 : 0.6])


    async function getNodesBeneath(){
        let response = await axios.get(`/api/v1/branches/${branch.uri}/nodes_beneath/`);
        setNodes(response.data[0].nodes);
    }

    function handleClick(){
        setClicked(!clicked);
    }

    useEffect(()=>{
        getNodesBeneath();
    },[])

    return(
        <div style={{width:'100%'}}>
            <animated.div css={{width:'100%',height:200,position:'relative',
            overflow:'hidden'}} style={props} className="noselect" onClick={handleClick}>
                <img src={branch.branch_image} css={{width:'100%',height:'100%',objectFit:'cover'
                ,transform:clicked?'scale(1.3)':'scale(1)',transition:'0.2s ease'}}/>
                <div css={imageOverlay}>
                    <span css={{fontSize:'3rem',fontWeight:'bold',color:'white'
                    ,wordBreak:'break-word',textAlign:'center',userSelect:'none'}}>{branch.name}</span>
                </div>
                {clicked?<CheckBoxSvg/>:null}
            </animated.div>
            <div css={{display:'flex',justifyContent:'center',flexFlow:'row wrap',transition:'max-height 1s ease',
            maxHeight:clicked?1000:0}}>
                {transitions.map(({ item, key, props }) => (
                    <animated.div key={key} style={props} 
                    css={{height:80,width:80,position:'relative',boxSizing:'border-box',
                    margin:10,flexGrow:1,maxWidth:200,display:'flex'}}><SuggestedBranch branch={item}
                        followingBranches={followingBranches} setFollowing={setFollowing}
                    /></animated.div>
                ))}
            </div>
        </div>
    )
}

function SuggestedBranch({branch,followingBranches,setFollowing}){
    const [clicked,setClicked] = useSuggestionClicked(branch,followingBranches,setFollowing);

    function handleClick(){
        setClicked(!clicked);
    }

    return(
        <div key={branch.id} onClick={handleClick} className="noselect" css={{borderRadius:clicked?20:10,
        transition:'0.2s ease',overflow:'hidden',position:'relative'}}>
            <img src={branch.branch_image}
                css={{objectFit:'cover',height:80,width:'100%',transform:clicked?'scale(1.3)':'scale(1)'
                ,transition:'0.2s ease'}}
            />
            <div css={imageOverlay}>
                <span css={{fontSize:'1.2rem',fontWeight:'bold',color:'white',wordBreak:'break-word',
                textAlign:'center',userSelect:'none'}}>{branch.name}</span>
            </div>
            {clicked?<CheckBoxSvg/>:null}
        </div>
    )
}

function useSuggestionClicked(branch,followingBranches,setFollowing){
    const [clicked,setClicked] = useState(false);

    useEffect(()=>{
        let newFollows = [...followingBranches];

        if(clicked){
            // if branch was selected add it to the pool
            newFollows.push(branch)
            setFollowing(newFollows)
        }else{
            // if branch was unselected remove from the pool
            newFollows = newFollows.filter(f=>f.uri!==branch.uri)
            setFollowing(newFollows)
        }
    },[clicked])

    return [clicked,setClicked]
}

function CheckBoxSvg(){
    return(
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            style={{
                position: "absolute",
                top: 0,
                right: 0,
                zIndex: 12323123,
                height: 25,
                width: 25,
                margin: 6
            }}
            >
            <path
                d="m256 0c-141.164062 0-256 114.835938-256 256s114.835938 256 256 256 256-114.835938 256-256-114.835938-256-256-256zm0 0"
                fill="#2196f3"
            />
            <path
                d="m385.75 201.75-138.667969 138.664062c-4.160156 4.160157-9.621093 6.253907-15.082031 6.253907s-10.921875-2.09375-15.082031-6.253907l-69.332031-69.332031c-8.34375-8.339843-8.34375-21.824219 0-30.164062 8.339843-8.34375 21.820312-8.34375 30.164062 0l54.25 54.25 123.585938-123.582031c8.339843-8.34375 21.820312-8.34375 30.164062 0 8.339844 8.339843 8.339844 21.820312 0 30.164062zm0 0"
                fill="#fafafa"
            />
        </svg>
    )
}