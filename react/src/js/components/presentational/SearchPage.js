import React, { useState,useContext,useEffect,useRef } from 'react';
import ReactDOM from 'react-dom';
import {Link} from 'react-router-dom'
import {UserContext} from '../container/ContextContainer'
import {ToggleContent} from './Temporary'
import {CommentSection} from './Comments'
import {SmallBranchList} from './BranchList'
import {ChildBranch} from "./Branch"
import BranchFooter from "./Temporary"
import axios from 'axios';
import LazyLoad from 'react-lazy-load';


export function SearchPage(props){
    return(
        <div>
            <h1>Seach</h1>
            <Search/>
        </div>
    )
}

function Search(){
    const [results,setResults] = useState([])
    const [focused,setFocused] = useState(false);
    const [text,setText] = useState('');
    const wrapperRef = useRef(null);

    async function getResults(){
        let safeText = text.trim()
        const response = safeText ? await axios.get(`/api/search/?branch=${safeText}`): null
        console.log(response)
        if(response && Array.isArray(response.data)){
            setResults(response.data)
        }
    }

    useEffect(()=>{
        if(focused){
            getResults();
        }
    },[text])

    console.log(results.length)

    //let {styleName='', style=null, branch, editMode, children} = this.props
    return(
        <div ref={wrapperRef}>
            <input
                placeholder="Search"
                className="search-button"
                style={{height:50,width:'25%'}}
                value={text}
                onChange={e=> setText(e.target.value)}
                onFocus={e=> setFocused(true)}                
            />
            <div className="flex-fill" style={{flexFlow:'row wrap', justifyContent:'space-between'}}>
                {results.length>0?
                results.map(r=>{
                    return  <div className="branch-container" 
                            style={{display:'flex',minWidth:250, width:'30%',flexGrow:1,margin:10,flexFlow:'column',border:'1px solid #e2eaf1'}}>
                                <ChildBranch style={{marginTop:0,marginBottom:0,width:'100%',bannerWidth:'100%', branchDimensions:96}} 
                                branch={r}/>
                                <BranchFooter branch={r}/>
                            </div>
                           
                }):null}
            </div>
            
        </div>
    )
}