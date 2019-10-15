import React, {useEffect,useState} from 'react'
import {css} from "@emotion/core";
import {useGetAllPaths} from "../container/PathContainer";
import axios from 'axios';


const imgWrapper = () => css({
    display:'flex',
    flexFlow:'row wrap',
    alignItems:'center',
    height:40,
    margin:'0 -10px 10px'
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
export function Path({from,to}){
    const branches = useGetAllPaths(from,to);
    return (
        <div css={imgWrapper}>
            <Logo/>
            {branches?
                branches.map((b,i)=>{
                return (
                    <>
                    <div style={{margin:'0 10px'}}>
                        <img src={b.branch_image} className={`round-picture ${b.uri==from?'double-border':''}`} 
                        style={{height:30,width:30,objectFit:'cover'}}/>
                    </div>
                    {branches.length - 1 !=i?<div css={arrow}>
                        <span css={theme=>bullet(theme)}></span>
                    </div>:null}
                    </>
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