import React from 'react';
import {SmallBranch} from "./Branch"
import {DropdownList} from "./BranchPosts"
import {useMyBranches} from "../container/BranchContainer"


export function BranchSwitcher({defaultBranch,setBranch,changeCurrentBranch=false,
    preview=true,previewClassName,children}){
    const branches = useMyBranches();

    return (
        <DropdownList type="branch" component={BranchItem} label={defaultBranch} name="branch" 
        options={branches} defaultOption={defaultBranch} changeCurrentBranch={changeCurrentBranch} 
        setBranch={setBranch} preview={preview} previewClassName={previewClassName}> 
            {children}
        </DropdownList>
    )
}

export function BranchItem({setSelected,selected,option}){
    let style = option.uri==selected.uri?{backgroundColor:'#e2eaf1'}:null

    return(
        <div style={{...style}} 
        onClick={()=>setSelected(option)}  className="filter-dropdown-item">
            <SmallBranch branch={option} isLink={false} hoverable={false}/>
        </div>
        
    )
}

