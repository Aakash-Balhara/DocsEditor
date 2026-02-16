import React from 'react';
import Header from '../components/Header';
import { DocumentProvider, useDocument } from '../context/DocumentContext';
import EditorToolbar from '../components/EditorToolbar';
import EditorContent from '../components/EditorContent';
import CommentsSidebar from '../components/CommentsSidebar';
import ShareModal from '../components/ShareModal';
import HistoryModal from '../components/HistoryModal';

const DocumentEditorLayout = () => {
  const { isOnline } = useDocument();

  return (
    <div>
      <Header />
      <div className="editor-layout">
        <div className="editor-main">
          <EditorToolbar />
          <EditorContent />
        </div>
        <CommentsSidebar />
        {!isOnline && <div className="offline-warning">You are currently offline. Changes will be synced when you reconnect.</div>}
      </div>
      <HistoryModal />
      <ShareModal />
    </div>
  );
};

const DocumentEditor = () => {
  return (
    <DocumentProvider>
      <DocumentEditorLayout />
    </DocumentProvider>
  );
};

export default DocumentEditor;
