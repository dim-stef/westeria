import React, { Component, useState,useEffect,useRef } from "react";
import {Link} from "react-router-dom"
import {UserContext} from "../container/ContextContainer"
import axios from 'axios'


export default class NavigationBar extends Component{
    static contextType = UserContext
    render(){
        return(
            <div style={{
                    height: 50,
                    position: "fixed",
                    width: "100%",
                    backgroundColor: "white",
                    borderBottom: "1px solid rgba(0,0,0,0.25)",
                    zIndex: 5000,
                    top:0
                }}
            >
            <div style={{display:'flex',
                    justifyContent:'space-between',
                    alignItems:'center',
                    height:'100%',
                    margin:'0 auto',
                    maxWidth:1200}}>
                <Home/>
                <Search/>
                {this.context.isAuth ? <ProfilePictureButton/> : null}
            </div>
                
            </div>
        )
    }
}


function Home(props){
    return(
        <Link to="/" style={{textDecoration:'none'}}>
            <div style={{display:'flex',alignItems:'center'}}>
                <span className="material-icons user-color">home</span>
                <span style={{color: "#156bb7",fontWeight:500,fontSize:17}}>Home</span>
            </div>
        </Link>
    )
}


class ProfilePictureButton extends Component{
    static contextType = UserContext
    render(){
        return(
            <Link to={`/${this.context.currentBranch.uri}`}>
                <div style={{
                        width:32,
                        height:32,
                        backgroundImage:`url(${this.context.currentBranch.branch_image})`, 
                        backgroundRepeat:'no-repeat',
                        backgroundSize:'cover',
                        backgroundPosition:'center',
                        borderRadius:'50%',
                        border:0}}>
                </div>
            </Link>
        )
    }
}

function Search(){
    const [results,setResults] = useState([])
    const [focused,setFocused] = useState(false);
    const [text,setText] = useState('');
    const wrapperRef = useRef(null);

    async function getResults(){
        let safeText = text.trim()
        const response = safeText ? await axios.get(`/api/search/?branch=${safeText}`): null

        if(response && Array.isArray(response.data)){
            setResults(response.data)
        }
    }

    useEffect(()=>{
        if(focused){
            getResults();
        }
        document.addEventListener("click", handleClickOutside, false);
        return () => {
            document.removeEventListener("click", handleClickOutside, false);
        };
    },[text])

    const handleClickOutside = event => {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
          setFocused(false);
        }
    };

    function handleClick(e){
        setText('');
        setFocused(false);
    }

    return(
        <div style={{position:'relative',height:'65%'}} ref={wrapperRef}>
            <input
                placeholder="Search"
                className="search-button"
                value={text}
                onChange={e=> setText(e.target.value)}
                onFocus={e=> setFocused(true)}
                
            />
           {focused && text?<SearchResults results={results.slice(0,5)} onclic={e=>{handleClick(e)}}/>:null}
        </div>
    )
}
//onBlur={e=> setFocused(false)}
function SearchResults({results,onclic}){
    const [displayedResults, setDisplayedResults] = useState([]);

    useEffect(()=>{
        console.log(results)
        var r = results.map(r => {
            return <ResultBranch branch={r} onclic={onclic}/>
        })
        setDisplayedResults(r);
    },[results])

    return(
        <div style={{position:'absolute',width:'100%',marginTop:10}}>
            <div style={{position:'relative',height:10}}>
                <div className="arrow-upper"></div>
                <div className="arrow-up"></div>
            </div>
            
            <div style={{backgroundColor:'white',padding:10,boxShadow:'0px 0px 1px 1px #0000001a'}}> 
                {displayedResults}
            </div>
        </div>
    )
}

function ResultBranch({branch,onclic}){
    return(
        <Link to={`/${branch.uri}`} className="search-small-result" style={{color:'#000000d6',textDecoration:'none'}} onClick={onclic}>
            <div style={{marginTop:5,marginBottom:10}}>
                <div style={{display:'flex',alignItems:'center'}}>
                    <img src={branch.branch_image} style={{width:28,height:28,borderRadius:'50%'}}></img>
                    <div style={{marginLeft:10,fontSize:'1.8em'}}>
                        <span style={{fontWeight:'bold'}}>{branch.name}</span>
                        <span style={{color:'gray',fontSize:'0.9em'}}>@{branch.uri}</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}