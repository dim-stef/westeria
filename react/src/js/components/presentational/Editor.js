import React, {useRef,useEffect,lazy,Suspense} from 'react'


export function CustomEditor({onInput,onKeyDown,placeholder,className,style,editorRef=null,onBlur,
    files,setFiles=()=>{}}){

    function handleInput(e){

        if (e.target.innerText) {
			e.target.dataset.divPlaceholderContent = 'true';
		}
		else {
			delete(e.target.dataset.divPlaceholderContent);
		}
        onInput(e);
    }

    function onPaste(event){
        event.preventDefault();
        var items = (event.clipboardData || event.originalEvent.clipboardData).items;
        for (var index in items) {
            var item = items[index];
            if (item.kind === 'file') {  
                var blob = item.getAsFile();
                setFiles([...files,blob])
            }
        }
    }

    function onDrop(){
        //console.log("droppp")
    }

    return(
        <div
        onPaste={onPaste}
        onDrop={onDrop}
        contentEditable
        className={className}
        ref={editorRef}
        onInput={handleInput}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        data-placeholder={placeholder}
        style={style}/>
    )
}