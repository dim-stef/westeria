import React from "react"
import { css } from "@emotion/core";
import Skeleton, {SkeletonTheme} from 'react-loading-skeleton';
import { useTheme } from 'emotion-theming'

export function SkeletonBranchList(){

    function getSkeletonBranches(){
        let branches = []
        for(var i =0; i<5;i++){
            let skeleton = <SkeletonBranch key={i}/>
            branches.push(skeleton)
        }
        return branches;
    }

    let branches=  getSkeletonBranches()
     
    return(
        <div>
            {branches}
        </div>
    )
}

const skeletonContainer = theme => css({
    margin:'10px 0',display:'flex',alignContent:'center'
})

const skeletonChildrenContainer = theme =>css({
    display:'flex',flexDirection:'column',justifyContent:'center',marginLeft:10, flex:'1 1 auto'
})

function SkeletonBranch(){
    const theme = useTheme()

    return(
        <div css={skeletonContainer}>
            <SkeletonTheme color={theme.skeletonColor} highlightColor={theme.skeletonHighlightColor}>
                <Skeleton circle={true} width={48} height={48}/>
            </SkeletonTheme>
            
            <div css={skeletonChildrenContainer}>
                <SkeletonTheme color={theme.skeletonColor} highlightColor={theme.skeletonHighlightColor}>
                    <Skeleton count={2} width="60%" height="40%"/>
                </SkeletonTheme>
            </div>
        </div>
    )
}