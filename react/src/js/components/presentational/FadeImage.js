import React, {useEffect,useRef,useState} from "react"
import {css} from "@emotion/core"

export const FadeImage= React.memo(function FadeImage(props){
    const ref = useRef(null);
    const [loaded,setLoaded] = useState(false);

    let style = props.style?props.style:{}

    useEffect(()=>{
        console.log("mount")
    },[])
    function onImageLoad(){
        setLoaded(true);
    }

    return(
        <img ref={ref} {...props} style={loaded?{
            transition:'opacity 0.3s',
            opacity:1,
            ...style
        }:{
            opacity:0,
            transition:'opacity 0.3s',
            ...style
        }}
        onLoad={onImageLoad}/>
    )
},(prevProps,nextProps)=>{
    return prevProps.src == nextProps.src;
})
