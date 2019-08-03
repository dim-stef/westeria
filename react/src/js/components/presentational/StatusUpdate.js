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
import {BranchSwitcher} from './BranchSwitcher'
import Plain from 'slate-plain-serializer'
import ReactPlayer from 'react-player'
import EmojiPicker from 'emoji-picker-react';
import { css } from '@emotion/core';
import { MoonLoader } from 'react-spinners';
import axios from 'axios'
import EmojiConvertor from "emoji-js"
let emoji = new EmojiConvertor(); 
// some more settings...
emoji.supports_css = true;
emoji.allow_native = true;
emoji.replace_mode = 'unified';
//emoji.text_mode = true;


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
                <div style={{width:100,height:100,position:'relative',margin: '10px 10px 10px 0px'}}>
                    <img style={{objectFit:'cover',width:'100%',height:'100%',borderRadius:'10px',border: '1px solid #989898'}} src={URL.createObjectURL(file)}/>
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
        <div style={{display:'flex',flexFlow:'row wrap'}}>
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
export function StatusUpdateAuthWrapper(props){
    const userContext = useContext(UserContext);

    return(
        userContext.isAuth?<StatusUpdate {...props}/>:<p>Not authorized</p>
    )
}
export default function StatusUpdate({currentPost,postsContext,measure=null,updateFeed,postedId,replyTo=null,style=null}){
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

    function renderNode(props, editor, next) {
        const { node, attributes, children } = props
      
        switch (node.type) {
            case 'emoji':
                return <p {...attributes}>{children}</p>
            default:
            return next()
        }
    }

    const [value,setValue] = useState(initialValue);
    const [files,setFiles] = useState([]);
    const [minimized,setMinimized] = useState(true);
    const ref = useRef(null);
    const wrapperRef = useRef(null);
    const context = useContext(UserContext);
    const [branch,setBranch] = useState(context.currentBranch)

    const handleChange = (e) =>{
        setValue(e.value);
        console.log("e.vakye",e.value)
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
    
    const onBlur = (event, editor, next) => {
        next();
        setTimeout(() => setMinimized(true), 0);
    };

    const onFocus = (event, editor, next) => {
        next();
        setTimeout(() => setMinimized(false), 0);
    };

    function handleClickOutside(event) {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target)
            && event.target!=document.getElementById('emoji-picker-wrapper')) {
                if(document.getElementById('modal-post-to') && document.getElementById('modal-post-to').contains(event.target)){
                    null
                }else{
                    setMinimized(true)
                }
           
        }else{
            setMinimized(false)
        }
    }

    useEffect(()=>{
        document.addEventListener('mousedown', handleClickOutside);

        return ()=>{
            document.removeEventListener('mousedown', handleClickOutside);
        }
    })

    useEffect(()=>{
        /*let inCache = postsContext.openPosts.some(p=>{
            return p==currentPost.id
        })*/

        if(measure && !ref){
            console.log("remeasure")
            measure();
        }
    })
    
    return(
        <div ref={wrapperRef} className="flex-fill" style={{padding:10,fontSize:'1.5rem',backgroundColor:'#C2E4FB',
        justifyContent:'stretch',position:'relative',zIndex:4,...style}}>
            <BranchSwitcher defaultBranch={branch} changeCurrentBranch={false} 
            setBranch={setBranch} preview={false} previewClassName="branch-switcher-preview">
                <img src={branch.branch_image} className="profile-picture" 
                style={{width:34,height:34,marginRight:10,display:'block'}}/>
            </BranchSwitcher>
            <div style={{width:'100%'}}>
                <Editor
                className="editor"
                ref={ref}
                value={value}
                onChange={handleChange}
                schema={schema}
                placeholder="Add a leaf"
                style={{padding:5,backgroundColor:'white',minWidth:0,borderRadius:10,
                wordBreak:'break-all',border:'2px solid #219ef3'}}/>
                {files.length>0?<MediaPreview files={files} setFiles={setFiles}/>:null}
                {minimized?
                null:
                <Toolbar editor={ref} files={files} branch={branch} postedId={postedId} currentPost={currentPost} 
                updateFeed={updateFeed} replyTo={replyTo} value={value} setValue={setValue} handleImageClick={handleImageClick}/>}
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

function Toolbar({editor,files,branch,postedId,currentPost=null,updateFeed,value,setValue,replyTo=null,handleImageClick}){
    const [parents,setParents] = useState(null)
    const [siblings,setSiblings] = useState([])
    const [children,setChildren] = useState(null)
    const [checkedBranches,setCheckedBranches] = useState([])
    const [loading,setLoading] = useState(true);

    console.log("editor",editor)
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
            formData.append('posted_to',branch.id);
            formData.append('replied_to',replyTo)
        }

        let uri = `/api/branches/${branch.uri}/posts/new/`
        setLoading(true);
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
                    updateFeed(response.data);
                    console.log(response);
                })
                console.log(response);
            }).catch(error => {
            console.log(error)
        }).finally(()=>{
            setLoading(false);
        })
    }
    
    async function onSelect(index,lastIndex,event){
        console.log("event",event)
        //event.stopPropagation();
        let endpoint = "parents";
        if(index===0){
            endpoint = "parents";
        }else if(index===1){
            endpoint = "siblings";
        }else if(index===2){
            endpoint = "children";
        }

        let target = currentPost?currentPost.poster:branch.uri
        let response = await axios.get(`/api/branches/${target}/${endpoint}/`)
        let branches = await response.data.results;
        console.log(response);
        if(index===0){
            setParents(branches);
        }else if(index===1){
            setSiblings(branches);
        }else if(index===2){
            setChildren(branches);
        }
    }

    function handleCloseModal(e){
        let values = []
        var checkBoxes = document.querySelectorAll('.input-checkbox:checked');
        for(var checkBox of checkBoxes){
            values.push(checkBox.value);
            console.log(checkBox.value);
        }
        setCheckedBranches(values);
    }

    let renderParents,renderChildren,renderSiblings;
    if(parents){
        renderParents = parents.length>0?parents.map(b=>{return <SmallBranch branch={b}>
            <CheckBox value={b.id} checkedBranches={checkedBranches}/>
        </SmallBranch>}):null;
    }else{
        renderParents = <SkeletonBranchList/>
    }

    if(siblings){
        renderSiblings = siblings.length>0?siblings.map(b=>{return <SmallBranch branch={b}>
            <CheckBox value={b.id} checkedBranches={checkedBranches}/>
        </SmallBranch>}):null;
    }else{
        renderSiblings = <SkeletonBranchList/>
    }

    if(children){
        renderChildren = children.length>0?children.map(b=>{return <SmallBranch branch={b}>
            <CheckBox value={b.id} checkedBranches={checkedBranches}/>
        </SmallBranch>}):null;
    }else{
        renderChildren = <SkeletonBranchList/>
    }


    function handleOpenModal(e,show){
        e.stopPropagation();
        show();
        onSelect(0);
    }

    return(
        <div style={{marginTop:5}}>
             <ToggleContent 
                toggle={show=>(
                    <div style={{display:'flex'}}>
                        <input type="file" multiple="multiple" className="inputfile" id="media" onInput={e=>handleImageClick(e)}></input>
                        <label for="media" style={{height:26,padding:2,marginRight:10}}><MediaSvg/></label>
                        <Emoji editor={editor}/>
                        <button style={{marginLeft:10}}
                        onClick={e=>{handleOpenModal(e,show)}}>Post to</button>
                        
                    </div>
                )}
                content={hide => (
                <Modal onClick={handleCloseModal}>
                    <PostToBranches parents={renderParents} siblings={renderSiblings} children={renderChildren}
                        onSelect={onSelect}
                    />
                </Modal>    
                )}/>
            <button onClick={handleClick}>Add</button>
            <MoonLoader
                sizeUnit={"px"}
                size={15}
                color={'#123abc'}
                loading={loading}
            />
        </div>
    )
}

function PostToBranches({parents,siblings,children,onSelect}){


    return(
        <div id="modal-post-to" style={{width:400,height:500,margin:'0 auto',marginTop:60,backgroundColor:'white'}}
        >
            <div onClick={()=>console.log("clicke2")}>
            <Tabs onSelect={onSelect} defaultFocus={true}>
                <TabList className="post-to-branch-tab-list" >
                    <Tab className="post-to-branch-tab"
                    selectedClassName="post-to-branch-tab-list-selected">Parents</Tab>
                    <Tab className="post-to-branch-tab"
                    selectedClassName="post-to-branch-tab-list-selected">Siblings</Tab>
                    <Tab className="post-to-branch-tab"
                    selectedClassName="post-to-branch-tab-list-selected">Children</Tab>
                </TabList>

                <TabPanel>
                    <div className="post-to-branch-tab-panel">
                        {parents}
                    </div>
                </TabPanel>
                <TabPanel>
                    <div className="post-to-branch-tab-panel">
                        {siblings}
                    </div>
                </TabPanel>
                <TabPanel>
                    <div className="post-to-branch-tab-panel">
                        {children}
                    </div>
                </TabPanel>
            </Tabs>
            </div>
        </div>
    )
}

export function CheckBox({value,checkedBranches}){
    const ref = useRef(null)
    

    useEffect(()=>{
        for(var value of checkedBranches){
            if(value==ref.current.value){
                ref.current.checked = true;
            }
        }
    },[])

    return(
        <label className="checkbox-label">
            <input type="checkbox" className="input-checkbox" value={value} ref={ref}></input>
            <span className="checkbox-custom rectangular"></span>
        </label>
    )
}


function Emoji({editor}){
    const [isOpen,setOpen] = useState(false);

    function handleEmojiClick(code,data){
        console.log(code,data)
        console.log("emoji",emoji.replace_colons(`:${code}:`))
        // \u{1F604}
        //editor.current.insertText(emoji.replace_unified(`\\u{${code}}`));
        editor.current.insertBlock(emoji.replace_colons(`:${data.name}:`));
    }

    function handleClick(){
        setOpen(!isOpen);
    }

    return(
        <div style={{position:'relative'}}>
            <div onClick={handleClick} style={{marginRight:10,padding:2,display:'inline-flex'}}>
                <EmojiSvg/>
            </div>
            {isOpen?
                <div style={{position:'absolute',zIndex:6}} id="emoji-picker-wrapper">
                    <EmojiPicker onEmojiClick={handleEmojiClick}/>
                </div>
            :null
            }
        </div>
    )
}
function EmojiSvg(){
    return(
        <svg
        className="messenger-icon"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        x="0px"
        y="0px"
        viewBox="0 0 295.996 295.996"
        style={{ enableBackground: "new 0 0 295.996 295.996" ,height:26}}
        xmlSpace="preserve"
        >
        <path d="M147.998 0C66.392 0 0 66.392 0 147.998s66.392 147.998 147.998 147.998 147.998-66.392 147.998-147.998S229.605 0 147.998 0zm0 279.996c-36.256 0-69.143-14.696-93.022-38.44a132.713 132.713 0 0 1-23.934-32.42C21.442 190.847 16 170.047 16 147.998 16 75.214 75.214 16 147.998 16c34.523 0 65.987 13.328 89.533 35.102 12.208 11.288 22.289 24.844 29.558 39.996 8.27 17.239 12.907 36.538 12.907 56.9 0 72.784-59.214 131.998-131.998 131.998z" />
        <circle cx="99.666" cy="114.998" r={16} />
        <circle cx="198.666" cy="114.998" r={16} />
        <path d="M147.715 229.995c30.954 0 60.619-15.83 77.604-42.113l-13.439-8.684c-15.597 24.135-44.126 37.604-72.693 34.308-22.262-2.567-42.849-15.393-55.072-34.308l-13.438 8.684c14.79 22.889 39.716 38.409 66.676 41.519 3.461.399 6.917.594 10.362.594z" />
        </svg>

    )
}

function MediaSvg(){
    return(
        <svg
        className="messenger-icon"
        height="512pt"
        viewBox="0 -36 512 511"
        width="512pt"
        style={{ height: 26, width: 26 }}
        >
        <path d="M231.898 198.617c28.204 0 51.153-22.945 51.153-51.148 0-28.207-22.95-51.153-51.153-51.153s-51.148 22.946-51.148 51.153c0 28.203 22.945 51.148 51.148 51.148zm0-72.3c11.665 0 21.153 9.488 21.153 21.152 0 11.66-9.488 21.148-21.153 21.148-11.66 0-21.148-9.488-21.148-21.148 0-11.664 9.488-21.153 21.148-21.153zm0 0" />
        <path d="M493.305.5H18.695C8.387.5 0 8.887 0 19.195v401.727c0 10.308 8.387 18.695 18.695 18.695h474.61c10.308 0 18.695-8.387 18.695-18.695V19.195C512 8.887 503.613.5 493.305.5zM482 30.5v237.406l-94.352-94.355c-6.152-6.14-16.156-6.137-22.304.012l-133.442 133.44-85.238-85.233a15.674 15.674 0 0 0-11.164-4.63c-4.215 0-8.176 1.641-11.156 4.622L30 316.105V30.5zM30 409.617v-51.086l105.5-105.5 85.234 85.235a15.694 15.694 0 0 0 11.168 4.632c4.211 0 8.176-1.644 11.153-4.625L376.5 204.828l105.504 105.504v99.285zm0 0" />
        </svg>
    )
}

const Modal = ({ children ,onClick}) => (
    ReactDOM.createPortal(
        <div className="modal" onClick={onClick}>
            {children}
        </div>,
        document.getElementById('modal-root')
    )
);