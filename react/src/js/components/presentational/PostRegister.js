import React, {useContext} from "react";
import {css} from "@emotion/core";
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

export default function PostRegister(){
    const userContext = useContext(UserContext);

    return(
        userContext.isAuth?
        <div css={container}>
            <div css={simpleForm}>
                <UpdateBranch branch={userContext.currentBranch} postRegister/>
            </div>
        </div>:null
    )
}