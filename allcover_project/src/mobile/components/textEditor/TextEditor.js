import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';
import 'tui-color-picker/dist/tui-color-picker.css';
import '@toast-ui/editor-plugin-color-syntax/dist/toastui-editor-plugin-color-syntax.css';
import '@toast-ui/editor/dist/i18n/ko-kr';
import { useRef } from 'react';

export default function TextEditor({ handleEditorChange }) {
    const editorRef = useRef();

    const onChange = () => {
        const data = editorRef.current.getInstance().getHTML();
        handleEditorChange(data);
      };
    return (
        <div style={{ width: '100%', maxWidth: '500px'}}>
            <Editor
                initialValue=""
                previewStyle="vertical"
                height="250px"
                initialEditType="wysiwyg"
                hideModeSwitch={true}
                useCommandShortcut={false}
                plugins={[colorSyntax]}
                language="ko-KR"
                ref={editorRef}
                onChange={onChange}
                toolbarItems={[
                    ['bold', 'italic'],
                    ['ol'],
                    ['link'],
                ]}
            />
        </div>
    );
}