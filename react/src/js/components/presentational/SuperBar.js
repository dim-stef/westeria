import React, {useEffect,useRef,useState} from "react"
import {Link,NavLink} from "react-router-dom";
import {css} from "@emotion/core";

const dropdownList = theme =>css({
    display:'flex',
    flexFlow:'column'
})

function SuperDropdown({options,onChange,children}){

    const [shown,setShown] = useState(false);

    function handleClick(){
        setShown(!shown);
    }

    function handleOptionSelect(option){
        onChange(option);
    }

    return(
        <div style={{position:'relative'}}>
            { React.cloneElement( children, { onClick: handleClick } ) }
            {shown?
            <div css={dropdownList}>
                {options.map(o=>{
                    return(
                        <React.Fragment><Option option={o}
                            handleSelect={handleOptionSelect}
                        /></React.Fragment>
                    )
                })}
            </div>:null}
        </div>
    )
}

function PostListPicker({postsContext}){
    let options = [
        {
            label:'Feed',
            value:'',
            action:'link',
        },
        {
            label:'Tree',
            value:'tree',
            action:'link',
        },
        {
            label:'All',
            value:'all',
            action:'link',
        }
    ]

    let defaultOption;
    if(postsContext.content=="feed"){
        defaultOption = options[0];
    }else if(postsContext.content=="all"){
        defaultOption = options[2];
    }else if(postsContext.content=="tree"){
        defaultOption = options[1];
    }

    const [option,setOption] = useState(defaultOption)

    function onChange(newOption){
        setOption(newOption)
    }

    return(
        <SuperDropdown options={options} onChange={onChange} default={defaultOption}>
            <p>{option.label}</p>
        </SuperDropdown>
    )
}

function ContentTypeFilter({postsContext}){

    const options = [
        { value: 'leaves', label: 'Leaves' },
        { value: 'leavesAndReplies', label: 'Leaves and Replies' },
        { value: 'media', label: 'Media' },
    ];

    const [option,setOption] = useState(postsContext.paramas.content);

    function onChange(newParams){
        setParams(newParams)
    }

    return (
        <SuperDropdown options={options}>

        </SuperDropdown>        
    )
}

function FilterBar({postsContext,refresh}){
    const [params,setParams] = useState(postsContext.params || null);

    function shallowCompare(obj1, obj2){
        var same = true;
        if(Object.keys(obj1).length!=Object.keys(obj2).length){
            same = false;
        }else{
            for (var key in obj1) {
                if (obj1.hasOwnProperty(key)) {
                    if(obj1[key].hasOwnProperty('value')){
                        if(obj1[key].value != obj2[key].value){
                            same = false;
                        }
                    }else{
                        shallowCompare(obj1[key],obj2[key])
                    }
                }
            }
        }
        return same;
    }

    useEffect(()=>{
        if(!shallowCompare(params , postsContext.params)){
            postsContext.params = params;
            refreshFunction();
        }
        postsContext.params = params;
    },[params])

    return(
        <div></div>
    )
}

function Option({option,handleSelect}){
    return(
        option.action==='link'?
        <div key={option.value} onClick={()=>handleSelect(option)}>
            <NavLink to={`/${option.value}`} >
                {option.label}
            </NavLink>
        </div>:
        <div key={option.value} onClick={()=>handleSelect(option)}>
            {option.label}
        </div>
    )
}

export function SuperBar({postsContext,refresh}){
    return(
        <PostListPicker postsContext={postsContext}/>
    )
}