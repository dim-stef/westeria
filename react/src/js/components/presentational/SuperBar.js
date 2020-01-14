import React, {useEffect,useRef,useState,useContext} from "react";
import ReactDOM from "react-dom";
import {Link,NavLink,useLocation} from "react-router-dom";
import history from "../../history";
import {css} from "@emotion/core";
import { useSpring,useSprings,useTransition, animated, interpolate } from 'react-spring/web.cjs';
import { useDrag } from 'react-use-gesture'
import {useMediaQuery} from 'react-responsive';
import {UserContext,ParentBranchDrawerContext} from "../container/ContextContainer";
import {useFollowingBranches,useTopLevelBranches} from "../container/BranchContainer";
import {useTheme} from "../container/ThemeContainer";
import {useTheme as useEmotionTheme} from "emotion-theming";
import {StatusUpdate} from "./StatusUpdate";

const dropdownList = (theme,getTheme,ref) =>css({
    display:'flex',
    flexFlow:'column',
    position:'absolute',
    backgroundColor:getTheme.dark?'#05060c':theme.backgroundColor,
    margin:'10px 0',
    padding:'5px 0',
    boxShadow:'0px 2px 4px -1px #000000',
    minWidth:'100px',
    borderRadius:5,
    top:ref.current.getBoundingClientRect().y + ref.current.clientHeight,
    left:ref.current.getBoundingClientRect().x - 15
})

const optionCss = (theme,isMobile) =>css({
    fontSize:'1.5em',
    fontWeight:500,
    padding:'3px 5px',
    color:theme.textHarshColor,
    textDecoration:'none',
    cursor:'pointer',
    'a':{
        color:theme.textHarshColor,
        textDecoration:'none',
        display:'block'
    },
    '@media (min-device-width: 767px)':{
        '&:hover':{
            backgroundColor:theme.embeddedHoverColor
        }
    }
})

const superBar = () =>css({
    boxSizing:'border-box',
    overflow:'hidden',
    '@media (max-device-width: 767px)':{
        margin:0
    }
})

function PostListPicker({postsContext,branch}){
    let options = !postsContext.isProfile?[
        {
            label:'Feed',
            value:'',
            action:'link',
        },
        {
            label:'Tree',
            value:'/tree',
            action:'link',
        },
        {
            label:'All',
            value:'/all',
            action:'link',
        }
    ]:[
        {
            label:'Posts',
            value:`/${branch.uri}`,
            action:'link',
        },
        {
            label:'Tree',
            value:`/${branch.uri}/tree`,
            action:'link',
        },
        {
            label:'Community',
            value:`/${branch.uri}/community`,
            action:'link',
        }
    ]

    let defaultOption;
    if(postsContext.content=="feed" || postsContext.content=="branch"){
        defaultOption = options[0];
    }else if(postsContext.content=="all" || postsContext.content=="branch_community"){
        defaultOption = options[2];
    }else if(postsContext.content=="tree" || postsContext.content=="branch_tree"){
        defaultOption = options[1];
    }else{
        defaultOption = options[1];
    }

    const [option,setOption] = useState(defaultOption)

    return(
        
        branch?<SuperDropDown options={options}>
            <div role="button" css={{cursor:'pointer',display:'flex',flexFlow:'column',alignItems:'start'}}>
                <div css={theme=>({color:theme.textColor,fontWeight:'bold',
                fontSize:'2em',cursor:'pointer',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',width:170})}>
                {branch.name}</div>

                <div css={theme=>({color:theme.textHarshColor,
                fontSize:'1.5em',fontWeight:500})}>
                {option.label}</div>
            </div>
        </SuperDropDown>:null
    )
}

function useFilters(postsContext,refresh){
    const [params,setParams] = useState(postsContext.params || null);

    function shallowCompare(obj1, obj2){
        var same = true;
        if(Object.keys(obj1).length!=Object.keys(obj2).length){
            same = false;
        }else{
            for (var key in obj1) {
                if (obj1.hasOwnProperty(key)) {
                    if(obj1[key].hasOwnProperty('value')){
                        if(obj1[key].value != obj2[key].value){
                            same = false;
                        }
                    }else{
                        shallowCompare(obj1[key],obj2[key])
                    }
                }
            }
        }
        return same;
    }

    useEffect(()=>{
        if(params){
            if(!shallowCompare(params , postsContext.params)){
                postsContext.params = params;
                refresh();
            }
            postsContext.params = params;
        }
    },[params])

    return [params,setParams];
}


function Option({option,handleOptionClick,setSelected}){

    function handleClick(e){
        e.stopPropagation();
        handleOptionClick(option)
    }

    return(
        option.action==='link'?
        <div css={theme=>optionCss(theme)} key={option.value} onClick={(e)=>handleClick(e)}>
            <NavLink to={option.value} >
                {option.label}
            </NavLink>
        </div>:
        <div css={theme=>optionCss(theme)} key={option.value} onClick={(e)=>handleClick(e)}>
            {option.label}
        </div>
    )
}

const superBarWrapper = (isDark) =>css({
    height:'100%',backgroundColor:isDark?'#05060c':'#f7f7f7',zIndex:3,
    display:'flex',justifyContent:'space-around',alignItems:'center',borderRadius:15,
    position:'relative',
    '@media (max-device-width: 767px)':{
        borderTopRightRadius:0,
        borderTopLeftRadius:0
    }

})

import bezier from "bezier-easing"

export function SuperBar({postsContext,refresh,branch,isFeed,updateFeed,postedId}){
    const getTheme = useTheme();
    const userContext = useContext(UserContext);

    return(
        <div css={superBar}>
            <div css={theme=>superBarWrapper(getTheme.dark)}>
                <div css={{flex:'1 1 auto',display:'flex',justifyContent:'space-around',height:'100%',alignItems:'center',
                zIndex:4,backgroundColor:'inherit'}}>
                    {(isFeed && userContext.isAuth) || !isFeed?
                    <Branches branch={branch}/>:null}
                    <PostListPicker postsContext={postsContext} refresh={refresh} branch={branch}/>
                    <Filter postsContext={postsContext} refresh={refresh}/>
                </div>
                {userContext.isAuth?<StatusUpdateButton branch={branch} updateFeed={updateFeed} 
                postedId={postedId} isFeed={isFeed} postsContext={postsContext}/>:null}
            </div>
        </div>
    )
}

const swipeableBarWrapper = theme =>css({
    paddingTop:'10px',
    boxSizing:'border-box',
    height:'inherit',
    display:'flex',
    width:'fit-content',
    willChange:'transform'
})

const bubble = theme =>css({
    color:theme.textColor,
    textDecoration:'none',
    userSelect:'none',
    userDrag:'none',
    padding:'5px 15px',
    fontSize:'1.4rem',
    fontWeight:'bold',
    backgroundColor:theme.hoverColor,
    borderRadius:25,
    margin:'0 3px',
    display:'flex',
    justifyContent:'center',
    alignItems:'center',
    width:'max-content',
    'a':{
        color:theme.textColor,
        textDecoration:'none',
        width:'max-content',
        height:'100%',
        display:'flex',
        justifyContent:'center',
        alignItems:'center',
        userSelect:'none',
        userDrag:'none',
    }
})

export function SwipeableBar({postsContext,refresh,branch,isFeed,updateFeed,postedId,width}){
    const theme = useEmotionTheme();
    const loc = useLocation();
    const [location,setLocation] = useState(loc)
    const userContext = useContext(UserContext);
    const parentBranchDrawerContext = useContext(ParentBranchDrawerContext)
    const barRef = useRef(null);
    const containerRef = useRef(null);
    const shouldClick = useRef(true);
    const fillerBranches = userContext.isAuth?useFollowingBranches():useTopLevelBranches();

    const [props, set] = useSpring(() => ({
        from:{ x:0 },
        config:{tension:370,friction:27},
    }))

    const bind = useDrag(({ down,movement:[mx,my], offset: [ox, oy],delta:[dx,dy], velocity,direction:[xDir,yDir],
        memo = props.x.getValue() }) => {
        let rect = barRef.current.getBoundingClientRect();

        let x = mx + memo;

        // user is swiping / dragging, should not click
        if(Math.abs(mx)>5){
            shouldClick.current = false;
        }else{
            shouldClick.current = true;
        }

        if(!down){

            // if out of bounds on right side, dock to right
            if(rect.right <= containerRef.current.clientWidth + 10){
                x = -(rect.width - containerRef.current.clientWidth)
            }

            // if out of bounds on right side, dock to left
            if(x > 0){
                x = 0;
            }
        }
        
        set({ x:x })

        return memo
    })

    function onClickCapture(e){
        if(!shouldClick.current){
            e.stopPropagation();
        }
    }

    function handleDrawerClick(){
        try{
            parentBranchDrawerContext.setShow(true);
        }catch(e){
            // no drawer is shown
            // desktop user goes here
        }
        
    }

    let activeStyle={
        border:`2px solid #2196f3`,
        order:-1
    }

    function handleBubbleClick(){
        set({x:0})
    }

    let bubbleProps = {
        activeStyle:activeStyle,
        shouldClick:shouldClick,
        onClick:handleBubbleClick
    }

    return(
        <div css={superBar} id="super-bar" ref={containerRef} style={{width:width}} onClickCapture={onClickCapture}>
            <animated.div ref={barRef} css={swipeableBarWrapper} {...bind()}
            style={{transform:props.x.interpolate(x=>`translateX(${x}px)`)}}>
                {branch?
                <div css={theme=>({...bubble(theme),backgroundColor:theme.backgroundLightColor})}
                 style={{padding:6,order:-2}} onClick={handleDrawerClick}>
                    <img css={{width:32,height:32,objectFit:'cover',borderRadius:'50%'}} src={branch.branch_image}/>
                </div>:null}
                <div css={bubble}><Filter postsContext={postsContext} refresh={refresh}/></div>
                {(isFeed && userContext.isAuth) || !isFeed?
                <div css={bubble}><Branches branch={branch} shouldClick={shouldClick}/></div>:null}
                {(isFeed && userContext.isAuth)?
                <>
                    <BubbleNavLink to="/" label="Feed" {...bubbleProps}/>
                    <BubbleNavLink to="/tree" label="Tree leaves" {...bubbleProps}/>
                    <BubbleNavLink to="/all" label="All leaves" {...bubbleProps}/>
                </>:null}
                {!isFeed?
                <>
                    <BubbleNavLink to={`/${branch.uri}`} 
                    {...bubbleProps} label={`${branch.name}'s leaves`}/>
                    <BubbleNavLink to={`/${branch.uri}/tree`} {...bubbleProps} label="Tree leaves"/>
                    <BubbleNavLink to={`/${branch.uri}/community`} 
                    {...bubbleProps} label="Community leaves" />
                </>:null}

                {fillerBranches && fillerBranches.length > 0?
                    fillerBranches.filter(b=>{
                            // in case user is not authenticated
                            if(branch){
                                return b.uri!=branch.uri
                            }else {
                                return true
                            }
                        }).map(b=>{
                        return <React.Fragment key={b.uri}>
                            <BubbleBranch branch={b} shouldClick={shouldClick}/>
                        </React.Fragment>
                    }):null}
            </animated.div>
        </div>
    )
}

function BubbleBranch({branch,shouldClick}){
    const ref = useRef(null);
    const shouldPreventDefault = usePreventDragClick(ref,shouldClick);

    const location = useLocation();
    let activeStyle={
        border:`2px solid #2196f3`,
        order:-1
    }

    const [active,setActive] = useState(false);

    return <div ref={ref} style={{display:'contents'}}><NavLink exact to={{ pathname:`/${branch.uri}`}} css={bubble}
    activeStyle={activeStyle} onClick={shouldPreventDefault} onDragStart={e=>e.preventDefault()}>
    <div css={{display:'flex',justifyContent:'center',alignItems:'center'}}>
        <img src={branch.branch_image} css={{width:20,height:20,objectFit:'cover',borderRadius:'50%',
        marginRight:10}}/>
        <span>{branch.name}</span>
    </div></NavLink></div>
}

function BubbleNavLink({to,activeStyle,state=null,label,shouldClick,onClick}){

    const ref = useRef(null);
    const shouldPreventDefault = usePreventDragClick(ref,shouldClick);

    return(
        <div ref={ref} style={{display:'contents'}}>
        <NavLink exact to={{pathname:to,state:state}} css={bubble} activeStyle={activeStyle} 
        draggable="false" onDragStart={e=>e.preventDefault()} onClick={(e)=>{shouldPreventDefault(e,onClick);}}>
        {label}</NavLink></div>
    )
}

// Use this to prevent ghost click after dragging an object
function usePreventDragClick(ref,shouldClick){

    function shouldPreventDefault(e,func){
        if(!shouldClick.current){
            e.preventDefault();
        }else{
            if(func){
                func();
            }
        }
    }

    useEffect(()=>{
        if(ref.current){
            ref.current.addEventListener('click',shouldPreventDefault)
        }

        return ()=>{
            if(ref.current){
                ref.current.removeEventListener('click',shouldPreventDefault)
            }
        }
    },[ref])

    return shouldPreventDefault
}

function Branches({branch}){

    function handleClick(){
        history.push(`/${branch.uri}/branches`);
    }

    return(
        <div role="button" onClick={handleClick} css={theme=>({
        cursor:'pointer',width:'max-content'})}>
            {branch.branch_count?branch.branch_count:null} Branches
        </div>
    )
}
function Filter({postsContext,refresh}){

    const [params,setParams] = useFilters(postsContext,refresh);

    function handlePostTypeSelect(t){
        let p = params;
        p.content.label = t.label
        p.content.value = t.value
        postsContext.params = p;
        //setParams(p)
        refresh();
    }

    function handleOrderingSelect(o){
        let p = params;
        p.ordering.label = o.label
        p.ordering.value = o.value
        postsContext.params = p;
        //setParams(p)
        refresh();
    }

    const options = [
        { 
            value: 'post_type', 
            label: postsContext.params.content.label,
            onChildSelect:handlePostTypeSelect,
            children:[
                    { value: 'leaves', label: 'Leaves',onSelect:handlePostTypeSelect },
                    { value: 'leavesAndReplies', label: 'Leaves and Replies',onSelect:handlePostTypeSelect },
                    { value: 'media', label: 'Media',onSelect:handlePostTypeSelect },
                ]
        },
        { 
            value: 'ordering', 
            label: postsContext.params.ordering.label,
            onChildSelect:handleOrderingSelect,
            children:[
                    { value: '-hot_score', label: 'Hot',onSelect:handleOrderingSelect },
                    { value: '-created', label: 'New',onSelect:handleOrderingSelect },
                ]
        },
    ];

    return (
        <SuperDropDown options={options}>
            <FilterSvg/>
        </SuperDropDown>
    )
}

function SuperDropDown({options,children}){
 
    const isMobile = useMediaQuery({
        query: '(max-device-width: 767px)'
    })

    const [shown,setShown] = useState(false);
    const [selected,setSelected] = useState(options[0]);
    const [list,setList] = useState(options);
    const ref = useRef(null);
    const getTheme = useTheme();
    const easing = bezier(0.25, 0.63, 0.76, 1.01);

    const transitions = useTransition(shown, null, {
        from: { opacity: 0, transform: 'translateY(-20px)'},
        enter: { opacity: 1, transform: 'translateY(0)'},
        leave: { opacity: 0, transform: 'translateY(-50px)' },
        config: {
            duration: 100,
            easing:t=>easing(t)
        },
    })
    
    function handleClick(){
        setShown(!shown);
    }

    useEffect(()=>{
        if(shown){
            setList(options);
        }
    },[shown])

    function handleOptionClick(o){
        if(o.children){
            setList(o.children);
        }else{
            if(o.onSelect){
                o.onSelect(o);
            }
        }
    }

    return(
        <div ref={ref} style={{position:'relative',zIndex:2}} css={{display:'flex'}}>
        { React.cloneElement( children, { onClick: handleClick } ) }
            {transitions.map(({ item, props, key }) => {
            return item && ReactDOM.createPortal(
                <animated.div key={key} css={(theme)=>dropdownList(theme,getTheme,ref)}
                    style={props}>
                        {list.map(o=>{
                            return(
                                <React.Fragment key={o.value}><Option option={o}
                                    handleOptionClick={handleOptionClick}
                                    setSelected={list.onChildSelect?list.onChildSelect:()=>{}}
                                /></React.Fragment>
                            )
                        })}
                
            </animated.div>,document.getElementById('hoverable-element-root')) })}
        </div>
    )
}


function StatusUpdateButton({branch,isFeed,updateFeed,postedId,postsContext,containerRef,width}){
    const getTheme = useTheme();
    const [show,setShow] = useState(false);
    const transitions = useTransition(show, null, {
        from: { opacity: 0 },
        enter: { opacity: 1},
        leave: { opacity: 0},
        config:{duration:200}
    })
    
    function handleClick(){
        setShow(!show);
    }

    const rect = containerRef.current?containerRef.current.getBoundingClientRect():{};

    return(
        <>
        <div onClick={handleClick} css={theme=>({width:'10%',display:'flex',justifyContent:'center',height:'100%',alignItems:'center',
        backgroundColor:getTheme.dark?'#090a10':'#efefef',zIndex:3})}>
            <PlusSvg/>
        </div>
        {ReactDOM.createPortal(transitions.map(({ item, props, key }) => {
            return (
                item && 
                <animated.div key={key} css={{width:width,position:'fixed',zIndex:0,left:rect.left,top:rect.y + 60}}
                    style={props}>
                        <StatusUpdate activeBranch={branch} postsContext={postsContext} updateFeed={updateFeed} 
                        postedId={postedId} isFeed={isFeed} redirect/>
                </animated.div>
                
        )}),document.getElementById('hoverable-element-root'))}
        </>
    )
}

const icon = theme =>css({
    height:20,
    width:20,
    borderRadius:'50%',
    padding:7,
    borderRadius:'50%',
    overflow:'visible',
    fill:theme.textHarshColor,
    cursor:'pointer',
})

const FilterSvg = props =>{
    return(
        <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        x="0px"
        y="0px"
        viewBox="0 0 971.986 971.986"
        style={{ enableBackground: "new 0 0 971.986 971.986" }}
        css={icon}
        {...props}
        xmlSpace="preserve"
        >
        <g>
            <path d="M370.216,459.3c10.2,11.1,15.8,25.6,15.8,40.6v442c0,26.601,32.1,40.101,51.1,21.4l123.3-141.3   c16.5-19.8,25.6-29.601,25.6-49.2V500c0-15,5.7-29.5,15.8-40.601L955.615,75.5c26.5-28.8,6.101-75.5-33.1-75.5h-873   c-39.2,0-59.7,46.6-33.1,75.5L370.216,459.3z" />
        </g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        </svg>
    )
}

const PlusSvg = (props)=>{
    return(
        <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        x="0px"
        y="0px"
        viewBox="0 0 512 512"
        style={{ enableBackground: "new 0 0 512 512" }}
        css={icon}
        xmlSpace="preserve"
        >
        <g>
            <g>
            <path d="M492,236H276V20c0-11.046-8.954-20-20-20c-11.046,0-20,8.954-20,20v216H20c-11.046,0-20,8.954-20,20s8.954,20,20,20h216    v216c0,11.046,8.954,20,20,20s20-8.954,20-20V276h216c11.046,0,20-8.954,20-20C512,244.954,503.046,236,492,236z" />
            </g>
        </g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        </svg>
    )
}
