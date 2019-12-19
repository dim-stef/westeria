import React, {useContext, useEffect, useRef, useState} from 'react'
import ReactDOM from 'react-dom';
import { useTheme } from 'emotion-theming'
import { css } from "@emotion/core";
import history from "../../history"
import {UserContext} from "../container/ContextContainer"
import {SmallBranch} from "./Branch"
import {Tab, TabList, TabPanel, Tabs} from 'react-tabs';
import {SkeletonBranchList} from "./SkeletonBranchList";
import {CustomEditor} from './Editor'
import {ToggleContent} from './Temporary'
import {BranchSwitcher} from './BranchSwitcher'
//import EmojiPicker from 'emoji-picker-react';
import {MediaPreview} from './EditorMediaPreview'
import {MoonLoader} from 'react-spinners';
import {TagSelector} from "./TagSelector";
import axios from 'axios'

const schema  = {
	blocks: {
		text: {
			isVoid: true
		}
	}
};
export default function StatusUpdateAuthWrapper(props){
    const userContext = useContext(UserContext);

    return(
        userContext.isAuth?<StatusUpdate {...props}/>:null
    )
}


function isFileImage(file) {
    return file && file['type'].split('/')[0] === 'image';
}

function isFileVideo(file) {
    return file && file['type'].split('/')[0] === 'video';
}

export function StatusUpdate({activeBranch=null,currentPost,isFeed=false,measure=null,updateFeed,postedId,replyTo=null,style=null,
    redirect=false}){

    function renderNode(props, editor, next) {
        const { node, attributes, children } = props
      
        switch (node.type) {
            case 'emoji':
                return <p {...attributes}>{children}</p>
            default:
            return next()
        }
    }

    const theme = useTheme();
    const [value,setValue] = useState('');
    const [files,setFiles] = useState([]);
    const [imageError,setImageError] = useState(false);
    const [videoError,setVideoError] = useState(false);
    const [minimized,setMinimized] = useState(true);
    const ref = useRef(null);
    const editorRef = useRef(null);
    const wrapperRef = useRef(null);
    const context = useContext(UserContext);
    const [branch,setBranch] = useState(context.currentBranch)
    const [parents,setParents] = useState(null);
    const [siblings,setSiblings] = useState(null);
    const [children,setChildren] = useState(null);
    const [checkedBranches,setCheckedBranches] = useState([])

    let postToProps = {parents:parents,setParents:setParents,siblings:siblings,setSiblings:setSiblings,
    children:children,setChildren:setChildren,checkedBranches:checkedBranches,setCheckedBranches:setCheckedBranches};

    const handleChange = (e) =>{
        setValue(e.target.innerText);
    }

    function handleImageClick(e){
        var newFiles = e.target.files;
        let newFilesArray = Array.from(newFiles);
        let imgErr = false;
        let videoErr = false;
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
        if(measure && !ref){
            measure();
        }
    })
    
    let warningStyle ={
        color:'#bf1b08',
        fontSize:'1.5rem',
        fontWeight:600,
        padding:'0 10px'
    }

    let placeholder = 'Add a leaf';
    if(activeBranch){
        placeholder = `Add a leaf to ${activeBranch.name}`
    }
    if(currentPost){
        placeholder = `Reply to ${currentPost.poster_name}`
    }

    return(
            <div ref={wrapperRef} className="flex-fill" style={{padding:10,fontSize:'1.5rem',backgroundColor:theme.hoverColor,
            justifyContent:'stretch',WebkitJustifyContent:'strech',position:'relative',zIndex:3,...style}}>
                <BranchSwitcher defaultBranch={branch} changeCurrentBranch={false} 
                setBranch={setBranch} preview={false} previewClassName="branch-switcher-preview" 
                style={{backgroundColor:'transparent !important'}}>
                    <img src={branch.branch_image} className="profile-picture"
                    style={{width:34,height:34,marginRight:10,display:'block',objectFit:'cover'}}/>
                </BranchSwitcher>
                <div style={{width:'100%'}}>
                    <CustomEditor
                    files={files}
                    setFiles={setFiles}
                    editorRef={editorRef}
                    onInput={handleChange}
                    placeholder={placeholder}
                    className="editor flex-fill text-wrap"
                    value={value}
                    style={{padding:'5px 10px',backgroundColor:'transparent',minWidth:0,borderRadius:25,color:theme.textColor,
                    border:'2px solid #219ef3',minHeight:'2rem',
                    alignItems:'center',backgroundColor:theme.backgroundColor,
                    WebkitAlignItems:'center',display:'block'}}/>
                    {files.length>0?<MediaPreview files={files} setFiles={setFiles}/>:null}
                    <Toolbar editor={ref} resetEditor={resetEditor} files={files} branch={branch} 
                    postedId={postedId} currentPost={currentPost} isFeed={isFeed} activeBranch={activeBranch}
                    updateFeed={updateFeed} replyTo={replyTo} value={value} setValue={setValue} handleImageClick={handleImageClick}
                        redirect={redirect} {...postToProps}
                    />
                    {imageError?<p style={warningStyle}>One of the images you entered exceeds the 15mb size limit</p>:null}
                    {videoError?<p style={warningStyle}>One of the videos you entered exceeds the 512mb size limit</p>:null}
                </div>
            </div>
    )
}


function Toolbar({editor,resetEditor,files,branch,postedId,currentPost=null,updateFeed,value,isFeed=false,replyTo=null,handleImageClick,
    parents,setParents,siblings,setSiblings,children,setChildren,checkedBranches,setCheckedBranches,activeBranch,redirect}){
    const [isLoading,setLoading] = useState(false);
    const userContext = useContext(UserContext);

    const inputRef = useRef(null)
    const handleClick = (e)=>{
        
        let post = value;
        //let post = value;
        let type = replyTo?'reply':'post';

        const formData = new FormData();
        if(files.length>0){
            for (var i = 0; i < files.length; i++)
            {
                if(isFileImage(files[i])){
                    formData.append('images',files[i])
                }else if(isFileVideo(files[i])){
                    formData.append('videos',files[i])
                }
                
            }
        }

        // if not feed get postedId from props else get from branch switcher
        if(!isFeed && postedId){
            formData.append('posted_to',postedId);
        }

        let postedTo = [ ...checkedBranches];
        
        for(var id of postedTo){
            formData.append('posted_to',id);
        }

        //if(postedTo.length>0){
        //    formData.append('posted_to',postedTo);
        //}
        
        formData.append('type',type);
        formData.append('text',post);
        
        if(replyTo){
            formData.append('posted_to',branch.id);
            formData.append('replied_to',replyTo)
        }

        formData.append('posted_to',branch.id); // add self
        formData.append('posted',branch.id);  // add self

        let uri = `/api/branches/${branch.uri}/posts/new/`
        setLoading(true);
        axios.post(
            uri,
            formData,
            {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRFToken': getCookie('csrftoken')
                },
            }).then(response => {
                if(redirect){
                    history.push(`/${branch.uri}/leaves/${response.data.id}`)
                }
                resetEditor();
                axios.get(`/api/branches/${branch.uri}/posts/${response.data.id}`).then(response =>{
                    updateFeed(response.data);
                })
            }).catch(error => {
        }).finally(()=>{
            setLoading(false);
        })
    }
    
    async function onSelect(index,lastIndex,event){
        let endpoint = "parents";
        if(index===0){
            endpoint = "parents";
        }else if(index===1){
            endpoint = "siblings";
        }else if(index===2){
            endpoint = "children";
        }

        let target = currentPost?currentPost.poster:activeBranch.uri
        let response = await axios.get(`/api/branches/${target}/${endpoint}/`)
        let branches = await response.data.results;
        if(index===0){
            setParents(branches);
        }else if(index===1){
            setSiblings(branches);
        }else if(index===2){
            setChildren(branches);
        }
    }

    let renderParents,renderChildren,renderSiblings;
    if(parents){
        renderParents = parents.length>0?parents.map(b=>{return <SmallBranch branch={b}>
            <CheckBox value={b.id} checkedBranches={checkedBranches} setCheckedBranches={setCheckedBranches}/>
        </SmallBranch>}):null;
    }else{
        renderParents = <SkeletonBranchList/>
    }

    if(siblings){
        renderSiblings = siblings.length>0?siblings.map(b=>{return <SmallBranch branch={b}>
            <CheckBox value={b.id} checkedBranches={checkedBranches} setCheckedBranches={setCheckedBranches}/>
        </SmallBranch>}):null;
    }else{
        renderSiblings = <SkeletonBranchList/>
    }

    if(children){
        renderChildren = children.length>0?children.map(b=>{return <SmallBranch branch={b}>
            <CheckBox value={b.id} checkedBranches={checkedBranches} setCheckedBranches={setCheckedBranches}/>
        </SmallBranch>}):null;
    }else{
        renderChildren = <SkeletonBranchList/>
    }


    function handleOpenModal(e,show){
        e.stopPropagation();
        show();
        onSelect(0);
    }

    useEffect(()=>{
        if(inputRef.current){
            inputRef.current.addEventListener('input',handleImageClick)
            inputRef.current.addEventListener('change',handleImageClick)
        }

        return ()=>{
            if(inputRef.current){
                inputRef.current.removeEventListener('input',handleImageClick)
                inputRef.current.removeEventListener('change',handleImageClick)
            }
        }
    },[inputRef])

    const [tags,setTags] = useState([]);
    return(
        <ToggleContent 
            toggle={show=>(
            <div className="flex-fill" style={{marginTop:5}}>
                <div className="flex-fill" style={{flex:'1 1 auto',WebkitFlex:'1 1 auto'}}>
                    <input type="file" multiple className="inputfile" id="media"
                    accept="image/*|video/*" style={{display:'block'}} ref={inputRef}></input>
                    <label for="media" style={{display:'inherit'}}><MediaSvg/></label>
                    <TagSelector tags={tags} setTags={setTags}/>
                </div>
                <button style={{marginRight:10}} className="editor-btn"
                onClick={e=>{handleOpenModal(e,show)}}>Crosspost</button>
                {isLoading?
                <div style={{alignSelf:'center',WebkitAlignItems:'center'}}>
                    <MoonLoader
                        sizeUnit={"px"}
                        size={20}
                        color={'#123abc'}
                        loading={isLoading}
                    />
                </div>:<button onClick={handleClick} className="editor-btn">Add</button>}
            </div>
        )}
        content={hide => (
        <Modal>
            <PostToBranches parents={renderParents} siblings={renderSiblings} children={renderChildren}
                onSelect={onSelect}
            />
        </Modal>    
        )}/>
    )
}

function PostToBranches({parents,siblings,children,onSelect}){
    const theme = useTheme();
    return(
        <div id="modal-post-to" className="post-to-branch-container" style={{backgroundColor:theme.hoverColor}}>
            <div>
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

export function CheckBox({value,checkedBranches,setCheckedBranches}){
    const ref = useRef(null)
    
    useEffect(()=>{
        for(var value of checkedBranches){
            if(value==ref.current.value){
                ref.current.checked = true;
            }
        }
    },[])

    function handleCheckClick(e){
        if(e.target.checked){
            setCheckedBranches([...checkedBranches,e.target.value]);
        }
    }

    return(
        <label className="checkbox-label">
            <input type="checkbox" className="input-checkbox" onChange={handleCheckClick} value={value} ref={ref}></input>
            <span className="checkbox-custom rectangular"></span>
        </label>
    )
}


/*function Emoji({editor}){
    const [isOpen,setOpen] = useState(false);

    function handleEmojiClick(code,data){
         
         
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
}*/
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


const MediaSvg = props => {
    const theme = useTheme();
    return <svg
      x="0px"
      y="0px"
      viewBox="0 0 260 260"
      xmlSpace="preserve"
      className="messenger-icon"
      style={{fill:theme.textHarshColor}}
      {...props}
    >
      <path
        d="M93.3 136c0-13.7 11.1-24.8 24.8-24.8 2.8 0 5-2.2 5-5s-2.2-5-5-5c-19.2 0-34.8 15.6-34.8 34.8 0 2.8 2.2 5 5 5s5-2.3 5-5z"
      />
      <path
        d="M225.3 81.9h-50.5l-21.7-29.3c-.9-1.3-2.4-2-4-2h-62c-1.6 0-3.1.8-4 2L61.3 81.9H34.7c-2.8 0-5 2.2-5 5v117.6c0 2.8 2.2 5 5 5h190.7c2.8 0 5-2.2 5-5V86.9c-.1-2.8-2.3-5-5.1-5zm-22.4 30.2h17.4v65.5h-17.4v-65.5zm-139-20.2c1.6 0 3.1-.8 4-2l21.7-29.3h57l21.7 29.3c.9 1.3 2.4 2 4 2h48v10.2h-22.4c-2.8 0-5 2.2-5 5v3h-29c-9.1-16-26.2-26.8-45.9-26.8-19.6 0-36.8 10.8-45.9 26.8H39.7V91.9h24.2zm54.2 1.4c23.5 0 42.7 19.1 42.7 42.7 0 23.5-19.1 42.7-42.7 42.7-23.5 0-42.7-19.1-42.7-42.7s19.2-42.7 42.7-42.7zM39.7 199.5v-79.4h28.2c-1.6 5-2.4 10.3-2.4 15.8 0 29 23.6 52.7 52.7 52.7 29 0 52.7-23.6 52.7-52.7 0-5.5-.9-10.8-2.4-15.8h24.6v62.6c0 2.8 2.2 5 5 5h22.4v11.8H39.7z"
      />
      <path
        d="M189.6 74h17.3c2.8 0 5-2.2 5-5s-2.2-5-5-5h-17.3c-2.8 0-5 2.2-5 5s2.2 5 5 5z"
      />
    </svg>
};

const TagSvg = props =>{
    return(
        <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        viewBox="0 0 59.998 59.998"
        style={{ enableBackground: "new 0 0 59.998 59.998" }}
        xmlSpace="preserve"
        >
        <path d="M59.206,0.293c-0.391-0.391-1.023-0.391-1.414,0L54.085,4H30.802L1.532,33.511c-0.666,0.666-1.033,1.553-1.033,2.495  s0.367,1.829,1.033,2.495l20.466,20.466c0.687,0.687,1.588,1.031,2.491,1.031c0.907,0,1.814-0.347,2.509-1.041l28.501-29.271V5.414  l3.707-3.707C59.597,1.316,59.597,0.684,59.206,0.293z M53.499,28.874L25.574,57.553c-0.596,0.596-1.566,0.596-2.162,0L2.946,37.087  c-0.596-0.596-0.596-1.566,0.003-2.165L31.636,6h20.449l-4.833,4.833C46.461,10.309,45.516,10,44.499,10c-2.757,0-5,2.243-5,5  s2.243,5,5,5s5-2.243,5-5c0-1.017-0.309-1.962-0.833-2.753l4.833-4.833V28.874z M47.499,15c0,1.654-1.346,3-3,3s-3-1.346-3-3  s1.346-3,3-3c0.462,0,0.894,0.114,1.285,0.301l-1.992,1.992c-0.391,0.391-0.391,1.023,0,1.414C43.987,15.902,44.243,16,44.499,16  s0.512-0.098,0.707-0.293l1.992-1.992C47.386,14.106,47.499,14.538,47.499,15z" />
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