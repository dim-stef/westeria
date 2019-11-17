import React, {useState,useRef,useEffect,useContext} from "react";
import {css} from "@emotion/core";
import clamp from 'lodash-es/clamp'
import { useSpring,useSprings,useTransition, animated, interpolate } from 'react-spring/web.cjs'
import { useDrag } from 'react-use-gesture'
import {PreviewPost} from "./PreviewPost"

const gridContainer = () =>css({
    height:600,
    display:'grid',
    gridTemplateColumns: 'repeat(4,1fr)',
    gridGap:10,
    gridAutoFlow:'dense'
})

const cell = () =>css({
    gridColumn:`span ${Math.ceil(Math.random()*4)}`,
    gridRow:`span ${Math.ceil(Math.random()*4)}`,
    order:1//Math.ceil(Math.random()*20)
})

const to = (x) => ({ x: x,scale: 1,display: 'block'})
const from = (x) => ({ x: x||0,scale: 1,display: 'block'})
const ani = (x) => ({ x: x,scale: 1,display: 'block'})
// This is being used down there in the view, it interpolates rotation and scale into a css transform
const trans = (r, s) => `rotateX(0deg) rotateY(${r / 10}deg) rotateZ(${r}deg) scale(${s})`
const transX = (x) => `translateX(${x}px)`


export function SwipeablePostGrid({postsContext,activeBranch,posts,fetchData}){

    let width = 640;
    function getPages(){
        var perChunk = 2 // items per chunk    
        var result = posts.reduce((resultArray, item, index) => { 
        const chunkIndex = Math.floor(index/perChunk)

        if(!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = [] // start a new chunk
        }

        resultArray[chunkIndex].push(item)

        return resultArray
        }, [])

        return result
    }

    const [page,setPage] = useState(0);
    const [pages,setPages] = useState(getPages())
    const [shownPages,setShownPages] = useState(pages.slice(0,6));
    const movX = useRef(null);
    const shouldOpen = useRef(true);
    const shouldUpdate = useRef(false);

    const isDown = useRef(false);
    const mainPage = useRef(null);
    const [index,setIndex] = useState(0);
    const pageIndex = useRef(0);
    const dataIndexChanged = useRef(false);
    const [props, set, stop] = useSpring(()=>({
        from:from(),
        config:{ mass: 1, tension: 500, friction: 35 },
        onRest:()=>{
            console.log("rest")
            if(dataIndexChanged.current){
                console.log("in")
                
                //stop();
                dataIndexChanged.current = false;
            }
        },
        onFrame:(f)=>{
            if((f.x + 0.5 > 0 && f.x < 0)
            || (Math.abs(f.x) + 0.5 > width && Math.abs(f.x) < width)
            || (Math.abs(f.x) + 0.5 > 2 * width && Math.abs(f.x) < 2 * width)){
                console.log("in")
                //stop()
                if(shouldUpdate.current){
                    dataIndexChanged.current = true;
                    if(movX.current > 0){
                        //index -=1
                        
                        setIndex(index=>index - 1)
                    }else{
                        setIndex(index=>index + 1)
                        //index +=1
                    }
                    //console.log(i,shownPages,pageIndex,pages.slice(pageindex, pageindex + 3))
                    //setShownPages(pages.slice(index, index + 6))
                }
            }
        }
    }))

    
    useEffect(()=>{
        if(shouldUpdate.current){
            shouldUpdate.current = false;
        }
    },[shownPages])

    useEffect(()=>{
        set(()=> ({
            from:ani(0),
            to:ani(0),
            immediate:true,
            config:{clamp:true}
        }))
        console.log("indexxx")
        if(shouldUpdate.current){
            shouldUpdate.current = false;
        }
        //stop();
    },[index])

    const bind = useDrag(({ down, velocity, movement: [mx], direction: [xDir], distance,cancel }) => {
        isDown.current = down;
        console.log("innnnnnnn",mx)
        movX.current = mx;

        if(down && Math.abs(mx) < 10){
            shouldOpen.current = true;
        }else{
            shouldOpen.current = false;
        }

        const trigger = velocity > 0.8;
        const isGone = !down && trigger;

        set(()=>{
            //const x = isGone ? xDir > 0 ? -width : width : down ? mx : 0;
            let x;
            if(isGone){
                shouldUpdate.current = true
                //setIndex(index=>index + 1)
                if(xDir < 0){
                    x = -width;
                }else{
                    x = width;
                }
            }else{
                if(!down){
                    x = 0
                }else{
                    x = mx;
                }
            }
            console.log(x)
            return {
                to:ani(x),
                from:ani(0),
                immediate:false,
                config:{ mass: 1, tension: 500, friction: 35 },                
            }
        })
    })

    return (
        <div style={{position:'relative',width:width,height:600}}>
            <animated.div id="page1" key={index - 1} data-index={index - 1}
            style={{position:'absolute',transform : props.x.interpolate(x => `translateX(${dataIndexChanged.current?-width:x - width}px)`),
            width:'100%'}}>
                <animated.div className="noselect">
                {shownPages[index - 1]?
                    <Page index={index-1} page={shownPages[index-1]} 
                    posts={posts} activeBranch={activeBranch} postsContext={postsContext}
                    shouldOpen={shouldOpen}
                    />:null
                }
                    
                </animated.div>
            </animated.div>
            <animated.div {...bind()} key={index} id="page2" data-index={index}
            style={{transform : props.x.interpolate(x => `translateX(${dataIndexChanged.current?0:x}px)`),position:'absolute',
            width:'100%'}} ref={mainPage}>
                <animated.div className="noselect">
                    <Page index={index} page={shownPages[index]} 
                    posts={posts} activeBranch={activeBranch} postsContext={postsContext}
                    shouldOpen={shouldOpen}
                    />
                </animated.div>
            </animated.div>
            <animated.div id="page3" key={index + 1} data-index={index + 1}
            style={{position:'absolute',transform : props.x.interpolate(x => `translateX(${dataIndexChanged.current?width:1.5*x + width}px)`),
            width:'100%'}}>
                <animated.div className="noselect">
                    <Page index={index + 1} page={shownPages[index + 1]} 
                    posts={posts} activeBranch={activeBranch} postsContext={postsContext}
                    shouldOpen={shouldOpen}
                    />
                </animated.div>
            </animated.div>
            

        </div>
    )
}

function Page({index,page,posts,activeBranch,postsContext,shouldOpen}){
    function getPostProps(post){
        let props = {
            post:post,
            key:[post.id,post.spreaders,postsContext.content],
            viewAs:"post",
            activeBranch:activeBranch,
            postsContext:postsContext,
            index:0
        };

        return props;
    }

    return(
        <div className="noselect" css={gridContainer}>
            {page.map(p=>{
                return <div css={cell}>
                    <PreviewPost {...getPostProps(p)} viewAs="post" size="large" shouldOpen={shouldOpen}/>
                </div>
            })}
        </div>
    )
}


/**return (
        <div style={{position:'relative',width:width,height:600}}>
            <animated.div id="page1" key={index - 1} data-index={index - 1}
            style={{position:'absolute',transform : props.x.interpolate(x => `translateX(${dataIndexChanged.current?-width:x - width}px)`),
            width:'100%'}}>
                <animated.div className="noselect">
                {shownPages[index - 1]?
                    <Page index={index-1} page={shownPages[index-1]} 
                    posts={posts} activeBranch={activeBranch} postsContext={postsContext}
                    shouldOpen={shouldOpen}
                    />:null
                }
                    
                </animated.div>
            </animated.div>
            <animated.div {...bind()} key={index} id="page2" data-index={index}
            style={{transform : props.x.interpolate(x => `translateX(${dataIndexChanged.current?0:x}px)`),position:'absolute',
            width:'100%'}} ref={mainPage}>
                <animated.div className="noselect">
                    <Page index={index} page={shownPages[index]} 
                    posts={posts} activeBranch={activeBranch} postsContext={postsContext}
                    shouldOpen={shouldOpen}
                    />
                </animated.div>
            </animated.div>
            <animated.div id="page3" key={index + 1} data-index={index + 1}
            style={{position:'absolute',transform : props.x.interpolate(x => `translateX(${dataIndexChanged.current?width:x + width}px)`),
            width:'100%'}}>
                <animated.div className="noselect">
                    <Page index={index + 1} page={shownPages[index + 1]} 
                    posts={posts} activeBranch={activeBranch} postsContext={postsContext}
                    shouldOpen={shouldOpen}
                    />
                </animated.div>
            </animated.div>
            

        </div>
    ) */