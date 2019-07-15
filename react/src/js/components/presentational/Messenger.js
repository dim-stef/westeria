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

export function Messenger({ws,branch,room,roomId,updateMessages=null,style=null}){
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
    const [author,setAuthor] = useState(branch);

    let initIsMember = room.members.some(m=>m==branch.uri);

    const [isMember,setIsMember] = useState(initIsMember);

    const handleChange = (e) =>{
        setValue(e.value);
        console.log(value)
        if (e.value.document != value.document) {
            //const content = JSON.stringify(e.value.toJSON())
            const content = Plain.serialize(e.value)
            localStorage.setItem('message', content)
        }
    }


    function handleImageClick(e){
        var newFiles = e.target.files;
        let newFilesArray = Array.from(newFiles);
        setFiles([...files,...newFilesArray]);        
    }

    useEffect(()=>{
        setIsMember(room.members.some(m=>m==branch.uri))
    },[branch])

    return(
        <>
        {!isMember?<p>You are not a part of this group so you can't send a message</p>:null}
        <div className="flex-fill" style={{padding:10,fontSize:'1.5rem',backgroundColor:'white',
        justifyContent:'stretch',borderTop:'1px solid #e2eaf1',...style}}>
            <div>
                <img src={context.currentBranch.branch_image} className="profile-picture" 
                style={{width:48,height:48,marginRight:10,display:'block',objectFit:'cover'}}/>
            </div>
            <div style={{width:'100%'}}>
                <Editor
                ref={ref}
                value={value}
                onChange={handleChange}
                schema={schema}
                placeholder="Type something"
                style={{padding:5,backgroundColor:'white',minWidth:0,borderRadius:10,
                wordBreak:'break-all',border:'1px solid #a6b7c5'}}/>
                {files.length>0?<MediaPreview files={files} setFiles={setFiles}/>:null}
                <input type="file" multiple="multiple" onInput={e=>handleImageClick(e)}></input>
                <Toolbar editor={ref} files={files} ws={ws} branch={branch} room={roomId}
                updateMessages={updateMessages} value={value}/>
            </div>
        </div>
        </>
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

function Toolbar({editor,updateMessages,ws,files,branch,room,value}){
    console.log("branch",branch)
    const handleClick = (e)=>{
        
        let message = Plain.serialize(value);

        const formData = new FormData();
        formData.append('message',message);
        formData.append('message_html',message);
        formData.append('author',branch.id);

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

            let uri = `/api/branches/${branch.uri}/chat_rooms/${room}/messages/new/`;

            axios.post(
                uri,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                }).then(response => {
                    axios.get(`/api/branches/${branch.uri}/chat_rooms/${room}/messages/${response.data.id}/`).then(response =>{
                        updateMessages([response.data]);
                        console.log(response);
                    })
                    console.log(response);
                }).catch(error => {
                console.log(error)
            })
        }else{
            ws.send(JSON.stringify({
                'message': message,
                'room_name': room,
                //'branch': branch,
                'from_branch': branch.uri,
                'images':[],
                'videos':[]
            }));
        }  
    }
    


    return(
        <div style={{marginTop:5}}>
            <button onClick={handleClick}>Send</button>
        </div>
    )
}