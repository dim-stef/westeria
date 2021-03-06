import React, {useState,useEffect,useLayoutEffect,useRef} from "react"
import {useSprings,animated} from "react-spring/web.cjs";
import Async from "react-select/async";
import Select from "react-select";
import AsyncCreatableSelect from 'react-select/async-creatable';
import {useTheme} from "emotion-theming";
import {css} from "@emotion/core";
import {BubbleBranch as StyledBubbleBranch} from "./Branch"
import axios from "axios";

const options = [
    {value:'tag1',label:'Tag1',icon:'cccc'},
    {value:'tag2',label:'Tag2',icon:'cccc222'},
]

const customStyles = (theme,width='70%') => {
    return {
        container: () => ({
            width: width,
            position:'relative',
        }),
        control: () => ({
            backgroundColor:'transparent',
            color:theme.textColor,
            display:'flex',
            border:`1px solid ${theme.borderColor}`,
            borderRadius:15
        }),
        input: () =>({
            color:theme.textColor,
            fontSize:'1.3rem'
        }),
        multiValue: () =>({
            backgroundColor:theme.hoverColor,
            color:theme.textColor,
            fontSize:'1.5rem',
            display:'flex',
            margin:2,
            borderRadius:2,
            'div':{
                color:theme.textColor
            }
        }),
        placeholder: () =>({
            color:theme.textLightColor,
            fontSize:'1.3rem'
        }),
        menu: () => ({
            backgroundColor:theme.backgroundLightColor,
            color:theme.textColor,
            marginTop:15,
            borderRadius:15,
            boxShadow:'0px 2px 6px -4px black',
            fontSize:'1.5rem',
            fontWeight:500,
            overflow:'hidden'
        }),
        option: () => ({
            backgroundColor:'transparent',
            padding:'8px 10px',
            cursor:'pointer',
            '&:hover':{
                backgroundColor:theme.hoverColor
            }
        }),
    }
}

const tagInput = theme => css({
    width:'100%',
    padding:'10px 20px',
    boxSizing:'border-box',
    borderRadius:25,
    border:'2px solid #2196f3',
    fontSize:'1.5rem',
    color:theme.textColor,
    marginBottom:10
})

const negativeButton = theme =>css({
    padding:'5px 10px',fontSize:'1.3rem',fontWeight:'bold',
    border:`1px solid ${theme.borderColor}`,
    borderRadius:50,backgroundColor:'transparent',color:theme.textColor,
    margin:'0 5px'
})

const positiveButton = theme =>css({
    padding:'5px 10px',fontSize:'1.3rem',fontWeight:'bold',border:0,
    borderRadius:50,backgroundColor:'#2196f3',color:'white',
    margin:'0 5px'
})

function transformTags(tags){
    let tagsWithAttrs = tags.map(tag=>{
        return {label:tag,value:tag,icon:''}
    })

    return tagsWithAttrs;
}

function MenuPortal(props){
    return(
        <div style={{position:'absolute',left:0,right:0,bottom:100}}>
            {props.children}
        </div>
    )
}

const to = (x) => ({ x: x })

function useSlider(width){
    const index = useRef(0);

    const [props,set] = useSprings(2, i=>({
        from:{x:i*width},
    }))

    function sendToRight(){
        index.current = 1;

        // add some offset to width cause of padding
        set((i)=>({
            to:to((i - index.current) * (width + 70)),
            immediate:false,
        }))
    }

    function sendToLeft(){
        index.current = 0;
        set((i)=>({
            to:to((i - index.current) * (width + 70)),
            immediate:false,
        }))
    }

    useLayoutEffect(()=>{
        set((i)=>({
            to:to(i*(width + 70)),
            immediate:true,
        }))
    },[width])

    return [props,set,sendToRight,sendToLeft]
}

export function SerialTagSelector(props){
    const ref = useRef(null)
    const [width,setWidth] = useState(0);

    // all tags related to props.branch that were fetched from search results
    const [tags,setTags] = useState([]);

    // all selected tags available in westeria
    const [genericTags,setGenericTags] = useState([]);

    // all selected tags related to props.branch
    const [relatedTags,setRelatedTags] = useState([]);
    // branches that were found based on the selected tags
    const [availableBranches,setAvailableBranches] = useState([]);
    const [sliderProps,set,sendToRight,sendToLeft] = useSlider(width);

    async function loadInitialTags(){
        let response = await axios.get(`/api/v1/branches/${props.branch.uri}/related_tags/`);
        
        let data = response.data.map(tag=>{
            return {
                label:tag.tag.name,
                value:tag.tag.name
            }
        })
        setTags(data);
    }

    async function handleSearch(e){
        let str = e.target.value.replace(/\s\s+/g, '%20');
        let response = await axios.get(
            str==''?`/api/v1/branches/${props.branch.uri}/related_tags/`
            :`/api/v1/branches/${props.branch.uri}/related_tags/?tag=${str}`);
    
        let data = response.data.map(tag=>{
            return {
                label:tag.tag.name,
                value:tag.tag.name
            }
        })

        setTags(data);
    }

    useLayoutEffect(()=>{
        if(ref.current){
            setWidth(ref.current.clientWidth);
        }
    },[ref])

    useEffect(()=>{
        // genericTags might be null
        // doing this to prevent non spreadable error

        let genTags = genericTags?genericTags:[]
        props.setSelectedTags([...relatedTags,...genTags])
    },[genericTags,relatedTags])

    useEffect(()=>{
        loadInitialTags();
    },[])

    async function getBranchesByTags(){
        let tagsString = props.selectedTags.map(t=>t.label).join(',')

        let uri = `/api/v1/branches_by_tags/?tags=${tagsString}`;
        let response = await axios.get(uri)
        setAvailableBranches(response.data)
    }

    useEffect(()=>{
        if(props.selectedTags.length > 0){
            getBranchesByTags();
        }
    },[props.selectedTags])

    return(
        <div id="tag-selector-modal" style={{position:'relative',width:'100%',
        height:'100%',overflowX:'hidden'}} 
        ref={ref}>
            {sliderProps.map(({x},i)=>{
                return (
                    <animated.div key={i} style={{position:'absolute',height:'100%',width:'100%',
                    transform:x.interpolate(x=>`translateX(${x}px)`)}} css={{display:'flex',flexFlow:'column'}}>
                    {i==0?
                        <>
                        <h1>Add your own tags</h1>
                        <CreateableTagSelector tags={genericTags} setTags={setGenericTags}/>
                        <h1>Select tags related to {props.branch.name}</h1>
                        <input type="text" onChange={handleSearch} css={tagInput} 
                        placeholder="Search for available tags..."/>
                        <div css={{display:'flex',flexFlow:'row wrap',overflow:'auto',minHeight:200}}>
                            {tags.map((item,i)=>{
                                return(
                                    <React.Fragment key={i}>
                                        <BubbleTag tag={item} selectedTags={relatedTags} 
                                        setSelectedTags={setRelatedTags}/>
                                    </React.Fragment>
                                )
                            })}
                            {tags && tags.length == 0?
                            <h1 css={{alignSelf:'center',justifySelf:'center',width:'100%',textAlign:'center'}}>
                            No related tags were found :(</h1>:null}
                        </div>
                        <div css={theme=>({display:'flex',justifyContent:'space-between',borderRadius:50,
                        backgroundColor:theme.backgroundDarkColor,padding:10})}>
                            <button css={negativeButton} onClick={props.hide}>No, cancel</button>
                            <button css={positiveButton} onClick={sendToRight}>Add tags</button>
                        </div>
                        </>:<PostToBranches branches={availableBranches} sendToLeft={sendToLeft} hide={props.hide}
                            setSelectedBranches={props.setSelectedBranches} selectedBranches={props.selectedBranches}
                        />}
                    </animated.div>
                )
            })}
        </div>
    )
}

function PostToBranches({branches,selectedBranches,setSelectedBranches,sendToLeft,hide}){
    return(
        <div>
            <h1 css={theme=>({color:theme.textColor})}>Expand this leaf</h1>
            <h3 css={theme=>({color:theme.textLightColor})}>
            Based on the tags you selected this leaf can be posted on these branches as well</h3>
            <div css={{display:'flex',flexFlow:'row wrap'}}>
                {branches.length>0?
                branches.map(b=>{
                    return <React.Fragment key={b.uri}>
                        <BubbleBranch branch={b} selectedBranches={selectedBranches} 
                            setSelectedBranches={setSelectedBranches}
                        />
                    </React.Fragment>
                }):null}
            </div>
            <div css={theme=>({display:'flex',justifyContent:'space-between',borderRadius:50,
            backgroundColor:theme.backgroundDarkColor,padding:10})}>
                <button css={negativeButton} onClick={sendToLeft}>Change tags</button>
                <button css={positiveButton} onClick={hide}>Add branches</button>
            </div>
        </div>
    )
}

function BubbleBranch({branch,selectedBranches,setSelectedBranches}){
    const [clicked,setClicked] = useState(selectedBranches.some(b=>b.uri===branch.uri));

    function handleBranchClick(){
        setClicked(!clicked);
    }

    useEffect(()=>{
        let newBranches = [...selectedBranches];

        if(!clicked){
            newBranches = selectedBranches.filter(b=>b.uri!=branch.uri);
        }else{
            newBranches.push(branch)
        }

        setSelectedBranches(newBranches)
    },[clicked])

    return(
        <StyledBubbleBranch branch={branch} clicked={clicked} clickable={handleBranchClick}/>
    )
}

function BubbleTag({tag,selectedTags,setSelectedTags}){
    const [clicked,setClicked] = useState(selectedTags.some(t=>t.label===tag.label));

    function handleTagClick(){
        setClicked(!clicked);
    }

    useEffect(()=>{
        let newTags = [...selectedTags];

        if(!clicked){
            newTags = newTags.filter(t=>t.label!=tag.label);
        }else{
            newTags.push(tag)
        }

        setSelectedTags(newTags)
    },[clicked])

    return(
        <div onClick={handleTagClick} 
        css={theme=>({padding:'5px 10px',cursor:'pointer',transition:'background-color 0.15s ease',
        border:clicked?`1px solid transparent`:`1px solid ${theme.borderColor}`,
        borderRadius:50,color:clicked?'white':theme.textColor,
        width:'max-content',fontSize:'1.7rem',margin:7,backgroundColor:clicked?'#219ef3 !important':'transparent',
        minHeight:30,display:'flex',alignItems:'center',justifyContent:'center',flex:'1 1 auto',textAlign:'center',
        '&:hover':{
            backgroundColor:theme.backgroundDarkColor
        }})}>
        {tag.label}</div>
    )
}

export function TagSelector(props){

    const [options,setOptions] = useState([]);
    const theme = useTheme();

    function handleChange(values){
        props.setTags(values);
    }

    async function loadOptions(str){
        let response;
        if(str==''){
            response = await axios.get(`/api/v1/branches/${props.branch.uri}/tags_above/`);

        }else{
            str = str.replace(/\s\s+/g, '%20');
            response = await axios.get(`/api/v1/branches/${props.branch.uri}/related_tags/?tag=${str}`);
        }
        
        let data = response.data.map(tag=>{
            return {
                label:tag.tag.name,
                value:tag.tag.name
            }
        })

        return data;
    }

    return (
        <Async
            styles={customStyles(theme)}
            loadOptions={loadOptions}
            defaultOptions
            closeMenuOnSelect={false}
            menuPortalTarget={document.getElementById('disable-slide-swipe')} // needed to activate portaling
            components={{
                MenuPortal
            }}
            menuIsOpen
            isMulti
            onChange={handleChange}
        />
    )
}

export function CreateableTagSelector(props){

    const theme = useTheme();

    function handleChange(values){
        props.setTags(values);
    }

    async function loadOptions(str){
        str = str.replace(/\s\s+/g, '%20');
        let response = await axios.get(`/api/v1/tags/?name=${str}`);
        
        let data = response.data.map(tag=>{
            return {
                label:tag.name,
                value:tag.name
            }
        })

        return data;
    }

    return (
        <AsyncCreatableSelect
            {...props}
            loadOptions={loadOptions}
            value={props.tags}
            styles={customStyles(theme)}
            closeMenuOnSelect={false}
            isMulti
            onChange={handleChange}
            placeholder="Add or create your tags"
        />
    )
}

const branchTypeOptions = [
    { value: 'CM', label: 'Community' },
    { value: 'US', label: 'User' },
]

export function BranchTypeSelector(props){
    const theme = useTheme();

    function handleChange(values){
        props.setType(values);
    }

    return (
        <Select
            {...props}
            isSearchable={false}
            options={branchTypeOptions}
            defaultValue={props.type}
            styles={customStyles(theme,'max-content')}
            closeMenuOnSelect={false}
            onChange={handleChange}
            placeholder="Select type"
        />
    )
}

const customSingleValue = ({ data }) => (
    <div className="input-select">
        <div className="input-select__single-value">
            { data.icon && <span className="input-select__icon">{ data.icon }</span> }
            <span>{ data.label }</span>
        </div>
    </div>
);