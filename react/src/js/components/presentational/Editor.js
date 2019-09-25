import React from 'react'


export function CustomEditor({onInput,onKeyDown,placeholder,className,style,editorRef=null,onBlur,
    files,setFiles=()=>{},onFocus}){

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
        var items = (event || event.originalEvent).clipboardData.items;
        var text = (event || event.originalEvent).clipboardData.getData('text/plain');
        document.execCommand("insertHTML", false, text);
        
        for (var index in items) {
            var item = items[index];
            if (item.kind === 'file') {  
                var blob = item.getAsFile();
                setFiles([...files,blob])
            }
        }
    }

    function onDrop(){
        //
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
        onFocus={onFocus}
        data-placeholder={placeholder}
        style={style}/>
    )
}