import React, {useContext,useRef,useState,useLayoutEffect} from "react";
import {css} from "@emotion/core";
import {useSprings,animated} from "react-spring/web.cjs";
import {useDrag} from "react-use-gesture";
import {UserContext} from "../container/ContextContainer";
import {UpdateBranch} from "./SettingsPage";
import {ArrowSvg} from "./Svgs"

const container = theme=>css({
    display:'flex',
    justifyContent:'center',
    alignItems:'center',
    height:'80vh',
    paddingTop:60
})

const simpleForm = theme =>css({
    position:'relative',
    display:'flex',
    flexFlow:'column',
    alignItems:'flex-end',
    width:'40%',
    padding:'7em',
    backgroundColor:theme.backgroundLightColor,
    borderRadius:50,
    boxSizing:'border-box',
    boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
    '@media (max-width: 1226px)':{
        width:'60%'
    },
    '@media (max-width: 767px)':{
        width:'80%',
        padding:'3em'
    }

})

const to = (x) => ({ x: x })

export default function PostRegister(){
    const userContext = useContext(UserContext);


    const index = useRef(0);
    const containerRef = useRef(null);
    const [width,setWidth] = useState(0);
    const [formHeight,setFormHeight] = useState(0);

    useLayoutEffect(()=>{
        if(containerRef.current){
            setWidth(containerRef.current.clientWidth)
        }
    },[containerRef])

    return(
        userContext.isAuth?
        <div css={container} ref={containerRef}>
            <div css={simpleForm} style={{height:formHeight}}>
                {width!=0?<PageSlider width={width} setFormHeight={setFormHeight}/>:null}
            </div>
        </div>:null
    )
}

function PageSlider({width,setFormHeight}){
    const index = useRef(0);
    const userContext = useContext(UserContext);
    const editorPageRef = useRef(null);

    const [props,set] = useSprings(2, i=>({
        from:{x:i*width}
    }))

    const bind = useDrag(({ down, movement: [mx, my], velocity,direction:[xDir,yDir],delta:[xDelta] }) => {
        const trigger = velocity > 0.2;
        const isGone = trigger && !down
        index.current = isGone? xDir < 0 ? index.current+1 :index.current - 1 : index.current
        console.log(index.current)
        set(i=>{
            const x = (i - index.current) * width + (down ? mx : 0)
            return {x:x}
        })
    })

    useLayoutEffect(()=>{
        if(editorPageRef.current){
            setFormHeight(editorPageRef.current.clientHeight)
        }
    },[editorPageRef])

    return(
        props.map(({x},i)=>{
            // these child elements are absolutely positioned to perform animations
            // we need to grab the first "pages" height in order to adjust parent accordingly
            return (
                <animated.div ref={i==0?editorPageRef:null} key={i} {...bind()} 
                style={{width:'100%',position:'absolute',padding:'inherit',boxSizing:'border-box',left:0,top:0,
                transform:x.interpolate(x=>`translateX(${x}px)`)}}>
                    <UpdateBranch branch={userContext.currentBranch} postRegister/>
                </animated.div>
            )
        })
            
    )
}