import React from "react"
import { css } from "@emotion/core";
import Skeleton, {SkeletonTheme} from 'react-loading-skeleton';
import { useTheme } from 'emotion-theming'


function SkeletonBranch({dimensions=24}){
    const theme = useTheme()
    
    return(
        <SkeletonTheme color={theme.skeletonColor} highlightColor={theme.skeletonHighlightColor}>
            <Skeleton circle={true} width={dimensions} height={dimensions}/>
        </SkeletonTheme> 
    )
}

function SkeletonBox({boxSize=100}){
    const theme = useTheme()

    return(
        <SkeletonTheme color={theme.skeletonColor} highlightColor={theme.skeletonHighlightColor}>
            <Skeleton width='100%' height={boxSize}/>
        </SkeletonTheme>
    )
}

export const SkeletonPostList = React.memo(({count,branchSize,boxSize})=>{

    return(
        [...Array(count)].map((s,i)=>(
            <div key={i} css={{display:'flex',flexFlow:'column',margin:'20px 0'}}>
                <div css={{margin:'10px 0'}}>
                    <SkeletonBranch dimensions={branchSize}/>
                </div>
                <SkeletonBox boxSize={boxSize}/>
            </div>
        ))
    )
})
