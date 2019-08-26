import React, {useState,useContext,useEffect,useRef,useCallback,lazy,Suspense} from 'react'
import {UserContext} from "../container/ContextContainer"
import {isMobile} from 'react-device-detect';
import { Block,Value } from 'slate'
import {ToggleContent} from './Temporary'
import {CustomEditor} from "./Editor"
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
        <div className="flex-fill" style={{alignItems:'center'}}>
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

export default function Messenger({ws,branch,room,roomId,scrollToBottom,style=null,setHeightOnBlur,setHeightOnInput}){
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

    const [value,setValue] = useState('');
    const [previousValue,setPreviousValue] = useState(value);
    const [files,setFiles] = useState([])
    const ref = useRef(null);
    const editorRef = useRef(null);
    const context = useContext(UserContext);
    const [author,setAuthor] = useState(branch);
    let initIsMember = room.members.some(m=>m==branch.uri);
    const [isMember,setIsMember] = useState(initIsMember);


    const handleChange = (e) =>{
        setValue(e.target.innerText);
        setHeightOnInput()
    }

    function handleSendMessage(){
        let message = value;

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
                }).then(r=>{
                    scrollToBottom();
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
        if(value == ''){
            const documentNode = ref.current
            documentNode.focus()
        }
    },[value])

    const handlerRef = useRef(onKeyDown);

    function onKeyDown(event){
        // Return with no changes if the keypress is not '&'
        if (event.which !== 13 || event.keyCode !== 13 || event.key !== "Enter"){
            
            return
        }
        
        event.preventDefault();
        handleSendMessage();
        // Prevent line break.
        
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
        editorRef.current.innerText = '';
        setValue('');
        setFiles([]);
    }

    useEffect(()=>{
        setIsMember(room.members.some(m=>m==branch.uri))
    },[branch])

    return(
        <>
        <Suspense fallback={null}>
            {!isMember?<p>You are not a part of this group so you can't send a message</p>:null}
            <div className="flex-fill" style={{flexFlow:'column',WebkitFlexFlow:'column',zIndex:6,backgroundColor:'white'}}>
                <div className="flex-fill center-items" style={{padding:10,fontSize:'1.5rem',
                justifyContent:'stretch',borderTop:'1px solid #e2eaf1',...style}}>
                    <div>
                        <img src={context.currentBranch.branch_image} className="profile-picture" 
                        style={{width:48,height:48,marginRight:10,display:'block',objectFit:'cover'}}/>
                    </div>
                    <div className="flex-fill" style={{width:'100%'}} ref={ref}>
                        <CustomEditor
                        editorRef={editorRef}
                        value={value}
                        onInput={handleChange}
                        onKeyDown={(e)=>handlerRef.current(e)}
                        onBlur={setHeightOnBlur}
                        schema={schema}
                        className="flex-fill"
                        placeholder="Type something"
                        style={{padding:5,backgroundColor:'white',minWidth:0,borderRadius:10,
                        wordBreak:'break-all',border:'1px solid #a6b7c5',flex:'1 1 auto',minHeight:'2rem',alignItems:'center'}}/>
                        
                        <Toolbar handleSendMessage={handleSendMessage} onInput={handleImageClick}/>
                    </div>
                </div>
                {files.length>0?<MediaPreview files={files} setFiles={setFiles}/>:null}
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

function Toolbar({handleSendMessage,onInput}){
    
    return(
        <div className="flex-fill" style={{marginTop:5}}>
            <div className="flex-fill" style={{flex:'1 1 auto',margin:'0 10px'}}>
                <input type="file" multiple="multiple" className="inputfile" id="media" onInput={onInput}></input>
                <label for="media" style={{display:'inherit'}}><MediaSvg/></label>
            </div>
            <button className="editor-btn" onClick={handleSendMessage}>Send</button>
        </div>
    )
}

const MediaSvg = props => (
    <svg
      id="Layer_1"
      x="0px"
      y="0px"
      viewBox="0 0 260 260"
      xmlSpace="preserve"
      className="messenger-icon"
      {...props}
    >
      <style>{".st0{fill:#212121}"}</style>
      <path
        className="st0"
        d="M93.3 136c0-13.7 11.1-24.8 24.8-24.8 2.8 0 5-2.2 5-5s-2.2-5-5-5c-19.2 0-34.8 15.6-34.8 34.8 0 2.8 2.2 5 5 5s5-2.3 5-5z"
      />
      <path
        className="st0"
        d="M225.3 81.9h-50.5l-21.7-29.3c-.9-1.3-2.4-2-4-2h-62c-1.6 0-3.1.8-4 2L61.3 81.9H34.7c-2.8 0-5 2.2-5 5v117.6c0 2.8 2.2 5 5 5h190.7c2.8 0 5-2.2 5-5V86.9c-.1-2.8-2.3-5-5.1-5zm-22.4 30.2h17.4v65.5h-17.4v-65.5zm-139-20.2c1.6 0 3.1-.8 4-2l21.7-29.3h57l21.7 29.3c.9 1.3 2.4 2 4 2h48v10.2h-22.4c-2.8 0-5 2.2-5 5v3h-29c-9.1-16-26.2-26.8-45.9-26.8-19.6 0-36.8 10.8-45.9 26.8H39.7V91.9h24.2zm54.2 1.4c23.5 0 42.7 19.1 42.7 42.7 0 23.5-19.1 42.7-42.7 42.7-23.5 0-42.7-19.1-42.7-42.7s19.2-42.7 42.7-42.7zM39.7 199.5v-79.4h28.2c-1.6 5-2.4 10.3-2.4 15.8 0 29 23.6 52.7 52.7 52.7 29 0 52.7-23.6 52.7-52.7 0-5.5-.9-10.8-2.4-15.8h24.6v62.6c0 2.8 2.2 5 5 5h22.4v11.8H39.7z"
      />
      <path
        className="st0"
        d="M189.6 74h17.3c2.8 0 5-2.2 5-5s-2.2-5-5-5h-17.3c-2.8 0-5 2.2-5 5s2.2 5 5 5z"
      />
    </svg>
  );