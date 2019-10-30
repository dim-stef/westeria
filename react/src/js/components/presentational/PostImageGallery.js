import React, {useRef, useState,useEffect,useLayoutEffect} from "react"
import { Prompt } from "react-router"
import history from "../../history"
import {useTheme} from "emotion-theming";
import {ToggleContent} from './Temporary'
import LazyLoad from 'react-lazy-load';
import ReactPlayer from 'react-player'
import ReactDOM from 'react-dom';
import SwipeableViews from 'react-swipeable-views';
import PinchToZoom from 'react-pinch-and-zoom';

const Modal = ({ children ,onClick}) => (
    ReactDOM.createPortal(
        <div className="modal" onClick={onClick}>
            {children}
        </div>,
        document.getElementById('modal-root')
    )
);


Number.prototype.roundTo = function(num) {
    var resto = this%num;
    if (resto <= (num/2)) { 
        return this+resto;
    } else {
        return this+num-resto;
    }
}

export function PreviewPostMedia({images,videos}){
    return(
        <div style={{height:'100%',width:'100%'}}>
            {videos.length>0?<VideoComponent key={videos[0].id} src={videos[0].video}
                thumbnail={videos[0].thumbnail}
            />:
            <img style={{objectFit:'cover',maxHeight:'100%',width:'100%',height:'100%'}} src={images[0].image}/>}
            
        </div>
    )
}

export function Images(props){
    const theme = useTheme();

    function getTallerElement(){
        let heights = props.images.map(im=>{
            return im.height;
        })

        let max = Math.max(...heights);
        return props.images.find(im=>im.height==max);
    }

    function calcPadding(){
        let image = getTallerElement();
        let height = image.height;
        let width = image.width;
        let ratio = height/width;
        let paddingTop = height!=0 ?
        `${ratio*100}%` : 0;
        if(props.videos.length>0 && ratio<0.56){
            paddingTop = '56%';
        }
        return paddingTop;
    }

    let initStyle;
    if(props.viewAs=="reply"){
        initStyle = {
            border: `1px solid ${theme.borderColor}`,
            borderRadius: 10,
        }
    }else{
        initStyle = {
            margin: '0 -10px'
        }
    }


    const [paddTop,setPaddTop] = useState(props.images.length>0?calcPadding(props.images[0]):'56%');
    const [left,setLeft] = useState(0);
    const [swiping,setSwiping] = useState(false);
    const [style,setStyle] = useState(initStyle);
    const [index,setIndex] = useState(0);
    const ref = useRef(null);

    let isTouchScreen = "ontouchstart" in document.documentElement;
    

    function changeIndex(newIndex){
        setIndex(newIndex);
    }

    function incrementIndex(){
        setIndex(index + 1);
    }

    function decrementIndex(){
        setIndex(index - 1);
    }
    
    let maxHeight=620;

    function handleChangeIndex(index){
        setIndex(index)
    }


    // These bottom 3 functions prevent react-swipeable-views from applying their own transition
    // If that was the case, for some reason the first index item gets no transition from swipeable views

    function handleResetTransition(){
        let swipeContainers = document.getElementsByClassName('react-swipeable-view-container');
        for(let i = 0; i < swipeContainers.length; i++) {
            swipeContainers[i].style.transition = null;
        }
    }

    useLayoutEffect(()=>{
        let swipeContainers = document.getElementsByClassName('react-swipeable-view-container');
        for(let i = 0; i < swipeContainers.length; i++) {
            swipeContainers[i].style.transition = null;
        }
    },[index])

    useEffect(()=>{
        window.addEventListener('touchend',handleResetTransition)

        return ()=>{
            window.removeEventListener('touchend',handleResetTransition)
        }
    },[])

    function onSwitching(){
        let swipeContainers = document.getElementsByClassName('react-swipeable-view-container');
        for(let i = 0; i < swipeContainers.length; i++) {
            swipeContainers[i].style.transition = 'all 0s ease 0s';
        }
    }

    return(
        <div ref={ref} style={{...style,overflow: 'hidden',maxHeight:maxHeight}}>
            <div style={{position:'relative',paddingTop:paddTop}} >
                <div className="flex-fill post-image-wrapper" style={{maxHeight:maxHeight}}>
                    {props.images.length + props.videos.length>1?
                    <MediaButtons index={index} changeIndex={changeIndex} count={props.images.length + props.videos.length} 
                    imageWidth={props.imageWidth} left={left}
                    setLeft={setLeft} incrementIndex={incrementIndex} decrementIndex={decrementIndex}/>:null}

                    {/* <SwipeableViews> must be the last child of .post-image-wrapper in order to apply css*/}
                    <SwipeableViews index={index} onChangeIndex={handleChangeIndex} disableLazyLoading onSwitching={onSwitching}
                    slideStyle={{position:'relative',overflow:'hidden',alignItems:'center',WebkitAlignItems:'center'}} 
                    slideClassName="flex-fill">
                        {props.images.map(img=>{
                            return <div key={img.image} 
                            style={{width:'100%',height:'100%'}}>
                            <ImageComponent width={props.imageWidth} key={img} src={img.image} height={img.height}
                                maxHeight={maxHeight} isSwiping={swiping} setLeft={setLeft} imgWidth={img.width}
                            /></div>
                        })}
                        {props.videos.map(vid=>{
                            return <div key={vid.id} style={{width:'100%',height:'100%'}}
                             >
                            <VideoComponent width={props.imageWidth} key={vid.id} src={vid.video}
                                thumbnail={vid.thumbnail} maxHeight={maxHeight}
                            /></div>
                        })}

                        </SwipeableViews>
                </div>  
            </div>
        </div>
    )
}

//disablepictureinpicture controlslist="nodownload"
function VideoComponent({src,thumbnail}){

    return(
        <div onClick={e=>{e.stopPropagation()}} className="flex-fill video-container">
            <ReactPlayer pip={false} 
             width="100%" height="100%" url={src} volume={0} muted controls playing light={thumbnail}
             config={{ file: { attributes: { controlsList: 'nodownload',disablepictureinpicture: 'true' } } }}>
            </ReactPlayer>
        </div>
    )
}


function getScrollbarWidth() {

    // Creating invisible container
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll'; // forcing scrollbar to appear
    outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
    document.body.appendChild(outer);

    // Creating inner element and placing it in the container
    const inner = document.createElement('div');
    outer.appendChild(inner);

    // Calculating difference between container's full width and the child width
    const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);

    // Removing temporary elements from the DOM
    outer.parentNode.removeChild(outer);

    return scrollbarWidth;

}


function ImageComponent({src,maxHeight,imgWidth,height}){

    function handleModalOpen(e,show){
        e.stopPropagation();
        show();
        document.body.style.overflowY = 'hidden';
        document.body.style.paddingRight = `${getScrollbarWidth()}px`
        if (window.location.href.indexOf('#') == -1)
        {
            window.history.pushState({urlPath:"#"},"",'#')
        }
        //history.push(history.location.pathname)
    }

    function handleModalClose(e,hide){

        if(e){
            e.stopPropagation();
        }
        
        hide();
        document.body.style.overflowY = 'scroll';
        document.body.style.paddingRight = 0;
    }

    let borders = imgWidth>height?{
        height:'auto',
        width:'100%'
    }:{
        height:'100vh',
        width:'unset'
    }

    function listenHistory(hide){
        history.listen((location, action) => {
            if(action==='POP'){
                hide();
            }
        });
    }

    return(
        <ToggleContent 
            toggle={show=>(
                <div style={{width:'100%',height:'100%'}}> {/*style={{width:width}} */}
                    <LazyLoad
                        debounce={false}
                        offsetVertical={500}
                        height="100%"
                        >
                        
                            <img onClick={e=>{
                                handleModalOpen(e,show)
                                }} style={{width:'100%',
                            objectFit:'cover',maxHeight:maxHeight,backgroundColor:'#607d8b'}} src={src}/>
                            {/*,position:'absolute',
                            top:'50%',right:'50%',transform:'translate(50%,-50%)' */}
                    </LazyLoad>
                    
                </div>
            )}
            content={hide => {
                
                listenHistory(()=>handleModalClose(null,hide));
                return <>
                 <Modal onClick={e=>handleModalClose(e,hide)}>
                        <div className="flex-fill" style={{height:'100%',overflowY:'scroll'}}>
                            <div style={{margin:'auto',width:'100%'}}>
                                <div className="close-button" onClick={e=>handleModalClose(e,hide)}>
                                    <CloseSvg/>
                                </div>
                                <PinchToZoom>
                                    <div className="zoom-container flex-fill center-items" onClick={e=>handleModalClose(e,hide)}>
                                        <img style={{objectFit:'contain',height:'100vh',width:'100%',backgroundColor:'#59686f'}} 
                                        onClick={(e)=>e.stopPropagation()} src={src}/>
                                    </div>
                                </PinchToZoom>
                            </div>
                        </div>
                </Modal>
                </>
            }}/>
    )
}




function MediaButtons({index,changeIndex,count,imageWidth,setIndex,incrementIndex,decrementIndex}){

    function handleLeftClick(e){
        e.stopPropagation();
        decrementIndex();
    }

    function handleRightClick(e){
        e.stopPropagation();
        incrementIndex();
    }

    return(
        <>

            {index!=0?
            <div role="button" className="image-arrow-button" style={{left:0}} onClick={handleLeftClick}>
                <div style={{transform:"rotate(180deg)"}}><ImageArrow/></div>
            </div>:null}
            {index!=count-1?
            <div role="button" className="image-arrow-button" style={{right:0}} onClick={handleRightClick}>
                <div><ImageArrow/></div>
            </div>:null}
            
        </>
    )
}


function ImageArrow(){
    return(
        <svg
            xmlnsXlink="http://www.w3.org/1999/xlink"
            version="1.1"
            x="0px"
            y="0px"
            width="451.846px"
            height="451.847px"
            viewBox="0 0 451.846 451.847"
            style={{
                enableBackground: "new 0 0 451.846 451.847",
                height: 15,
                fill: "white",
                width: 15,
            }}
            xmlSpace="preserve"
            >
            <path d="M345.441 248.292L151.154 442.573c-12.359 12.365-32.397 12.365-44.75 0-12.354-12.354-12.354-32.391 0-44.744L278.318 225.92 106.409 54.017c-12.354-12.359-12.354-32.394 0-44.748 12.354-12.359 32.391-12.359 44.75 0l194.287 194.284c6.177 6.18 9.262 14.271 9.262 22.366 0 8.099-3.091 16.196-9.267 22.373z" />
        </svg>
    )
}

const CloseSvg = props => (
    <svg x="0px" y="0px" viewBox="0 0 260 260" xmlSpace="preserve"
    width="50px"
    width="50px"
    style={{
        transform: 'rotate(45deg)',
        msTransform: 'rotate(45deg)',
        WebkitTransform: 'rotate(45deg)'
    }} {...props}>
      <path
        d="M186.9 124.5H138V75.6c0-3.8-3-6.8-6.8-6.8s-6.8 3.1-6.8 6.8v48.8H75.6c-3.8 0-6.8 3.1-6.8 6.8 0 3.8 3.1 6.8 6.8 6.8h48.8v48.8c0 3.8 3.1 6.8 6.8 6.8 3.8 0 6.8-3 6.8-6.8V138h48.8c3.8 0 6.8-3 6.8-6.8.1-3.7-3-6.7-6.7-6.7z"
        fill="#4497d2"
      />
    </svg>
  );