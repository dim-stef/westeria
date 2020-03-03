import React, {useEffect,useLayoutEffect,useRef,useState,useContext} from "react";
import ReactDOM from "react-dom";
import {Link,NavLink,Route,useLocation} from "react-router-dom";
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
import {HamburgerSvg,UserSvg,CommunitySvg,TreeSvg,EarthSvg,HomeSvg} from "./Svgs"
import bezier from "bezier-easing"

const dropdownList = (theme,getTheme,ref) =>css({
    zIndex:1,
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

const superBar = theme =>css({
    boxSizing:'border-box',
    overflow:'hidden',
    display:'flex',
    alignItems:'center',
    padding:'5px 0',
    backgroundColor:theme.backgroundLightColor,
    borderRadius:100,
    overflow:'hidden',
    '@media (max-device-width: 767px)':{
        borderRadius:0,
        margin:0
    }
})

const linkCss = theme =>css({
    textDecoration:'none',
    color:theme.textColor,
    margin:'0 5px',
    fontSize:'1.6rem',
    fontWeight:'bold',
    flexGrow:1,
    textAlign:'center',
    width:'33%',
    overflow:'hidden',
    display:'flex',
    flexFlow:'column',
    justifyContent:'center',
    alignItems:'center',
    borderRadius:10,
    padding:'2px 0',
    transition:'background-color 0.2s',
    '@media (max-device-width:767px)':{
        fontSize:'1.1rem',
    },
    '&:active':{
        backgroundColor:'rgba(33, 150, 243, 0.19)',
        
    },
})

const activeLink = theme =>css({
    'svg':{
        fill:'rgb(33, 150, 243)'
    }
})

const linkContentCss = (theme,match) =>css({
    overflow:'hidden',
    textOverflow:'ellipsis',
    whiteSpace:'nowrap',
    width:'100%',
    color:match?theme.primaryColor:theme.textLightColor,
    transition:'color 250ms',
    marginTop:2,
    fontWeight:400
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
    boxSizing:'border-box',
    height:'inherit',
    display:'flex',
    width:'fit-content',
    willChange:'transform'
})

const navIcon = (theme,match) =>css({
    fill:match?theme.primaryColor:theme.textLightColor,
    height:25,
    width:25,
    transition:'fill 250ms',
    '@media (max-device-width:767px)':{
        height:20,
        width:20
    }
})

const bubble = theme =>css({
    color:theme.textColor,
    textDecoration:'none',
    userSelect:'none',
    userDrag:'none',
    padding:'5px 8px',
    fontSize:'1.4rem',
    fontWeight:'bold',
    backgroundColor:theme.hoverColor,
    borderRadius:25,
    margin:'0 3px',
    display:'flex',
    justifyContent:'center',
    alignItems:'center',
    width:'max-content',
    zIndex:1,
    fill:theme.textColor,
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

const sliderTo = (y=0) =>({y:y})

export const SwipeableBar = React.memo(function SwipeableBar({postsContext,refresh,branch,isFeed,width}){
    const theme = useEmotionTheme();
    const loc = useLocation();
    const [location,setLocation] = useState(loc);
    const [height,setHeight] = useState(0);
    const userContext = useContext(UserContext);
    const parentBranchDrawerContext = useContext(ParentBranchDrawerContext)
    const indexRef = useRef(0);
    const containerRef = useRef(null);
    const superBarRef = useRef(null);
    const barRef = useRef(null);
    const shouldClick = useRef(true);
    const fillerBranches = userContext.isAuth?useFollowingBranches():useTopLevelBranches();

    const isMobile = useMediaQuery({
        query: '(max-device-width: 767px)'
    })

    let headerText;
    if(postsContext.content=='all'){
        headerText = 'All leaves';
    }else if(postsContext.content=='tree'){
        headerText = 'Tree leaves';
    }else if(postsContext.content=='branch'){
        headerText = `${branch.name}'s leaves`;
    }else if(postsContext.content=='branch_community'){
        headerText = 'Community leaves';
    }else if(postsContext.content=='branch_tree'){
        headerText = 'Tree leaves';
    }else{
        headerText = 'Feed leaves';
    }

    useLayoutEffect(()=>{
        if(superBarRef.current){
            setHeight(superBarRef.current.clientHeight);
        }
    },[superBarRef])

    const [props, set] = useSpring(() => ({
        from:{ x:0 },
        config:{tension:370,friction:27},
    }))

    const [switcherProps, switcherSet,stop] = useSprings(2,i => ({
        // using 60 as an estimated height for the bar
        from:{ y:i*60 },
    }))

    useEffect(()=>{
        if(height!=0){
            switcherSet((i)=>({
                to:sliderTo(i*height),
            }))
        }
    },[height])

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

    function handleDrawerClick(e){
        e.stopPropagation();
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

    function handleMenuClick(e){
        e.stopPropagation();
        indexRef.current = indexRef.current==0?1:0;

        switcherSet((i)=>({
            to:sliderTo((height)*(i-indexRef.current)),
        }))

    }

    let bubbleProps = {
        activeStyle:activeStyle,
        shouldClick:shouldClick,
        onClick:handleBubbleClick
    }


    return(
        <div css={superBar} ref={superBarRef} id="super-bar" style={{width:width}}>
            <div css={{display:'flex',width:'100%'}}>
            {branch?
            <div css={theme=>({backgroundColor:theme.backgroundLightColor,zIndex:1,borderTopRightRadius:100,
            borderBottomRightRadius:100})}
            onClick={handleDrawerClick}>
                <div css={theme=>({marginLeft:5,borderRadius:'50%',backgroundColor:theme.backgroundDarkColor,display:'flex',
                padding:6})}>
                    <img css={{width:32,height:32,objectFit:'cover',borderRadius:'50%'}} onClick={handleDrawerClick} 
                    src={branch.branch_image}/>
                </div>
            </div>:null}
            <div ref={containerRef} css={{minWidth:'50%',flexBasis:'90%',position:'relative'}}>
                {switcherProps.map(({y},i)=>{
                    return <animated.div css={{width:'100%',height:'100%',position:'absolute'}}
                    style={{willChange:'transform',
                    transform:y.interpolate(y=>{return `translateY(${y}px)`})}}>
                        {(i==0 && userContext.isAuth) || (i==1 && !userContext.isAuth) || (branch && !userContext.isAuth)?
                        <div css={{height:'100%',display:'flex',flexFlow:'column',maxWidth:'70%',margin:'0 auto',
                        justifyContent:'center',alignItems:'center','@media (max-device-width:767px)':{
                            maxWidth:'100%'
                        }}}>
                            {isFeed?
                            <div css={{display:'flex',flexGrow:1,width:'100%',justifyContent:'center',width:'100%'}}>
                                {userContext.isAuth?
                                <>
                                <NavLink exact to="/" css={linkCss}>
                                    
                                    <Route exact path="/" children={({ match }) => (
                                        <>
                                        <HomeSvg css={theme=>navIcon(theme,match)}/>
                                        </>
                                    )} />
                                </NavLink>
                                <NavLink to="/tree" css={linkCss}>
                                    <Route exact path="/tree" children={({ match }) => (
                                        <>
                                        <TreeSvg css={theme=>navIcon(theme,match)}/>
                                        </>
                                    )} />
                                </NavLink>
                                <NavLink to="/all" css={linkCss}>
                                    <Route exact path="/all" children={({ match }) => (
                                        <>
                                        <EarthSvg css={theme=>navIcon(theme,match)}/>
                                        </>
                                    )} />
                                </NavLink>
                                </>
                                :<NavLink to="/" css={linkCss}>
                                    <Route path="/" children={({ match }) => (
                                        <>
                                        <EarthSvg css={theme=>navIcon(theme,match)}/>
                                        </>
                                    )} />
                                    <Route>
                                </Route></NavLink>}
                            </div>:null}
                            {!isFeed?
                            <div css={{display:'flex',flexGrow:1,width:'100%',justifyContent:'center',width:'100%'}}>
                                <NavLink exact to={`/${branch.uri}`} css={linkCss} >
                                    <Route exact path={`/${branch.uri}`} children={({ match }) => (
                                        <>
                                        <UserSvg css={theme=>navIcon(theme,match)}/>
                                        </>
                                    )} />
                                </NavLink>
                                <NavLink to={`/${branch.uri}/tree`} css={linkCss} >
                                    <Route exact path={`/${branch.uri}/tree`} children={({ match }) => (
                                        <>
                                        <TreeSvg css={theme=>navIcon(theme,match)}/>
                                        </>
                                    )} /></NavLink>
                                <NavLink to={`/${branch.uri}/community`} css={linkCss}>
                                    <Route exact path={`/${branch.uri}/community`} children={({ match }) => (
                                        <>
                                        <CommunitySvg css={theme=>navIcon(theme,match)}/>
                                        </>
                                    )} />
                                </NavLink>
                            </div>:null}
                        </div>:
                        <animated.div ref={barRef} css={swipeableBarWrapper} {...bind()} onClickCapture={onClickCapture} 
                            style={{transform:props.x.interpolate(x=>`translateX(${x}px)`)}}>
                            <div css={bubble}><Filter postsContext={postsContext} refresh={refresh}/></div>

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
                        </animated.div>}
                    </animated.div>
                })}
            </div>
            <div css={theme=>({backgroundColor:theme.backgroundLightColor,zIndex:1,borderTopLeftRadius:100,
            borderBottomLeftRadius:100})} onClick={handleMenuClick}
            >
                <div css={theme=>({marginRight:5,borderRadius:'50%',backgroundColor:theme.backgroundLightColor,display:'flex',
                padding:6})}>
                    <div css={{height:32,width:32,display:'flex',justifyContent:'center',alignItems:'center'}}>
                        <HamburgerSvg css={{height:20,width:20,fill:theme.textColor}}/>
                    </div>
                </div>
            </div>
            </div>
        </div>
    )
},(prevProps,nextProps)=>{
    if(prevProps.branch && nextProps.branch && 
        prevProps.branch.uri == nextProps.branch.uri && prevProps.width == nextProps.width){
        return true;
    }
    return false;
})

function LinkText({text,match}){
    
    const transitions = useTransition(match, null, {
        from: { opacity: 0, height:0},
        enter: { opacity: 1, height:20},
        leave: { opacity: 0, height:0},
        config: {
            duration: 250,
            easing:t => t*(2-t)
        },
    })

    return (
        <div css={theme=>linkContentCss(theme,match)}>
            {text}
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
        <img src={branch.branch_image} css={{width:32,height:32,objectFit:'cover',borderRadius:'50%',
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
