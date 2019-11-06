import React, {useState,useRef,useLayoutEffect} from "react";
import {Post} from "./SingularPost"
import {PreviewPost} from "./PreviewPost"
import {css} from "@emotion/core";

// proceed with caution

const gridContainer = (height) =>css({
    display:'grid',
    position:'relative',
    placeContent:'stretch',
    gridTemplateColumns:'repeat(2, 1fr)',
    gridTemplateRows:'repeat(2, 1fr)',
    gridAutoFlow:'dense',
    gridGap:10,
    margin:10,
    height:height
})

const nestedContainer = (size,item,parentGridSize) =>css({
    display:'grid',
    placeContent:'stretch',
    gridTemplateColumns:`repeat(${size}, 1fr)`,
    gridTemplateRows:`repeat(${size}, 1fr)`,
    gridRow:`span ${item.isFlat?'initial':parentGridSize}`,
    gridColumn:`span ${item.isFlat?parentGridSize:'initial'}`,
    gridAutoFlow:'dense',
    gridGap:10,
})

const smallGrid = (isParentFlat,isBigFlat) =>css({
    display:'grid',
    placeContent:'stretch',
    gridTemplateColumns:`repeat(2, 1fr)`,
    gridTemplateRows:`repeat(2, 1fr)`,
    gridRow:`span ${isParentFlat?isBigFlat?2:1:isBigFlat?4:2}`,
    gridColumn:`span ${isParentFlat?isBigFlat?2:4:isBigFlat?1:2}`,
    gridAutoFlow:'dense',
    gridGap:10,
})

const cell = (item,isFlat=false,isParentFlat) =>css({
    height:'100%',
    display:'grid', // this fixes height of cell
    gridColumn:`span ${item.size.getDimensions(isFlat,isParentFlat)[0]}`,
    gridRow:`span ${item.size.getDimensions(isFlat,isParentFlat)[1]}`,
})

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}


export function Grid({posts,activeBranch,measure,postsContext}){
    let sizes = {
        xsmall:{
            getDimensions:(isFlat,isParentFlat)=>{
                if(isFlat){
                    return [1,2]
                }else{
                    return [2,1]
                }
            },
            label:'xsmall',
        },
        small:{
            getDimensions:(isFlat,isParentFlat)=>{
                if(isFlat){
                    if(isParentFlat){
                        return [2,2]
                    }else{
                        return [4,1]
                    }
                }else{
                    if(isParentFlat){
                        return [1,4]
                    }else{
                        return [2,2]
                    }
                }
            },
            label:'small'
        },
        medium:{
            getDimensions:(isParentFlat)=>{
                if(isParentFlat){
                    return [2,4]
                }else{
                    return [4,2]
                }
            },
            label:'medium'
        },
        large:{
            getDimensions:(isFlat)=>{
                if(isFlat){
                    return [2,1]
                }else{
                    return [1,2]
                }
            },
            label:'large'
        }
    }

    const [isShown,setShown] = useState(false);
    const [height,setHeight] = useState(0);
    const ref = useRef(null);

    function getOrder(){
        let orderedPosts = [...posts];

        // sort posts by engagement order
        orderedPosts.sort((a, b) => (a.engagement < b.engagement) ? 1 : -1)
        return [
            {
                post:orderedPosts[0],
                size:sizes.large,
                order:getRandomInt(2),
                isFlat:false
            },
            {
                post:orderedPosts[1],
                size:sizes.medium,
                order:null,
                isFlat:false
            },
            {
                post:orderedPosts[2],
                size:sizes.small,
                order:getRandomInt(3)-1,
                isFlat:false
            },
            {
                post:orderedPosts[3],
                size:sizes.xsmall,
                order:getRandomInt(2),
                isFlat:false
            },
            {
                post:orderedPosts[4],
                size:sizes.xsmall,
                order:getRandomInt(2)-1,
                isFlat:false
            },
        ]
    }

    const [order,setOrder] = useState(getOrder())

    useLayoutEffect(()=>{
        if(ref.current){
            setHeight(ref.current.clientWidth)
        }
    },[ref])


    useLayoutEffect(()=>{
        if(height!=0){
            measure();
        }
    },[height])

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
        <div css={()=>gridContainer(height)} ref={ref}>
            <div style={{order:order[0].order}} 
            css={()=>cell(order[0],order[0].isFlat)}>
                {order[0].post?<PreviewPost {...getPostProps(order[0].post)} viewAs="post" size="large"/>:null}
            </div>
            <div css={()=>nestedContainer(4,order[0],2)}>
                <div css={()=>cell(order[1],order[0].isFlat)}>
                    {order[1].post?<PreviewPost {...getPostProps(order[1].post)} viewAs="post" size="medium"/>:null}
                </div>
                <div style={{order:order[2].order}} 
                css={()=>cell(order[2],order[2].isFlat,order[0].isFlat)}>
                    {order[2].post?<PreviewPost {...getPostProps(order[2].post)} viewAs="post" size="small"/>:null}
                    
                </div>
                <div css={()=>smallGrid(order[2].isFlat,order[0].isFlat)}>
                    <div style={{order:order[3].order}} 
                    css={()=>cell(order[3],order[2].isFlat,order[0].isFlat)}>
                        {order[3].post?<PreviewPost {...getPostProps(order[3].post)} viewAs="post" size="xsmall"/>:null}
                    </div>
                    <div style={{order:order[4].order}} 
                    css={()=>cell(order[4],order[2].isFlat,order[0].isFlat)}>
                        {order[4].post?<PreviewPost {...getPostProps(order[4].post)} viewAs="post" size="xsmall"/>:null}
                    </div>
                </div>
            </div>
        </div>
    )
}