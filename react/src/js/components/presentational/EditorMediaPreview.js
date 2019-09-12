import React, {useState,useContext,useEffect,useLayoutEffect,useRef,useCallback,lazy,Suspense} from 'react'
import ReactPlayer from 'react-player'

export function MediaPreview(props){

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
                    <button className="remove-media-btn" onClick={()=>handleClick(file)}>x</button>
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
                    <button className="remove-media-btn" onClick={()=>handleClick(file)}>x</button>
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

function isFileImage(file) {
    return file && file['type'].split('/')[0] === 'image';
}

function isFileVideo(file) {
    return file && file['type'].split('/')[0] === 'video';
}