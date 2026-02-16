import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useDocument } from '../context/DocumentContext';

const EditorContent = () => {
  const { value, handleChange, canEdit } = useDocument();

  const modules = {
    toolbar: canEdit ? [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline','strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ] : false,
  };

  return (
    <ReactQuill key={canEdit ? 'editable' : 'readonly'} theme="snow" value={value} onChange={handleChange} modules={modules} readOnly={!canEdit} />
  );
};

export default EditorContent;
