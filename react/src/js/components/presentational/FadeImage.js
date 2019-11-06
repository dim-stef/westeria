import React, {useEffect,useRef,useState} from "react"
import {css} from "@emotion/core"

const image = () =>css({
    opacity:0,
    transition:'opacity 0.3s',
})

const imageLoaded = () =>css({
    transition:'opacity 0.3s',
    opacity:1,
})


export function FadeImage(props){
    const ref = useRef(null);
    const [loaded,setLoaded] = useState(false);

    function onImageLoad(){
        setLoaded(true);
    }

    return(
        <img ref={ref} {...props} css={loaded?imageLoaded:image}
         onLoad={onImageLoad}/>
    )
}