import React, {useEffect,useState} from 'react'
import {css} from "@emotion/core";
import {Link} from "react-router-dom";
import {useGetAllPaths} from "../container/PathContainer";
import {HoverableTooltip} from "./Tooltip"
import {SmallCard} from "./Card"
import LazyLoad from 'react-lazy-load';
import axios from 'axios';


const imgWrapper = () => css({
    display:'flex',
    flexFlow:'row',
    alignItems:'center',
    height:40,
    margin:'10px 0',
    overflow:'auto'
})

const arrow = ()=>css({
    display:'flex',
    alignItems:'center',
    height:'100%'
})

const bullet = theme =>css({
    backgroundColor:theme.embeddedHoverColor,
    borderRadius:'50%',
    backgroundColor:'#2196f3',
    height:4,
    width:4
})

const compass = theme => css({
    height:23,
    width:23,
    fill:theme.textLightColor
})

export function Path({from,to,id,postsContext}){
    const paths = useGetAllPaths(from,to);

    let compassText;
    if(!from){
        compassText = `One of the paths containing @${to}`
    }else{
        compassText = `This is the path Westeria took to show you this leaf from @${to}`;
    }

    function handleClick(e){
        e.stopPropagation();
        e.preventDefault();
    }

    return (
        <div css={imgWrapper}>
            <HoverableTooltip position={{left:0,top:70}} text={compassText}>
                <CompassSvg/>
            </HoverableTooltip>
            {paths && paths.length > 0?
                paths[0].map((b,i)=>{
                let className;
                if(b.uri==from || b.uri==to){
                    className='double-border'
                }else{
                    className=''
                }

                return (
                        <React.Fragment key={b.uri}>
                        <SmallCard branch={b}>
                            <div style={{margin:'0 10px'}} onClick={handleClick}>
                                <Link to={`/${b.uri}`}>
                                    <img src={b.branch_image} className={`round-picture ${className}`} 
                                    style={{height:30,width:30,objectFit:'cover'}}/>
                                </Link>
                            </div>
                        </SmallCard>
                        {paths[0].length - 1 !=i?<div css={arrow}>
                            <span css={theme=>bullet(theme)}></span>
                        </div>:null}
                        </React.Fragment>
                    
                )
            }):null}
        </div>
    )
}

function RightArrow(){
    return(
        <svg
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        viewBox="0 0 129 129"
        enableBackground="new 0 0 129 129"
        style={{height:15,fill:'#9cb1c3'}}
        >
            <path d="M40.4 121.3c-.8.8-1.8 1.2-2.9 1.2s-2.1-.4-2.9-1.2c-1.6-1.6-1.6-4.2 0-5.8l51-51-51-51c-1.6-1.6-1.6-4.2 0-5.8 1.6-1.6 4.2-1.6 5.8 0l53.9 53.9c1.6 1.6 1.6 4.2 0 5.8l-53.9 53.9z" />
        </svg>

    )
}

function Logo(){
    return(
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="30" height="30">
            <defs>
                <image width="34" height="56" id="img1" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAA4CAMAAACv1NoNAAAAAXNSR0IB2cksfwAAAVlQTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAqFmfAQAAAHN0Uk5TAAouWnFzXiwMdsz3//VqBiur+fqwJjLp40g19FA07PNMAhm+2AWp/dANjhHa/ihlpgEf0e9PZ68Dz/IwMfyRnuIW6EYpiF+/E+ZVfJaZUllTigthOLx33CqkJG37m6gO3ucv6z/SwZXtyifVQB5Jh5AgGlPKTdkAAAFwSURBVHic7dRHU8JQFIbhAxKNcBAQRRFBQRCliF0UkWbvFRWxF+zt/y9MQpQk3HvjjFvfZeZZZCb5DoAyg7HBxDU2GYAW32y2oJDV3GIjC7ujFeWcbe0k4epARZ3uetFlRVWebq3w+lBTT69fJQJ9WoEY9CpFqD9cT3BgUEHcHoJAjNRENEYUGB/6IQmyQBwekcXoGI2MT8hkkiYQp5JVMk0nMylJzKbpBOckkmEIzOZEkmeReEEQ8yyBuCB8qUU2WVoGcLCJ1QWwwia4CjkdgWvg0iPrUNAjG7CpT7b0ybY++cW72PXIDuw6dcgegJktLPsAHJscRAGMbFIUR3DIEp4j8a8zscixtH1bkC7ypepITso0UY7Ic+RPaeTs/HvTpQuyuCzVTsPVNUn4UsobdJOtF7cqIVzUu7gaeDIB0BSt3CtA+iER0gqhx+JT9QCEY5VnngCE/C+vbyJ5/0iSgdSnSDgG+Cd/IDwn5FU/+wJakVpHlmDd1wAAAABJRU5ErkJggg=="/>
            </defs>
            <use id="Background" href="#img1" x="13" y="2" />
        </svg>
    )
}

const PathSvg = props => (
    <svg
      x="0px"
      y="0px"
      viewBox="0 0 297 297"
      style={{
        width: 19,
        height: 19
      }}
      xmlSpace="preserve"
      fill="#595959"
      {...props}
    >
      <path d="M256.195 7.594c-22.498 0-40.802 18.314-40.802 40.826 0 2.994.333 5.912.947 8.725l-52.365 26.201c-7.488-8.664-18.541-14.164-30.861-14.164-22.499 0-40.803 18.314-40.803 40.826s18.304 40.826 40.803 40.826c3.197 0 6.306-.382 9.293-1.081l25.062 37.622c-8.351 7.481-13.618 18.34-13.618 30.411 0 2.318.205 4.589.577 6.802l-74.499 12.425c-4.998-16.894-20.641-29.259-39.125-29.259C18.305 207.754 0 226.067 0 248.578c0 22.514 18.305 40.828 40.804 40.828 19.531 0 35.893-13.805 39.872-32.174l82.316-13.73c7.487 9.211 18.897 15.109 31.661 15.109 22.501 0 40.807-18.314 40.807-40.825 0-22.511-18.306-40.825-40.807-40.825-3.197 0-6.305.383-9.291 1.081L160.3 140.419c8.351-7.481 13.617-18.34 13.617-30.411 0-2.994-.333-5.911-.947-8.723l52.366-26.202c7.487 8.665 18.54 14.165 30.859 14.165 22.5 0 40.805-18.315 40.805-40.828 0-22.512-18.305-40.826-40.805-40.826zM40.804 269.34c-11.435 0-20.737-9.313-20.737-20.762 0-11.446 9.303-20.759 20.737-20.759s20.736 9.313 20.736 20.759c0 11.448-9.302 20.762-20.736 20.762zm174.59-51.554c0 11.447-9.304 20.759-20.74 20.759-11.435 0-20.736-9.311-20.736-20.759 0-11.446 9.302-20.759 20.736-20.759 11.436 0 20.74 9.313 20.74 20.759zM112.378 110.008c0-11.447 9.302-20.76 20.736-20.76 11.434 0 20.736 9.313 20.736 20.76s-9.302 20.76-20.736 20.76c-11.434 0-20.736-9.313-20.736-20.76zm143.817-40.826c-11.434 0-20.735-9.314-20.735-20.762 0-11.447 9.302-20.76 20.735-20.76 11.436 0 20.738 9.312 20.738 20.76.001 11.447-9.302 20.762-20.738 20.762z" />
    </svg>
  );

const CompassSvg = props => {
    return <svg
        x="0px"
        y="0px"
        viewBox="0 0 60 60"

        xmlSpace="preserve"
        overflow="visible"
        css={theme=>compass(theme)}
        {...props}
    >
        <path d="M44.394 13.091L8.633 29.503a1 1 0 00.252 1.895l15.833 2.653 1.809 14.95a1.002 1.002 0 001.889.324l17.291-34.882a1 1 0 00-1.313-1.352zM28.11 45.438l-1.496-12.369a1.002 1.002 0 00-.828-.866l-13.362-2.239L42.66 16.087 28.11 45.438z" />
        <path d="M30 0C13.458 0 0 13.458 0 30s13.458 30 30 30 30-13.458 30-30S46.542 0 30 0zm0 58C14.561 58 2 45.439 2 30S14.561 2 30 2s28 12.561 28 28-12.561 28-28 28z" />
    </svg>
};