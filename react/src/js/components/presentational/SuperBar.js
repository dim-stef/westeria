import React, {useEffect,useRef,useState} from "react"
import {Link,NavLink} from "react-router-dom";
import {css} from "@emotion/core";
import {useMediaQuery} from 'react-responsive'
import {useTheme} from "../container/ThemeContainer"

const dropdownList = (theme,getTheme) =>css({
    display:'flex',
    flexFlow:'column',
    position:'absolute',
    backgroundColor:getTheme.dark?'#05060c':theme.backgroundColor,
    margin:'10px 0',
    padding:'5px 0',
    boxShadow:'0px 2px 4px -1px #000000',
    minWidth:'100px',
})

const optionCss = (theme,isMobile) =>css({
    fontSize:'1.5em',
    fontWeight:500,
    padding:'3px 5px',
    color:theme.textHarshColor,
    textDecoration:'none',
    cursor:'pointer',
    'a':{
        color:theme.textHarshColor,
        textDecoration:'none',
    },
    '@media (min-device-width: 767px)':{
        '&:hover':{
            backgroundColor:theme.embeddedHoverColor
        }
    }
})

const superBar = () =>css({
    margin:'10px 0',
    height:50,
    borderBottom:'2px solid black',
    boxSizing:'border-box',
    '@media (max-device-width: 767px)':{
        margin:0
    }
})

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
    }else{
        defaultOption = options[1];
    }

    const [option,setOption] = useState(defaultOption)

    function onChange(newOption){
        setOption(newOption)
    }

    return(
        <SuperDropdown2 options={options}>
            <div role="button" css={theme=>({color:theme.textHarshColor,fontWeight:'bold',
            fontSize:'2em',cursor:'pointer'})}>
            {option.label}</div>
        </SuperDropdown2>
    )
}

function useFilters(postsContext,refresh){
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
        if(params){
            if(!shallowCompare(params , postsContext.params)){
                postsContext.params = params;
                refresh();
            }
            postsContext.params = params;
        }
    },[params])

    return [params,setParams];
}


function Option({option,handleOptionClick,setSelected}){


    function handleClick(){
        handleOptionClick(option)
    }

    return(
        option.action==='link'?
        <div css={theme=>optionCss(theme)} key={option.value} onClick={()=>handleClick(option)}>
            <NavLink to={`/${option.value}`} >
                {option.label}
            </NavLink>
        </div>:
        <div css={theme=>optionCss(theme)} key={option.value} onClick={()=>handleClick(option)}>
            {option.label}
        </div>
    )
}

export function SuperBar({postsContext,refresh}){
    const getTheme = useTheme();

    return(
        <div css={superBar}>
            <div css={theme=>({height:'100%',backgroundColor:getTheme.dark?'#05060c':theme.backgroundColor,zIndex:3,
            display:'flex',justifyContent:'space-around',alignItems:'center'})}>
                <PostListPicker postsContext={postsContext} refresh={refresh}/>
                <Filter postsContext={postsContext} refresh={refresh}/>
            </div>
        </div>
    )
}

function Filter({postsContext,refresh}){

    const [params,setParams] = useFilters(postsContext,refresh);

    function handlePostTypeSelect(t){
        let p = params;
        p.content.label = t.label
        p.content.value = t.value
        postsContext.params = p;
        //setParams(p)
        refresh();
    }

    const options = [
        { 
            value: 'post_type', 
            label: params.content.label || params.label,
            onChildSelect:handlePostTypeSelect,
            children:[
                    { value: 'leaves', label: 'Leaves',onSelect:handlePostTypeSelect },
                    { value: 'leavesAndReplies', label: 'Leaves and Replies',onSelect:handlePostTypeSelect },
                    { value: 'media', label: 'Media',onSelect:handlePostTypeSelect },
                ]
        },
        { 
            value: 'post_list', 
            label: postsContext.content,
            children:[
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
        },
    ];

    return (
        <SuperDropdown2 options={options}>
            <p>click me</p>
        </SuperDropdown2>
    )
}

function SuperDropdown2({options,children}){
 
    const isMobile = useMediaQuery({
        query: '(max-device-width: 767px)'
    })

    const [shown,setShown] = useState(false);
    const [selected,setSelected] = useState(options[0]);
    const [list,setList] = useState(options);
    const getTheme = useTheme();
    //const list = childrenShown?selected.children:options
    
    function handleClick(){
        setShown(!shown);
    }

    function handleOptionClick(o){
        if(o.children){
            setList(o.children);
        }else{
            if(o.onSelect){
                o.onSelect(o);
            }
        }
    }

    return(
        <div style={{position:'relative',zIndex:2}}>
            { React.cloneElement( children, { onClick: handleClick } ) }
            {shown?
            <div css={(theme)=>dropdownList(theme,getTheme)}>
                {list.map(o=>{
                    return(
                        <React.Fragment key={o.value}><Option option={o}
                            handleOptionClick={handleOptionClick}
                            setSelected={list.onChildSelect?list.onChildSelect:()=>{}}
                        /></React.Fragment>
                    )
                })}
                
            </div>:null}
        </div>
    )
}