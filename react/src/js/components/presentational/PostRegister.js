import React, {useContext} from "react";
import {css} from "@emotion/core";
import {UserContext} from "../container/ContextContainer";
import {UpdateBranch} from "./SettingsPage";

const container = theme=>css({
    boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
})

export default function PostRegister(){
    const userContext = useContext(UserContext);

    return(
        userContext.isAuth?
        <div>
            <UpdateBranch branch={userContext.currentBranch} isSimple/>
        </div>:null
    )
}