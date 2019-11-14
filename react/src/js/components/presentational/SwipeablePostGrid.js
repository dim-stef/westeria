import React, {useState,useRef,useEffect,useContext} from "react";
import {css} from "@emotion/core";
import clamp from 'lodash-es/clamp'
import { useSpring,useSprings, animated, interpolate } from 'react-spring/web.cjs'
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

const to = () => ({ x: 0, y: 0, scale: 1,opacity:1, rot: 0 })
const from = (x) => ({ x: x, rot: 0, scale: 1,opacity:0, y: 0 })
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
    const [shownPages,setShownPages] = useState(pages.slice(0,3));
    const movX = useRef(null);
    const shouldOpen = useRef(true);
    const shouldUpdate = useRef(false);

    const index = useRef(0);
    const pageIndex = useRef(0);

    const [props ,set, stop] = useSprings(3, i=>({
        x: i * width - i * 50,
        scale: 1,
        display: 'block',
        config:{ mass: 1, tension: 500, friction: 35 },
        onFrame:(f)=>{
            if((f.x + 0.5 > 0 && f.x < 0)
            || (Math.abs(f.x) + 0.5 > width && Math.abs(f.x) < width)
            || (Math.abs(f.x) + 0.5 > 2 * width && Math.abs(f.x) < 2 * width)){
                if(shouldUpdate.current){
                    if(movX.current > 0){
                        pageIndex.current +=1
                    }else{
                        if(pageIndex.current !=0){
                            pageIndex.current -=1
                        }
                    }
                    //console.log(i,shownPages,pageIndex,pages.slice(pageIndex.current, pageIndex.current + 3))
                    setShownPages(pages.slice(pageIndex.current, pageIndex.current + 3))
                }
            }
        }
    }))

    useEffect(()=>{
        if(shouldUpdate.current){
            index.current = 2;
            shouldUpdate.current = false;
        }
    },[shownPages])


    // Create a bunch of springs using the helpers above
    // Create a gesture, we're interested in down-state, delta (current-pos - click-pos), direction and velocity
    const bind = useDrag(({ down, movement: [mx], direction: [xDir], distance, cancel }) => {
        movX.current = mx;
        //console.log(mx)
        if(down){
            if(Math.abs(mx)>10) {
                shouldOpen.current = false;
            }else{
                shouldOpen.current = true;
            }
            document.body.classList.add('noselect');
        }else{
            //shouldOpen.current = true;
            document.body.classList.remove('noselect');
        }

        if (down && distance > width / 2){
          //cancel((index.current = clamp(index.current + (xDir > 0 ? -1 : 1), 0, pages.length - 1)))
          cancel((index.current = (xDir > 0 ? -1 : 1)))
          shouldUpdate.current = true;
          //setShownPages(pages.slice(index.current, index.current + 3))
        }
        set(i => {
          const x = (i) * width + (down ? mx : 0)
          const scale = down ? 1 - distance / width / 2 : 1
          return { x, scale, display: 'block' }
        })
    })

    return (
        <div style={{position:'relative',width:width}}>
            {props.map(({ x, display, scale }, i) => {

            return <animated.div {...bind(i)} key={i} style={{transform: interpolate([x], transX),position:'absolute',zIndex:i}}>
                <animated.div className="noselect">
                    <Page index={i} page={shownPages[i]} posts={posts} activeBranch={activeBranch} postsContext={postsContext}
                        shouldOpen={shouldOpen}
                    />
                </animated.div>
            </animated.div>
            })}

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