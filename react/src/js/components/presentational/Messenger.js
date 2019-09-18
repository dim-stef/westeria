import React, {Suspense, useContext, useEffect, useLayoutEffect, useRef, useState} from 'react'
import {Redirect} from 'react-router-dom';
import {ChatRoomsContext, UserContext} from "../container/ContextContainer"
import {MoonLoader} from 'react-spinners';
import {CustomEditor} from "./Editor"
import {MediaPreview} from './EditorMediaPreview'
import axios from 'axios'
//const Editor = lazy(() => import('slate-react'));

const schema = {
    document: {

    },
    blocks: {
        image: {
        isVoid: true,
        },
    },
}

function isFileImage(file) {
    return file && file['type'].split('/')[0] === 'image';
}

function isFileVideo(file) {
    return file && file['type'].split('/')[0] === 'video';
}

export default function Messenger({ws,branch,room,roomId,scrollToBottom,style=null,setHeightOnBlur,setHeightOnInput}){

    const [value,setValue] = useState(null);
    const [files,setFiles] = useState([])
    const ref = useRef(null);
    const editorRef = useRef(null);
    const context = useContext(UserContext);
    const roomsContext = useContext(ChatRoomsContext)
    const [imageError,setImageError] = useState(false);
    const [videoError,setVideoError] = useState(false);

    // could either be object or just uri, need to check for both
    let initIsMember = room.members.some(m=>m==branch || m==branch.uri);
    const [isMember,setIsMember] = useState(initIsMember);
    const [isLoading,setLoading] = useState(false);


    const handleChange = (e) =>{
        setValue(e.target.innerText);
        setHeightOnInput()
    }

    function handleSendMessage(e){
        setLoading(true);
        let message = value;
        if(message==null){
            message='';
        }
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

            /*fetch(uri, {
                    method: 'POST',
                    credentials: "include",
                    body: formData,
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    },
              }).then(function (response) {
                    setLoading(false);
                    scrollToBottom();
              }).catch(e=>{
                console.log(e)
              })*/


            axios.post(
                uri,
                formData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                }).then(r=>{
                    setLoading(false);
                    scrollToBottom();
                })
        }else{
            setLoading(false);
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
            const documentNode = editorRef.current
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
        let imgErr = false;
        let videoErr = false;
        let newFilesArray = Array.from(newFiles);
        let validatedFiles = newFilesArray.map(f=>{
            // 15mb limit
            if(isFileImage(f) && f.size>15728640){
                imgErr = true;
                return false;
            }

            // 512mb limit
            if(isFileVideo(f) && f.size>536870912){
                imgErr = false;
                return false;
            }

            return f;
        })

        setImageError(imgErr);
        setVideoError(videoErr);
        setFiles([...files,...validatedFiles]);        
    }

    function resetEditor(){
        editorRef.current.innerText = '';
        setValue('');
        setFiles([]);
    }

    useLayoutEffect(()=>{
        // could either be object or just uri, need to check for both
        setIsMember(room.members.some(m=>m==branch ||m==branch.uri))
    },[branch])

    let warningStyle ={
        color:'#bf1b08',
        fontSize:'1.5rem',
        fontWeight:600,
        padding:'0 10px'
    }

    return(
        <>
        <Suspense fallback={null}>
            {!isMember?<Redirect to="/messages"/>:null}
            <div className="flex-fill messenger messenger-editor">
                <div className="flex-fill center-items" style={{padding:10,fontSize:'1.5rem',
                justifyContent:'stretch',borderTop:'1px solid #e2eaf1',...style}}>
                    <div>
                        <img src={context.currentBranch.branch_image} className="profile-picture" 
                        style={{width:48,height:48,marginRight:10,display:'block',objectFit:'cover'}}/>
                    </div>
                    <div className="flex-fill" style={{width:'100%',alignItems:'center',WebkitAlignItems:'center'}} ref={ref}>
                        <CustomEditor
                        files={files}
                        setFiles={setFiles}
                        editorRef={editorRef}
                        value={value}
                        onInput={handleChange}
                        onKeyDown={(e)=>handlerRef.current(e)}
                        onBlur={setHeightOnBlur}
                        schema={schema}
                        className="flex-fill"
                        placeholder="Type message"
                        style={{padding:'10px 10px',minWidth:0,borderRadius:25,
                        wordBreak:'break-all',border:'1px solid rgb(199, 208, 214)',flex:'1 1 auto',
                        minHeight:'2rem',maxHeight:100,overflow:'auto'}}/>
                        
                        <Toolbar handleSendMessage={handleSendMessage} onInput={handleImageClick} isLoading={isLoading}/>
                    </div>
                </div>
                {imageError?<p style={warningStyle}>One of the images you entered exceeds the 15mb size limit</p>:null}
                {videoError?<p style={warningStyle}>One of the videos you entered exceeds the 512mb size limit</p>:null}

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


function Toolbar({handleSendMessage,onInput,isLoading}){

    function preventBlur(e){
        e.preventDefault();
        e.stopPropagation();
    }

    return(
        <div className="flex-fill" style={{marginTop:5}}>
            <div className="flex-fill" style={{flex:'1 1 auto',margin:'0 10px'}}>
                <input type="file" accept="image/*|video/*" capture multiple 
                className="inputfile" id="media" style={{display:'block'}} onInput={onInput}></input>
                <label for="media" style={{display:'inherit'}}><MediaSvg/></label>
            </div>
            {isLoading?
                <div style={{alignSelf:'center'}}>
                    <MoonLoader
                        sizeUnit={"px"}
                        size={20}
                        color={'#123abc'}
                        loading={isLoading}
                    />
                </div>:
            <button className="editor-btn" onClick={handleSendMessage} onMouseDown={preventBlur}
             ontouchstart={preventBlur}>Send</button>}
            
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