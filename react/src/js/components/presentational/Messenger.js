import React, {useState,useContext,useEffect,useRef} from 'react'
import ReactDOM from 'react-dom';
import {UserContext} from "../container/ContextContainer"
import {SmallBranch} from "./Branch"
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import {SkeletonBranchList} from "./SkeletonBranchList";
import { Editor } from 'slate-react'
import { Block,Value } from 'slate'
import {ToggleContent} from './Temporary'
import Plain from 'slate-plain-serializer'
import ReactPlayer from 'react-player'
import axios from 'axios'

var csrftoken = getCookie('csrftoken');


function MediaPreview(props){
    console.log("props.files",props.files)

    function handleClick(file){
        let fileArray = Array.from(props.files);
        let newFiles = fileArray.filter(f=>{
            return f!=file
        })
        console.log("newfiles",newFiles,file)
        props.setFiles(newFiles);
    }

    function renderImages(){
        let images = [];
        for (var i = 0; i < props.files.length; i++){
            if(isFileImage(props.files[i])){
                let file = props.files[i];
                let img = (
                <div style={{width:100,height:100,position:'relative'}}>
                    <img style={{objectFit:'cover',width:'100%',height:'100%'}} src={URL.createObjectURL(file)}/>
                    <button style={{position:'absolute',top:0,right:0}} onClick={()=>handleClick(file)}>x</button>
                </div>
                );
                images.push(img)
            }
        }
        return images;
    }

    function renderVideos(){
        let videos = [];
        for (var i = 0; i < props.files.length; i++){
            if(isFileVideo(props.files[i])){
                let file = props.files[i];
                let vid = (
                <div className="player-wrapper">
                    <ReactPlayer width={100} height={100} url={URL.createObjectURL(file)} 
                    volume={0} muted playing loop>
                    </ReactPlayer>
                    <button style={{position:'absolute',top:0,right:0}} onClick={()=>handleClick(file)}>x</button>
                </div>
                );
                videos.push(vid)
            }
        }
        return videos;
    }
    return(
        <div style={{display:'flex'}}>
            {renderImages()}
            {renderVideos()}
        </div>
    )
}

const schema = {
    document: {

    },
    blocks: {
        image: {
        isVoid: true,
        },
    },
}

export default function StatusUpdate({currentPost,updateFeed,postedId,replyTo=null,style=null}){
    const initialValue = Value.fromJSON({
    document: {
        nodes: [
            {
                object: 'block',
                type: 'paragraph',
                nodes: [
                {
                    object: 'text',
                    leaves: [
                    {
                        text: '',
                    },
                    ],
                },
                ],
            },
            ],
        },
    })

    const [value,setValue] = useState(initialValue);
    const [files,setFiles] = useState([])
    const ref = useRef(null);
    const context = useContext(UserContext);

    const handleChange = (e) =>{
        setValue(e.value);
        console.log(value)
        if (e.value.document != value.document) {
            //const content = JSON.stringify(e.value.toJSON())
            const content = Plain.serialize(e.value)
            localStorage.setItem('content', content)
        }
    }


    function handleImageClick(e){
        var newFiles = e.target.files;
        let newFilesArray = Array.from(newFiles);
        setFiles([...files,...newFilesArray]);        
    }
    
    

    return(
        <div className="flex-fill" style={{padding:10,fontSize:'1.5rem',backgroundColor:'#cfdeea',
        justifyContent:'stretch',...style}}>
            <div>
                <img src={context.currentBranch.branch_image} className="profile-picture" 
                style={{width:48,height:48,marginRight:10,display:'block'}}/>
            </div>
            <div style={{width:'100%'}}>
                <Editor
                ref={ref}
                value={value}
                onChange={handleChange}
                schema={schema}
                placeholder="Add a leaf"
                style={{padding:5,backgroundColor:'white',minWidth:0,borderRadius:10,
                wordBreak:'break-all',border:'1px solid #a6b7c5'}}/>
                {files.length>0?<MediaPreview files={files} setFiles={setFiles}/>:null}
                <input type="file" multiple="multiple" onInput={e=>handleImageClick(e)}></input>
                <Toolbar editor={ref} files={files} branch={context.currentBranch} postedId={postedId} currentPost={currentPost} 
                updateFeed={updateFeed} replyTo={replyTo} value={value}/>
            </div>
        </div>
    )
}

function CodeNode(props) {
    return (
        <pre {...props.attributes}>
            <code>{props.children}</code>
        </pre>
    )
}

function isFileImage(file) {
    return file && file['type'].split('/')[0] === 'image';
}

function isFileVideo(file) {
    return file && file['type'].split('/')[0] === 'video';
}

function Toolbar({editor,files,branch,postedId,currentPost=null,updateFeed,value,replyTo=null}){
    const [parents,setParents] = useState(null)
    const [siblings,setSiblings] = useState([])
    const [children,setChildren] = useState(null)
    const [checkedBranches,setCheckedBranches] = useState([])


    const handleClick = (e)=>{
        
        let post = Plain.serialize(value);
        let type = replyTo?'reply':'post';

        const formData = new FormData();
        if(files.length>0){
            for (var i = 0; i < files.length; i++)
            {
                if(isFileImage(files[i])){
                    formData.append('images',files[i])
                }else if(isFileVideo(files[i])){
                    console.log("isvideo")
                    formData.append('videos',files[i])
                }
                
            }
        }
        
        let postedTo = [postedId||currentPost.poster_id, ...checkedBranches];
        for(var id of postedTo){
            formData.append('posted_to',id);
        }
        
        formData.append('posted',postedId||currentPost.poster_id);
        formData.append('type',type);
        formData.append('text',post);
        
        if(replyTo){
            //data = {...data,replied_to:replyTo}
            formData.append('replied_to',replyTo)
        }

        let uri = `/api/branches/${branch.uri}/posts/new/`

        axios.post(
            uri,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRFToken': getCookie('csrftoken')
                },
            }).then(response => {
                axios.get(`/api/branches/${branch.uri}/posts/${response.data.id}`).then(response =>{
                    updateFeed([response.data]);
                    console.log(response);
                })
                console.log(response);
            }).catch(error => {
            console.log(error)
        })
    }
    


    return(
        <div style={{marginTop:5}}>
            <button onClick={handleClick}>Send</button>
        </div>
    )
}