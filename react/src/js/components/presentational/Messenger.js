import React, {useState,useContext,useEffect,useRef,useCallback,lazy,Suspense} from 'react'
import {UserContext} from "../container/ContextContainer"
import {isMobile} from 'react-device-detect';
import { Block,Value } from 'slate'
import {ToggleContent} from './Temporary'
import Plain from 'slate-plain-serializer'
import ReactPlayer from 'react-player'
import axios from 'axios'
//const Editor = lazy(() => import('slate-react'));
import {Editor} from "slate-react";


function MediaPreview(props){

    function handleClick(file){
        let fileArray = Array.from(props.files);
        let newFiles = fileArray.filter(f=>{
            return f!=file
        })
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

export default function Messenger({ws,branch,room,roomId,updateMessages=null,style=null}){
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
    const [previousValue,setPreviousValue] = useState(value);
    const [files,setFiles] = useState([])
    const ref = useRef(null);
    const editorRef = useRef(null);
    const context = useContext(UserContext);
    const [author,setAuthor] = useState(branch);
    let initIsMember = room.members.some(m=>m==branch.uri);
    const [isMember,setIsMember] = useState(initIsMember);


    const handleChange = (e) =>{
        setValue(e.value);
        if (e.value.document != value.document) {
            //const content = JSON.stringify(e.value.toJSON())
            const content = Plain.serialize(e.value)
            localStorage.setItem('message', content)
        }
    }

    function handleSendMessage(editor){
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
                    formData.append('videos',files[i])
                }
            }

            let uri = `/api/branches/${branch.uri}/chat_rooms/${roomId}/messages/new/`;

            axios.post(
                uri,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                })
        }else{
            ws.send(JSON.stringify({
                'message': message,
                'room_name': roomId,
                'from_branch': branch.uri,
                'images':[],
                'videos':[]
            }));
        }
        resetEditor();
    }
    

    useEffect(()=>{
        if(Plain.serialize(value) == ''){
            const documentNode = ref.current.querySelector(`[data-key="${value.document.key}"`)
            documentNode.focus()
        }
    },[Plain.serialize(value)])

    const handlerRef = useRef(onKeyDown);

    function onKeyDown(event, editor, next){
        // Return with no changes if the keypress is not '&'
        if (event.which !== 13 || event.keyCode !== 13 || event.key !== "Enter") return next()
    
        // Prevent line break.
        event.preventDefault();
        handleSendMessage(editor);
    }

    // Update the current value of the ref after we successfully render.
    useEffect(
        () => {
            handlerRef.current = onKeyDown;
        },
        [onKeyDown,value,branch,files]
    );

    function handleImageClick(e){
        var newFiles = e.target.files;
        let newFilesArray = Array.from(newFiles);
        setFiles([...files,...newFilesArray]);        
    }

    function resetEditor(){
        setValue(initialValue);
        setFiles([]);
    }

    useEffect(()=>{
        setIsMember(room.members.some(m=>m==branch.uri))
    },[branch])

    return(
        <>
        <Suspense fallback={null}>
            {!isMember?<p>You are not a part of this group so you can't send a message</p>:null}
            <div className="flex-fill" style={{padding:10,fontSize:'1.5rem',backgroundColor:'white',
            justifyContent:'stretch',borderTop:'1px solid #e2eaf1',zIndex:6,...style}}>
                <div>
                    <img src={context.currentBranch.branch_image} className="profile-picture" 
                    style={{width:48,height:48,marginRight:10,display:'block',objectFit:'cover'}}/>
                </div>
                <div style={{width:'100%'}} ref={ref}>
                    <Editor
                    autoFocus
                    editorRef={editorRef}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={(e,editor,next)=>handlerRef.current(e,editor,next)}
                    onFocus={(event, editor, next) => editor.focus()}
                    schema={schema}
                    placeholder="Type something"
                    style={{padding:5,backgroundColor:'white',minWidth:0,borderRadius:10,
                    wordBreak:'break-all',border:'1px solid #a6b7c5'}}/>
                    {files.length>0?<MediaPreview files={files} setFiles={setFiles}/>:null}
                    <input type="file" multiple="multiple" onInput={e=>handleImageClick(e)}></input>
                    <Toolbar handleSendMessage={handleSendMessage}/>
                </div>
            </div>
        </Suspense>
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

function Toolbar({handleSendMessage}){
    
    return(
        <div style={{marginTop:5}}>
            <button onClick={handleSendMessage}>Send</button>
        </div>
    )
}