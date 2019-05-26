import React, {useState,useContext,useEffect,useRef} from 'react'
import {UserContext} from "../container/ContextContainer"
import FormatToolbar from "./FormatToolbar"
import { Editor } from 'slate-react'
import { Block,Value } from 'slate'
import Plain from 'slate-plain-serializer'
import axios from 'axios'

var csrftoken = getCookie('csrftoken');


function ImageComponent(props){

    useEffect(()=>{
        console.log(props.files)
    },[])

    function renderImages(){
        let images = [];
        for (var i = 0; i < props.files.length; i++)
        {
            let img = (
            <div style={{width:100,height:100}}>
                <img style={{objectFit:'cover',width:'100%',height:'100%'}} src={URL.createObjectURL(props.files[i])}/>
            </div>
            );
            images.push(img)
        }
        return images;
    }
    return(
        <div style={{display:'flex'}}>
            {renderImages()}
        </div>
    )
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

    const schema = {
        document: {

        },
        blocks: {
            image: {
            isVoid: true,
            },
        },
    }

    

    const [value,setValue] = useState(initialValue);
    const [files,setFiles] = useState(null)
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

    const renderNode = (props, editor, next) => {
        switch (props.node.type) {
            case 'code':
                return <CodeNode {...props} />
            case 'image': {
                    //const src = props.node.data.get('src')
                    //console.log("props.node.data",props.node.toJSON())
                    //const src = props.node.toJSON().data.data.src
                    //return <img {...props.attributes} src={src} />
                    console.log("files",files)
                    return <ImageComponent {...props} files={files}/>
                }
            default:
                return next()
        }
    }


    const renderBlock = (props, editor, next) => {
        const { attributes, node, isFocused } = props
        switch (node.type) {
            case 'image': {
            const src = node.data.get('src')
            return (
                <img
                {...attributes}
                src={src}
                className={css`
                    display: block;
                    max-width: 100%;
                    max-height: 20em;
                    box-shadow: ${isFocused ? '0 0 0 2px blue;' : 'none'};
                `}
                />
            )
            }

            default: {
            return next()
            }
        }
    }

    function insertImage(editor, data, target) {
        if (target) {
          editor.select(target)
        }
        console.log(data)
      
        editor.insertBlock({
          type: 'image',
          data: { data },
        })
    }

    function handleImageClick(e){
        console.log(e.target)
        var files = e.target.files;
        setFiles(files);
        /*console.log(URL.createObjectURL(files[0]))
        for (var i = 0; i < files.length; i++)
        {
            //ref.current.command(insertImage, {src:URL.createObjectURL(files[i]), file:files[i]})
            ref.current.command(insertImage,null);
            console.log(ref.current.value.texts)
            console.log(ref.current.value.blocks)
        }*/
        
    }
    
    

    return(
        <div style={{padding:10,fontSize:'1.5rem',backgroundColor:'#cfdeea',
        display:'flex',justifyContent:'stretch',...style}}>
            <div>
                <img src={context.currentBranch.branch_image} className="profile-picture" 
                style={{width:48,height:48,marginRight:10,display:'block'}}/>
            </div>
            <div style={{width:'100%'}}>
                <Editor
                ref={ref}
                value={value}
                onChange={handleChange}
                renderNode={renderNode}
                schema={schema}
                placeholder="Add a leaf"
                style={{padding:5,backgroundColor:'white',minWidth:0,width:'98%',borderRadius:10,
                wordBreak:'break-all',border:'1px solid #a6b7c5'}}/>
                {files?<ImageComponent files={files}/>:null}
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


function Toolbar({editor,files,branch,postedId,currentPost=null,updateFeed,value,replyTo=null}){

    const handleClick = (e)=>{
        
        let post = Plain.serialize(value);
        let type = replyTo?'reply':'post';

        const formData = new FormData();
        if(files){
            for (var i = 0; i < files.length; i++)
            {
                formData.append('images',files[i])
            }
        }
        
        formData.append('posted',postedId||currentPost.poster_id);
        formData.append('posted_to',[postedId||currentPost.poster_id]);
        formData.append('type',type);
        formData.append('text',post);
        
        if(replyTo){
            data = {...data,replied_to:replyTo}
            formData.append('replied_to',replyTo)
        }

        let uri = `/api/branches/${branch.uri}/posts/new/`

        axios.post(
            uri,
            formData,
            {
                headers: {
                    'Content-Type': 'application/json',
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
            <button onClick={handleClick}>Add</button>    
        </div>
    )
}